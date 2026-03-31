import { Type } from 'class-transformer';
import { IsOptional, IsEnum, IsInt, Min, Max } from 'class-validator';
import { EventSource } from './webhook-event.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class FunnelStatsQueryDto {
  @ApiPropertyOptional({
    enum: EventSource,
    description: 'Filter by event source (facebook or tiktok)',
  })
  @IsOptional()
  @IsEnum(EventSource)
  source?: EventSource;
}

export class CountriesQueryDto {
  @ApiPropertyOptional({
    description: 'Limit the number of results',
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

export class TimeSeriesQueryDto {
  @ApiPropertyOptional({
    enum: EventSource,
    description: 'Filter by event source (facebook or tiktok)',
  })
  @IsOptional()
  @IsEnum(EventSource)
  source?: EventSource;

  @ApiPropertyOptional({
    description: 'Filter by hours',
    minimum: 1,
    maximum: 720,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(24 * 30)
  hours?: number;
}
