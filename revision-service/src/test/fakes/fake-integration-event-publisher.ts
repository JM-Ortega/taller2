import { RevisionFinalizada } from '../../domain/event/revision-finalizada';
import { IntegrationEventPublisher } from '../../application/port/out/integration-event-publisher';

export class FakeIntegrationEventPublisher extends IntegrationEventPublisher {
  private readonly publicados: RevisionFinalizada[] = [];

  async publish(event: RevisionFinalizada): Promise<void> {
    this.publicados.push(event);
  }

  eventosPublicados(): readonly RevisionFinalizada[] {
    return this.publicados;
  }
}
