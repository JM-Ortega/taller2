import { DataSource } from 'typeorm';
import { crearRevisionDataSource } from './revision-data-source.factory';

describe('crearRevisionDataSource', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('construye un DataSource sin inicializarlo (sin conectar)', () => {
    const dataSource = crearRevisionDataSource();

    expect(dataSource).toBeInstanceOf(DataSource);
    expect(dataSource.isInitialized).toBe(false);
  });

  it('usa REVISION_DATABASE_URL cuando está definida', () => {
    process.env.REVISION_DATABASE_URL = 'postgres://user:pass@otrohost:5432/otra_db';

    const dataSource = crearRevisionDataSource();

    expect((dataSource.options as { url?: string }).url).toBe(
      'postgres://user:pass@otrohost:5432/otra_db',
    );
  });

  it('usa una URL local por defecto cuando REVISION_DATABASE_URL no está definida', () => {
    delete process.env.REVISION_DATABASE_URL;

    const dataSource = crearRevisionDataSource();

    expect((dataSource.options as { url?: string }).url).toBe(
      'postgres://postgres:postgres@localhost:5432/revision',
    );
  });

  it('synchronize es false por defecto', () => {
    delete process.env.REVISION_DB_SYNCHRONIZE;

    const dataSource = crearRevisionDataSource();

    expect((dataSource.options as { synchronize?: boolean }).synchronize).toBe(false);
  });

  it('synchronize se activa solo con REVISION_DB_SYNCHRONIZE=true explícito', () => {
    process.env.REVISION_DB_SYNCHRONIZE = 'true';

    const dataSource = crearRevisionDataSource();

    expect((dataSource.options as { synchronize?: boolean }).synchronize).toBe(true);
  });

  it('registra las 5 entidades reales del bounded context', () => {
    const dataSource = crearRevisionDataSource();

    expect((dataSource.options as { entities?: unknown[] }).entities).toHaveLength(5);
  });
});
