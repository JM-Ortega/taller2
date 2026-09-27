import { CriterioRevision } from './criterio-revision';
import { ResultadoEvaluacion } from './resultado-evaluacion';

export type Evaluacion = Readonly<{
  criterios: readonly CriterioRevision[];
  observaciones: string;
  resultado: ResultadoEvaluacion;
}>;
