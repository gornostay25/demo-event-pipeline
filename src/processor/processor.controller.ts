import { Controller, Logger, BadRequestException } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { ProcessorService } from './processor.service';
import { WebhookEventDto } from '../dto/webhook-event.dto';

/**
 * ProcessorController - NATS message consumer controller
 *
 * In NestJS microservices, Controllers are used to define message patterns.
 * This controller listens to NATS subjects and delegates processing to the service.
 *
 * Note: NestJS only scans Controller classes for @EventPattern and @MessagePattern decorators.
 * @EventPattern() on @Injectable() services will be ignored.
 */
@Controller()
export class ProcessorController {
  private readonly logger = new Logger(ProcessorController.name);

  constructor(private readonly processorService: ProcessorService) {}

  @EventPattern('events.batch.ingest')
  async handleBatchIngest(@Payload() events: any[]) {
    // Validate payload before processing
    if (!events) {
      this.logger.error('Received null or undefined payload from NATS');
      throw new BadRequestException('Invalid payload: null or undefined');
    }

    if (!Array.isArray(events)) {
      this.logger.error(
        `Received non-array payload from NATS: ${typeof events}`,
      );
      throw new BadRequestException(
        `Invalid payload: expected array, got ${typeof events}`,
      );
    }

    if (events.length === 0) {
      this.logger.warn('Received empty batch from NATS');
      return { status: 'skipped', reason: 'empty batch' };
    }

    // Optional: Validate individual event structure
    const invalidEvents = events.filter(
      (event) => !event.eventId || !event.timestamp || !event.source,
    );

    if (invalidEvents.length > 0) {
      this.logger.warn(
        `Found ${invalidEvents.length} invalid events in batch of ${events.length}`,
      );
    }

    // Delegate to service for processing
    return this.processorService.processBatch(events);
  }
}
