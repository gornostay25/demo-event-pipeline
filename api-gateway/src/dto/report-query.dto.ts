import { Type } from 'class-transformer';
import { IsOptional, IsEnum, IsInt, Min, Max } from 'class-validator';
import { EventSource } from './webhook-event.dto';

export class ReportQueryDto {
  @IsOptional()
  @IsEnum(EventSource)
  source?: EventSource;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(24 * 30)
  hours?: number;
}
