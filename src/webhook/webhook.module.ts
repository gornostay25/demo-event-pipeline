import { Module } from '@nestjs/common';
import { WebhookController } from './webhook.controller';
import { WebhookService } from './webhook.service';
import { NatsModule } from '../nats/nats.module';

@Module({
  imports: [NatsModule],
  controllers: [WebhookController],
  providers: [WebhookService],
})
export class WebhookModule {}
