import { RevisionFinalizada } from '../event/revision-finalizada';
import { RevisionInvalidaException } from '../exception/revision-invalida.exception';
import { RevisionYaFinalizadaException } from '../exception/revision-ya-finalizada.exception';
import { RevisorNoAsignadoException } from '../exception/revisor-no-asignado.exception';
import { RevisorYaEvaluoException } from '../exception/revisor-ya-evaluo.exception';
import { RevisoresInvalidosException } from '../exception/revisores-invalidos.exception';
import { Evaluacion } from './evaluacion';
import { PreguntaParaRevision } from './pregunta-para-revision';
import { ResultadoEvaluacion } from './resultado-evaluacion';
import { ResultadoRevision } from './resultado-revision';

function copiarPreguntaParaRevision(snapshot: PreguntaParaRevision): PreguntaParaRevision {
  return {
    ...snapshot,
    opciones: snapshot.opciones.map((opcion) => ({ ...opcion })),
  };
}

function copiarEvaluacion(evaluacion: Evaluacion): Evaluacion {
  return {
    ...evaluacion,
    criterios: evaluacion.criterios.map((criterio) => ({ ...criterio })),
  };
}

function exigirVersionValida(versionPregunta: number): void {
  if (versionPregunta < 1) {
    throw new RevisionInvalidaException('versionPregunta debe ser mayor o igual a 1');
  }
}

function exigirRevisoresValidos(revisorIds: readonly string[]): void {
  if (revisorIds.length < 1) {
    throw new RevisoresInvalidosException('se requiere al menos un revisor');
  }
  if (new Set(revisorIds).size !== revisorIds.length) {
    throw new RevisoresInvalidosException('no puede haber revisores duplicados');
  }
}

function exigirSnapshot(preguntaParaRevision: PreguntaParaRevision): void {
  if (preguntaParaRevision == null) {
    throw new RevisionInvalidaException('preguntaParaRevision es obligatorio');
  }
}

function calcularResultado(
  revisorIds: readonly string[],
  evaluaciones: ReadonlyMap<string, Evaluacion>,
): ResultadoRevision | null {
  if (revisorIds.some((revisorId) => !evaluaciones.has(revisorId))) {
    return null;
  }
  const todasFavorables = revisorIds.every(
    (revisorId) => evaluaciones.get(revisorId)?.resultado === ResultadoEvaluacion.FAVORABLE,
  );
  return todasFavorables ? ResultadoRevision.FAVORABLE : ResultadoRevision.DESFAVORABLE;
}

export class Revision {
  private readonly revisionId: string;
  private readonly preguntaId: string;
  private readonly versionPregunta: number;
  private readonly revisorIds: readonly string[];
  private readonly preguntaParaRevision: PreguntaParaRevision;
  private readonly evaluaciones: Map<string, Evaluacion>;
  private resultadoFinal: ResultadoRevision | null;

  private constructor(
    revisionId: string,
    preguntaId: string,
    versionPregunta: number,
    revisorIds: readonly string[],
    preguntaParaRevision: PreguntaParaRevision,
    evaluaciones: ReadonlyMap<string, Evaluacion>,
    resultadoFinal: ResultadoRevision | null,
  ) {
    this.revisionId = revisionId;
    this.preguntaId = preguntaId;
    this.versionPregunta = versionPregunta;
    this.revisorIds = [...revisorIds];
    this.preguntaParaRevision = copiarPreguntaParaRevision(preguntaParaRevision);
    this.evaluaciones = new Map();
    for (const [revisorId, evaluacion] of evaluaciones) {
      this.evaluaciones.set(revisorId, copiarEvaluacion(evaluacion));
    }
    this.resultadoFinal = resultadoFinal;
  }

  static crear(
    revisionId: string,
    preguntaId: string,
    versionPregunta: number,
    revisorIds: readonly string[],
    preguntaParaRevision: PreguntaParaRevision,
  ): Revision {
    exigirVersionValida(versionPregunta);
    exigirRevisoresValidos(revisorIds);
    exigirSnapshot(preguntaParaRevision);
    return new Revision(
      revisionId,
      preguntaId,
      versionPregunta,
      revisorIds,
      preguntaParaRevision,
      new Map(),
      null,
    );
  }

  static reconstituir(
    params: Readonly<{
      revisionId: string;
      preguntaId: string;
      versionPregunta: number;
      revisorIds: readonly string[];
      preguntaParaRevision: PreguntaParaRevision;
      evaluaciones: ReadonlyMap<string, Evaluacion>;
      resultadoFinal: ResultadoRevision | null;
    }>,
  ): Revision {
    const {
      revisionId,
      preguntaId,
      versionPregunta,
      revisorIds,
      preguntaParaRevision,
      evaluaciones,
      resultadoFinal,
    } = params;

    exigirVersionValida(versionPregunta);
    exigirRevisoresValidos(revisorIds);
    exigirSnapshot(preguntaParaRevision);

    for (const revisorId of evaluaciones.keys()) {
      if (!revisorIds.includes(revisorId)) {
        throw new RevisorNoAsignadoException(
          `el revisor ${revisorId} no está asignado a esta revisión`,
        );
      }
    }

    const resultadoCalculado = calcularResultado(revisorIds, evaluaciones);

    if (resultadoFinal !== null && resultadoCalculado === null) {
      throw new RevisionInvalidaException(
        'no puede existir un resultado final si faltan evaluaciones',
      );
    }
    if (
      resultadoFinal !== null &&
      resultadoCalculado !== null &&
      resultadoFinal !== resultadoCalculado
    ) {
      throw new RevisionInvalidaException(
        'el resultado final es contradictorio con las evaluaciones registradas',
      );
    }
    if (resultadoFinal === null && resultadoCalculado !== null) {
      throw new RevisionInvalidaException(
        'todos los revisores evaluaron pero no se fijó un resultado final',
      );
    }

    return new Revision(
      revisionId,
      preguntaId,
      versionPregunta,
      revisorIds,
      preguntaParaRevision,
      evaluaciones,
      resultadoFinal,
    );
  }

  registrarEvaluacion(
    revisorId: string,
    evaluacion: Evaluacion,
    occurredAt: Date,
  ): RevisionFinalizada | null {
    if (this.resultadoFinal !== null) {
      throw new RevisionYaFinalizadaException(
        `la revisión ${this.revisionId} ya está finalizada`,
      );
    }
    if (!this.revisorIds.includes(revisorId)) {
      throw new RevisorNoAsignadoException(
        `el revisor ${revisorId} no está asignado a esta revisión`,
      );
    }
    if (this.evaluaciones.has(revisorId)) {
      throw new RevisorYaEvaluoException(`el revisor ${revisorId} ya evaluó esta revisión`);
    }

    this.evaluaciones.set(revisorId, copiarEvaluacion(evaluacion));

    const resultado = calcularResultado(this.revisorIds, this.evaluaciones);
    if (resultado === null) {
      return null;
    }

    this.resultadoFinal = resultado;
    return {
      revisionId: this.revisionId,
      preguntaId: this.preguntaId,
      versionPregunta: this.versionPregunta,
      resultado,
      occurredAt,
    };
  }

  getRevisionId(): string {
    return this.revisionId;
  }

  getPreguntaId(): string {
    return this.preguntaId;
  }

  getVersionPregunta(): number {
    return this.versionPregunta;
  }

  getRevisorIds(): readonly string[] {
    return [...this.revisorIds];
  }

  getPreguntaParaRevision(): PreguntaParaRevision {
    return copiarPreguntaParaRevision(this.preguntaParaRevision);
  }

  getEvaluaciones(): ReadonlyMap<string, Evaluacion> {
    const copia = new Map<string, Evaluacion>();
    for (const [revisorId, evaluacion] of this.evaluaciones) {
      copia.set(revisorId, copiarEvaluacion(evaluacion));
    }
    return copia;
  }

  getResultadoFinal(): ResultadoRevision | null {
    return this.resultadoFinal;
  }
}
