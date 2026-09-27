import { CrearRevisionCommand } from '../../application/command/crear-revision.command';
import { RegistrarEvaluacionCommand } from '../../application/command/registrar-evaluacion.command';
import { PreguntaRevisionSolicitada } from '../../application/model/pregunta-revision-solicitada';
import { Evaluacion } from '../../domain/model/evaluacion';
import { PreguntaParaRevision } from '../../domain/model/pregunta-para-revision';
import { Revision } from '../../domain/model/revision';
import { CrearRevisionRequest } from './dto/request/crear-revision.request';
import { RegistrarEvaluacionRequest } from './dto/request/registrar-evaluacion.request';
import { EvaluacionResponse } from './dto/response/evaluacion.response';
import { PreguntaParaRevisionResponse } from './dto/response/pregunta-para-revision.response';
import { PreguntaPendienteRevisionResponse } from './dto/response/pregunta-pendiente-revision.response';
import { RevisionResponse } from './dto/response/revision.response';

export class RevisionRestMapper {
  toCrearRevisionCommand(request: CrearRevisionRequest): CrearRevisionCommand {
    return {
      preguntaId: request.preguntaId,
      revisorIds: [...request.revisorIds],
    };
  }

  toRegistrarEvaluacionCommand(
    revisionId: string,
    request: RegistrarEvaluacionRequest,
  ): RegistrarEvaluacionCommand {
    return {
      revisionId,
      revisorId: request.revisorId,
      criterios: request.criterios.map((criterio) => ({
        nombre: criterio.nombre,
        cumple: criterio.cumple,
      })),
      observaciones: request.observaciones,
      resultado: request.resultado,
    };
  }

  toPendienteResponse(solicitud: PreguntaRevisionSolicitada): PreguntaPendienteRevisionResponse {
    return {
      preguntaId: solicitud.preguntaId,
      versionPregunta: solicitud.versionPregunta,
    };
  }

  toRevisionResponse(revision: Revision): RevisionResponse {
    return {
      revisionId: revision.getRevisionId(),
      preguntaId: revision.getPreguntaId(),
      versionPregunta: revision.getVersionPregunta(),
      revisorIds: [...revision.getRevisorIds()],
      preguntaParaRevision: this.toPreguntaParaRevisionResponse(revision.getPreguntaParaRevision()),
      evaluaciones: this.toEvaluacionesResponse(revision.getEvaluaciones()),
      resultadoFinal: revision.getResultadoFinal(),
    };
  }

  private toPreguntaParaRevisionResponse(
    snapshot: PreguntaParaRevision,
  ): PreguntaParaRevisionResponse {
    return {
      contexto: snapshot.contexto,
      preguntaDirecta: snapshot.preguntaDirecta,
      opciones: snapshot.opciones.map((opcion) => ({
        texto: opcion.texto,
        correcta: opcion.correcta,
      })),
      justificacion: snapshot.justificacion,
      bibliografia: snapshot.bibliografia,
      competencia: snapshot.competencia,
      tema: snapshot.tema,
      subtema: snapshot.subtema,
      nivelDificultad: snapshot.nivelDificultad,
    };
  }

  private toEvaluacionesResponse(
    evaluaciones: ReadonlyMap<string, Evaluacion>,
  ): readonly EvaluacionResponse[] {
    return [...evaluaciones.entries()].map(([revisorId, evaluacion]) => ({
      revisorId,
      criterios: evaluacion.criterios.map((criterio) => ({
        nombre: criterio.nombre,
        cumple: criterio.cumple,
      })),
      observaciones: evaluacion.observaciones,
      resultado: evaluacion.resultado,
    }));
  }
}
