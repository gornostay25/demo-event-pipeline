import { Module } from '@nestjs/common';
import { EventModule } from '../event/event.module';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';

/**
 * AnalyticsModule - Query and reporting module
 *
 * Provides REST endpoints for analytics and reporting on events.
 * Uses EventService for database queries.
 */
@Module({
  imports: [EventModule],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}
