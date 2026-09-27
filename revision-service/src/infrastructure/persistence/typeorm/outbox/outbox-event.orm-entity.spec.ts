import { getMetadataArgsStorage } from 'typeorm';
import { OutboxEventOrmEntity } from './outbox-event.orm-entity';

describe('OutboxEventOrmEntity', () => {
  const storage = getMetadataArgsStorage();
  const columnas = storage.columns.filter((columna) => columna.target === OutboxEventOrmEntity);

  function columna(propiedad: string) {
    const encontrada = columnas.find((c) => c.propertyName === propiedad);
    if (encontrada === undefined) {
      throw new Error(`no se encontró la columna para ${propiedad}`);
    }
    return encontrada;
  }

  it('mapea a la tabla outbox_event', () => {
    const tabla = storage.tables.find((t) => t.target === OutboxEventOrmEntity);
    expect(tabla?.name).toBe('outbox_event');
  });

  it('define event_id como PK uuid', () => {
    const c = columna('eventId');
    expect(c.options.name).toBe('event_id');
    expect(c.options.type).toBe('uuid');
    expect(c.options.primary).toBe(true);
  });

  it('define event_type varchar NOT NULL', () => {
    const c = columna('eventType');
    expect(c.options.name).toBe('event_type');
    expect(c.options.type).toBe('varchar');
    expect(c.options.nullable).toBe(false);
  });

  it('define occurred_at timestamptz NOT NULL', () => {
    const c = columna('occurredAt');
    expect(c.options.name).toBe('occurred_at');
    expect(c.options.type).toBe('timestamptz');
    expect(c.options.nullable).toBe(false);
  });

  it('define payload jsonb NOT NULL', () => {
    const c = columna('payload');
    expect(c.options.name).toBe('payload');
    expect(c.options.type).toBe('jsonb');
    expect(c.options.nullable).toBe(false);
  });

  it('define published_at timestamptz nullable', () => {
    const c = columna('publishedAt');
    expect(c.options.name).toBe('published_at');
    expect(c.options.type).toBe('timestamptz');
    expect(c.options.nullable).toBe(true);
  });

  it('no declara columnas adicionales', () => {
    const nombresPropiedades = columnas.map((c) => c.propertyName).sort();
    expect(nombresPropiedades).toEqual(
      ['eventId', 'eventType', 'occurredAt', 'payload', 'publishedAt'].sort(),
    );
  });
});
