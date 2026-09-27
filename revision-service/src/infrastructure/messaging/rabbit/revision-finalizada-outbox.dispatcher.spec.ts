import type { Channel } from 'amqplib';
import type { DataSource } from 'typeorm';
import { ResultadoRevision } from '../../../domain/model/resultado-revision';
import { OutboxEventOrmEntity } from '../../persistence/typeorm/outbox/outbox-event.orm-entity';
import { RevisionFinalizadaOutboxDispatcher } from './revision-finalizada-outbox.dispatcher';

function eventoPendiente(overrides: Partial<OutboxEventOrmEntity> = {}): OutboxEventOrmEntity {
  const occurredAt = new Date('2026-01-01T00:00:00.000Z');
  const eventId = '550e8400-e29b-41d4-a716-446655440000';
  const payload = {
    eventId,
    eventType: 'RevisionFinalizada',
    occurredAt: occurredAt.toISOString(),
    revisionId: '04d6ea25-e7a0-4a0a-a85e-1cac79fd5c94',
    preguntaId: '7d444840-9dc0-11d1-b245-5ffdce74fad2',
    versionPregunta: 1,
    resultado: ResultadoRevision.FAVORABLE,
  };
  return {
    eventId,
    eventType: 'RevisionFinalizada',
    occurredAt,
    payload,
    publishedAt: null,
    ...overrides,
  };
}

function crearRepositorioMock(pendientes: OutboxEventOrmEntity[]) {
  return {
    find: jest.fn().mockResolvedValue(pendientes),
    save: jest.fn().mockImplementation(async (evento: OutboxEventOrmEntity) => evento),
  };
}

function crearDataSourceMock(repositorio: ReturnType<typeof crearRepositorioMock>) {
  return { getRepository: jest.fn().mockReturnValue(repositorio) };
}

function crearChannelMock() {
  return { publish: jest.fn().mockReturnValue(true) };
}

describe('RevisionFinalizadaOutboxDispatcher', () => {
  it('consulta únicamente eventType=RevisionFinalizada con publishedAt null, ordenado por occurredAt ASC', async () => {
    const repositorio = crearRepositorioMock([]);
    const dataSource = crearDataSourceMock(repositorio);
    const channel = crearChannelMock();
    const dispatcher = new RevisionFinalizadaOutboxDispatcher(
      dataSource as unknown as DataSource,
      channel as unknown as Channel,
    );

    await dispatcher.dispatchPending();

    expect(repositorio.find).toHaveBeenCalledWith({
      where: { eventType: 'RevisionFinalizada', publishedAt: expect.anything() },
      order: { occurredAt: 'ASC' },
    });
    expect(channel.publish).not.toHaveBeenCalled();
  });

  it('publica exactamente con exchange=saberpro.events y routing=revision.finalizada', async () => {
    const evento = eventoPendiente();
    const repositorio = crearRepositorioMock([evento]);
    const dataSource = crearDataSourceMock(repositorio);
    const channel = crearChannelMock();
    const dispatcher = new RevisionFinalizadaOutboxDispatcher(
      dataSource as unknown as DataSource,
      channel as unknown as Channel,
    );

    await dispatcher.dispatchPending();

    expect(channel.publish).toHaveBeenCalledWith(
      'saberpro.events',
      'revision.finalizada',
      expect.any(Buffer),
      { contentType: 'application/json', contentEncoding: 'utf-8' },
    );
  });

  it('el body JSON contiene exactamente el payload persistido y no genera otro eventId', async () => {
    const evento = eventoPendiente();
    const repositorio = crearRepositorioMock([evento]);
    const dataSource = crearDataSourceMock(repositorio);
    const channel = crearChannelMock();
    const dispatcher = new RevisionFinalizadaOutboxDispatcher(
      dataSource as unknown as DataSource,
      channel as unknown as Channel,
    );

    await dispatcher.dispatchPending();

    const [, , body] = channel.publish.mock.calls[0];
    const cuerpo = JSON.parse((body as Buffer).toString('utf-8'));
    expect(cuerpo).toEqual(evento.payload);
    expect(cuerpo.eventId).toBe(evento.eventId);
  });

  it('no reconstruye el mensaje leyendo Revision: solo usa el payload persistido en Outbox', async () => {
    const evento = eventoPendiente();
    const repositorio = crearRepositorioMock([evento]);
    const dataSource = crearDataSourceMock(repositorio);
    const channel = crearChannelMock();
    const dispatcher = new RevisionFinalizadaOutboxDispatcher(
      dataSource as unknown as DataSource,
      channel as unknown as Channel,
    );

    await dispatcher.dispatchPending();

    expect(dataSource.getRepository).toHaveBeenCalledTimes(1);
    expect(dataSource.getRepository).toHaveBeenCalledWith(OutboxEventOrmEntity);
  });

  it('tras un publish sin excepción, marca publishedAt y persiste la actualización', async () => {
    const evento = eventoPendiente();
    const repositorio = crearRepositorioMock([evento]);
    const dataSource = crearDataSourceMock(repositorio);
    const channel = crearChannelMock();
    const dispatcher = new RevisionFinalizadaOutboxDispatcher(
      dataSource as unknown as DataSource,
      channel as unknown as Channel,
    );

    await dispatcher.dispatchPending();

    expect(evento.publishedAt).not.toBeNull();
    expect(repositorio.save).toHaveBeenCalledWith(evento);
  });

  it('si channel.publish lanza, no marca publicado, no persiste, y propaga el error', async () => {
    const evento = eventoPendiente();
    const repositorio = crearRepositorioMock([evento]);
    const dataSource = crearDataSourceMock(repositorio);
    const channel = crearChannelMock();
    const errorPublish = new Error('canal Rabbit no disponible');
    channel.publish.mockImplementation(() => {
      throw errorPublish;
    });
    const dispatcher = new RevisionFinalizadaOutboxDispatcher(
      dataSource as unknown as DataSource,
      channel as unknown as Channel,
    );

    await expect(dispatcher.dispatchPending()).rejects.toBe(errorPublish);

    expect(evento.publishedAt).toBeNull();
    expect(repositorio.save).not.toHaveBeenCalled();
  });

  it('si persistir la marca falla, el error se propaga (sin afirmar exactly-once)', async () => {
    const evento = eventoPendiente();
    const repositorio = crearRepositorioMock([evento]);
    const errorSave = new Error('fallo al guardar publishedAt');
    repositorio.save.mockRejectedValue(errorSave);
    const dataSource = crearDataSourceMock(repositorio);
    const channel = crearChannelMock();
    const dispatcher = new RevisionFinalizadaOutboxDispatcher(
      dataSource as unknown as DataSource,
      channel as unknown as Channel,
    );

    await expect(dispatcher.dispatchPending()).rejects.toBe(errorSave);
  });
});
