export type RegistrarEvaluacionCommand = Readonly<{
  revisionId: string;
  revisorId: string;
  criterios: readonly Readonly<{
    nombre: string;
    cumple: boolean;
  }>[];
  observaciones: string;
  resultado: 'FAVORABLE' | 'DESFAVORABLE';
}>;
