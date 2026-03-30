import { Module, Global } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';

/**
 * Centralized NATS Publisher Provider
 *
 * This module provides a reusable NATS client for publishing messages
 * across the application. It follows DRY principles and allows easy
 * configuration management.
 *
 * Usage:
 * @Inject('NATS_PUBLISHER') private natsPublisher: ClientProxy
 */
@Global()
@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'NATS_PUBLISHER',
        transport: Transport.NATS,
        options: {
          servers: [process.env.NATS_URL || 'nats://localhost:4222'],
        },
      },
    ]),
  ],
  exports: [ClientsModule],
})
export class NatsModule {}
