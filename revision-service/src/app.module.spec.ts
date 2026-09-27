import 'reflect-metadata';
import { Test } from '@nestjs/testing';
import { PreguntaRevisionSolicitadaStore } from './application/port/out/pregunta-revision-solicitada.store';
import { PreguntaRevisionGateway } from './application/port/out/pregunta-revision.gateway';
import { RevisionUnitOfWork } from './application/port/out/revision-unit-of-work';
import { CrearRevisionUseCase } from './application/use-case/crear-revision.use-case';
import { ListarPreguntasPendientesUseCase } from './application/use-case/listar-preguntas-pendientes.use-case';
import { ListarRevisionesPreguntaUseCase } from './application/use-case/listar-revisiones-pregunta.use-case';
import { ObtenerRevisionUseCase } from './application/use-case/obtener-revision.use-case';
import { RegistrarEvaluacionUseCase } from './application/use-case/registrar-evaluacion.use-case';
import { RegistrarPreguntaEnviadaRevisionUseCase } from './application/use-case/registrar-pregunta-enviada-revision.use-case';
import { RevisionRepository } from './domain/repository/revision.repository';
import { AppModule } from './app.module';
import { PreguntaRevisionGrpcAdapter } from './infrastructure/grpc/pregunta-revision-grpc.adapter';
import { TypeOrmPreguntaRevisionSolicitadaStoreAdapter } from './infrastructure/persistence/typeorm/request/typeorm-pregunta-revision-solicitada-store.adapter';
import { TypeOrmRevisionRepositoryAdapter } from './infrastructure/persistence/typeorm/revision/typeorm-revision-repository.adapter';
import { TypeOrmRevisionUnitOfWork } from './infrastructure/persistence/typeorm/typeorm-revision-unit-of-work';
import { PreguntasPendientesRevisionController } from './interfaces/rest/preguntas-pendientes-revision.controller';
import { RevisionController } from './interfaces/rest/revision.controller';

describe('AppModule', () => {
  it(
    'compila la composición real sin ejecutar lifecycle externo ' +
      '(sin conectar Rabbit, PostgreSQL ni gRPC reales)',
    async () => {
      const moduleRef = await Test.createTestingModule({
        imports: [AppModule],
      }).compile();

      expect(moduleRef).toBeDefined();

      expect(moduleRef.get(RevisionController)).toBeInstanceOf(RevisionController);
      expect(moduleRef.get(PreguntasPendientesRevisionController)).toBeInstanceOf(
        PreguntasPendientesRevisionController,
      );

      expect(moduleRef.get(CrearRevisionUseCase)).toBeInstanceOf(CrearRevisionUseCase);
      expect(moduleRef.get(ListarPreguntasPendientesUseCase)).toBeInstanceOf(
        ListarPreguntasPendientesUseCase,
      );
      expect(moduleRef.get(ListarRevisionesPreguntaUseCase)).toBeInstanceOf(
        ListarRevisionesPreguntaUseCase,
      );
      expect(moduleRef.get(ObtenerRevisionUseCase)).toBeInstanceOf(ObtenerRevisionUseCase);
      expect(moduleRef.get(RegistrarEvaluacionUseCase)).toBeInstanceOf(RegistrarEvaluacionUseCase);
      expect(moduleRef.get(RegistrarPreguntaEnviadaRevisionUseCase)).toBeInstanceOf(
        RegistrarPreguntaEnviadaRevisionUseCase,
      );

      expect(moduleRef.get(RevisionRepository)).toBeInstanceOf(TypeOrmRevisionRepositoryAdapter);
      expect(moduleRef.get(PreguntaRevisionSolicitadaStore)).toBeInstanceOf(
        TypeOrmPreguntaRevisionSolicitadaStoreAdapter,
      );
      expect(moduleRef.get(RevisionUnitOfWork)).toBeInstanceOf(TypeOrmRevisionUnitOfWork);
      expect(moduleRef.get(PreguntaRevisionGateway)).toBeInstanceOf(PreguntaRevisionGrpcAdapter);

      await moduleRef.close();
    },
  );
});
