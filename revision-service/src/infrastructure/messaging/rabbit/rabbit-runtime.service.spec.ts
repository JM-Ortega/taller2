import * as amqplib from 'amqplib';
import type { ConsumeMessage } from 'amqplib';
import type { DataSource } from 'typeorm';
import { RegistrarPreguntaEnviadaRevisionUseCase } from '../../../application/use-case/registrar-pregunta-enviada-revision.use-case';
import { RabbitRuntimeService } from './rabbit-runtime.service';
import { RevisionFinalizadaOutboxDispatcher } from './revision-finalizada-outbox.dispatcher';

jest.mock('amqplib');
jest.mock('./revision-finalizada-outbox.dispatcher');

const EXCHANGE = 'saberpro.events';
const QUEUE = 'revision.pregunta-enviada.queue';
const ROUTING_KEY = 'pregunta.enviada_revision';

function mensajeConPayload(payload: unknown): ConsumeMessage {
  return { content: Buffer.from(JSON.stringify(payload), 'utf-8') } as unknown as ConsumeMessage;
}

function payloadValido(overrides: Partial<Record<string, unknown>> = {}): Record<string, unknown> {
  return {
    eventId: '550e8400-e29b-41d4-a716-446655440000',
    eventType: 'PreguntaEnviadaARevision',
    occurredAt: '2026-09-27T12:00:00Z',
    preguntaId: '7d444840-9dc0-11d1-b245-5ffdce74fad2',
    autorId: 'autor-001',
    versionPregunta: 1,
    ...overrides,
  };
}

function crearChannelMock() {
  return {
    assertExchange: jest.fn().mockResolvedValue(undefined),
    assertQueue: jest.fn().mockResolvedValue(undefined),
    bindQueue: jest.fn().mockResolvedValue(undefined),
    consume: jest.fn().mockResolvedValue(undefined),
    ack: jest.fn(),
    nack: jest.fn(),
    close: jest.fn().mockResolvedValue(undefined),
  };
}

function crearConexionMock(channel: ReturnType<typeof crearChannelMock>) {
  return {
    createChannel: jest.fn().mockResolvedValue(channel),
    close: jest.fn().mockResolvedValue(undefined),
  };
}

function crearDataSourceMock() {
  return {
    isInitialized: false,
    initialize: jest.fn().mockImplementation(async function (this: { isInitialized: boolean }) {
      this.isInitialized = true;
    }),
    destroy: jest.fn().mockResolvedValue(undefined),
  };
}

describe('RabbitRuntimeService', () => {
  const useCase = { execute: jest.fn().mockResolvedValue(undefined) } as unknown as RegistrarPreguntaEnviadaRevisionUseCase;
  let channel: ReturnType<typeof crearChannelMock>;
  let connection: ReturnType<typeof crearConexionMock>;
  let dataSource: ReturnType<typeof crearDataSourceMock>;
  let serviciosCreados: RabbitRuntimeService[];

  beforeEach(() => {
    jest.clearAllMocks();
    channel = crearChannelMock();
    connection = crearConexionMock(channel);
    dataSource = crearDataSourceMock();
    serviciosCreados = [];
    (amqplib.connect as jest.Mock).mockResolvedValue(connection);
    (RevisionFinalizadaOutboxDispatcher as jest.Mock).mockImplementation(() => ({
      dispatchPending: jest.fn().mockResolvedValue(undefined),
    }));
  });

  afterEach(async () => {
    // Todo test que llama a onModuleInit deja un timer de polling real corriendo;
    // se apaga siempre aquí para no filtrar handles abiertos entre tests.
    await Promise.all(serviciosCreados.map((servicio) => servicio.onApplicationShutdown()));
  });

  function crearServicio(pollIntervalMs = 1000): RabbitRuntimeService {
    const servicio = new RabbitRuntimeService(dataSource as unknown as DataSource, useCase, {
      rabbitUrl: 'amqp://guest:guest@localhost:5672',
      outboxPollIntervalMs: pollIntervalMs,
    });
    serviciosCreados.push(servicio);
    return servicio;
  }

  it('inicializa el DataSource antes de comenzar a consumir', async () => {
    const servicio = crearServicio();
    const orden: string[] = [];
    dataSource.initialize.mockImplementation(async () => {
      orden.push('dataSource.initialize');
      dataSource.isInitialized = true;
    });
    channel.consume.mockImplementation(async () => {
      orden.push('channel.consume');
    });

    await servicio.onModuleInit();

    expect(orden).toEqual(['dataSource.initialize', 'channel.consume']);
  });

  it('no reinicializa el DataSource si ya está inicializado', async () => {
    dataSource.isInitialized = true;
    const servicio = crearServicio();

    await servicio.onModuleInit();

    expect(dataSource.initialize).not.toHaveBeenCalled();
  });

  it('declara exchange/queue/binding exactos', async () => {
    const servicio = crearServicio();

    await servicio.onModuleInit();

    expect(channel.assertExchange).toHaveBeenCalledWith(EXCHANGE, 'topic', { durable: true });
    expect(channel.assertQueue).toHaveBeenCalledWith(QUEUE, {
      durable: true,
      autoDelete: false,
      exclusive: false,
    });
    expect(channel.bindQueue).toHaveBeenCalledWith(QUEUE, EXCHANGE, ROUTING_KEY);
    expect(channel.consume).toHaveBeenCalledWith(QUEUE, expect.any(Function), { noAck: false });
  });

  it('un delivery válido delega al consumer y no hace nack', async () => {
    const servicio = crearServicio();
    await servicio.onModuleInit();
    const callback = channel.consume.mock.calls[0][1] as (m: ConsumeMessage | null) => void;

    callback(mensajeConPayload(payloadValido()));
    await Promise.resolve();
    await Promise.resolve();

    expect(useCase.execute).toHaveBeenCalledTimes(1);
    expect(channel.nack).not.toHaveBeenCalled();
  });

  it('mensaje permanentemente inválido hace nack con requeue=false', async () => {
    const servicio = crearServicio();
    await servicio.onModuleInit();
    const callback = channel.consume.mock.calls[0][1] as (m: ConsumeMessage | null) => void;
    const mensajeInvalido = mensajeConPayload(payloadValido({ eventType: 'OtroEvento' }));

    callback(mensajeInvalido);
    await Promise.resolve();
    await Promise.resolve();

    expect(channel.nack).toHaveBeenCalledWith(mensajeInvalido, false, false);
  });

  it('un error técnico (Use Case falla) hace nack con requeue=true', async () => {
    (useCase.execute as jest.Mock).mockRejectedValueOnce(new Error('BD no disponible'));
    const servicio = crearServicio();
    await servicio.onModuleInit();
    const callback = channel.consume.mock.calls[0][1] as (m: ConsumeMessage | null) => void;
    const mensaje = mensajeConPayload(payloadValido());

    callback(mensaje);
    await Promise.resolve();
    await Promise.resolve();

    expect(channel.nack).toHaveBeenCalledWith(mensaje, false, true);
  });

  it('el shutdown detiene el timer de polling y cierra canal/conexión/DataSource', async () => {
    dataSource.isInitialized = true;
    const servicio = crearServicio(50);
    await servicio.onModuleInit();

    await servicio.onApplicationShutdown();

    expect(channel.close).toHaveBeenCalledTimes(1);
    expect(connection.close).toHaveBeenCalledTimes(1);
    expect(dataSource.destroy).toHaveBeenCalledTimes(1);
  });

  it('el shutdown es idempotente/defensivo si se invoca más de una vez', async () => {
    dataSource.isInitialized = true;
    const servicio = crearServicio(50);
    await servicio.onModuleInit();

    await servicio.onApplicationShutdown();
    await expect(servicio.onApplicationShutdown()).resolves.toBeUndefined();

    expect(channel.close).toHaveBeenCalledTimes(1);
    expect(connection.close).toHaveBeenCalledTimes(1);
  });

  it('el polling del Outbox no se solapa: no arranca un ciclo nuevo mientras el anterior sigue pendiente', async () => {
    let resolverPrimerCiclo: (() => void) | undefined;
    const primerCiclo = new Promise<void>((resolve) => {
      resolverPrimerCiclo = resolve;
    });
    const dispatchPending = jest
      .fn()
      .mockImplementationOnce(() => primerCiclo)
      .mockImplementation(() => Promise.resolve());
    (RevisionFinalizadaOutboxDispatcher as jest.Mock).mockImplementation(() => ({
      dispatchPending,
    }));

    const servicio = crearServicio(10);
    await servicio.onModuleInit();

    expect(dispatchPending).toHaveBeenCalledTimes(1);

    await new Promise((resolve) => setTimeout(resolve, 30));
    expect(dispatchPending).toHaveBeenCalledTimes(1);

    resolverPrimerCiclo?.();
    await new Promise((resolve) => setTimeout(resolve, 30));
    expect(dispatchPending.mock.calls.length).toBeGreaterThanOrEqual(2);

    await servicio.onApplicationShutdown();
  });
});
