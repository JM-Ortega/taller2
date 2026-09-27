import { PreguntaParaRevision } from '../../domain/model/pregunta-para-revision';
import { PreguntaRevisionGateway } from '../../application/port/out/pregunta-revision.gateway';

export class FakePreguntaRevisionGateway extends PreguntaRevisionGateway {
  private llamadas: ReadonlyArray<{ preguntaId: string; versionPregunta: number }> = [];

  constructor(private readonly snapshot: PreguntaParaRevision) {
    super();
  }

  async iniciarRevision(
    preguntaId: string,
    versionPregunta: number,
  ): Promise<PreguntaParaRevision> {
    this.llamadas = [...this.llamadas, { preguntaId, versionPregunta }];
    return this.snapshot;
  }

  contarLlamadas(): number {
    return this.llamadas.length;
  }

  ultimaLlamada(): { preguntaId: string; versionPregunta: number } | undefined {
    return this.llamadas[this.llamadas.length - 1];
  }
}
