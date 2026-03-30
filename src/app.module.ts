import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WebhookModule } from './webhook/webhook.module';
import { ProcessorModule } from './processor/processor.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { NatsModule } from './nats/nats.module';
import { EventModule } from './event/event.module';
import { HealthModule } from './health/health.module';
import { AppDataSource } from './data-source';
import { APP_FILTER } from '@nestjs/core';
import { AllExceptionsFilter } from './filters/all-exceptions.filter';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        ...AppDataSource.options,
        synchronize: false,
      }),
    }),
    NatsModule,
    EventModule,
    WebhookModule,
    ProcessorModule,
    AnalyticsModule,
    HealthModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
})
export class AppModule {}
