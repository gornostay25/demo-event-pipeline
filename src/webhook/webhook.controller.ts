import { Controller, Post, Body, HttpCode, Logger } from '@nestjs/common';
import { WebhookService } from './webhook.service';
import {
  type WebhookPayload,
  WebhookEventDto,
  WebhookBatchDto,
} from '../dto/webhook-event.dto';

/**
 * WebhookController - HTTP endpoint for event ingestion
 *
 * Accepts events from external publishers and returns 202 Accepted
 * immediately, relying on NATS JetStream for durability and processing.
 */
@Controller('webhook')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(private readonly webhookService: WebhookService) {}

  /**
   * Accept events from external publishers
   * Returns 202 Accepted immediately (fire-and-forget pattern)
   *
   * @param payload - Single event or array of events (validated by DTO)
   * @returns Acceptance confirmation
   */
  @Post()
  @HttpCode(202)
  async ingest(@Body() payload: WebhookPayload) {
    // Determine if payload is single event or batch
    const events = this.normalizePayload(payload);
    this.logger.log(`Received ${events.length} event(s) from webhook`);

    // Fire-and-forget: publish to NATS without waiting
    this.webhookService.handleEvents(events);

    return { status: 'accepted', count: events.length };
  }

  /**
   * Normalize payload to always return an array of events
   *
   * @param payload - Single event, array of events, or batch object
   * @returns Array of validated events
   */
  private normalizePayload(payload: WebhookPayload): WebhookEventDto[] {
    // If payload is a batch object with events property
    if (payload && typeof payload === 'object' && 'events' in payload) {
      const batch = payload;
      return batch.events;
    }

    // If payload is an array
    if (Array.isArray(payload)) {
      return payload;
    }

    // Otherwise, treat as single event
    return [payload];
  }
}
