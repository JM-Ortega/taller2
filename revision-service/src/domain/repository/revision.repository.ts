import { Revision } from '../model/revision';

export abstract class RevisionRepository {
  abstract findById(revisionId: string): Promise<Revision | null>;
  abstract findByPreguntaId(preguntaId: string): Promise<readonly Revision[]>;
  abstract save(revision: Revision): Promise<void>;
}
