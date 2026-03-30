import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event as EventEntity } from '../event/event.entity';

interface FunnelStatsQuery {
  source?: 'facebook' | 'tiktok';
}

interface CountriesQuery {
  limit?: number;
}

interface TimeSeriesQuery {
  source?: 'facebook' | 'tiktok';
  hours?: number;
}

interface FunnelStatsRow {
  funnelStage: string;
  count: string;
}

interface SourceStatsRow {
  source: string;
  count: string;
}

interface CountryStatsRow {
  country: string;
  count: string;
}

interface TimeSeriesRow {
  bucket: string;
  count: string;
}

export interface FunnelStatsResult {
  funnelStage: string;
  count: number;
}

export interface SourceStatsResult {
  source: string;
  count: number;
}

export interface CountryStatsResult {
  country: string;
  count: number;
}

export interface TimeSeriesResult {
  bucket: string;
  count: number;
}

export interface FunnelConversionResult {
  source: 'facebook' | 'tiktok' | 'all';
  topCount: number;
  bottomCount: number;
  conversionRate: number;
}

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(
    @InjectRepository(EventEntity)
    private readonly eventRepository: Repository<EventEntity>,
  ) {}

  /**
   * Get funnel statistics grouped by stage
   * Uses JSONB path queries if needed for nested data
   */
  async getFunnelStats(query: FunnelStatsQuery): Promise<FunnelStatsResult[]> {
    this.logger.log(`Fetching funnel stats: ${JSON.stringify(query)}`);

    const queryBuilder = this.eventRepository
      .createQueryBuilder('event')
      .select('event.funnelStage', 'funnelStage')
      .addSelect('COUNT(*)', 'count')
      .groupBy('event.funnelStage')
      .orderBy('event.funnelStage', 'ASC');

    // Apply source filter if provided
    if (query.source) {
      queryBuilder.andWhere('event.source = :source', { source: query.source });
    }

    const result = await queryBuilder.getRawMany<FunnelStatsRow>();
    return (result || []).map((item) => ({
      funnelStage: item.funnelStage,
      count: Number(item.count),
    }));
  }

  async getSourcesStats(): Promise<SourceStatsResult[]> {
    this.logger.log('Fetching source stats');

    const result = await this.eventRepository
      .createQueryBuilder('event')
      .select('event.source', 'source')
      .addSelect('COUNT(*)', 'count')
      .groupBy('event.source')
      .orderBy('count', 'DESC')
      .getRawMany<SourceStatsRow>();

    return (result || []).map((item) => ({
      source: item.source,
      count: Number(item.count),
    }));
  }

  async getTopCountries(query: CountriesQuery): Promise<CountryStatsResult[]> {
    const limit = Math.max(1, Math.min(query.limit ?? 10, 100));
    this.logger.log(`Fetching top countries with limit=${limit}`);

    const result = await this.eventRepository
      .createQueryBuilder('event')
      .select(
        "COALESCE(event.data->'user'->'location'->>'country', event.data->'engagement'->>'country', 'unknown')",
        'country',
      )
      .addSelect('COUNT(*)', 'count')
      .groupBy('country')
      .orderBy('count', 'DESC')
      .limit(limit)
      .getRawMany<CountryStatsRow>();

    return (result || []).map((item) => ({
      country: item.country,
      count: Number(item.count),
    }));
  }

  async getTimeSeries(query: TimeSeriesQuery): Promise<TimeSeriesResult[]> {
    const hours = Math.max(1, Math.min(query.hours ?? 24, 24 * 30));
    this.logger.log(
      `Fetching time-series stats: ${JSON.stringify({ ...query, hours })}`,
    );

    const queryBuilder = this.eventRepository
      .createQueryBuilder('event')
      .select("date_trunc('hour', event.timestamp)", 'bucket')
      .addSelect('COUNT(*)', 'count')
      .where("event.timestamp >= NOW() - (:hours * INTERVAL '1 hour')", {
        hours,
      })
      .groupBy('bucket')
      .orderBy('bucket', 'ASC');

    if (query.source) {
      queryBuilder.andWhere('event.source = :source', { source: query.source });
    }

    const result = await queryBuilder.getRawMany<TimeSeriesRow>();
    return (result || []).map((item) => ({
      bucket: item.bucket,
      count: Number(item.count),
    }));
  }

  async getFunnelConversion(
    query: FunnelStatsQuery,
  ): Promise<FunnelConversionResult> {
    this.logger.log(
      `Fetching funnel conversion stats: ${JSON.stringify(query)}`,
    );

    const queryBuilder = this.eventRepository
      .createQueryBuilder('event')
      .select('event.funnelStage', 'funnelStage')
      .addSelect('COUNT(*)', 'count')
      .groupBy('event.funnelStage');

    if (query.source) {
      queryBuilder.andWhere('event.source = :source', { source: query.source });
    }

    const result = await queryBuilder.getRawMany<FunnelStatsRow>();
    const topCount = Number(
      result.find(
        (item: { funnelStage: string; count: string }) =>
          item.funnelStage === 'top',
      )?.count ?? 0,
    );
    const bottomCount = Number(
      result.find(
        (item: { funnelStage: string; count: string }) =>
          item.funnelStage === 'bottom',
      )?.count ?? 0,
    );

    const conversionRate =
      topCount > 0 ? Number(((bottomCount / topCount) * 100).toFixed(2)) : 0;

    return {
      source: query.source ?? 'all',
      topCount,
      bottomCount,
      conversionRate,
    };
  }
}
