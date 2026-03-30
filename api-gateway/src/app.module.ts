import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { NATS_PUBLISHER } from './nats/nats.constants';
import { WebhookController } from './webhook/webhook.controller';
import { ReportsController } from './reports/reports.controller';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: NATS_PUBLISHER,
        transport: Transport.NATS,
        options: {
          servers: [process.env.NATS_URL || 'nats://localhost:4222'],
        },
      },
    ]),
  ],
  controllers: [WebhookController, ReportsController],
  providers: [],
})
export class AppModule {}
