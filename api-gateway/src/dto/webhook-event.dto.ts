import {
  IsString,
  IsNotEmpty,
  IsISO8601,
  IsEnum,
  IsObject,
  ValidateNested,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum EventSource {
  FACEBOOK = 'facebook',
  TIKTOK = 'tiktok',
}

export enum FunnelStage {
  TOP = 'top',
  BOTTOM = 'bottom',
}

export interface FacebookUserLocation {
  country: string;
  city: string;
}

export interface FacebookUser {
  userId: string;
  name: string;
  age: number;
  gender: 'male' | 'female' | 'non-binary';
  location: FacebookUserLocation;
}

export interface FacebookEngagementTop {
  actionTime: string;
  referrer: 'newsfeed' | 'marketplace' | 'groups';
  videoId: string | null;
}

export interface FacebookEngagementBottom {
  adId: string;
  campaignId: string;
  clickPosition: 'top_left' | 'bottom_right' | 'center';
  device: 'mobile' | 'desktop';
  browser: 'Chrome' | 'Firefox' | 'Safari';
  purchaseAmount: string | null;
}

export type FacebookEngagement =
  | FacebookEngagementTop
  | FacebookEngagementBottom;

export interface TiktokUser {
  userId: string;
  username: string;
  followers: number;
}

export interface TiktokEngagementTop {
  watchTime: number;
  percentageWatched: number;
  device: 'Android' | 'iOS' | 'Desktop';
  country: string;
  videoId: string;
}

export interface TiktokEngagementBottom {
  actionTime: string;
  profileId: string | null;
  purchasedItem: string | null;
  purchaseAmount: string | null;
}

export type TiktokEngagement = TiktokEngagementTop | TiktokEngagementBottom;

export class EventDataDto {
  @IsString()
  @IsNotEmpty()
  @Type(() => Object)
  user: FacebookUser | TiktokUser;

  @IsObject()
  @ValidateNested()
  engagement: FacebookEngagement | TiktokEngagement;
}

export class WebhookEventDto {
  @IsString()
  @IsNotEmpty()
  eventId: string;

  @IsISO8601()
  timestamp: string;

  @IsEnum(EventSource)
  source: EventSource;

  @IsEnum(FunnelStage)
  funnelStage: FunnelStage;

  @IsString()
  @IsNotEmpty()
  eventType: string;

  @IsObject()
  @ValidateNested()
  @Type(() => EventDataDto)
  data: EventDataDto;
}

export class WebhookBatchDto {
  @IsArray()
  @ValidateNested({ each: true })
  events: WebhookEventDto[];
}

// Support three payload formats: single event, array, or { events: [...] }
export type WebhookPayload =
  | WebhookEventDto
  | WebhookEventDto[]
  | WebhookBatchDto;
