import { status as GrpcStatus } from '@grpc/grpc-js';
import { of, throwError } from 'rxjs';
import { IntegracionPreguntaInconsistenteException } from '../../application/exception/integracion-pregunta-inconsistente.exception';
import { ServicioPreguntaNoDisponibleException } from '../../application/exception/servicio-pregunta-no-disponible.exception';
import { PreguntaRevisionGrpcAdapter, PreguntaRevisionGrpcClient } from './pregunta-revision-grpc.adapter';

const PREGUNTA_ID = '550e8400-e29b-41d4-a716-446655440000';
const OTRO_PREGUNTA_ID = '7d444840-9dc0-11d1-b245-5ffdce74fad2';

function respuestaValida(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    preguntaId: PREGUNTA_ID,
    version: 1,
    contexto: 'Contexto...',
    preguntaDirecta: '¿Cuál opción es correcta?',
    opciones: [
      { texto: 'Opción A', correcta: true },
      { texto: 'Opción B', correcta: false },
    ],
    justificacion: 'Justificación...',
    bibliografia: 'Referencia...',
    competencia: 'Competencia...',
    tema: 'Tema...',
    subtema: 'Subtema...',
    nivelDificultad: 'Nivel...',
    ...overrides,
  };
}

function crearAdapter(client: Partial<PreguntaRevisionGrpcClient>): PreguntaRevisionGrpcAdapter {
  return new PreguntaRevisionGrpcAdapter(client as PreguntaRevisionGrpcClient);
}

describe('PreguntaRevisionGrpcAdapter', () => {
  it('envía preguntaId y version exactos y retorna el PreguntaParaRevision exacto', async () => {
    const iniciarRevision = jest.fn().mockReturnValue(of(respuestaValida()));
    const adapter = crearAdapter({ iniciarRevision });

    const snapshot = await adapter.iniciarRevision(PREGUNTA_ID, 1);

    expect(iniciarRevision).toHaveBeenCalledWith({ preguntaId: PREGUNTA_ID, version: 1 });
    expect(snapshot).toEqual({
      contexto: 'Contexto...',
      preguntaDirecta: '¿Cuál opción es correcta?',
      opciones: [
        { texto: 'Opción A', correcta: true },
        { texto: 'Opción B', correcta: false },
      ],
      justificacion: 'Justificación...',
      bibliografia: 'Referencia...',
      competencia: 'Competencia...',
      tema: 'Tema...',
      subtema: 'Subtema...',
      nivelDificultad: 'Nivel...',
    });
  });

  it('response con preguntaId con formato UUID inválido es integración inconsistente', async () => {
    const adapter = crearAdapter({
      iniciarRevision: jest.fn().mockReturnValue(of(respuestaValida({ preguntaId: 'no-es-un-uuid' }))),
    });

    await expect(adapter.iniciarRevision(PREGUNTA_ID, 1)).rejects.toBeInstanceOf(
      IntegracionPreguntaInconsistenteException,
    );
  });

  it('response con preguntaId distinto al solicitado es integración inconsistente', async () => {
    const adapter = crearAdapter({
      iniciarRevision: jest
        .fn()
        .mockReturnValue(of(respuestaValida({ preguntaId: OTRO_PREGUNTA_ID }))),
    });

    await expect(adapter.iniciarRevision(PREGUNTA_ID, 1)).rejects.toBeInstanceOf(
      IntegracionPreguntaInconsistenteException,
    );
  });

  it('response con version distinta a la solicitada es integración inconsistente', async () => {
    const adapter = crearAdapter({
      iniciarRevision: jest.fn().mockReturnValue(of(respuestaValida({ version: 2 }))),
    });

    await expect(adapter.iniciarRevision(PREGUNTA_ID, 1)).rejects.toBeInstanceOf(
      IntegracionPreguntaInconsistenteException,
    );
  });

  it('snapshot con un string requerido en blanco es integración inconsistente', async () => {
    const adapter = crearAdapter({
      iniciarRevision: jest.fn().mockReturnValue(of(respuestaValida({ contexto: '   ' }))),
    });

    await expect(adapter.iniciarRevision(PREGUNTA_ID, 1)).rejects.toBeInstanceOf(
      IntegracionPreguntaInconsistenteException,
    );
  });

  it('snapshot con opciones vacías es integración inconsistente', async () => {
    const adapter = crearAdapter({
      iniciarRevision: jest.fn().mockReturnValue(of(respuestaValida({ opciones: [] }))),
    });

    await expect(adapter.iniciarRevision(PREGUNTA_ID, 1)).rejects.toBeInstanceOf(
      IntegracionPreguntaInconsistenteException,
    );
  });

  it('una opción nula o mal formada dentro del snapshot es integración inconsistente', async () => {
    const adapter = crearAdapter({
      iniciarRevision: jest.fn().mockReturnValue(
        of(respuestaValida({ opciones: [null, { texto: 'Opción A', correcta: true }] })),
      ),
    });

    await expect(adapter.iniciarRevision(PREGUNTA_ID, 1)).rejects.toBeInstanceOf(
      IntegracionPreguntaInconsistenteException,
    );
  });

  it('UNAVAILABLE se traduce a ServicioPreguntaNoDisponibleException', async () => {
    const adapter = crearAdapter({
      iniciarRevision: jest
        .fn()
        .mockReturnValue(throwError(() => ({ code: GrpcStatus.UNAVAILABLE, message: 'unavailable' }))),
    });

    await expect(adapter.iniciarRevision(PREGUNTA_ID, 1)).rejects.toBeInstanceOf(
      ServicioPreguntaNoDisponibleException,
    );
  });

  it('DEADLINE_EXCEEDED se traduce a ServicioPreguntaNoDisponibleException', async () => {
    const adapter = crearAdapter({
      iniciarRevision: jest.fn().mockReturnValue(
        throwError(() => ({ code: GrpcStatus.DEADLINE_EXCEEDED, message: 'deadline exceeded' })),
      ),
    });

    await expect(adapter.iniciarRevision(PREGUNTA_ID, 1)).rejects.toBeInstanceOf(
      ServicioPreguntaNoDisponibleException,
    );
  });

  it('NOT_FOUND remoto se traduce a IntegracionPreguntaInconsistenteException', async () => {
    const adapter = crearAdapter({
      iniciarRevision: jest
        .fn()
        .mockReturnValue(throwError(() => ({ code: GrpcStatus.NOT_FOUND, message: 'not found' }))),
    });

    await expect(adapter.iniciarRevision(PREGUNTA_ID, 1)).rejects.toBeInstanceOf(
      IntegracionPreguntaInconsistenteException,
    );
  });

  it('FAILED_PRECONDITION remoto se traduce a IntegracionPreguntaInconsistenteException', async () => {
    const adapter = crearAdapter({
      iniciarRevision: jest.fn().mockReturnValue(
        throwError(() => ({ code: GrpcStatus.FAILED_PRECONDITION, message: 'failed precondition' })),
      ),
    });

    await expect(adapter.iniciarRevision(PREGUNTA_ID, 1)).rejects.toBeInstanceOf(
      IntegracionPreguntaInconsistenteException,
    );
  });

  it('INVALID_ARGUMENT remoto se traduce a IntegracionPreguntaInconsistenteException', async () => {
    const adapter = crearAdapter({
      iniciarRevision: jest.fn().mockReturnValue(
        throwError(() => ({ code: GrpcStatus.INVALID_ARGUMENT, message: 'invalid argument' })),
      ),
    });

    await expect(adapter.iniciarRevision(PREGUNTA_ID, 1)).rejects.toBeInstanceOf(
      IntegracionPreguntaInconsistenteException,
    );
  });

  it('un status gRPC inesperado se traduce a integración inconsistente sin filtrar el objeto técnico', async () => {
    const detalleTecnicoSensible = 'DETALLE_TECNICO_SENSIBLE_DEL_UPSTREAM';
    const adapter = crearAdapter({
      iniciarRevision: jest.fn().mockReturnValue(
        throwError(() => ({
          code: GrpcStatus.UNKNOWN,
          message: detalleTecnicoSensible,
          details: detalleTecnicoSensible,
        })),
      ),
    });

    await expect(adapter.iniciarRevision(PREGUNTA_ID, 1)).rejects.toBeInstanceOf(
      IntegracionPreguntaInconsistenteException,
    );
    try {
      await adapter.iniciarRevision(PREGUNTA_ID, 1);
      fail('se esperaba que lanzara una excepción');
    } catch (error) {
      expect((error as Error).message).not.toContain(detalleTecnicoSensible);
    }
  });

  it('un error local sin code gRPC se propaga tal cual, sin clasificarlo como 502/503', async () => {
    const errorLocal = new Error('fallo local');
    const adapter = crearAdapter({
      iniciarRevision: jest.fn().mockReturnValue(throwError(() => errorLocal)),
    });

    await expect(adapter.iniciarRevision(PREGUNTA_ID, 1)).rejects.toBe(errorLocal);

    try {
      await adapter.iniciarRevision(PREGUNTA_ID, 1);
      fail('se esperaba que lanzara una excepción');
    } catch (error) {
      expect(error).not.toBeInstanceOf(IntegracionPreguntaInconsistenteException);
      expect(error).not.toBeInstanceOf(ServicioPreguntaNoDisponibleException);
    }
  });

  it('una respuesta null/undefined del proxy es integración inconsistente y no provoca TypeError', async () => {
    const adapterConNull = crearAdapter({
      iniciarRevision: jest.fn().mockReturnValue(of(null)),
    });
    const adapterConUndefined = crearAdapter({
      iniciarRevision: jest.fn().mockReturnValue(of(undefined)),
    });

    await expect(adapterConNull.iniciarRevision(PREGUNTA_ID, 1)).rejects.toBeInstanceOf(
      IntegracionPreguntaInconsistenteException,
    );
    await expect(adapterConUndefined.iniciarRevision(PREGUNTA_ID, 1)).rejects.toBeInstanceOf(
      IntegracionPreguntaInconsistenteException,
    );
  });
});
