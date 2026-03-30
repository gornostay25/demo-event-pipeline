import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event as EventEntity } from '../entity/Event';

/**
 * EventService - Business logic layer for event operations
 *
 * This service encapsulates all database operations related to events,
 * providing a clean separation of concerns and making testing easier.
 * It follows the Repository Pattern from NestJS best practices.
 */
@Injectable()
export class EventService {
  private readonly logger = new Logger(EventService.name);

  constructor(
    @InjectRepository(EventEntity)
    private eventRepository: Repository<EventEntity>,
  ) {}

  /**
   * Save a single event to the database
   * Handles idempotency through database unique constraint
   *
   * @param event - Event data object
   * @returns Created event entity
   */
  async saveEvent(event: any): Promise<EventEntity> {
    const entity = this.eventRepository.create({
      eventId: event.eventId,
      timestamp: new Date(event.timestamp),
      source: event.source,
      funnelStage: event.funnelStage,
      eventType: event.eventType,
      data: event.data,
    });

    try {
      const saved = await this.eventRepository.save(entity);
      this.logger.log(`Event saved: ${saved.eventId}`);
      return saved;
    } catch (error) {
      // Unique constraint violation means event already exists (idempotent)
      if (error.code === '23505') {
        this.logger.warn(`Event already exists: ${event.eventId}`);
        return await this.findByEventId(event.eventId);
      }
      throw error;
    }
  }

  /**
   * Validate a single event object
   * Returns true if event is valid, false otherwise
   */
  private isValidEvent(event: any): boolean {
    // Check required fields
    if (!event || typeof event !== 'object') {
      return false;
    }

    // Validate eventId (required)
    if (
      !event.eventId ||
      typeof event.eventId !== 'string' ||
      event.eventId.trim().length === 0
    ) {
      this.logger.warn(`Invalid eventId: ${JSON.stringify(event.eventId)}`);
      return false;
    }

    // Validate timestamp (required and must be valid ISO string or Date)
    if (!event.timestamp) {
      this.logger.warn(`Missing timestamp for event: ${event.eventId}`);
      return false;
    }

    const timestamp = new Date(event.timestamp);
    if (isNaN(timestamp.getTime())) {
      this.logger.warn(
        `Invalid timestamp for event ${event.eventId}: ${event.timestamp}`,
      );
      return false;
    }

    // Validate source (required)
    if (!event.source || typeof event.source !== 'string') {
      this.logger.warn(`Invalid source for event: ${event.eventId}`);
      return false;
    }

    // Validate funnelStage (required)
    if (!event.funnelStage || typeof event.funnelStage !== 'string') {
      this.logger.warn(`Invalid funnelStage for event: ${event.eventId}`);
      return false;
    }

    // Validate eventType (required)
    if (!event.eventType || typeof event.eventType !== 'string') {
      this.logger.warn(`Invalid eventType for event: ${event.eventId}`);
      return false;
    }

    return true;
  }

  /**
   * Save multiple events in a single transaction (batch processing)
   * Uses bulk insert with orIgnore() for performance and idempotency
   *
   * @param events - Array of event data objects
   * @returns Number of events inserted
   */
  async saveEvents(events: any[]): Promise<number> {
    if (!Array.isArray(events) || events.length === 0) {
      this.logger.warn('saveEvents called with empty or non-array input');
      return 0;
    }

    // Filter out invalid events
    const validEvents = events.filter((event) => this.isValidEvent(event));
    const invalidCount = events.length - validEvents.length;

    if (invalidCount > 0) {
      this.logger.warn(
        `Filtered out ${invalidCount} invalid events from batch of ${events.length}. Processing ${validEvents.length} valid events.`,
      );
    }

    // Stop if all events are invalid
    if (validEvents.length === 0) {
      this.logger.error('All events in batch are invalid. Aborting save.');
      return 0;
    }

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
      const result = await this.eventRepository
        .createQueryBuilder()
        .insert()
        .into(EventEntity)
        .values(entities)
        .orIgnore() // PostgreSQL: if eventId already exists, row is ignored
        .execute();

      const insertedCount = result.raw
        ? result.raw.length || 0
        : entities.length;

      this.logger.log(
        `Successfully inserted ${insertedCount}/${events.length} events`,
      );
      return insertedCount;
    } catch (error) {
      this.logger.error(
        `Failed to insert batch of ${events.length} events. Error: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Find event by database ID
   *
   * @param id - Database UUID
   * @returns Event entity or null
   */
  async findById(id: string): Promise<EventEntity | null> {
    const event = await this.eventRepository.findOne({
      where: { id },
    });

    if (!event) {
      this.logger.warn(`Event not found by ID: ${id}`);
      return null;
    }

    return event;
  }

  /**
   * Find event by eventId (business identifier)
   *
   * @param eventId - Event's business identifier (e.g., from external system)
   * @returns Event entity
   * @throws NotFoundException if event doesn't exist
   */
  async findByEventId(eventId: string): Promise<EventEntity> {
    const event = await this.eventRepository.findOne({
      where: { eventId },
    });

    if (!event) {
      throw new NotFoundException(`Event with eventId "${eventId}" not found`);
    }

    return event;
  }

  /**
   * Get events count by source
   *
   * @param source - Optional source filter (e.g., 'facebook', 'tiktok')
   * @returns Array of { source, count }
   */
  async getEventsBySource(
    source?: string,
  ): Promise<{ source: string; count: number }[]> {
    try {
      const queryBuilder = this.eventRepository
        .createQueryBuilder('event')
        .select('event.source', 'source')
        .addSelect('COUNT(*)', 'count')
        .groupBy('event.source');

      if (source) {
        queryBuilder.andWhere('event.source = :source', { source });
      }

      const result = await queryBuilder.getRawMany();
      return result || [];
    } catch (error) {
      this.logger.error(
        `Error in getEventsBySource: ${error.message}`,
        error.stack,
      );
      return [];
    }
  }

  /**
   * Get top countries from event data (JSONB field)
   *
   * @param source - Optional source filter
   * @param limit - Maximum number of results to return
   * @returns Array of { country, count }
   */
  async getTopCountries(
    source?: string,
    limit: number = 10,
  ): Promise<{ country: string; count: number }[]> {
    try {
      const queryBuilder = this.eventRepository
        .createQueryBuilder('event')
        .select("event.data->>'user'->>'location'->>'country'", 'country')
        .addSelect('COUNT(*)', 'count')
        .where("event.data->>'user'->>'location'->>'country' IS NOT NULL")
        .groupBy("event.data->>'user'->>'location'->>'country'")
        .orderBy('count', 'DESC')
        .limit(limit);

      if (source) {
        queryBuilder.andWhere('event.source = :source', { source });
      }

      const result = await queryBuilder.getRawMany();
      return result || [];
    } catch (error) {
      this.logger.error(
        `Error in getTopCountries: ${error.message}`,
        error.stack,
      );
      return [];
    }
  }

  /**
   * Get events by funnel stage
   *
   * @param funnelStage - Stage in the funnel (e.g., 'top', 'bottom')
   * @returns Array of { funnelStage, count }
   */
  async getEventsByFunnelStage(
    funnelStage?: string,
  ): Promise<{ funnelStage: string; count: number }[]> {
    try {
      const queryBuilder = this.eventRepository
        .createQueryBuilder('event')
        .select('event.funnelStage', 'funnelStage')
        .addSelect('COUNT(*)', 'count')
        .groupBy('event.funnelStage');

      if (funnelStage) {
        queryBuilder.andWhere('event.funnelStage = :funnelStage', {
          funnelStage,
        });
      }

      const result = await queryBuilder.getRawMany();
      return result || [];
    } catch (error) {
      this.logger.error(
        `Error in getEventsByFunnelStage: ${error.message}`,
        error.stack,
      );
      return [];
    }
  }
}
