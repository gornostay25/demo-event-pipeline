import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { EventService } from './event.service';

interface IngestEventDto {
  eventId: string;
  timestamp: string;
  source: 'facebook' | 'tiktok';
  funnelStage: 'top' | 'bottom';
  eventType: string;
  data: any;
}

@Controller()
export class EventController {
  private readonly logger = new Logger(EventController.name);

  constructor(private readonly eventService: EventService) {}

  @EventPattern('event.ingest')
  async handleIngest(@Payload() payload: IngestEventDto | IngestEventDto[]) {
    try {
      const events = Array.isArray(payload) ? payload : [payload];

      if (events.length === 0) {
        this.logger.warn('Received empty event array');
        return;
      }

      this.logger.log(`Processing batch of ${events.length} events`);
      await this.eventService.saveEvents(events);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Failed to process event.ingest payload: ${JSON.stringify(payload)}`,
        stack ?? message,
      );
    }
  }
}
