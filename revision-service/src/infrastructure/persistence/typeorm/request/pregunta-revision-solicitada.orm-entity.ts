import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'pregunta_revision_solicitada' })
export class PreguntaRevisionSolicitadaOrmEntity {
  @PrimaryColumn({ name: 'pregunta_id', type: 'uuid' })
  preguntaId!: string;

  @PrimaryColumn({ name: 'version_pregunta', type: 'integer' })
  versionPregunta!: number;

  @Column({ name: 'autor_id', type: 'text', nullable: false })
  autorId!: string;
}
