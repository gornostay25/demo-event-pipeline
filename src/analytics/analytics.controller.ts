import { Controller, Get, Query } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';

/**
 * AnalyticsController - REST endpoints for event analytics
 *
 * Provides HTTP endpoints for querying aggregated event data.
 * All endpoints are source-agnostic and support optional filters.
 */
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  /**
   * Get event counts by source
   *
   * @param source - Optional filter by specific source
   * @returns Array of { source, count }
   */
  @Get('by-source')
  async getBySource(@Query('source') source?: string) {
    return this.analyticsService.getEventsBySource(source);
  }

  /**
   * Get top countries from event data
   *
   * @param source - Optional filter by specific source
   * @param limit - Maximum number of results (default: 10)
   * @returns Array of { country, count } sorted by count DESC
   */
  @Get('top-countries')
  async getTopCountries(
    @Query('source') source?: string,
    @Query('limit') limit?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : undefined;
    return this.analyticsService.getTopCountries(source, limitNum);
  }

  /**
   * Get event counts by funnel stage
   *
   * @param funnelStage - Optional filter by specific stage
   * @returns Array of { funnelStage, count }
   */
  @Get('by-funnel-stage')
  async getByFunnelStage(@Query('funnelStage') funnelStage?: string) {
    return this.analyticsService.getEventsByFunnelStage(funnelStage);
  }
}
