import { CriterioRevisionResponse } from './criterio-revision.response';

export type EvaluacionResponse = Readonly<{
  revisorId: string;
  criterios: readonly CriterioRevisionResponse[];
  observaciones: string;
  resultado: 'FAVORABLE' | 'DESFAVORABLE';
}>;
