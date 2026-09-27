import { Evaluacion } from '../../domain/model/evaluacion';
import { PreguntaParaRevision } from '../../domain/model/pregunta-para-revision';
import { ResultadoEvaluacion } from '../../domain/model/resultado-evaluacion';
import { Revision } from '../../domain/model/revision';

export function snapshotValido(): PreguntaParaRevision {
  return {
    contexto: 'Contexto de ejemplo',
    preguntaDirecta: '¿Cuál es la respuesta correcta?',
    opciones: [
      { texto: 'Opción correcta', correcta: true },
      { texto: 'Distractor 1', correcta: false },
      { texto: 'Distractor 2', correcta: false },
      { texto: 'Distractor 3', correcta: false },
      { texto: 'Distractor 4', correcta: false },
    ],
    justificacion: 'Justificación de ejemplo',
    bibliografia: 'Bibliografía de ejemplo',
    competencia: 'Comunicación escrita',
    tema: 'Tema ejemplo',
    subtema: 'Subtema ejemplo',
    nivelDificultad: 'MEDIO',
  };
}

export function evaluacionFavorable(): Evaluacion {
  return {
    criterios: [{ nombre: 'claridad', cumple: true }],
    observaciones: 'Todo correcto',
    resultado: ResultadoEvaluacion.FAVORABLE,
  };
}

export function evaluacionDesfavorable(): Evaluacion {
  return {
    criterios: [{ nombre: 'claridad', cumple: false }],
    observaciones: 'Requiere ajustes',
    resultado: ResultadoEvaluacion.DESFAVORABLE,
  };
}

export function revisionValidaEnCurso(
  revisorIds: readonly string[] = ['revisor-1', 'revisor-2'],
): Revision {
  return Revision.crear('revision-1', 'pregunta-1', 1, revisorIds, snapshotValido());
}
