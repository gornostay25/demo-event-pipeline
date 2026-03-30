import {
  IsString,
  IsNotEmpty,
  IsISO8601,
  IsEnum,
  IsOptional,
  IsObject,
  IsArray,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

export enum EventSource {
  FACEBOOK = 'facebook',
  TIKTOK = 'tiktok',
}

export enum FunnelStage {
  TOP = 'top',
  BOTTOM = 'bottom',
}

export interface EventData {
  [key: string]: any;
}

export class LocationData {
  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  region?: string;
}

export class UserData {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => LocationData)
  location?: LocationData;
}

export class EventDataDto {
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => UserData)
  user?: UserData;

  @IsOptional()
  @IsObject()
  other?: Record<string, any>;
}

export class WebhookEventDto {
  @IsString()
  @IsNotEmpty()
  eventId: string;

  @IsISO8601({ strict: true })
  timestamp: string;

  @IsEnum(EventSource)
  source: EventSource;

  @IsEnum(FunnelStage)
  funnelStage: FunnelStage;

  @IsString()
  @IsNotEmpty()
  eventType: string;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => EventDataDto)
  data?: EventDataDto;

  @IsOptional()
  @IsObject()
  rawData?: Record<string, any>;
}

export class WebhookBatchDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => WebhookEventDto)
  events: WebhookEventDto[];
}

export type WebhookPayload = WebhookEventDto | WebhookBatchDto;
