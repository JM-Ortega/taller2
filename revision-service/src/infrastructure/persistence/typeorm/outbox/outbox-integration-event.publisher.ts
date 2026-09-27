import { randomUUID } from 'node:crypto';
import { EntityManager } from 'typeorm';
import { RevisionFinalizada } from '../../../../domain/event/revision-finalizada';
import { IntegrationEventPublisher } from '../../../../application/port/out/integration-event-publisher';
import { OutboxEventOrmEntity } from './outbox-event.orm-entity';

const REVISION_FINALIZADA_EVENT_TYPE = 'RevisionFinalizada';

export class OutboxIntegrationEventPublisher implements IntegrationEventPublisher {
  constructor(private readonly manager: EntityManager) {}

  async publish(event: RevisionFinalizada): Promise<void> {
    const eventId = randomUUID();

    const payload = {
      eventId,
      eventType: REVISION_FINALIZADA_EVENT_TYPE,
      occurredAt: event.occurredAt.toISOString(),
      revisionId: event.revisionId,
      preguntaId: event.preguntaId,
      versionPregunta: event.versionPregunta,
      resultado: event.resultado,
    } satisfies Record<string, unknown>;

    await this.manager.save(OutboxEventOrmEntity, {
      eventId,
      eventType: REVISION_FINALIZADA_EVENT_TYPE,
      occurredAt: event.occurredAt,
      payload,
      publishedAt: null,
    });
  }
}
