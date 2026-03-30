import { Controller, Get, HttpCode } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Controller('health')
export class HealthController {
  constructor(private readonly dataSource: DataSource) {}

  @Get()
  @HttpCode(200)
  async check() {
    // Check database connection
    let dbStatus: string;
    try {
      if (this.dataSource.isInitialized) {
        await this.dataSource.query('SELECT 1');
        dbStatus = 'healthy';
      } else {
        dbStatus = 'uninitialized';
      }
    } catch (error) {
      dbStatus = 'unhealthy';
    }

    return {
      status: dbStatus === 'healthy' ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      checks: {
        database: {
          status: dbStatus,
        },
      },
    };
  }
}
