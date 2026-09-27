import type { EntityManager } from 'typeorm';
import {
  evaluacionFavorable,
  revisionValidaEnCurso,
} from '../../../../test/fixtures/revision-test-fixtures';
import { RevisionEvaluacionOrmEntity } from './revision-evaluacion.orm-entity';
import { RevisionPersistenceMapper } from './revision-persistence.mapper';
import { RevisionRevisorOrmEntity } from './revision-revisor.orm-entity';
import { RevisionOrmEntity } from './revision.orm-entity';
import { TypeOrmRevisionRepositoryAdapter } from './typeorm-revision-repository.adapter';

function coincideConCondicion<T extends object>(fila: T, condicion: Partial<T>): boolean {
  return (Object.keys(condicion) as (keyof T)[]).every((clave) => fila[clave] === condicion[clave]);
}

type Lock = { mode: string };
type OpcionesBusqueda<T> = { where: Partial<T>; lock?: Lock };

class FakeTransactionalManager {
  private readonly tablas = new Map<unknown, unknown[]>();
  readonly deletes: Array<{ target: unknown; criteria: unknown }> = [];
  readonly saves: Array<{ target: unknown; data: unknown }> = [];
  readonly findOneCalls: Array<{ target: unknown; options: OpcionesBusqueda<unknown> }> = [];

  seed<T>(target: new (...args: never[]) => T, filas: readonly T[]): void {
    this.tablas.set(target, [...filas]);
  }

  async findOne<T extends object>(
    target: unknown,
    options: OpcionesBusqueda<T>,
  ): Promise<T | null> {
    this.findOneCalls.push({ target, options });
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

describe('TypeOrmRevisionRepositoryAdapter.ligadoATransaccion', () => {
  const mapper = new RevisionPersistenceMapper();

  it('findById usa el manager transaccional recibido, bloquea la raíz con pessimistic_write y reconstruye el Aggregate', async () => {
    const original = revisionValidaEnCurso(['revisor-1', 'revisor-2']);
    original.registrarEvaluacion('revisor-1', evaluacionFavorable(), new Date());

    const manager = new FakeTransactionalManager();
    manager.seed(RevisionOrmEntity, [mapper.toRootEntity(original)]);
    manager.seed(RevisionRevisorOrmEntity, mapper.toRevisorEntities(original));
    manager.seed(RevisionEvaluacionOrmEntity, mapper.toEvaluacionEntities(original));

    const adapter = TypeOrmRevisionRepositoryAdapter.ligadoATransaccion(
      manager as unknown as EntityManager,
      mapper,
    );

    const reconstruida = await adapter.findById(original.getRevisionId());

    expect(reconstruida?.getRevisionId()).toBe(original.getRevisionId());
    expect(reconstruida?.getRevisorIds()).toEqual(original.getRevisorIds());
    expect(reconstruida?.getEvaluaciones().size).toBe(1);

    const busquedaRaiz = manager.findOneCalls.find((c) => c.target === RevisionOrmEntity);
    expect(busquedaRaiz?.options.lock).toEqual({ mode: 'pessimistic_write' });
  });

  it('save usa el mismo manager transaccional recibido, sin abrir ninguna transacción adicional', async () => {
    const revision = revisionValidaEnCurso(['revisor-1', 'revisor-2']);
    revision.registrarEvaluacion('revisor-1', evaluacionFavorable(), new Date());

    const manager = new FakeTransactionalManager();
    const adapter = TypeOrmRevisionRepositoryAdapter.ligadoATransaccion(
      manager as unknown as EntityManager,
      mapper,
    );

    await adapter.save(revision);

    expect(manager.deletes.map((d) => d.target)).toEqual([
      RevisionEvaluacionOrmEntity,
      RevisionRevisorOrmEntity,
    ]);
    expect(manager.saves.map((s) => s.target)).toEqual([
      RevisionOrmEntity,
      RevisionRevisorOrmEntity,
      RevisionEvaluacionOrmEntity,
    ]);
  });
});
