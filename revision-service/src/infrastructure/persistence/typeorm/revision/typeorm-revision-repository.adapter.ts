import { DataSource, EntityManager } from 'typeorm';
import { Revision } from '../../../../domain/model/revision';
import { RevisionRepository } from '../../../../domain/repository/revision.repository';
import { RevisionEvaluacionOrmEntity } from './revision-evaluacion.orm-entity';
import { RevisionPersistenceMapper } from './revision-persistence.mapper';
import { RevisionRevisorOrmEntity } from './revision-revisor.orm-entity';
import { RevisionOrmEntity } from './revision.orm-entity';

type EjecutorDeTransaccion = <T>(work: (manager: EntityManager) => Promise<T>) => Promise<T>;

export class TypeOrmRevisionRepositoryAdapter implements RevisionRepository {
  private constructor(
    private readonly mapper: RevisionPersistenceMapper,
    private readonly obtenerManager: () => EntityManager,
    private readonly ejecutarPersistencia: EjecutorDeTransaccion,
    private readonly bloquearRaizAlBuscarPorId: boolean,
  ) {}

  static standalone(
    dataSource: DataSource,
    mapper: RevisionPersistenceMapper,
  ): TypeOrmRevisionRepositoryAdapter {
    return new TypeOrmRevisionRepositoryAdapter(
      mapper,
      () => dataSource.manager,
      (work) => dataSource.transaction(work),
      false,
    );
  }

  static ligadoATransaccion(
    manager: EntityManager,
    mapper: RevisionPersistenceMapper,
  ): TypeOrmRevisionRepositoryAdapter {
    return new TypeOrmRevisionRepositoryAdapter(
      mapper,
      () => manager,
      (work) => work(manager),
      true,
    );
  }

  async findById(revisionId: string): Promise<Revision | null> {
    const manager = this.obtenerManager();
    const root = this.bloquearRaizAlBuscarPorId
      ? await manager.findOne(RevisionOrmEntity, {
          where: { revisionId },
          lock: { mode: 'pessimistic_write' },
        })
      : await manager.findOne(RevisionOrmEntity, { where: { revisionId } });
    if (root === null) {
      return null;
    }

    const [revisores, evaluaciones] = await this.cargarHijos(manager, revisionId);
    return this.mapper.toDomain(root, revisores, evaluaciones);
  }

  async findByPreguntaId(preguntaId: string): Promise<readonly Revision[]> {
    const manager = this.obtenerManager();
    const raices = await manager.find(RevisionOrmEntity, { where: { preguntaId } });

    const revisiones: Revision[] = [];
    for (const raiz of raices) {
      const [revisores, evaluaciones] = await this.cargarHijos(manager, raiz.revisionId);
      revisiones.push(this.mapper.toDomain(raiz, revisores, evaluaciones));
    }
    return revisiones;
  }

  async save(revision: Revision): Promise<void> {
    await this.ejecutarPersistencia(async (manager) => {
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
