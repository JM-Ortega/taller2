import type { DataSource } from 'typeorm';
import { PreguntaRevisionSolicitadaInconsistenteException } from '../../../../application/exception/pregunta-revision-solicitada-inconsistente.exception';
import { snapshotValido } from '../../../../test/fixtures/revision-test-fixtures';
import { RevisionOrmEntity } from '../revision/revision.orm-entity';
import { PreguntaRevisionSolicitadaOrmEntity } from './pregunta-revision-solicitada.orm-entity';
import { TypeOrmPreguntaRevisionSolicitadaStoreAdapter } from './typeorm-pregunta-revision-solicitada-store.adapter';

function coincideConCondicion<T extends object>(fila: T, condicion: Partial<T>): boolean {
  return (Object.keys(condicion) as (keyof T)[]).every((clave) => fila[clave] === condicion[clave]);
}

class FakeSolicitudQueryBuilder {
  private valoresInsert: PreguntaRevisionSolicitadaOrmEntity | null = null;
  private filtroPreguntaId: string | null = null;

  constructor(private readonly repositorio: FakeSolicitudRepository) {}

  insert(): this {
    return this;
  }

  into(): this {
    return this;
  }

  values(valores: PreguntaRevisionSolicitadaOrmEntity): this {
    this.valoresInsert = valores;
    return this;
  }

  orIgnore(): this {
    return this;
  }

  async execute(): Promise<void> {
    if (this.valoresInsert === null) {
      return;
    }
    const yaExiste = this.repositorio.solicitudes.some((fila) =>
      coincideConCondicion(fila, {
        preguntaId: this.valoresInsert?.preguntaId,
        versionPregunta: this.valoresInsert?.versionPregunta,
      }),
    );
    if (!yaExiste) {
      this.repositorio.solicitudes.push(this.valoresInsert);
    }
  }

  leftJoin(): this {
    return this;
  }

  where(): this {
    return this;
  }

  andWhere(_condicion: string, parametros?: { preguntaId?: string }): this {
    if (parametros?.preguntaId !== undefined) {
      this.filtroPreguntaId = parametros.preguntaId;
    }
    return this;
  }

  private pendientes(): PreguntaRevisionSolicitadaOrmEntity[] {
    return this.repositorio.solicitudes.filter((solicitud) => {
      const tieneRevision = this.repositorio.revisiones.some(
        (revision) =>
          revision.preguntaId === solicitud.preguntaId &&
          revision.versionPregunta === solicitud.versionPregunta,
      );
      const coincideFiltro =
        this.filtroPreguntaId === null || solicitud.preguntaId === this.filtroPreguntaId;
      return !tieneRevision && coincideFiltro;
    });
  }

  async getOne(): Promise<PreguntaRevisionSolicitadaOrmEntity | null> {
    return this.pendientes()[0] ?? null;
  }

  async getMany(): Promise<PreguntaRevisionSolicitadaOrmEntity[]> {
    return this.pendientes();
  }
}

class FakeSolicitudRepository {
  readonly solicitudes: PreguntaRevisionSolicitadaOrmEntity[] = [];
  readonly revisiones: RevisionOrmEntity[] = [];

  createQueryBuilder(): FakeSolicitudQueryBuilder {
    return new FakeSolicitudQueryBuilder(this);
  }

  async findOne(options: {
    where: Partial<PreguntaRevisionSolicitadaOrmEntity>;
  }): Promise<PreguntaRevisionSolicitadaOrmEntity | null> {
    return this.solicitudes.find((fila) => coincideConCondicion(fila, options.where)) ?? null;
  }
}

class FakeDataSourceParaStore {
  constructor(private readonly repositorio: FakeSolicitudRepository) {}

  getRepository(): FakeSolicitudRepository {
    return this.repositorio;
  }
}

function crearStore(repositorio = new FakeSolicitudRepository()) {
  const dataSource = new FakeDataSourceParaStore(repositorio);
  const store = new TypeOrmPreguntaRevisionSolicitadaStoreAdapter(dataSource as unknown as DataSource);
  return { store, repositorio };
}

describe('TypeOrmPreguntaRevisionSolicitadaStoreAdapter', () => {
  it('register inserta una solicitud nueva', async () => {
    const { store, repositorio } = crearStore();

    await store.register({ preguntaId: 'p1', versionPregunta: 1, autorId: 'autor-1' });

    expect(repositorio.solicitudes).toEqual([
      { preguntaId: 'p1', versionPregunta: 1, autorId: 'autor-1' },
    ]);
  });

  it('register duplicado con el mismo autor termina sin error', async () => {
    const { store, repositorio } = crearStore();
    repositorio.solicitudes.push({ preguntaId: 'p1', versionPregunta: 1, autorId: 'autor-1' });

    await expect(
      store.register({ preguntaId: 'p1', versionPregunta: 1, autorId: 'autor-1' }),
    ).resolves.toBeUndefined();
    expect(repositorio.solicitudes).toHaveLength(1);
  });

  it('register con el mismo pregunta/versión y autor distinto lanza la excepción de inconsistencia', async () => {
    const { store, repositorio } = crearStore();
    repositorio.solicitudes.push({ preguntaId: 'p1', versionPregunta: 1, autorId: 'autor-1' });

    await expect(
      store.register({ preguntaId: 'p1', versionPregunta: 1, autorId: 'autor-2' }),
    ).rejects.toThrow(PreguntaRevisionSolicitadaInconsistenteException);
    expect(repositorio.solicitudes).toHaveLength(1);
  });

  it('findPendingByPreguntaId retorna la solicitud sin Revision asociada', async () => {
    const { store, repositorio } = crearStore();
    repositorio.solicitudes.push({ preguntaId: 'p1', versionPregunta: 1, autorId: 'autor-1' });

    const pendiente = await store.findPendingByPreguntaId('p1');

    expect(pendiente).toEqual({ preguntaId: 'p1', versionPregunta: 1, autorId: 'autor-1' });
  });

  it('findPendingByPreguntaId retorna null cuando ya existe una Revision para esa versión', async () => {
    const { store, repositorio } = crearStore();
    repositorio.solicitudes.push({ preguntaId: 'p1', versionPregunta: 1, autorId: 'autor-1' });
    repositorio.revisiones.push({
      revisionId: 'r1',
      preguntaId: 'p1',
      versionPregunta: 1,
      snapshotPregunta: snapshotValido(),
      resultadoFinal: null,
    });

    const pendiente = await store.findPendingByPreguntaId('p1');

    expect(pendiente).toBeNull();
  });

  it('listPending retorna todas las solicitudes sin Revision asociada', async () => {
    const { store, repositorio } = crearStore();
    repositorio.solicitudes.push(
      { preguntaId: 'p1', versionPregunta: 1, autorId: 'autor-1' },
      { preguntaId: 'p2', versionPregunta: 1, autorId: 'autor-2' },
    );
    repositorio.revisiones.push({
      revisionId: 'r1',
      preguntaId: 'p1',
      versionPregunta: 1,
      snapshotPregunta: snapshotValido(),
      resultadoFinal: null,
    });

    const pendientes = await store.listPending();

    expect(pendientes).toEqual([{ preguntaId: 'p2', versionPregunta: 1, autorId: 'autor-2' }]);
  });
});
