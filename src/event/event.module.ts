import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Event as EventEntity } from '../entity/Event';
import { EventService } from './event.service';

/**
 * EventModule - Feature module for event management
 *
 * This module encapsulates all event-related functionality including
 * the EventService for business logic and TypeORM configuration
 * for the Event entity.
 *
 * It is exported so other modules (Analytics, Processor) can
 * use EventService for event operations.
 */
@Module({
  imports: [TypeOrmModule.forFeature([EventEntity])],
  providers: [EventService],
  exports: [EventService], // Export for use by other modules
})
export class EventModule {}
