import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import * as express from 'express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

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

  app.enableCors();
  app.use(express.json({ limit: '40mb' }));
  app.enableShutdownHooks();

  const config = new DocumentBuilder()
    .setTitle('Event Analytics API')
    .setDescription('API Gateway for Event Analytics System')
    .setVersion('1.0')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('swagger', app, documentFactory);

  const port = process.env.PORT || 3000;
  await app.listen(port);

  logger.log(`API Gateway is listening on port ${port}`);
}
void bootstrap();
