import { Entity, Column, PrimaryGeneratedColumn, Index } from 'typeorm';

@Entity('events')
@Index(['timestamp', 'source']) // Індекс для аналітики
export class Event {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true }) // Дедуплікація на рівні БД
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
  data: any; // Зберігаємо весь об'єкт data як є
}
