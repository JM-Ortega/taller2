import type { DataSource } from 'typeorm';
import { RegistrarEvaluacionUseCase } from '../../../application/use-case/registrar-evaluacion.use-case';
import { ResultadoRevision } from '../../../domain/model/resultado-revision';
import { evaluacionFavorable, revisionValidaEnCurso } from '../../../test/fixtures/revision-test-fixtures';
import { OutboxEventOrmEntity } from './outbox/outbox-event.orm-entity';
import { OutboxIntegrationEventPublisher } from './outbox/outbox-integration-event.publisher';
import { RevisionEvaluacionOrmEntity } from './revision/revision-evaluacion.orm-entity';
import { RevisionPersistenceMapper } from './revision/revision-persistence.mapper';
import { RevisionRevisorOrmEntity } from './revision/revision-revisor.orm-entity';
import { RevisionOrmEntity } from './revision/revision.orm-entity';
import { TypeOrmRevisionRepositoryAdapter } from './revision/typeorm-revision-repository.adapter';
import { TypeOrmRevisionUnitOfWork } from './typeorm-revision-unit-of-work';

function coincideConCondicion<T extends object>(fila: T, condicion: Partial<T>): boolean {
  return (Object.keys(condicion) as (keyof T)[]).every((clave) => fila[clave] === condicion[clave]);
}

class FakeManager {
  private readonly tablas = new Map<unknown, unknown[]>();
  readonly deletes: Array<{ target: unknown; criteria: unknown }> = [];
  readonly saves: Array<{ target: unknown; data: unknown }> = [];

  seed<T>(target: new (...args: never[]) => T, filas: readonly T[]): void {
    this.tablas.set(target, [...filas]);
  }

  async findOne<T extends object>(
    target: unknown,
    options: { where: Partial<T>; lock?: { mode: string } },
  ): Promise<T | null> {
    const filas = (this.tablas.get(target) ?? []) as T[];
    return filas.find((fila) => coincideConCondicion(fila, options.where)) ?? null;
  }

  async find<T extends object>(target: unknown, options: { where: Partial<T> }): Promise<T[]> {
    const filas = (this.tablas.get(target) ?? []) as T[];
    return filas.filter((fila) => coincideConCondicion(fila, options.where));
  }

  async delete(target: unknown, criteria: unknown): Promise<void> {
    this.deletes.push({ target, criteria });
  }

  async save<T>(target: unknown, data: T): Promise<T> {
    this.saves.push({ target, data });
    return data;
  }
}

class FakeDataSource {
  transactionCallCount = 0;

  constructor(private readonly manager: FakeManager) {}

  async transaction<T>(work: (manager: FakeManager) => Promise<T>): Promise<T> {
    this.transactionCallCount += 1;
    return work(this.manager);
  }
}

describe('TypeOrmRevisionUnitOfWork', () => {
  const mapper = new RevisionPersistenceMapper();

  it('execute abre exactamente una transacción y entrega un repository y publisher funcionales ligados al mismo manager', async () => {
    const manager = new FakeManager();
    const dataSource = new FakeDataSource(manager);
    const uow = new TypeOrmRevisionUnitOfWork(dataSource as unknown as DataSource, mapper);

    const resultado = await uow.execute(async (tx) => {
      expect(tx.revisions).toBeInstanceOf(TypeOrmRevisionRepositoryAdapter);
      expect(tx.events).toBeInstanceOf(OutboxIntegrationEventPublisher);

      const inexistente = await tx.revisions.findById('no-existe');
      expect(inexistente).toBeNull();

      await tx.events.publish({
        revisionId: 'revision-x',
        preguntaId: 'pregunta-x',
        versionPregunta: 1,
        resultado: ResultadoRevision.FAVORABLE,
        occurredAt: new Date(),
      });

      return 'ok';
    });

    expect(resultado).toBe('ok');
    expect(dataSource.transactionCallCount).toBe(1);
    expect(manager.saves.some((s) => s.target === OutboxEventOrmEntity)).toBe(true);
  });

  it('propaga el error de work sin manejarlo ni compensarlo internamente', async () => {
    const manager = new FakeManager();
    const dataSource = new FakeDataSource(manager);
    const uow = new TypeOrmRevisionUnitOfWork(dataSource as unknown as DataSource, mapper);

    await expect(
      uow.execute(async () => {
        throw new Error('fallo de dominio simulado');
      }),
    ).rejects.toThrow('fallo de dominio simulado');
  });

  describe('integrado con RegistrarEvaluacionUseCase', () => {
    it('una evaluación que no finaliza guarda el Aggregate y no escribe Outbox', async () => {
      const revision = revisionValidaEnCurso(['revisor-1', 'revisor-2']);
      const manager = new FakeManager();
      manager.seed(RevisionOrmEntity, [mapper.toRootEntity(revision)]);
      manager.seed(RevisionRevisorOrmEntity, mapper.toRevisorEntities(revision));
      manager.seed(RevisionEvaluacionOrmEntity, []);

      const dataSource = new FakeDataSource(manager);
      const uow = new TypeOrmRevisionUnitOfWork(dataSource as unknown as DataSource, mapper);
      const useCase = new RegistrarEvaluacionUseCase(uow);

      await useCase.execute({
        revisionId: revision.getRevisionId(),
        revisorId: 'revisor-1',
        criterios: [{ nombre: 'claridad', cumple: true }],
        observaciones: 'ok',
        resultado: 'FAVORABLE',
      });

      expect(dataSource.transactionCallCount).toBe(1);
      expect(manager.saves.some((s) => s.target === RevisionOrmEntity)).toBe(true);
      expect(manager.saves.some((s) => s.target === OutboxEventOrmEntity)).toBe(false);
    });

    it('la última evaluación finaliza la Revision y persiste Aggregate + Outbox en el mismo manager', async () => {
      const revision = revisionValidaEnCurso(['revisor-1']);
      const manager = new FakeManager();
      manager.seed(RevisionOrmEntity, [mapper.toRootEntity(revision)]);
      manager.seed(RevisionRevisorOrmEntity, mapper.toRevisorEntities(revision));
      manager.seed(RevisionEvaluacionOrmEntity, []);

      const dataSource = new FakeDataSource(manager);
      const uow = new TypeOrmRevisionUnitOfWork(dataSource as unknown as DataSource, mapper);
      const useCase = new RegistrarEvaluacionUseCase(uow);

      const resultado = await useCase.execute({
        revisionId: revision.getRevisionId(),
        revisorId: 'revisor-1',
        criterios: [{ nombre: 'claridad', cumple: true }],
        observaciones: 'ok',
        resultado: 'FAVORABLE',
      });

      expect(resultado.getResultadoFinal()).toBe(ResultadoRevision.FAVORABLE);
      expect(dataSource.transactionCallCount).toBe(1);

      const objetivos = manager.saves.map((s) => s.target);
      expect(objetivos).toContain(RevisionOrmEntity);
      expect(objetivos).toContain(OutboxEventOrmEntity);

      const outbox = manager.saves.find((s) => s.target === OutboxEventOrmEntity)
        ?.data as OutboxEventOrmEntity;
      expect(outbox.eventType).toBe('RevisionFinalizada');
      const payload = outbox.payload as Record<string, unknown>;
      expect(payload.revisionId).toBe(revision.getRevisionId());
      expect(payload.resultado).toBe(ResultadoRevision.FAVORABLE);
    });
  });
});
