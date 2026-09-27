import { RevisionFinalizada } from '../../../domain/event/revision-finalizada';

export abstract class IntegrationEventPublisher {
  abstract publish(event: RevisionFinalizada): Promise<void>;
}
