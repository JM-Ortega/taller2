import { ResultadoRevision } from '../model/resultado-revision';

export type RevisionFinalizada = Readonly<{
  revisionId: string;
  preguntaId: string;
  versionPregunta: number;
  resultado: ResultadoRevision;
  occurredAt: Date;
}>;
