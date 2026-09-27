import { DataSource } from 'typeorm';
import {
  RevisionTransaction,
  RevisionUnitOfWork,
} from '../../../application/port/out/revision-unit-of-work';
import { OutboxIntegrationEventPublisher } from './outbox/outbox-integration-event.publisher';
import { RevisionPersistenceMapper } from './revision/revision-persistence.mapper';
import { TypeOrmRevisionRepositoryAdapter } from './revision/typeorm-revision-repository.adapter';

export class TypeOrmRevisionUnitOfWork extends RevisionUnitOfWork {
  constructor(
    private readonly dataSource: DataSource,
    private readonly mapper: RevisionPersistenceMapper,
  ) {
    super();
  }

  async execute<T>(work: (tx: RevisionTransaction) => Promise<T>): Promise<T> {
    return this.dataSource.transaction(async (manager) => {
      const revisions = TypeOrmRevisionRepositoryAdapter.ligadoATransaccion(manager, this.mapper);
      const events = new OutboxIntegrationEventPublisher(manager);

      return work({ revisions, events });
    });
  }
}
