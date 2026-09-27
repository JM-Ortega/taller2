import { Entity, ForeignKey, PrimaryColumn } from 'typeorm';
import { RevisionOrmEntity } from './revision.orm-entity';

@Entity({ name: 'revision_revisor' })
export class RevisionRevisorOrmEntity {
  @PrimaryColumn({ name: 'revision_id', type: 'uuid' })
  @ForeignKey(() => RevisionOrmEntity)
  revisionId!: string;

  @PrimaryColumn({ name: 'revisor_id', type: 'text' })
  revisorId!: string;
}
