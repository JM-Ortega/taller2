import { status as GrpcStatus } from '@grpc/grpc-js';
import { isUUID } from 'class-validator';
import { lastValueFrom, Observable } from 'rxjs';
import { IntegracionPreguntaInconsistenteException } from '../../application/exception/integracion-pregunta-inconsistente.exception';
import { ServicioPreguntaNoDisponibleException } from '../../application/exception/servicio-pregunta-no-disponible.exception';
import { PreguntaRevisionGateway } from '../../application/port/out/pregunta-revision.gateway';
import { PreguntaParaRevision } from '../../domain/model/pregunta-para-revision';

type IniciarRevisionGrpcRequest = Readonly<{
  preguntaId: string;
  version: number;
}>;

type OpcionRespuestaGrpc = Readonly<{
  texto: string;
  correcta: boolean;
}>;

type IniciarRevisionGrpcResponse = Readonly<{
  preguntaId: string;
  version: number;
  contexto: string;
  preguntaDirecta: string;
  opciones: readonly OpcionRespuestaGrpc[];
  justificacion: string;
  bibliografia: string;
  competencia: string;
  tema: string;
  subtema: string;
  nivelDificultad: string;
}>;

export interface PreguntaRevisionGrpcClient {
  iniciarRevision(request: IniciarRevisionGrpcRequest): Observable<IniciarRevisionGrpcResponse>;
}

function esStringNoBlank(valor: unknown): valor is string {
  return typeof valor === 'string' && valor.trim().length > 0;
}

function esOpcionValida(opcion: unknown): opcion is OpcionRespuestaGrpc {
  if (opcion === null || typeof opcion !== 'object') {
    return false;
  }
  const candidata = opcion as Record<string, unknown>;
  return esStringNoBlank(candidata.texto) && typeof candidata.correcta === 'boolean';
}

function esSnapshotValido(response: IniciarRevisionGrpcResponse): boolean {
  const stringsRequeridos = [
    response.contexto,
    response.preguntaDirecta,
    response.justificacion,
    response.bibliografia,
    response.competencia,
    response.tema,
    response.subtema,
    response.nivelDificultad,
  ];
  if (!stringsRequeridos.every(esStringNoBlank)) {
    return false;
  }
  if (!Array.isArray(response.opciones) || response.opciones.length === 0) {
    return false;
  }
  return response.opciones.every(esOpcionValida);
}

function extraerCodigoGrpc(error: unknown): number | undefined {
  if (error !== null && typeof error === 'object' && 'code' in error) {
    const codigo = (error as { code?: unknown }).code;
    return typeof codigo === 'number' ? codigo : undefined;
  }
  return undefined;
}

export class PreguntaRevisionGrpcAdapter extends PreguntaRevisionGateway {
  constructor(private readonly client: PreguntaRevisionGrpcClient) {
    super();
  }

  async iniciarRevision(
    preguntaId: string,
    versionPregunta: number,
  ): Promise<PreguntaParaRevision> {
    const request: IniciarRevisionGrpcRequest = { preguntaId, version: versionPregunta };

    let response: IniciarRevisionGrpcResponse;
    try {
      response = await lastValueFrom(this.client.iniciarRevision(request));
    } catch (error) {
      throw this.traducirError(error);
    }

    this.validarRespuesta(request, response);

    return {
      contexto: response.contexto,
      preguntaDirecta: response.preguntaDirecta,
      opciones: response.opciones.map((opcion) => ({
        texto: opcion.texto,
        correcta: opcion.correcta,
      })),
      justificacion: response.justificacion,
      bibliografia: response.bibliografia,
      competencia: response.competencia,
      tema: response.tema,
      subtema: response.subtema,
      nivelDificultad: response.nivelDificultad,
    };
  }

  private validarRespuesta(
    request: IniciarRevisionGrpcRequest,
    response: IniciarRevisionGrpcResponse,
  ): void {
    if (response === null || response === undefined) {
      throw new IntegracionPreguntaInconsistenteException(
        'el servicio de Pregunta respondió una respuesta vacía',
      );
    }
    if (!isUUID(response.preguntaId)) {
      throw new IntegracionPreguntaInconsistenteException(
        'el servicio de Pregunta respondió un preguntaId con formato inválido',
      );
    }
    if (response.preguntaId !== request.preguntaId) {
      throw new IntegracionPreguntaInconsistenteException(
        'el servicio de Pregunta respondió un preguntaId distinto al solicitado',
      );
    }
    if (response.version !== request.version) {
      throw new IntegracionPreguntaInconsistenteException(
        'el servicio de Pregunta respondió una versión distinta a la solicitada',
      );
    }
    if (!esSnapshotValido(response)) {
      throw new IntegracionPreguntaInconsistenteException(
        'el servicio de Pregunta respondió un snapshot incompleto o con tipos inválidos',
      );
    }
  }

  private traducirError(error: unknown): Error {
    const codigo = extraerCodigoGrpc(error);
    if (codigo === undefined) {
      if (error instanceof Error) {
        return error;
      }
      return new Error('error local no clasificable al invocar el servicio de Pregunta');
    }
    if (codigo === GrpcStatus.UNAVAILABLE || codigo === GrpcStatus.DEADLINE_EXCEEDED) {
      return new ServicioPreguntaNoDisponibleException(
        'el servicio de Pregunta no está disponible en este momento',
      );
    }
    return new IntegracionPreguntaInconsistenteException(
      'el servicio de Pregunta respondió con un error incompatible con la solicitud',
    );
  }
}
