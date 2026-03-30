# Analytics Service

## Role

`analytics-service` is the read-only reporting engine.  
It has **no HTTP layer** and runs as a NATS microservice.

## How It Works

- Consumes report requests with `@MessagePattern('report.get_*')`.
- Executes aggregation queries on PostgreSQL and returns structured report payloads to the API Gateway.

```typescript
@MessagePattern('report.get_funnel')
async getFunnelStats(@Payload() query: FunnelStatsQuery) {
  return this.reportsService.getFunnelStats(query);
}
```

Current patterns include:

- `report.get_funnel`
- `report.get_sources`
- `report.get_countries`
- `report.get_time_series`
- `report.get_funnel_conversion`

## Performance Strategy

This service has its own dedicated runtime process and database connection pool.  
As a result, heavy JSONB and aggregation-heavy queries (including operators like `->>`) are isolated from the write path and do not degrade ingest throughput in `event-processor`.

```sql
SELECT
  COALESCE(data->'user'->'location'->>'country', data->'engagement'->>'country', 'unknown') AS country,
  COUNT(*) AS count
FROM events
GROUP BY country
ORDER BY count DESC;
```

## Analytics Examples

- Funnel stage volume (`top` vs `bottom`)
- Funnel conversion rate by source
- Country-level event distribution
- Source breakdown (Facebook vs TikTok)
- Time-series trend analysis (hourly buckets)
