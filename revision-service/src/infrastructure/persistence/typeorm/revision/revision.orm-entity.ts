import { Column, Entity, PrimaryColumn, Unique } from 'typeorm';
import { PreguntaParaRevision } from '../../../../domain/model/pregunta-para-revision';

@Entity({ name: 'revision' })
@Unique('UQ_revision_pregunta_version', ['preguntaId', 'versionPregunta'])
export class RevisionOrmEntity {
  @PrimaryColumn({ name: 'revision_id', type: 'uuid' })
  revisionId!: string;

  @Column({ name: 'pregunta_id', type: 'uuid', nullable: false })
  preguntaId!: string;

  @Column({ name: 'version_pregunta', type: 'integer', nullable: false })
  versionPregunta!: number;

  @Column({ name: 'snapshot_pregunta', type: 'jsonb', nullable: false })
  snapshotPregunta!: PreguntaParaRevision;

  @Column({ name: 'resultado_final', type: 'varchar', nullable: true })
  resultadoFinal!: string | null;
}
