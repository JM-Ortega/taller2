import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { PreguntaNoDisponibleParaRevisionException } from '../../application/exception/pregunta-no-disponible-para-revision.exception';
import { RevisionNoEncontradaException } from '../../application/exception/revision-no-encontrada.exception';
import { AutorIncluidoComoRevisorException } from '../../domain/exception/autor-incluido-como-revisor.exception';
import { RevisionYaFinalizadaException } from '../../domain/exception/revision-ya-finalizada.exception';
import { RevisorNoAsignadoException } from '../../domain/exception/revisor-no-asignado.exception';
import { RevisorYaEvaluoException } from '../../domain/exception/revisor-ya-evaluo.exception';
import { RevisoresInvalidosException } from '../../domain/exception/revisores-invalidos.exception';
import { ApiErrorResponse } from './dto/response/api-error.response';

const MENSAJE_VALIDACION = 'La solicitud contiene campos inválidos.';
const MENSAJE_INTERNO = 'Ha ocurrido un error inesperado.';

interface RespuestaHttpJson {
  status(codigo: number): RespuestaHttpJson;
  json(cuerpo: unknown): void;
}

type ResolucionError = Readonly<{ status: number; body: ApiErrorResponse }>;

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<RespuestaHttpJson>();
    const { status, body } = this.resolver(exception);
    response.status(status).json(body);
  }

  private resolver(exception: unknown): ResolucionError {
    if (exception instanceof RevisionNoEncontradaException) {
      return this.error(HttpStatus.NOT_FOUND, 'REVISION_NO_ENCONTRADA', exception.message);
    }
    if (exception instanceof PreguntaNoDisponibleParaRevisionException) {
      return this.error(
        HttpStatus.CONFLICT,
        'PREGUNTA_NO_DISPONIBLE_REVISION',
        exception.message,
      );
    }
    if (exception instanceof AutorIncluidoComoRevisorException) {
      return this.error(HttpStatus.CONFLICT, 'AUTOR_INCLUIDO_COMO_REVISOR', exception.message);
    }
    if (exception instanceof RevisorNoAsignadoException) {
      return this.error(HttpStatus.CONFLICT, 'REVISOR_NO_ASIGNADO', exception.message);
    }
    if (exception instanceof RevisorYaEvaluoException) {
      return this.error(HttpStatus.CONFLICT, 'REVISOR_YA_EVALUO', exception.message);
    }
    if (exception instanceof RevisionYaFinalizadaException) {
      return this.error(HttpStatus.CONFLICT, 'REVISION_YA_FINALIZADA', exception.message);
    }
    if (exception instanceof RevisoresInvalidosException) {
      return this.error(HttpStatus.BAD_REQUEST, 'VALIDATION_ERROR', MENSAJE_VALIDACION);
    }
    if (exception instanceof HttpException) {
      return this.resolverHttpException(exception);
    }
    return this.error(HttpStatus.INTERNAL_SERVER_ERROR, 'INTERNAL_ERROR', MENSAJE_INTERNO);
  }

  private resolverHttpException(exception: HttpException): ResolucionError {
    const status = exception.getStatus();
    const payload = exception.getResponse();
    if (status === HttpStatus.BAD_REQUEST) {
      if (typeof payload === 'object' && payload !== null && 'code' in payload) {
        return { status, body: payload as ApiErrorResponse };
      }
      return this.error(HttpStatus.BAD_REQUEST, 'VALIDATION_ERROR', MENSAJE_VALIDACION);
    }
    return this.error(HttpStatus.INTERNAL_SERVER_ERROR, 'INTERNAL_ERROR', MENSAJE_INTERNO);
  }

  private error(status: number, code: string, message: string): ResolucionError {
    return { status, body: { code, message } };
  }
}
