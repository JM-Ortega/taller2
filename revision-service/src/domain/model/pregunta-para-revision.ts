export type PreguntaParaRevision = Readonly<{
  contexto: string;
  preguntaDirecta: string;
  opciones: readonly Readonly<{
    texto: string;
    correcta: boolean;
  }>[];
  justificacion: string;
  bibliografia: string;
  competencia: string;
  tema: string;
  subtema: string;
  nivelDificultad: string;
}>;
