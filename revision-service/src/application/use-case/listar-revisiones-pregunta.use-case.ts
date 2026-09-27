import { Revision } from '../../domain/model/revision';
import { RevisionRepository } from '../../domain/repository/revision.repository';

export class ListarRevisionesPreguntaUseCase {
  constructor(private readonly repository: RevisionRepository) {}

  async execute(preguntaId: string): Promise<readonly Revision[]> {
    return this.repository.findByPreguntaId(preguntaId);
  }
}
