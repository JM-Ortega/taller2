import type { DataSource } from 'typeorm';
import { Revision } from '../../../../domain/model/revision';
import {
  evaluacionFavorable,
  revisionValidaEnCurso,
  snapshotValido,
} from '../../../../test/fixtures/revision-test-fixtures';
import { RevisionEvaluacionOrmEntity } from './revision-evaluacion.orm-entity';
import { RevisionPersistenceMapper } from './revision-persistence.mapper';
import { RevisionRevisorOrmEntity } from './revision-revisor.orm-entity';
import { RevisionOrmEntity } from './revision.orm-entity';
import { TypeOrmRevisionRepositoryAdapter } from './typeorm-revision-repository.adapter';

function coincideConCondicion<T extends object>(fila: T, condicion: Partial<T>): boolean {
  return (Object.keys(condicion) as (keyof T)[]).every((clave) => fila[clave] === condicion[clave]);
}

class FakeEntityManager {
  private readonly tablas = new Map<unknown, unknown[]>();
  readonly deletes: Array<{ target: unknown; criteria: unknown }> = [];
  readonly saves: Array<{ target: unknown; data: unknown }> = [];

  seed<T>(target: new (...args: never[]) => T, filas: readonly T[]): void {
    this.tablas.set(target, [...filas]);
  }

  async findOne<T extends object>(target: unknown, options: { where: Partial<T> }): Promise<T | null> {
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

  constructor(
    readonly manager: FakeEntityManager,
    readonly transactionalManager: FakeEntityManager,
  ) {}

  async transaction<T>(work: (manager: FakeEntityManager) => Promise<T>): Promise<T> {
    this.transactionCallCount += 1;
    return work(this.transactionalManager);
  }
}

function crearAdapter(manager: FakeEntityManager, transactionalManager = new FakeEntityManager()) {
  const dataSource = new FakeDataSource(manager, transactionalManager);
  const adapter = TypeOrmRevisionRepositoryAdapter.standalone(
    dataSource as unknown as DataSource,
    new RevisionPersistenceMapper(),
  );
  return { adapter, dataSource };
}

describe('TypeOrmRevisionRepositoryAdapter.standalone', () => {
  const mapper = new RevisionPersistenceMapper();

  it('findById retorna null cuando la raíz no existe', async () => {
    const { adapter } = crearAdapter(new FakeEntityManager());

    const resultado = await adapter.findById('inexistente');

    expect(resultado).toBeNull();
  });

  it('findById carga raíz, revisores y evaluaciones y reconstruye el Aggregate', async () => {
    const original = revisionValidaEnCurso(['revisor-1', 'revisor-2']);
    original.registrarEvaluacion('revisor-1', evaluacionFavorable(), new Date());

    const manager = new FakeEntityManager();
    manager.seed(RevisionOrmEntity, [mapper.toRootEntity(original)]);
    manager.seed(RevisionRevisorOrmEntity, mapper.toRevisorEntities(original));
    manager.seed(RevisionEvaluacionOrmEntity, mapper.toEvaluacionEntities(original));

    const { adapter } = crearAdapter(manager);

    const reconstruida = await adapter.findById(original.getRevisionId());

    expect(reconstruida?.getRevisionId()).toBe(original.getRevisionId());
    expect(reconstruida?.getRevisorIds()).toEqual(original.getRevisorIds());
    expect(reconstruida?.getEvaluaciones().size).toBe(1);
  });

  it('findByPreguntaId reconstruye todas las raíces encontradas', async () => {
    const uno = revisionValidaEnCurso(['revisor-1']);
    const dos = Revision.crear('revision-2', uno.getPreguntaId(), 2, ['revisor-2'], snapshotValido());

    const manager = new FakeEntityManager();
    manager.seed(RevisionOrmEntity, [mapper.toRootEntity(uno), mapper.toRootEntity(dos)]);
    manager.seed(RevisionRevisorOrmEntity, [
      ...mapper.toRevisorEntities(uno),
      ...mapper.toRevisorEntities(dos),
    ]);
    manager.seed(RevisionEvaluacionOrmEntity, []);

    const { adapter } = crearAdapter(manager);

    const revisiones = await adapter.findByPreguntaId(uno.getPreguntaId());

    expect(revisiones.map((r) => r.getRevisionId()).sort()).toEqual(
      [uno.getRevisionId(), dos.getRevisionId()].sort(),
    );
  });

  it('save abre exactamente una transacción y usa su manager para eliminar e insertar en orden', async () => {
    const revision = revisionValidaEnCurso(['revisor-1', 'revisor-2']);
    revision.registrarEvaluacion('revisor-1', evaluacionFavorable(), new Date());

    const manager = new FakeEntityManager();
    const transactionalManager = new FakeEntityManager();
    const { adapter, dataSource } = crearAdapter(manager, transactionalManager);

    await adapter.save(revision);

    expect(dataSource.transactionCallCount).toBe(1);
    expect(manager.deletes).toHaveLength(0);
    expect(manager.saves).toHaveLength(0);

    expect(transactionalManager.deletes.map((d) => d.target)).toEqual([
      RevisionEvaluacionOrmEntity,
      RevisionRevisorOrmEntity,
    ]);
    expect(transactionalManager.saves.map((s) => s.target)).toEqual([
      RevisionOrmEntity,
      RevisionRevisorOrmEntity,
      RevisionEvaluacionOrmEntity,
    ]);
  });
});
