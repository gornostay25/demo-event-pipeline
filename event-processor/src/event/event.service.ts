import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event as EventEntity } from './event.entity';

interface IngestEventDto {
  eventId: string;
  timestamp: string;
  source: 'facebook' | 'tiktok';
  funnelStage: 'top' | 'bottom';
  eventType: string;
  data: unknown;
}

@Injectable()
export class EventService {
  private readonly logger = new Logger(EventService.name);

  constructor(
    @InjectRepository(EventEntity)
    private readonly eventRepository: Repository<EventEntity>,
  ) {}

  /**
   * Save multiple events with idempotency using bulk insert
   * Uses QueryBuilder.insert().orIgnore() to skip duplicates
   */
  async saveEvents(events: IngestEventDto[]): Promise<number> {
    if (!Array.isArray(events) || events.length === 0) {
      this.logger.warn('saveEvents called with empty array');
      return 0;
    }

    // Validate events before insert
    const validEvents = events.filter((event) => this.isValidEvent(event));
    if (validEvents.length === 0) {
      this.logger.error('No valid events to save');
      return 0;
    }

    const invalidCount = events.length - validEvents.length;
    if (invalidCount > 0) {
      this.logger.warn(`Filtered out ${invalidCount} invalid events`);
    }

    // Build entities for bulk insert
    const entities = validEvents.map((event) =>
      this.eventRepository.create({
        eventId: event.eventId,
        timestamp: new Date(event.timestamp),
        source: event.source,
        funnelStage: event.funnelStage,
        eventType: event.eventType,
        data: event.data,
      }),
    );

    try {
      // Bulk insert with orIgnore() for idempotency
      // PostgreSQL ignores rows where eventId already exists
      const result = await this.eventRepository
        .createQueryBuilder()
        .insert()
        .into(EventEntity)
        .values(entities)
        .orIgnore()
        .execute();

      // Calculate inserted count (result.raw contains inserted rows)
      const insertedCount = result.raw
        ? result.raw.length || 0
        : entities.length;

      this.logger.log(
        `Inserted ${insertedCount}/${validEvents.length} events (ignored: ${validEvents.length - insertedCount})`,
      );
      return insertedCount;
    } catch (error) {
      this.logger.error(
        `Failed to insert batch: ${error.message}`,
        error.stack,
      );
      throw error; // Re-throw for NATS redelivery
    }
  }

  /**
   * Validate event structure
   */
  private isValidEvent(event: unknown): boolean {
    if (!event || typeof event !== 'object') {
      return false;
    }

    // Check required fields
    if (
      !event['eventId'] ||
      typeof event['eventId'] !== 'string' ||
      !event['timestamp'] ||
      typeof event['source'] !== 'string' ||
      typeof event['funnelStage'] !== 'string' ||
      !event['eventType']
    ) {
      return false;
    }

    // Validate timestamp
    const timestamp = new Date(event['timestamp']);
    if (isNaN(timestamp.getTime())) {
      return false;
    }

    return true;
  }
}
