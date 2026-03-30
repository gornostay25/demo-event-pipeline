import { Injectable, Logger } from '@nestjs/common';
import { EventService } from '../event/event.service';

/**
 * ProcessorService - Business logic for batch processing
 *
 * This service contains the business logic for processing event batches.
 * It is called by ProcessorController which handles NATS message routing.
 * Following Single Responsibility Principle: Controller handles routing,
 * Service handles business logic.
 */
@Injectable()
export class ProcessorService {
  private readonly logger = new Logger(ProcessorService.name);

  constructor(private readonly eventService: EventService) {}

  /**
   * Process a batch of events and save them to the database.
   * This is a regular service method called by the controller.
   *
   * @param events - Array of event objects from NATS
   */
  async processBatch(events: any[]) {
    if (!Array.isArray(events) || events.length === 0) {
      this.logger.warn('Received empty or invalid batch');
      return;
    }

    try {
      // Delegate to EventService for database operations
      const insertedCount = await this.eventService.saveEvents(events);
      this.logger.log(
        `Successfully processed batch: ${insertedCount}/${events.length} events inserted`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to process batch of ${events.length} events. Error: ${error.message}`,
        error.stack,
      );
      // Error will trigger NATS redelivery with proper ACK handling
      throw error;
    }
  }
}
