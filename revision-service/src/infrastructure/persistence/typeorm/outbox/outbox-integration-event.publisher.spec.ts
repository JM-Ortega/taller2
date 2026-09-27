import type { EntityManager } from 'typeorm';
import { ResultadoRevision } from '../../../../domain/model/resultado-revision';
import { OutboxEventOrmEntity } from './outbox-event.orm-entity';
import { OutboxIntegrationEventPublisher } from './outbox-integration-event.publisher';

class FakeEntityManager {
  readonly saves: Array<{ target: unknown; data: unknown }> = [];

  async save<T>(target: unknown, data: T): Promise<T> {
    this.saves.push({ target, data });
    return data;
  }
}

describe('OutboxIntegrationEventPublisher', () => {
  it('guarda exactamente un OutboxEventOrmEntity con eventId/eventType/occurredAt compartidos con el payload', async () => {
    const manager = new FakeEntityManager();
    const publisher = new OutboxIntegrationEventPublisher(manager as unknown as EntityManager);
    const occurredAt = new Date('2026-01-01T00:00:00.000Z');

    await publisher.publish({
      revisionId: 'revision-1',
      preguntaId: 'pregunta-1',
      versionPregunta: 2,
      resultado: ResultadoRevision.FAVORABLE,
      occurredAt,
    });

    expect(manager.saves).toHaveLength(1);
    const [guardado] = manager.saves;
    expect(guardado.target).toBe(OutboxEventOrmEntity);

    const entidad = guardado.data as OutboxEventOrmEntity;
    expect(typeof entidad.eventId).toBe('string');
    expect(entidad.eventId).toMatch(/^[0-9a-f-]{36}$/);
    expect(entidad.eventType).toBe('RevisionFinalizada');
    expect(entidad.occurredAt).toBe(occurredAt);
    expect(entidad.publishedAt).toBeNull();

    const payload = entidad.payload as Record<string, unknown>;
    expect(payload.eventId).toBe(entidad.eventId);
    expect(payload.eventType).toBe(entidad.eventType);
    expect(payload.occurredAt).toBe(occurredAt.toISOString());
    expect(payload.revisionId).toBe('revision-1');
    expect(payload.preguntaId).toBe('pregunta-1');
    expect(payload.versionPregunta).toBe(2);
    expect(payload.resultado).toBe(ResultadoRevision.FAVORABLE);
    expect(Object.keys(payload).sort()).toEqual(
      [
        'eventId',
        'eventType',
        'occurredAt',
        'revisionId',
        'preguntaId',
        'versionPregunta',
        'resultado',
      ].sort(),
    );
  });
});
