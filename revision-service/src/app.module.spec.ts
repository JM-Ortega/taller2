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

  it(
    'registra el cliente gRPC de Pregunta con loader.defaults=true, ' +
      'requerido para que @grpc/proto-loader materialice los valores ' +
      'escalares por defecto de proto3 (false, "", 0) que el wire omite',
    async () => {
      // Se reemplaza PreguntaRevisionGateway (y con ello su factoría
      // crearPreguntaRevisionGateway, que llama a ClientGrpc.getService) porque
      // esta suite reutiliza como singleton el mismo cliente gRPC registrado por
      // ClientsModule.register en AppModule: el test anterior ya lo cerró con
      // moduleRef.close(), lo que vacía su caché interna de servicios y rompe
      // getService() en compilaciones posteriores. options no se ve afectado por
      // close(), así que basta con evitar esa llamada para inspeccionarlo aquí.
      const moduleRef = await Test.createTestingModule({
        imports: [AppModule],
      })
        .overrideProvider(PreguntaRevisionGateway)
        .useValue({
          iniciarRevision: async () => {
            throw new Error('no debe invocarse en este test de configuración');
          },
        })
        .compile();

      const grpcClient = moduleRef.get('PREGUNTA_GRPC_PACKAGE') as {
        options: {
          package?: string;
          protoPath?: string;
          loader?: { defaults?: boolean };
        };
      };

      expect(grpcClient.options.package).toBe('saberpro.preguntas');
      expect(grpcClient.options.protoPath?.endsWith('contracts/grpc/pregunta_revision.proto')).toBe(
        true,
      );
      expect(grpcClient.options.loader).toEqual(
        expect.objectContaining({ defaults: true }),
      );

      await moduleRef.close();
    },
  );
});
