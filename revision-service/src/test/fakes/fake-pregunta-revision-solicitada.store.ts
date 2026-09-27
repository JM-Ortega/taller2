import { PreguntaRevisionSolicitada } from '../../application/model/pregunta-revision-solicitada';
import { PreguntaRevisionSolicitadaStore } from '../../application/port/out/pregunta-revision-solicitada.store';

export class FakePreguntaRevisionSolicitadaStore extends PreguntaRevisionSolicitadaStore {
  private readonly pendientes = new Map<string, PreguntaRevisionSolicitada>();

  agregarPendiente(solicitud: PreguntaRevisionSolicitada): void {
    this.pendientes.set(solicitud.preguntaId, solicitud);
  }

  async register(solicitud: PreguntaRevisionSolicitada): Promise<void> {
    this.pendientes.set(solicitud.preguntaId, solicitud);
  }

  async findPendingByPreguntaId(
    preguntaId: string,
  ): Promise<PreguntaRevisionSolicitada | null> {
    return this.pendientes.get(preguntaId) ?? null;
  }

  async listPending(): Promise<readonly PreguntaRevisionSolicitada[]> {
    return [...this.pendientes.values()];
  }
}
