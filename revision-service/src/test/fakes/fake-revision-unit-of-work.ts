import {
  RevisionTransaction,
  RevisionUnitOfWork,
} from '../../application/port/out/revision-unit-of-work';

export class FakeRevisionUnitOfWork extends RevisionUnitOfWork {
  constructor(private readonly transaction: RevisionTransaction) {
    super();
  }

  async execute<T>(work: (tx: RevisionTransaction) => Promise<T>): Promise<T> {
    return work(this.transaction);
  }
}
