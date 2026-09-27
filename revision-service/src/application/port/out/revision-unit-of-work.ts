import { RevisionRepository } from '../../../domain/repository/revision.repository';
import { IntegrationEventPublisher } from './integration-event-publisher';

export type RevisionTransaction = Readonly<{
  revisions: RevisionRepository;
  events: IntegrationEventPublisher;
}>;

export abstract class RevisionUnitOfWork {
  abstract execute<T>(work: (tx: RevisionTransaction) => Promise<T>): Promise<T>;
}
