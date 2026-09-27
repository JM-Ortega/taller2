import { Channel, ConsumeMessage } from 'amqplib';
import { RegistrarPreguntaEnviadaRevisionUseCase } from '../../../application/use-case/registrar-pregunta-enviada-revision.use-case';
import { FakePreguntaRevisionSolicitadaStore } from '../../../test/fakes/fake-pregunta-revision-solicitada.store';
import { PreguntaEnviadaRevisionConsumer } from './pregunta-enviada-revision.consumer';

const PREGUNTA_ID = '7d444840-9dc0-11d1-b245-5ffdce74fad2';
const EVENT_ID = '550e8400-e29b-41d4-a716-446655440000';

function payloadValido(overrides: Partial<Record<string, unknown>> = {}): Record<string, unknown> {
  return {
    eventId: EVENT_ID,
    eventType: 'PreguntaEnviadaARevision',
    occurredAt: '2026-09-27T12:00:00Z',
    preguntaId: PREGUNTA_ID,
    autorId: 'autor-001',
    versionPregunta: 1,
    ...overrides,
  };
}

function mensajeConTexto(texto: string): ConsumeMessage {
  return { content: Buffer.from(texto, 'utf-8') } as unknown as ConsumeMessage;
}

function mensajeConPayload(payload: unknown): ConsumeMessage {
  return mensajeConTexto(JSON.stringify(payload));
}

function crearChannelMock(): jest.Mocked<Pick<Channel, 'ack'>> {
  return { ack: jest.fn() };
}

function crearUseCaseMock(): jest.Mocked<Pick<RegistrarPreguntaEnviadaRevisionUseCase, 'execute'>> {
  return { execute: jest.fn().mockResolvedValue(undefined) };
}

describe('PreguntaEnviadaRevisionConsumer', () => {
  it('mensaje válido invoca el Use Case con el Command exacto y hace ACK solo después de que resuelve', async () => {
    const orden: string[] = [];
    const useCase = {
      execute: jest.fn().mockImplementation(async () => {
        orden.push('use-case');
      }),
    };
    const channel = {
      ack: jest.fn(() => {
        orden.push('ack');
      }),
    };
    const consumer = new PreguntaEnviadaRevisionConsumer(
      channel as unknown as Channel,
      useCase as unknown as RegistrarPreguntaEnviadaRevisionUseCase,
    );
    const mensaje = mensajeConPayload(payloadValido());

    await consumer.handle(mensaje);

    expect(useCase.execute).toHaveBeenCalledTimes(1);
    expect(useCase.execute).toHaveBeenCalledWith({
      preguntaId: PREGUNTA_ID,
      versionPregunta: 1,
      autorId: 'autor-001',
    });
    expect(channel.ack).toHaveBeenCalledTimes(1);
    expect(channel.ack).toHaveBeenCalledWith(mensaje);
    expect(orden).toEqual(['use-case', 'ack']);
  });

  it('un redelivery compatible del mismo (preguntaId, versionPregunta) es idempotente y ambos deliveries ACKean', async () => {
    const store = new FakePreguntaRevisionSolicitadaStore();
    const useCase = new RegistrarPreguntaEnviadaRevisionUseCase(store);
    const channel = crearChannelMock();
    const consumer = new PreguntaEnviadaRevisionConsumer(channel as unknown as Channel, useCase);
    const mensaje = mensajeConPayload(payloadValido());

    await consumer.handle(mensaje);
    await consumer.handle(mensaje);

    expect(channel.ack).toHaveBeenCalledTimes(2);
    const pendiente = await store.findPendingByPreguntaId(PREGUNTA_ID);
    expect(pendiente).toEqual({ preguntaId: PREGUNTA_ID, versionPregunta: 1, autorId: 'autor-001' });
  });

  it('JSON inválido no invoca el Use Case, no hace ACK y propaga el error', async () => {
    const useCase = crearUseCaseMock();
    const channel = crearChannelMock();
    const consumer = new PreguntaEnviadaRevisionConsumer(
      channel as unknown as Channel,
      useCase as unknown as RegistrarPreguntaEnviadaRevisionUseCase,
    );

    await expect(consumer.handle(mensajeConTexto('{esto no es json'))).rejects.toThrow();

    expect(useCase.execute).not.toHaveBeenCalled();
    expect(channel.ack).not.toHaveBeenCalled();
  });

  it('eventType incorrecto no invoca el Use Case ni hace ACK', async () => {
    const useCase = crearUseCaseMock();
    const channel = crearChannelMock();
    const consumer = new PreguntaEnviadaRevisionConsumer(
      channel as unknown as Channel,
      useCase as unknown as RegistrarPreguntaEnviadaRevisionUseCase,
    );

    await expect(
      consumer.handle(mensajeConPayload(payloadValido({ eventType: 'OtroEvento' }))),
    ).rejects.toThrow();

    expect(useCase.execute).not.toHaveBeenCalled();
    expect(channel.ack).not.toHaveBeenCalled();
  });

  it('eventId con UUID inválido no invoca el Use Case ni hace ACK', async () => {
    const useCase = crearUseCaseMock();
    const channel = crearChannelMock();
    const consumer = new PreguntaEnviadaRevisionConsumer(
      channel as unknown as Channel,
      useCase as unknown as RegistrarPreguntaEnviadaRevisionUseCase,
    );

    await expect(
      consumer.handle(mensajeConPayload(payloadValido({ eventId: 'no-es-un-uuid' }))),
    ).rejects.toThrow();

    expect(useCase.execute).not.toHaveBeenCalled();
    expect(channel.ack).not.toHaveBeenCalled();
  });

  it('preguntaId con UUID inválido no invoca el Use Case ni hace ACK', async () => {
    const useCase = crearUseCaseMock();
    const channel = crearChannelMock();
    const consumer = new PreguntaEnviadaRevisionConsumer(
      channel as unknown as Channel,
      useCase as unknown as RegistrarPreguntaEnviadaRevisionUseCase,
    );

    await expect(
      consumer.handle(mensajeConPayload(payloadValido({ preguntaId: 'no-es-un-uuid' }))),
    ).rejects.toThrow();

    expect(useCase.execute).not.toHaveBeenCalled();
    expect(channel.ack).not.toHaveBeenCalled();
  });

  it('versionPregunta menor a 1 no invoca el Use Case ni hace ACK', async () => {
    const useCase = crearUseCaseMock();
    const channel = crearChannelMock();
    const consumer = new PreguntaEnviadaRevisionConsumer(
      channel as unknown as Channel,
      useCase as unknown as RegistrarPreguntaEnviadaRevisionUseCase,
    );

    await expect(
      consumer.handle(mensajeConPayload(payloadValido({ versionPregunta: 0 }))),
    ).rejects.toThrow();

    expect(useCase.execute).not.toHaveBeenCalled();
    expect(channel.ack).not.toHaveBeenCalled();
  });

  it('versionPregunta no entero no invoca el Use Case ni hace ACK', async () => {
    const useCase = crearUseCaseMock();
    const channel = crearChannelMock();
    const consumer = new PreguntaEnviadaRevisionConsumer(
      channel as unknown as Channel,
      useCase as unknown as RegistrarPreguntaEnviadaRevisionUseCase,
    );

    await expect(
      consumer.handle(mensajeConPayload(payloadValido({ versionPregunta: 1.5 }))),
    ).rejects.toThrow();

    expect(useCase.execute).not.toHaveBeenCalled();
    expect(channel.ack).not.toHaveBeenCalled();
  });

  it('autorId vacío no invoca el Use Case ni hace ACK', async () => {
    const useCase = crearUseCaseMock();
    const channel = crearChannelMock();
    const consumer = new PreguntaEnviadaRevisionConsumer(
      channel as unknown as Channel,
      useCase as unknown as RegistrarPreguntaEnviadaRevisionUseCase,
    );

    await expect(
      consumer.handle(mensajeConPayload(payloadValido({ autorId: '' }))),
    ).rejects.toThrow();

    expect(useCase.execute).not.toHaveBeenCalled();
    expect(channel.ack).not.toHaveBeenCalled();
  });

  it('occurredAt inválido no invoca el Use Case ni hace ACK', async () => {
    const useCase = crearUseCaseMock();
    const channel = crearChannelMock();
    const consumer = new PreguntaEnviadaRevisionConsumer(
      channel as unknown as Channel,
      useCase as unknown as RegistrarPreguntaEnviadaRevisionUseCase,
    );

    await expect(
      consumer.handle(mensajeConPayload(payloadValido({ occurredAt: 'no-es-una-fecha' }))),
    ).rejects.toThrow();

    expect(useCase.execute).not.toHaveBeenCalled();
    expect(channel.ack).not.toHaveBeenCalled();
  });

  describe('validación estricta de occurredAt (date-time RFC3339)', () => {
    it('una fecha completa con Z es válida y procesa el mensaje', async () => {
      const useCase = crearUseCaseMock();
      const channel = crearChannelMock();
      const consumer = new PreguntaEnviadaRevisionConsumer(
        channel as unknown as Channel,
        useCase as unknown as RegistrarPreguntaEnviadaRevisionUseCase,
      );

      await consumer.handle(
        mensajeConPayload(payloadValido({ occurredAt: '2026-09-27T12:00:00Z' })),
      );

      expect(useCase.execute).toHaveBeenCalledTimes(1);
      expect(channel.ack).toHaveBeenCalledTimes(1);
    });

    it('un date-time con offset numérico es válido y procesa el mensaje', async () => {
      const useCase = crearUseCaseMock();
      const channel = crearChannelMock();
      const consumer = new PreguntaEnviadaRevisionConsumer(
        channel as unknown as Channel,
        useCase as unknown as RegistrarPreguntaEnviadaRevisionUseCase,
      );

      await consumer.handle(
        mensajeConPayload(payloadValido({ occurredAt: '2026-09-27T07:00:00-05:00' })),
      );

      expect(useCase.execute).toHaveBeenCalledTimes(1);
      expect(channel.ack).toHaveBeenCalledTimes(1);
    });

    it('una fecha sin hora es rechazada, no invoca el Use Case ni hace ACK', async () => {
      const useCase = crearUseCaseMock();
      const channel = crearChannelMock();
      const consumer = new PreguntaEnviadaRevisionConsumer(
        channel as unknown as Channel,
        useCase as unknown as RegistrarPreguntaEnviadaRevisionUseCase,
      );

      await expect(
        consumer.handle(mensajeConPayload(payloadValido({ occurredAt: '2026-09-27' }))),
      ).rejects.toThrow();

      expect(useCase.execute).not.toHaveBeenCalled();
      expect(channel.ack).not.toHaveBeenCalled();
    });

    it('un formato parseable por Date.parse pero que no es date-time es rechazado', async () => {
      const useCase = crearUseCaseMock();
      const channel = crearChannelMock();
      const consumer = new PreguntaEnviadaRevisionConsumer(
        channel as unknown as Channel,
        useCase as unknown as RegistrarPreguntaEnviadaRevisionUseCase,
      );

      await expect(
        consumer.handle(mensajeConPayload(payloadValido({ occurredAt: '09/27/2026 12:00' }))),
      ).rejects.toThrow();

      expect(useCase.execute).not.toHaveBeenCalled();
      expect(channel.ack).not.toHaveBeenCalled();
    });
  });

  it('una propiedad adicional no permitida no invoca el Use Case ni hace ACK', async () => {
    const useCase = crearUseCaseMock();
    const channel = crearChannelMock();
    const consumer = new PreguntaEnviadaRevisionConsumer(
      channel as unknown as Channel,
      useCase as unknown as RegistrarPreguntaEnviadaRevisionUseCase,
    );

    await expect(
      consumer.handle(mensajeConPayload(payloadValido({ schemaVersion: 1 }))),
    ).rejects.toThrow();

    expect(useCase.execute).not.toHaveBeenCalled();
    expect(channel.ack).not.toHaveBeenCalled();
  });

  it('si el Use Case falla no hace ACK y propaga el error', async () => {
    const errorUseCase = new Error('fallo de persistencia');
    const useCase = { execute: jest.fn().mockRejectedValue(errorUseCase) };
    const channel = crearChannelMock();
    const consumer = new PreguntaEnviadaRevisionConsumer(
      channel as unknown as Channel,
      useCase as unknown as RegistrarPreguntaEnviadaRevisionUseCase,
    );

    await expect(consumer.handle(mensajeConPayload(payloadValido()))).rejects.toBe(errorUseCase);

    expect(channel.ack).not.toHaveBeenCalled();
  });

  it('un mensaje nulo (cancelación) no invoca el Use Case ni hace ACK', async () => {
    const useCase = crearUseCaseMock();
    const channel = crearChannelMock();
    const consumer = new PreguntaEnviadaRevisionConsumer(
      channel as unknown as Channel,
      useCase as unknown as RegistrarPreguntaEnviadaRevisionUseCase,
    );

    await consumer.handle(null);

    expect(useCase.execute).not.toHaveBeenCalled();
    expect(channel.ack).not.toHaveBeenCalled();
  });
});
