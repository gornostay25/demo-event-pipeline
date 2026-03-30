import { Module } from '@nestjs/common';
import { EventModule } from '../event/event.module';
import { ProcessorService } from './processor.service';
import { ProcessorController } from './processor.controller';

@Module({
  imports: [EventModule],
  controllers: [ProcessorController],
  providers: [ProcessorService],
})
export class ProcessorModule {}
