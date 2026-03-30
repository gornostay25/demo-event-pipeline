import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ReportsService } from './reports.service';

interface FunnelStatsQuery {
  source?: 'facebook' | 'tiktok';
}

interface CountriesQuery {
  limit?: number;
}

interface TimeSeriesQuery {
  source?: 'facebook' | 'tiktok';
  hours?: number;
}

@Controller()
export class ReportsController {
  private readonly logger = new Logger(ReportsController.name);

  constructor(private readonly reportsService: ReportsService) {}

  @MessagePattern('report.get_funnel')
  async getFunnelStats(@Payload() query: FunnelStatsQuery) {
    this.logger.log(`Received report request: ${JSON.stringify(query)}`);

    // Delegate to service for database queries
    const result = await this.reportsService.getFunnelStats(query);

    return result;
  }

  @MessagePattern('report.get_sources')
  async getSourcesStats() {
    this.logger.log('Received source report request');
    return this.reportsService.getSourcesStats();
  }

  @MessagePattern('report.get_countries')
  async getTopCountries(@Payload() query: CountriesQuery) {
    this.logger.log(
      `Received countries report request: ${JSON.stringify(query)}`,
    );
    return this.reportsService.getTopCountries(query ?? {});
  }

  @MessagePattern('report.get_time_series')
  async getTimeSeries(@Payload() query: TimeSeriesQuery) {
    this.logger.log(
      `Received time-series report request: ${JSON.stringify(query)}`,
    );
    return this.reportsService.getTimeSeries(query ?? {});
  }

  @MessagePattern('report.get_funnel_conversion')
  async getFunnelConversion(@Payload() query: FunnelStatsQuery) {
    this.logger.log(
      `Received funnel conversion report request: ${JSON.stringify(query)}`,
    );
    return this.reportsService.getFunnelConversion(query ?? {});
  }
}
