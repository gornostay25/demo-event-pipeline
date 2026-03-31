import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Event } from './event/event.entity';
import { ReportsController } from './reports/reports.controller';
import { ReportsService } from './reports/reports.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        username: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_NAME || 'events_db',
        entities: [Event],
        synchronize: false,
        migrationsRun: false,
        extra: {
          max: 10,
          statement_timeout: 60000,
        },
      }),
    }),
    TypeOrmModule.forFeature([Event]),
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class AppModule {}
