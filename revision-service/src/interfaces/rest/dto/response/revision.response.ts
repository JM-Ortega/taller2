import { EvaluacionResponse } from './evaluacion.response';
import { PreguntaParaRevisionResponse } from './pregunta-para-revision.response';

export type RevisionResponse = Readonly<{
  revisionId: string;
  preguntaId: string;
  versionPregunta: number;
  revisorIds: readonly string[];
  preguntaParaRevision: PreguntaParaRevisionResponse;
  evaluaciones: readonly EvaluacionResponse[];
  resultadoFinal: 'FAVORABLE' | 'DESFAVORABLE' | null;
}>;
