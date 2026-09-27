import { DataSource } from 'typeorm';
import { OutboxEventOrmEntity } from './outbox/outbox-event.orm-entity';
import { PreguntaRevisionSolicitadaOrmEntity } from './request/pregunta-revision-solicitada.orm-entity';
import { RevisionEvaluacionOrmEntity } from './revision/revision-evaluacion.orm-entity';
import { RevisionRevisorOrmEntity } from './revision/revision-revisor.orm-entity';
import { RevisionOrmEntity } from './revision/revision.orm-entity';

const DEFAULT_DATABASE_URL = 'postgres://postgres:postgres@localhost:5432/revision';

export function crearRevisionDataSource(): DataSource {
  return new DataSource({
    type: 'postgres',
    url: process.env.REVISION_DATABASE_URL ?? DEFAULT_DATABASE_URL,
    synchronize: process.env.REVISION_DB_SYNCHRONIZE === 'true',
    entities: [
      RevisionOrmEntity,
      RevisionRevisorOrmEntity,
      RevisionEvaluacionOrmEntity,
      PreguntaRevisionSolicitadaOrmEntity,
      OutboxEventOrmEntity,
    ],
  });
}
