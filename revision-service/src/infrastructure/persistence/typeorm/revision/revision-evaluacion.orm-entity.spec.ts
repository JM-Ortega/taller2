import { getMetadataArgsStorage } from 'typeorm';
import { RevisionEvaluacionOrmEntity } from './revision-evaluacion.orm-entity';
import { RevisionRevisorOrmEntity } from './revision-revisor.orm-entity';

describe('RevisionEvaluacionOrmEntity', () => {
  const storage = getMetadataArgsStorage();
  const columnas = storage.columns.filter(
    (columna) => columna.target === RevisionEvaluacionOrmEntity,
  );

  function columna(propiedad: string) {
    const encontrada = columnas.find((c) => c.propertyName === propiedad);
    if (encontrada === undefined) {
      throw new Error(`no se encontró la columna para ${propiedad}`);
    }
    return encontrada;
  }

  it('mapea a la tabla revision_evaluacion', () => {
    const tabla = storage.tables.find((t) => t.target === RevisionEvaluacionOrmEntity);
    expect(tabla?.name).toBe('revision_evaluacion');
  });

  it('declara PK compuesta revision_id + revisor_id', () => {
    expect(columna('revisionId').options.primary).toBe(true);
    expect(columna('revisorId').options.primary).toBe(true);
  });

  it('define criterios jsonb NOT NULL', () => {
    const c = columna('criterios');
    expect(c.options.name).toBe('criterios');
    expect(c.options.type).toBe('jsonb');
    expect(c.options.nullable).toBe(false);
  });

  it('define observaciones text NOT NULL', () => {
    const c = columna('observaciones');
    expect(c.options.name).toBe('observaciones');
    expect(c.options.type).toBe('text');
    expect(c.options.nullable).toBe(false);
  });

  it('define resultado varchar NOT NULL', () => {
    const c = columna('resultado');
    expect(c.options.name).toBe('resultado');
    expect(c.options.type).toBe('varchar');
    expect(c.options.nullable).toBe(false);
  });

  it('declara una FK compuesta hacia revision_revisor', () => {
    const claves = storage.foreignKeys.filter((fk) => fk.target === RevisionEvaluacionOrmEntity);
    expect(claves).toHaveLength(1);
    const tipoReferenciado = claves[0].type as () => unknown;
    expect(tipoReferenciado()).toBe(RevisionRevisorOrmEntity);
    expect(claves[0].columnNames).toEqual(['revisionId', 'revisorId']);
    expect(claves[0].referencedColumnNames).toEqual(['revisionId', 'revisorId']);
  });
});
