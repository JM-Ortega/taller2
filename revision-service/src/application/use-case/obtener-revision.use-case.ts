import { Revision } from '../../domain/model/revision';
import { RevisionRepository } from '../../domain/repository/revision.repository';
import { RevisionNoEncontradaException } from '../exception/revision-no-encontrada.exception';

export class ObtenerRevisionUseCase {
  constructor(private readonly repository: RevisionRepository) {}

  async execute(revisionId: string): Promise<Revision> {
    const revision = await this.repository.findById(revisionId);
    if (revision === null) {
      throw new RevisionNoEncontradaException(revisionId);
    }
    return revision;
  }
}
