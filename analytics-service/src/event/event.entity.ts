import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';

@Entity('events')
@Index(['timestamp', 'source'])
export class Event {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  eventId: string;

  @Column({ type: 'timestamptz' })
  timestamp: Date;

  @Column()
  source: 'facebook' | 'tiktok';

  @Column()
  funnelStage: 'top' | 'bottom';

  @Column()
  eventType: string;

  @Column({ type: 'jsonb' })
  data: any;
}
