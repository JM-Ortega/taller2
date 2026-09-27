import 'reflect-metadata';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request = require('supertest');
import { ListarPreguntasPendientesUseCase } from '../../application/use-case/listar-preguntas-pendientes.use-case';
import { PreguntasPendientesRevisionController } from './preguntas-pendientes-revision.controller';

describe('PreguntasPendientesRevisionController', () => {
  let app: INestApplication;
  let listarPreguntasPendientesUseCase: { execute: jest.Mock };

  beforeEach(async () => {
    listarPreguntasPendientesUseCase = { execute: jest.fn() };

    const moduleRef = await Test.createTestingModule({
      controllers: [PreguntasPendientesRevisionController],
      providers: [
        {
          provide: ListarPreguntasPendientesUseCase,
          useValue: listarPreguntasPendientesUseCase,
        },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('lista las solicitudes pendientes exponiendo solo preguntaId y versionPregunta', async () => {
    listarPreguntasPendientesUseCase.execute.mockResolvedValue([
      { preguntaId: 'pregunta-1', versionPregunta: 1, autorId: 'autor-1' },
      { preguntaId: 'pregunta-2', versionPregunta: 3, autorId: 'autor-2' },
    ]);

    const response = await request(app.getHttpServer())
      .get('/api/v1/preguntas-pendientes-revision')
      .expect(200);

    expect(response.body).toEqual([
      { preguntaId: 'pregunta-1', versionPregunta: 1 },
      { preguntaId: 'pregunta-2', versionPregunta: 3 },
    ]);
    expect(JSON.stringify(response.body)).not.toContain('autorId');
  });
});
