import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('AnalyticsServiceBootstrap');
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.NATS,
      options: {
        servers: [process.env.NATS_URL || 'nats://localhost:4222'],
        gracefulfulShutdown: true,
      },
    },
  );

  app.enableShutdownHooks();

  await app.listen();
  logger.log('Analytics Service microservice is listening');
}
void bootstrap();
