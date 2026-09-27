import { join } from 'node:path';
import { Module } from '@nestjs/common';
import { ClientGrpc, ClientsModule, Transport } from '@nestjs/microservices';
import { DataSource } from 'typeorm';

import { RevisionRepository } from './domain/repository/revision.repository';
import { PreguntaRevisionSolicitadaStore } from './application/port/out/pregunta-revision-solicitada.store';
import { RevisionUnitOfWork } from './application/port/out/revision-unit-of-work';
import { PreguntaRevisionGateway } from './application/port/out/pregunta-revision.gateway';

import { CrearRevisionUseCase } from './application/use-case/crear-revision.use-case';
import { ListarPreguntasPendientesUseCase } from './application/use-case/listar-preguntas-pendientes.use-case';
import { ListarRevisionesPreguntaUseCase } from './application/use-case/listar-revisiones-pregunta.use-case';
import { ObtenerRevisionUseCase } from './application/use-case/obtener-revision.use-case';
import { RegistrarEvaluacionUseCase } from './application/use-case/registrar-evaluacion.use-case';
import { RegistrarPreguntaEnviadaRevisionUseCase } from './application/use-case/registrar-pregunta-enviada-revision.use-case';

import { crearRevisionDataSource } from './infrastructure/persistence/typeorm/revision-data-source.factory';
import { RevisionPersistenceMapper } from './infrastructure/persistence/typeorm/revision/revision-persistence.mapper';
import { TypeOrmRevisionRepositoryAdapter } from './infrastructure/persistence/typeorm/revision/typeorm-revision-repository.adapter';
import { TypeOrmPreguntaRevisionSolicitadaStoreAdapter } from './infrastructure/persistence/typeorm/request/typeorm-pregunta-revision-solicitada-store.adapter';
import { TypeOrmRevisionUnitOfWork } from './infrastructure/persistence/typeorm/typeorm-revision-unit-of-work';

import { crearPreguntaRevisionGateway } from './infrastructure/grpc/pregunta-revision-grpc.provider';
import { RabbitRuntimeService } from './infrastructure/messaging/rabbit/rabbit-runtime.service';

import { PreguntasPendientesRevisionController } from './interfaces/rest/preguntas-pendientes-revision.controller';
import { RevisionController } from './interfaces/rest/revision.controller';

const PREGUNTA_GRPC_PACKAGE = 'PREGUNTA_GRPC_PACKAGE';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: PREGUNTA_GRPC_PACKAGE,
        transport: Transport.GRPC,
        options: {
          package: 'saberpro.preguntas',
          protoPath: join(__dirname, '../../contracts/grpc/pregunta_revision.proto'),
          url: process.env.PREGUNTA_GRPC_URL ?? 'localhost:9090',
          loader: {
            // proto3 omite del wire los valores por defecto (false, "", 0);
            // sin esto, @grpc/proto-loader no repone esos campos al decodificar
            // y el adaptador los ve como ausentes en vez de con su valor real.
            defaults: true,
          },
        },
      },
    ]),
  ],
  controllers: [RevisionController, PreguntasPendientesRevisionController],
  providers: [
    {
      provide: DataSource,
      useFactory: (): DataSource => crearRevisionDataSource(),
    },
    {
      provide: RevisionRepository,
      useFactory: (dataSource: DataSource): RevisionRepository =>
        TypeOrmRevisionRepositoryAdapter.standalone(dataSource, new RevisionPersistenceMapper()),
      inject: [DataSource],
    },
    {
      provide: PreguntaRevisionSolicitadaStore,
      useFactory: (dataSource: DataSource): PreguntaRevisionSolicitadaStore =>
        new TypeOrmPreguntaRevisionSolicitadaStoreAdapter(dataSource),
      inject: [DataSource],
    },
    {
      provide: RevisionUnitOfWork,
      useFactory: (dataSource: DataSource): RevisionUnitOfWork =>
        new TypeOrmRevisionUnitOfWork(dataSource, new RevisionPersistenceMapper()),
      inject: [DataSource],
    },
    {
      provide: PreguntaRevisionGateway,
      useFactory: (grpcClient: ClientGrpc): PreguntaRevisionGateway =>
        crearPreguntaRevisionGateway(grpcClient),
      inject: [PREGUNTA_GRPC_PACKAGE],
    },
    {
      provide: CrearRevisionUseCase,
      useFactory: (
        store: PreguntaRevisionSolicitadaStore,
        gateway: PreguntaRevisionGateway,
        repository: RevisionRepository,
      ): CrearRevisionUseCase => new CrearRevisionUseCase(store, gateway, repository),
      inject: [PreguntaRevisionSolicitadaStore, PreguntaRevisionGateway, RevisionRepository],
    },
    {
      provide: ListarPreguntasPendientesUseCase,
      useFactory: (store: PreguntaRevisionSolicitadaStore): ListarPreguntasPendientesUseCase =>
        new ListarPreguntasPendientesUseCase(store),
      inject: [PreguntaRevisionSolicitadaStore],
    },
    {
      provide: ListarRevisionesPreguntaUseCase,
      useFactory: (repository: RevisionRepository): ListarRevisionesPreguntaUseCase =>
        new ListarRevisionesPreguntaUseCase(repository),
      inject: [RevisionRepository],
    },
    {
      provide: ObtenerRevisionUseCase,
      useFactory: (repository: RevisionRepository): ObtenerRevisionUseCase =>
        new ObtenerRevisionUseCase(repository),
      inject: [RevisionRepository],
    },
    {
      provide: RegistrarEvaluacionUseCase,
      useFactory: (unitOfWork: RevisionUnitOfWork): RegistrarEvaluacionUseCase =>
        new RegistrarEvaluacionUseCase(unitOfWork),
      inject: [RevisionUnitOfWork],
    },
    {
      provide: RegistrarPreguntaEnviadaRevisionUseCase,
      useFactory: (store: PreguntaRevisionSolicitadaStore): RegistrarPreguntaEnviadaRevisionUseCase =>
        new RegistrarPreguntaEnviadaRevisionUseCase(store),
      inject: [PreguntaRevisionSolicitadaStore],
    },
    {
      provide: RabbitRuntimeService,
      useFactory: (
        dataSource: DataSource,
        useCase: RegistrarPreguntaEnviadaRevisionUseCase,
      ): RabbitRuntimeService =>
        new RabbitRuntimeService(dataSource, useCase, {
          rabbitUrl: process.env.RABBITMQ_URL ?? 'amqp://guest:guest@localhost:5672',
          outboxPollIntervalMs: Number(process.env.OUTBOX_POLL_INTERVAL_MS ?? 1000),
        }),
      inject: [DataSource, RegistrarPreguntaEnviadaRevisionUseCase],
    },
  ],
})
export class AppModule {}
