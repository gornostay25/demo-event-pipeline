import { Controller, Get, Query, Logger } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { NATS_PUBLISHER } from '../nats/nats.constants';
import { ReportQueryDto } from '../dto/report-query.dto';
import { firstValueFrom } from 'rxjs';

@Controller('reports')
export class ReportsController {
  private readonly logger = new Logger(ReportsController.name);

  constructor(
    @Inject(NATS_PUBLISHER) private readonly natsClient: ClientProxy,
  ) {}

  @Get('funnel')
  async getFunnelStats(@Query() query: ReportQueryDto) {
    this.logger.log(`Fetching funnel stats: ${JSON.stringify(query)}`);

    // Use request-response pattern with NATS
    // firstValueFrom() converts Observable to Promise
    const result = await firstValueFrom(
      this.natsClient.send('report.get_funnel', query),
    );

    return result;
  }

  @Get('sources')
  async getSourcesStats() {
    this.logger.log('Fetching source stats');
    return firstValueFrom(this.natsClient.send('report.get_sources', {}));
  }

  @Get('countries')
  async getTopCountries(@Query() query: ReportQueryDto) {
    const payload = { limit: query.limit };
    this.logger.log(`Fetching top countries: ${JSON.stringify(payload)}`);
    return firstValueFrom(
      this.natsClient.send('report.get_countries', payload),
    );
  }

  @Get('time-series')
  async getTimeSeries(@Query() query: ReportQueryDto) {
    const payload = { source: query.source, hours: query.hours };
    this.logger.log(`Fetching time-series stats: ${JSON.stringify(payload)}`);
    return firstValueFrom(
      this.natsClient.send('report.get_time_series', payload),
    );
  }

  @Get('funnel-conversion')
  async getFunnelConversion(@Query() query: ReportQueryDto) {
    const payload = { source: query.source };
    this.logger.log(
      `Fetching funnel conversion stats: ${JSON.stringify(payload)}`,
    );
    return firstValueFrom(
      this.natsClient.send('report.get_funnel_conversion', payload),
    );
  }
}
