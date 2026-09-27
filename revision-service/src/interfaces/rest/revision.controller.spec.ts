import 'reflect-metadata';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { randomUUID } from 'node:crypto';
import request = require('supertest');
import { PreguntaNoDisponibleParaRevisionException } from '../../application/exception/pregunta-no-disponible-para-revision.exception';
import { RevisionNoEncontradaException } from '../../application/exception/revision-no-encontrada.exception';
import { CrearRevisionUseCase } from '../../application/use-case/crear-revision.use-case';
import { ListarRevisionesPreguntaUseCase } from '../../application/use-case/listar-revisiones-pregunta.use-case';
import { ObtenerRevisionUseCase } from '../../application/use-case/obtener-revision.use-case';
import { RegistrarEvaluacionUseCase } from '../../application/use-case/registrar-evaluacion.use-case';
import { AutorIncluidoComoRevisorException } from '../../domain/exception/autor-incluido-como-revisor.exception';
import { RevisionYaFinalizadaException } from '../../domain/exception/revision-ya-finalizada.exception';
import { RevisorNoAsignadoException } from '../../domain/exception/revisor-no-asignado.exception';
import { RevisorYaEvaluoException } from '../../domain/exception/revisor-ya-evaluo.exception';
import { Revision } from '../../domain/model/revision';
import { ResultadoEvaluacion } from '../../domain/model/resultado-evaluacion';
import { snapshotValido } from '../../test/fixtures/revision-test-fixtures';
import { RevisionController } from './revision.controller';

describe('RevisionController', () => {
  let app: INestApplication;
  let crearRevisionUseCase: { execute: jest.Mock };
  let obtenerRevisionUseCase: { execute: jest.Mock };
  let listarRevisionesPreguntaUseCase: { execute: jest.Mock };
  let registrarEvaluacionUseCase: { execute: jest.Mock };

  const preguntaId = randomUUID();
  const revisionId = randomUUID();

  function revisionDeEjemplo(
    revisorIds: readonly string[] = ['revisor-1', 'revisor-2'],
  ): Revision {
    return Revision.crear(revisionId, preguntaId, 1, revisorIds, snapshotValido());
  }

  beforeEach(async () => {
    crearRevisionUseCase = { execute: jest.fn() };
    obtenerRevisionUseCase = { execute: jest.fn() };
    listarRevisionesPreguntaUseCase = { execute: jest.fn() };
    registrarEvaluacionUseCase = { execute: jest.fn() };

    const moduleRef = await Test.createTestingModule({
      controllers: [RevisionController],
      providers: [
        { provide: CrearRevisionUseCase, useValue: crearRevisionUseCase },
        { provide: ObtenerRevisionUseCase, useValue: obtenerRevisionUseCase },
        { provide: ListarRevisionesPreguntaUseCase, useValue: listarRevisionesPreguntaUseCase },
        { provide: RegistrarEvaluacionUseCase, useValue: registrarEvaluacionUseCase },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /api/v1/revisiones', () => {
    it('crea la revisión y retorna 201 con Location y el command exacto', async () => {
      crearRevisionUseCase.execute.mockResolvedValue(revisionDeEjemplo());

      const response = await request(app.getHttpServer())
        .post('/api/v1/revisiones')
        .send({ preguntaId, revisorIds: ['revisor-1', 'revisor-2'] })
        .expect(201);

      expect(response.headers.location).toBe(`/api/v1/revisiones/${revisionId}`);
      expect(response.body.revisionId).toBe(revisionId);
      expect(response.body.resultadoFinal).toBeNull();
      expect(crearRevisionUseCase.execute).toHaveBeenCalledWith({
        preguntaId,
        revisorIds: ['revisor-1', 'revisor-2'],
      });
    });

    it('preguntaId inválido retorna 400 y no invoca el Use Case', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/revisiones')
        .send({ preguntaId: 'no-es-uuid', revisorIds: ['revisor-1'] })
        .expect(400);

      expect(response.body.code).toBe('VALIDATION_ERROR');
      expect(crearRevisionUseCase.execute).not.toHaveBeenCalled();
    });

    it('revisorIds vacío retorna 400 y no invoca el Use Case', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/revisiones')
        .send({ preguntaId, revisorIds: [] })
        .expect(400);

      expect(response.body.code).toBe('VALIDATION_ERROR');
      expect(crearRevisionUseCase.execute).not.toHaveBeenCalled();
    });

    it('revisores duplicados retorna 400 y no invoca el Use Case', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/revisiones')
        .send({ preguntaId, revisorIds: ['revisor-1', 'revisor-1'] })
        .expect(400);

      expect(response.body.code).toBe('VALIDATION_ERROR');
      expect(crearRevisionUseCase.execute).not.toHaveBeenCalled();
    });

    it('revisor null o vacío retorna 400 y no invoca el Use Case', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/revisiones')
        .send({ preguntaId, revisorIds: [null, ''] })
        .expect(400);

      expect(response.body.code).toBe('VALIDATION_ERROR');
      expect(crearRevisionUseCase.execute).not.toHaveBeenCalled();
    });

    it('pregunta no disponible para revisión retorna 409', async () => {
      crearRevisionUseCase.execute.mockRejectedValue(
        new PreguntaNoDisponibleParaRevisionException(preguntaId),
      );

      const response = await request(app.getHttpServer())
        .post('/api/v1/revisiones')
        .send({ preguntaId, revisorIds: ['revisor-1'] })
        .expect(409);

      expect(response.body.code).toBe('PREGUNTA_NO_DISPONIBLE_REVISION');
    });

    it('autor incluido como revisor retorna 409', async () => {
      crearRevisionUseCase.execute.mockRejectedValue(
        new AutorIncluidoComoRevisorException('el autor no puede ser revisor de su propia pregunta'),
      );

      const response = await request(app.getHttpServer())
        .post('/api/v1/revisiones')
        .send({ preguntaId, revisorIds: ['revisor-1'] })
        .expect(409);

      expect(response.body.code).toBe('AUTOR_INCLUIDO_COMO_REVISOR');
    });
  });

  describe('GET /api/v1/revisiones/:id', () => {
    it('UUID válido existente retorna 200 con el response completo', async () => {
      obtenerRevisionUseCase.execute.mockResolvedValue(revisionDeEjemplo());

      const response = await request(app.getHttpServer())
        .get(`/api/v1/revisiones/${revisionId}`)
        .expect(200);

      expect(response.body.revisionId).toBe(revisionId);
      expect(response.body.preguntaId).toBe(preguntaId);
      expect(obtenerRevisionUseCase.execute).toHaveBeenCalledWith(revisionId);
    });

    it('revisión inexistente retorna 404', async () => {
      obtenerRevisionUseCase.execute.mockRejectedValue(
        new RevisionNoEncontradaException(revisionId),
      );

      const response = await request(app.getHttpServer())
        .get(`/api/v1/revisiones/${revisionId}`)
        .expect(404);

      expect(response.body.code).toBe('REVISION_NO_ENCONTRADA');
    });

    it('UUID inválido retorna 400 y no invoca el Use Case', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/revisiones/no-es-un-uuid')
        .expect(400);

      expect(response.body.code).toBe('VALIDATION_ERROR');
      expect(obtenerRevisionUseCase.execute).not.toHaveBeenCalled();
    });
  });

  describe('GET /api/v1/revisiones', () => {
    it('lista el historial con UUID de pregunta válido invocando el Use Case con el string exacto', async () => {
      listarRevisionesPreguntaUseCase.execute.mockResolvedValue([revisionDeEjemplo()]);

      const response = await request(app.getHttpServer())
        .get('/api/v1/revisiones')
        .query({ preguntaId })
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].revisionId).toBe(revisionId);
      expect(listarRevisionesPreguntaUseCase.execute).toHaveBeenCalledWith(preguntaId);
    });

    it('UUID de pregunta inválido retorna 400 y no invoca el Use Case', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/revisiones')
        .query({ preguntaId: 'no-es-un-uuid' })
        .expect(400);

      expect(response.body.code).toBe('VALIDATION_ERROR');
      expect(listarRevisionesPreguntaUseCase.execute).not.toHaveBeenCalled();
    });

    it('sin query preguntaId retorna 400 y no invoca el Use Case', async () => {
      const response = await request(app.getHttpServer()).get('/api/v1/revisiones').expect(400);

      expect(response.body.code).toBe('VALIDATION_ERROR');
      expect(listarRevisionesPreguntaUseCase.execute).not.toHaveBeenCalled();
    });
  });

  describe('POST /api/v1/revisiones/:id/evaluaciones', () => {
    const evaluacionValida = {
      revisorId: 'revisor-1',
      criterios: [{ nombre: 'Coherencia', cumple: true }],
      observaciones: 'La pregunta es clara.',
      resultado: 'FAVORABLE',
    };

    it('evaluación válida retorna 200 con el command exacto y la respuesta refleja la evaluación', async () => {
      const revision = revisionDeEjemplo();
      revision.registrarEvaluacion(
        'revisor-1',
        {
          criterios: [{ nombre: 'Coherencia', cumple: true }],
          observaciones: 'La pregunta es clara.',
          resultado: ResultadoEvaluacion.FAVORABLE,
        },
        new Date(),
      );
      registrarEvaluacionUseCase.execute.mockResolvedValue(revision);

      const response = await request(app.getHttpServer())
        .post(`/api/v1/revisiones/${revisionId}/evaluaciones`)
        .send(evaluacionValida)
        .expect(200);

      expect(registrarEvaluacionUseCase.execute).toHaveBeenCalledWith({
        revisionId,
        revisorId: 'revisor-1',
        criterios: [{ nombre: 'Coherencia', cumple: true }],
        observaciones: 'La pregunta es clara.',
        resultado: 'FAVORABLE',
      });
      expect(response.body.evaluaciones).toContainEqual({
        revisorId: 'revisor-1',
        criterios: [{ nombre: 'Coherencia', cumple: true }],
        observaciones: 'La pregunta es clara.',
        resultado: 'FAVORABLE',
      });
    });

    it('revisionId inválido en el path retorna 400 y no invoca el Use Case', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/revisiones/no-es-un-uuid/evaluaciones')
        .send(evaluacionValida)
        .expect(400);

      expect(response.body.code).toBe('VALIDATION_ERROR');
      expect(registrarEvaluacionUseCase.execute).not.toHaveBeenCalled();
    });

    it('revisorId vacío retorna 400 y no invoca el Use Case', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/v1/revisiones/${revisionId}/evaluaciones`)
        .send({ ...evaluacionValida, revisorId: '' })
        .expect(400);

      expect(response.body.code).toBe('VALIDATION_ERROR');
      expect(registrarEvaluacionUseCase.execute).not.toHaveBeenCalled();
    });

    it('criterio con nombre vacío retorna 400 y no invoca el Use Case', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/v1/revisiones/${revisionId}/evaluaciones`)
        .send({ ...evaluacionValida, criterios: [{ nombre: '', cumple: true }] })
        .expect(400);

      expect(response.body.code).toBe('VALIDATION_ERROR');
      expect(registrarEvaluacionUseCase.execute).not.toHaveBeenCalled();
    });

    it('criterio null dentro de la lista retorna 400 y no invoca el Use Case', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/v1/revisiones/${revisionId}/evaluaciones`)
        .send({ ...evaluacionValida, criterios: [null] })
        .expect(400);

      expect(response.body.code).toBe('VALIDATION_ERROR');
      expect(registrarEvaluacionUseCase.execute).not.toHaveBeenCalled();
    });

    it('observaciones vacío es aceptado', async () => {
      registrarEvaluacionUseCase.execute.mockResolvedValue(revisionDeEjemplo());

      await request(app.getHttpServer())
        .post(`/api/v1/revisiones/${revisionId}/evaluaciones`)
        .send({ ...evaluacionValida, observaciones: '' })
        .expect(200);

      expect(registrarEvaluacionUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({ observaciones: '' }),
      );
    });

    it('resultado inválido retorna 400 y no invoca el Use Case', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/v1/revisiones/${revisionId}/evaluaciones`)
        .send({ ...evaluacionValida, resultado: 'REGULAR' })
        .expect(400);

      expect(response.body.code).toBe('VALIDATION_ERROR');
      expect(registrarEvaluacionUseCase.execute).not.toHaveBeenCalled();
    });

    it('revisión inexistente retorna 404', async () => {
      registrarEvaluacionUseCase.execute.mockRejectedValue(
        new RevisionNoEncontradaException(revisionId),
      );

      const response = await request(app.getHttpServer())
        .post(`/api/v1/revisiones/${revisionId}/evaluaciones`)
        .send(evaluacionValida)
        .expect(404);

      expect(response.body.code).toBe('REVISION_NO_ENCONTRADA');
    });

    it('revisor no asignado retorna 409', async () => {
      registrarEvaluacionUseCase.execute.mockRejectedValue(
        new RevisorNoAsignadoException('el revisor no está asignado a esta revisión'),
      );

      const response = await request(app.getHttpServer())
        .post(`/api/v1/revisiones/${revisionId}/evaluaciones`)
        .send(evaluacionValida)
        .expect(409);

      expect(response.body.code).toBe('REVISOR_NO_ASIGNADO');
    });

    it('revisor ya evaluó retorna 409', async () => {
      registrarEvaluacionUseCase.execute.mockRejectedValue(
        new RevisorYaEvaluoException('el revisor ya evaluó esta revisión'),
      );

      const response = await request(app.getHttpServer())
        .post(`/api/v1/revisiones/${revisionId}/evaluaciones`)
        .send(evaluacionValida)
        .expect(409);

      expect(response.body.code).toBe('REVISOR_YA_EVALUO');
    });

    it('revisión ya finalizada retorna 409', async () => {
      registrarEvaluacionUseCase.execute.mockRejectedValue(
        new RevisionYaFinalizadaException('la revisión ya está finalizada'),
      );

      const response = await request(app.getHttpServer())
        .post(`/api/v1/revisiones/${revisionId}/evaluaciones`)
        .send(evaluacionValida)
        .expect(409);

      expect(response.body.code).toBe('REVISION_YA_FINALIZADA');
    });
  });
});
