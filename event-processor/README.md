# Event Processor

## Role

`event-processor` is the high-throughput background worker responsible for durable event persistence.
It has **no HTTP layer** and is bootstrapped via `NestFactory.createMicroservice(...)`.

```typescript
const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
  transport: Transport.NATS,
  options: { servers: [process.env.NATS_URL || 'nats://localhost:4222'] },
});
```

## How It Works

- Subscribes to NATS events with `@EventPattern('event.ingest')`.
- Accepts single or batched events.
- Validates payloads and persists using bulk insert for throughput.

```typescript
@EventPattern('event.ingest')
async handleIngest(@Payload() payload: IngestEventDto | IngestEventDto[]) {
  await this.eventService.saveEvents(events);
}
```

## Database Strategy (Idempotency)

Duplicate delivery is expected in at-least-once messaging systems.  
To guarantee safe reprocessing, inserts use PostgreSQL conflict handling (`ON CONFLICT DO NOTHING`) through TypeORM `.orIgnore()` on unique `eventId`.

```typescript
await this.eventRepository
  .createQueryBuilder()
  .insert()
  .into(EventEntity)
  .values(entities)
  .orIgnore()
  .execute();
```

## Data Structure

The `data` column uses `JSONB` to store heterogeneous Facebook and TikTok payloads in a single table without forcing a rigid schema.

```sql
-- Example: flexible JSONB storage
SELECT event_id, source, data
FROM events
WHERE data->'user'->'location'->>'country' = 'US';
```
