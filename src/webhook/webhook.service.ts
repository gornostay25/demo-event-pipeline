import { Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Inject } from '@nestjs/common';
import { WebhookEventDto } from '../dto/webhook-event.dto';

/**
 * WebhookService - Handles incoming webhook requests
 *
 * This service receives events from external publishers and
 * publishes them to NATS JetStream for asynchronous processing.
 */
@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(@Inject('NATS_PUBLISHER') private natsPublisher: ClientProxy) {}

  /**
   * Handle incoming webhook payload and publish to NATS
   *
   * @param events - Array of validated event objects
   */
  handleEvents(events: WebhookEventDto[]): void {
    if (!events || events.length === 0) {
      this.logger.warn('handleEvents called with empty array');
      return;
    }

    // Split array into chunks of 500 events each
    // This ensures we don't exceed NATS 1MB message limit
    const chunks = this.chunkArray(events, 500);

    // Fire-and-forget: publish to NATS without awaiting
    // This allows the controller to immediately respond with 202 Accepted
    for (const chunk of chunks) {
      this.natsPublisher.emit('events.batch.ingest', chunk);
    }

    this.logger.log(
      `Published ${events.length} events to NATS in ${chunks.length} chunk(s)`,
    );
  }

  /**
   * Utility function to split array into chunks
   *
   * @param array - Array to split
   * @param size - Size of each chunk
   * @returns Array of chunked arrays
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    return Array.from({ length: Math.ceil(array.length / size) }, (_, i) =>
      array.slice(i * size, i * size + size),
    );
  }
}
