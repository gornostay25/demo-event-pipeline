import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Event } from './event/event.entity';
import { EventController } from './event/event.controller';
import { EventService } from './event/event.service';

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
        synchronize: false, // Use migrations instead
        migrationsRun: true, // Run migrations on startup
        migrations: ['dist/migrations/*.js'],
        extra: {
          max: 20,
          idleTimeoutMillis: 30000,
        },
      }),
    }),
    TypeOrmModule.forFeature([Event]),
  ],
  controllers: [EventController],
  providers: [EventService],
})
export class AppModule {}
