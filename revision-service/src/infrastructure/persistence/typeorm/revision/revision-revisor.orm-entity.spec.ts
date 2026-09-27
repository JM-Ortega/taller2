import { getMetadataArgsStorage } from 'typeorm';
import { RevisionOrmEntity } from './revision.orm-entity';
import { RevisionRevisorOrmEntity } from './revision-revisor.orm-entity';

describe('RevisionRevisorOrmEntity', () => {
  const storage = getMetadataArgsStorage();
  const columnas = storage.columns.filter(
    (columna) => columna.target === RevisionRevisorOrmEntity,
  );

  it('mapea a la tabla revision_revisor', () => {
    const tabla = storage.tables.find((t) => t.target === RevisionRevisorOrmEntity);
    expect(tabla?.name).toBe('revision_revisor');
  });

  it('declara PK compuesta revision_id + revisor_id', () => {
    const revisionId = columnas.find((c) => c.propertyName === 'revisionId');
    const revisorId = columnas.find((c) => c.propertyName === 'revisorId');

    expect(revisionId?.options.name).toBe('revision_id');
    expect(revisionId?.options.primary).toBe(true);
    expect(revisorId?.options.name).toBe('revisor_id');
    expect(revisorId?.options.primary).toBe(true);
  });

  it('declara revisor_id como text NOT NULL', () => {
    const revisorId = columnas.find((c) => c.propertyName === 'revisorId');
    expect(revisorId?.options.type).toBe('text');
  });

  it('declara una FK hacia revision', () => {
    const claves = storage.foreignKeys.filter((fk) => fk.target === RevisionRevisorOrmEntity);
    expect(claves).toHaveLength(1);
    const tipoReferenciado = claves[0].type as () => unknown;
    expect(tipoReferenciado()).toBe(RevisionOrmEntity);
  });
});
