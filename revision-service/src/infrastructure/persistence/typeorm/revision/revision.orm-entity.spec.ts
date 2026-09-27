import { getMetadataArgsStorage } from 'typeorm';
import { RevisionOrmEntity } from './revision.orm-entity';

describe('RevisionOrmEntity', () => {
  const storage = getMetadataArgsStorage();
  const columnas = storage.columns.filter((columna) => columna.target === RevisionOrmEntity);

  function columna(propiedad: string) {
    const encontrada = columnas.find((c) => c.propertyName === propiedad);
    if (encontrada === undefined) {
      throw new Error(`no se encontró la columna para ${propiedad}`);
    }
    return encontrada;
  }

  it('mapea a la tabla revision', () => {
    const tabla = storage.tables.find((t) => t.target === RevisionOrmEntity);
    expect(tabla?.name).toBe('revision');
  });

  it('define revision_id como PK uuid', () => {
    const c = columna('revisionId');
    expect(c.options.name).toBe('revision_id');
    expect(c.options.type).toBe('uuid');
    expect(c.options.primary).toBe(true);
  });

  it('define pregunta_id uuid NOT NULL', () => {
    const c = columna('preguntaId');
    expect(c.options.name).toBe('pregunta_id');
    expect(c.options.type).toBe('uuid');
    expect(c.options.nullable).toBe(false);
  });

  it('define version_pregunta integer NOT NULL', () => {
    const c = columna('versionPregunta');
    expect(c.options.name).toBe('version_pregunta');
    expect(c.options.type).toBe('integer');
    expect(c.options.nullable).toBe(false);
  });

  it('define snapshot_pregunta jsonb NOT NULL', () => {
    const c = columna('snapshotPregunta');
    expect(c.options.name).toBe('snapshot_pregunta');
    expect(c.options.type).toBe('jsonb');
    expect(c.options.nullable).toBe(false);
  });

  it('define resultado_final varchar nullable', () => {
    const c = columna('resultadoFinal');
    expect(c.options.name).toBe('resultado_final');
    expect(c.options.type).toBe('varchar');
    expect(c.options.nullable).toBe(true);
  });

  it('declara UNIQUE sobre pregunta_id y version_pregunta', () => {
    const unicos = storage.uniques.filter((u) => u.target === RevisionOrmEntity);
    const columnasUnicas = unicos.flatMap((u) => (Array.isArray(u.columns) ? u.columns : []));
    expect(columnasUnicas).toEqual(['preguntaId', 'versionPregunta']);
  });
});
