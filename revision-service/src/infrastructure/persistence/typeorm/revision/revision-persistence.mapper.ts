import { Evaluacion } from '../../../../domain/model/evaluacion';
import { PreguntaParaRevision } from '../../../../domain/model/pregunta-para-revision';
import { ResultadoEvaluacion } from '../../../../domain/model/resultado-evaluacion';
import { ResultadoRevision } from '../../../../domain/model/resultado-revision';
import { Revision } from '../../../../domain/model/revision';
import { RevisionInvalidaException } from '../../../../domain/exception/revision-invalida.exception';
import { RevisionEvaluacionOrmEntity } from './revision-evaluacion.orm-entity';
import { RevisionRevisorOrmEntity } from './revision-revisor.orm-entity';
import { RevisionOrmEntity } from './revision.orm-entity';

function copiarSnapshot(snapshot: PreguntaParaRevision): PreguntaParaRevision {
  return {
    ...snapshot,
    opciones: snapshot.opciones.map((opcion) => ({ ...opcion })),
  };
}

function parseResultadoEvaluacion(valor: string): ResultadoEvaluacion {
  if (valor === ResultadoEvaluacion.FAVORABLE || valor === ResultadoEvaluacion.DESFAVORABLE) {
    return valor;
  }
  throw new RevisionInvalidaException(
    `resultado de evaluación persistido desconocido: ${valor}`,
  );
}

function parseResultadoRevision(valor: string | null): ResultadoRevision | null {
  if (valor === null) {
    return null;
  }
  if (valor === ResultadoRevision.FAVORABLE || valor === ResultadoRevision.DESFAVORABLE) {
    return valor;
  }
  throw new RevisionInvalidaException(`resultado final persistido desconocido: ${valor}`);
}

export class RevisionPersistenceMapper {
  toRootEntity(revision: Revision): RevisionOrmEntity {
    return {
      revisionId: revision.getRevisionId(),
      preguntaId: revision.getPreguntaId(),
      versionPregunta: revision.getVersionPregunta(),
      snapshotPregunta: copiarSnapshot(revision.getPreguntaParaRevision()),
      resultadoFinal: revision.getResultadoFinal(),
    };
  }

  toRevisorEntities(revision: Revision): RevisionRevisorOrmEntity[] {
    return revision.getRevisorIds().map((revisorId) => ({
      revisionId: revision.getRevisionId(),
      revisorId,
    }));
  }

  toEvaluacionEntities(revision: Revision): RevisionEvaluacionOrmEntity[] {
    const evaluaciones = revision.getEvaluaciones();
    return [...evaluaciones.entries()].map(([revisorId, evaluacion]) => ({
      revisionId: revision.getRevisionId(),
      revisorId,
      criterios: evaluacion.criterios.map((criterio) => ({ ...criterio })),
      observaciones: evaluacion.observaciones,
      resultado: evaluacion.resultado,
    }));
  }

  toDomain(
    root: RevisionOrmEntity,
    revisores: readonly RevisionRevisorOrmEntity[],
    evaluaciones: readonly RevisionEvaluacionOrmEntity[],
  ): Revision {
    const revisorIds = revisores.map((revisor) => revisor.revisorId);

    const evaluacionesMap = new Map<string, Evaluacion>();
    for (const evaluacion of evaluaciones) {
      evaluacionesMap.set(evaluacion.revisorId, {
        criterios: evaluacion.criterios.map((criterio) => ({ ...criterio })),
        observaciones: evaluacion.observaciones,
        resultado: parseResultadoEvaluacion(evaluacion.resultado),
      });
    }

    return Revision.reconstituir({
      revisionId: root.revisionId,
      preguntaId: root.preguntaId,
      versionPregunta: root.versionPregunta,
      revisorIds,
      preguntaParaRevision: copiarSnapshot(root.snapshotPregunta),
      evaluaciones: evaluacionesMap,
      resultadoFinal: parseResultadoRevision(root.resultadoFinal),
    });
  }
}
