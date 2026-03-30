import { Controller, Post, Body, HttpCode, Logger } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { NATS_PUBLISHER } from '../nats/nats.constants';
import { type WebhookPayload, WebhookEventDto } from '../dto/webhook-event.dto';

@Controller('webhook')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(
    @Inject(NATS_PUBLISHER) private readonly natsPublisher: ClientProxy,
  ) {}

  @Post()
  @HttpCode(202) // Accepted immediately
  handleWebhook(@Body() payload: WebhookPayload) {
    const events = this.extractEvents(payload);

    if (events.length === 0) {
      this.logger.warn('Received empty payload');
      return;
    }

    // Chunk events into 500-event batches to respect NATS 1MB limit
    const chunks = this.chunkArray(events, 500);

    // Fire-and-forget: emit to NATS without awaiting
    for (const chunk of chunks) {
      this.natsPublisher.emit('event.ingest', chunk);
    }

    this.logger.log(
      `Published ${events.length} events in ${chunks.length} chunk(s)`,
    );
  }

  private extractEvents(payload: WebhookPayload): WebhookEventDto[] {
    if (Array.isArray(payload)) {
      // Array format: [{ event1 }, { event2 }]
      return payload;
    } else if ('events' in payload) {
      // Batch format: { events: [{ event1 }, { event2 }] }
      return payload.events;
    } else {
      // Single event format: { event1 }
      return [payload];
    }
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    return Array.from({ length: Math.ceil(array.length / size) }, (_, i) =>
      array.slice(i * size, i * size + size),
    );
  }
}
