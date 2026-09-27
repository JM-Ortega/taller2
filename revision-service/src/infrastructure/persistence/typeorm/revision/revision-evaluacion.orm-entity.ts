import { Column, Entity, ForeignKey, PrimaryColumn } from 'typeorm';
import { CriterioRevision } from '../../../../domain/model/criterio-revision';
import { RevisionRevisorOrmEntity } from './revision-revisor.orm-entity';

@Entity({ name: 'revision_evaluacion' })
@ForeignKey(
  () => RevisionRevisorOrmEntity,
  ['revisionId', 'revisorId'],
  ['revisionId', 'revisorId'],
)
export class RevisionEvaluacionOrmEntity {
  @PrimaryColumn({ name: 'revision_id', type: 'uuid' })
  revisionId!: string;

  @PrimaryColumn({ name: 'revisor_id', type: 'text' })
  revisorId!: string;

  @Column({ name: 'criterios', type: 'jsonb', nullable: false })
  criterios!: readonly CriterioRevision[];

  @Column({ name: 'observaciones', type: 'text', nullable: false })
  observaciones!: string;

  @Column({ name: 'resultado', type: 'varchar', nullable: false })
  resultado!: string;
}
