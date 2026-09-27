import { PreguntaParaRevision } from '../../../domain/model/pregunta-para-revision';

export abstract class PreguntaRevisionGateway {
  abstract iniciarRevision(
    preguntaId: string,
    versionPregunta: number,
  ): Promise<PreguntaParaRevision>;
}
