import { PreguntaRevisionSolicitada } from '../model/pregunta-revision-solicitada';
import { PreguntaRevisionSolicitadaStore } from '../port/out/pregunta-revision-solicitada.store';

export class ListarPreguntasPendientesUseCase {
  constructor(private readonly store: PreguntaRevisionSolicitadaStore) {}

  async execute(): Promise<readonly PreguntaRevisionSolicitada[]> {
    return this.store.listPending();
  }
}
