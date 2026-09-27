import { DataSource, EntityManager } from 'typeorm';
import { Revision } from '../../../../domain/model/revision';
import { RevisionRepository } from '../../../../domain/repository/revision.repository';
import { RevisionEvaluacionOrmEntity } from './revision-evaluacion.orm-entity';
import { RevisionPersistenceMapper } from './revision-persistence.mapper';
import { RevisionRevisorOrmEntity } from './revision-revisor.orm-entity';
import { RevisionOrmEntity } from './revision.orm-entity';

export class TypeOrmRevisionRepositoryAdapter implements RevisionRepository {
  constructor(
    private readonly dataSource: DataSource,
    private readonly mapper: RevisionPersistenceMapper,
  ) {}

  async findById(revisionId: string): Promise<Revision | null> {
    const manager = this.dataSource.manager;
    const root = await manager.findOne(RevisionOrmEntity, { where: { revisionId } });
    if (root === null) {
      return null;
    }

    const [revisores, evaluaciones] = await this.cargarHijos(manager, revisionId);
    return this.mapper.toDomain(root, revisores, evaluaciones);
  }

  async findByPreguntaId(preguntaId: string): Promise<readonly Revision[]> {
    const manager = this.dataSource.manager;
    const raices = await manager.find(RevisionOrmEntity, { where: { preguntaId } });

    const revisiones: Revision[] = [];
    for (const raiz of raices) {
      const [revisores, evaluaciones] = await this.cargarHijos(manager, raiz.revisionId);
      revisiones.push(this.mapper.toDomain(raiz, revisores, evaluaciones));
    }
    return revisiones;
  }

  async save(revision: Revision): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const revisionId = revision.getRevisionId();

      await manager.delete(RevisionEvaluacionOrmEntity, { revisionId });
      await manager.delete(RevisionRevisorOrmEntity, { revisionId });

      await manager.save(RevisionOrmEntity, this.mapper.toRootEntity(revision));
      await manager.save(RevisionRevisorOrmEntity, this.mapper.toRevisorEntities(revision));
      await manager.save(RevisionEvaluacionOrmEntity, this.mapper.toEvaluacionEntities(revision));
    });
  }

  private async cargarHijos(
    manager: EntityManager,
    revisionId: string,
  ): Promise<[RevisionRevisorOrmEntity[], RevisionEvaluacionOrmEntity[]]> {
    const revisores = await manager.find(RevisionRevisorOrmEntity, { where: { revisionId } });
    const evaluaciones = await manager.find(RevisionEvaluacionOrmEntity, {
      where: { revisionId },
    });
    return [revisores, evaluaciones];
  }
}
