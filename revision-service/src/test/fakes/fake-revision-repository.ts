import { Revision } from '../../domain/model/revision';
import { RevisionRepository } from '../../domain/repository/revision.repository';

export class FakeRevisionRepository extends RevisionRepository {
  private readonly almacen = new Map<string, Revision>();
  private vecesGuardado = 0;

  agregar(revision: Revision): void {
    this.almacen.set(revision.getRevisionId(), revision);
  }

  async findById(revisionId: string): Promise<Revision | null> {
    return this.almacen.get(revisionId) ?? null;
  }

  async findByPreguntaId(preguntaId: string): Promise<readonly Revision[]> {
    return [...this.almacen.values()].filter(
      (revision) => revision.getPreguntaId() === preguntaId,
    );
  }

  async save(revision: Revision): Promise<void> {
    this.almacen.set(revision.getRevisionId(), revision);
    this.vecesGuardado += 1;
  }

  contarGuardados(): number {
    return this.vecesGuardado;
  }
}
