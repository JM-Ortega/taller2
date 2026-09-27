import { getMetadataArgsStorage } from 'typeorm';
import { PreguntaRevisionSolicitadaOrmEntity } from './pregunta-revision-solicitada.orm-entity';

describe('PreguntaRevisionSolicitadaOrmEntity', () => {
  const storage = getMetadataArgsStorage();
  const columnas = storage.columns.filter(
    (columna) => columna.target === PreguntaRevisionSolicitadaOrmEntity,
  );

  it('mapea a la tabla pregunta_revision_solicitada', () => {
    const tabla = storage.tables.find((t) => t.target === PreguntaRevisionSolicitadaOrmEntity);
    expect(tabla?.name).toBe('pregunta_revision_solicitada');
  });

  it('declara PK compuesta pregunta_id + version_pregunta', () => {
    const preguntaId = columnas.find((c) => c.propertyName === 'preguntaId');
    const versionPregunta = columnas.find((c) => c.propertyName === 'versionPregunta');

    expect(preguntaId?.options.name).toBe('pregunta_id');
    expect(preguntaId?.options.primary).toBe(true);
    expect(versionPregunta?.options.name).toBe('version_pregunta');
    expect(versionPregunta?.options.primary).toBe(true);
  });

  it('define autor_id text NOT NULL', () => {
    const autorId = columnas.find((c) => c.propertyName === 'autorId');
    expect(autorId?.options.name).toBe('autor_id');
    expect(autorId?.options.type).toBe('text');
    expect(autorId?.options.nullable).toBe(false);
  });
});
