import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import * as express from 'express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

const logger = new Logger('Bootstrap');

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  const config = new DocumentBuilder()
    .setTitle('Cats example')
    .setDescription('The cats API description')
    .setVersion('1.0')
    .addTag('cats')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);

  // Enable CORS
  app.enableCors();

  // Configure JSON body parser with increased limit for large payloads
  app.use(express.json({ limit: '40mb' }));

  // Enable global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      forbidNonWhitelisted: true,
    }),
  );

  // Enable shutdown hooks for graceful termination
  app.enableShutdownHooks();

  const natsUrl = process.env.NATS_URL || 'nats://localhost:4222';
  const port = process.env.PORT || 3000;

  // Connect to NATS microservice with graceful shutdown enabled
  try {
    app.connectMicroservice<MicroserviceOptions>({
      transport: Transport.NATS,
      options: {
        servers: [natsUrl],
        gracefulfulShutdown: true,
      },
    });
    logger.log(`Connecting to NATS at ${natsUrl}`);
  } catch (error) {
    logger.error(
      `Failed to connect to NATS at ${natsUrl}. Error: ${error.message}`,
    );
    process.exit(1);
  }

  await app.startAllMicroservices();
  logger.log('NATS microservice connected and listening');

  await app.listen(port);
  logger.log(`Application listening on port ${port}`);
}
void bootstrap();
