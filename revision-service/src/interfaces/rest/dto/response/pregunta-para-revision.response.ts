import { OpcionRespuestaResponse } from './opcion-respuesta.response';

export type PreguntaParaRevisionResponse = Readonly<{
  contexto: string;
  preguntaDirecta: string;
  opciones: readonly OpcionRespuestaResponse[];
  justificacion: string;
  bibliografia: string;
  competencia: string;
  tema: string;
  subtema: string;
  nivelDificultad: string;
}>;
