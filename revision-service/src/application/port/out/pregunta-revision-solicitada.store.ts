import { PreguntaRevisionSolicitada } from '../../model/pregunta-revision-solicitada';

export abstract class PreguntaRevisionSolicitadaStore {
  abstract register(solicitud: PreguntaRevisionSolicitada): Promise<void>;
  abstract findPendingByPreguntaId(
    preguntaId: string,
  ): Promise<PreguntaRevisionSolicitada | null>;
  abstract listPending(): Promise<readonly PreguntaRevisionSolicitada[]>;
}
