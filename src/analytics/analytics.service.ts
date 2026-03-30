import { Injectable, Logger } from '@nestjs/common';
import { EventService } from '../event/event.service';

/**
 * AnalyticsService - Query service for event analytics
 *
 * Provides aggregated data and statistics from event database.
 * All queries are source-agnostic and can be filtered by source parameter.
 * Uses EventService for data access following proper separation of concerns.
 */
@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private readonly eventService: EventService) {}

  /**
   * Get event count by source
   *
   * @param source - Optional filter by specific source (e.g., 'facebook', 'google')
   * @returns Array of { source, count }
   */
  async getEventsBySource(
    source?: string,
  ): Promise<{ source: string; count: number }[]> {
    return this.eventService.getEventsBySource(source);
  }

  /**
   * Get top countries from event location data
   *
   * @param source - Optional filter by specific source
   * @param limit - Maximum number of results (default: 10)
   * @returns Array of { country, count } sorted by count DESC
   */
  async getTopCountries(
    source?: string,
    limit: number = 10,
  ): Promise<{ country: string; count: number }[]> {
    this.logger.log(
      `Getting top countries. Source: ${source || 'all'}, Limit: ${limit}`,
    );

    return this.eventService.getTopCountries(source, limit);
  }

  /**
   * Get events by funnel stage
   *
   * @param funnelStage - Optional filter by specific stage (e.g., 'view', 'click', 'purchase')
   * @returns Array of { funnelStage, count }
   */
  async getEventsByFunnelStage(
    funnelStage?: string,
  ): Promise<{ funnelStage: string; count: number }[]> {
    return this.eventService.getEventsByFunnelStage(funnelStage);
  }
}
