# API Gateway

## Role

`api-gateway` is the pure HTTP entry point and facade for external clients and publishers.
It has **zero direct database access** and delegates all business work over NATS.

## How It Works

### 1) Webhook Ingestion (Event-Driven)

- Receives incoming events on `POST /webhook`.
- Uses `client.emit('event.ingest', payload)` for fire-and-forget publishing.
- Returns quickly (HTTP `202 Accepted`) to keep publisher latency low and avoid coupling request time to downstream processing.

```typescript
this.natsPublisher.emit('event.ingest', chunk);
```

### 2) Analytics Proxy (Request-Response)

- Receives reporting requests under `GET /reports/*`.
- Uses `client.send('report.get_*', query)` to request analytics data.
- Converts Observable responses with RxJS `firstValueFrom()` before returning HTTP responses.

```typescript
const result = await firstValueFrom(
  this.natsClient.send('report.get_funnel', query),
);
```

## Endpoints

### Webhook

- `POST /webhook`

### Reports

- `GET /reports/funnel`
- `GET /reports/sources`
- `GET /reports/countries`
- `GET /reports/time-series`
- `GET /reports/funnel-conversion`

## Notes

- Keep this service stateless and lightweight.
- Do not add TypeORM/database modules here.
