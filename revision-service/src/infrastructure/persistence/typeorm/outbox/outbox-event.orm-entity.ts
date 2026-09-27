import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'outbox_event' })
export class OutboxEventOrmEntity {
  @PrimaryColumn({ name: 'event_id', type: 'uuid' })
  eventId!: string;

  @Column({ name: 'event_type', type: 'varchar', nullable: false })
  eventType!: string;

  @Column({ name: 'occurred_at', type: 'timestamptz', nullable: false })
  occurredAt!: Date;

  @Column({ name: 'payload', type: 'jsonb', nullable: false })
  payload!: Record<string, unknown>;

  @Column({ name: 'published_at', type: 'timestamptz', nullable: true })
  publishedAt!: Date | null;
}
