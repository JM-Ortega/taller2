import { OnApplicationShutdown, OnModuleInit } from '@nestjs/common';
import * as amqplib from 'amqplib';
import { Channel, ChannelModel, ConsumeMessage } from 'amqplib';
import { DataSource } from 'typeorm';
import { RegistrarPreguntaEnviadaRevisionUseCase } from '../../../application/use-case/registrar-pregunta-enviada-revision.use-case';
import { PreguntaEnviadaRevisionConsumer } from '../../../interfaces/messaging/rabbit/pregunta-enviada-revision.consumer';
import { MensajePreguntaEnviadaRevisionInvalidoError } from '../../../interfaces/messaging/rabbit/mensaje-pregunta-enviada-revision-invalido.error';
import { RevisionFinalizadaOutboxDispatcher } from './revision-finalizada-outbox.dispatcher';

const EXCHANGE = 'saberpro.events';
const QUEUE = 'revision.pregunta-enviada.queue';
const ROUTING_KEY = 'pregunta.enviada_revision';

export type RabbitRuntimeConfig = Readonly<{
  rabbitUrl: string;
  outboxPollIntervalMs: number;
}>;

export class RabbitRuntimeService implements OnModuleInit, OnApplicationShutdown {
  private connection: ChannelModel | null = null;
  private channel: Channel | null = null;
  private detenido = false;
  private pollingEnCurso: Promise<void> | null = null;
  private temporizadorPolling: NodeJS.Timeout | null = null;

  constructor(
    private readonly dataSource: DataSource,
    private readonly registrarPreguntaEnviadaRevisionUseCase: RegistrarPreguntaEnviadaRevisionUseCase,
    private readonly config: RabbitRuntimeConfig,
  ) {}

  async onModuleInit(): Promise<void> {
    if (!this.dataSource.isInitialized) {
      await this.dataSource.initialize();
    }

    this.connection = await amqplib.connect(this.config.rabbitUrl);
    this.channel = await this.connection.createChannel();

    await this.channel.assertExchange(EXCHANGE, 'topic', { durable: true });
    await this.channel.assertQueue(QUEUE, { durable: true, autoDelete: false, exclusive: false });
    await this.channel.bindQueue(QUEUE, EXCHANGE, ROUTING_KEY);

    const consumer = new PreguntaEnviadaRevisionConsumer(
      this.channel,
      this.registrarPreguntaEnviadaRevisionUseCase,
    );
    await this.channel.consume(
      QUEUE,
      (mensaje) => {
        void this.procesarEntrega(consumer, mensaje);
      },
      { noAck: false },
    );

    const dispatcher = new RevisionFinalizadaOutboxDispatcher(this.dataSource, this.channel);
    this.iniciarPolling(dispatcher);
  }

  async onApplicationShutdown(): Promise<void> {
    this.detenido = true;

    if (this.temporizadorPolling !== null) {
      clearTimeout(this.temporizadorPolling);
      this.temporizadorPolling = null;
    }
    if (this.pollingEnCurso !== null) {
      await this.pollingEnCurso.catch(() => undefined);
    }
    if (this.channel !== null) {
      await this.channel.close().catch(() => undefined);
      this.channel = null;
    }
    if (this.connection !== null) {
      await this.connection.close().catch(() => undefined);
      this.connection = null;
    }
    if (this.dataSource.isInitialized) {
      await this.dataSource.destroy();
    }
  }

  private async procesarEntrega(
    consumer: PreguntaEnviadaRevisionConsumer,
    mensaje: ConsumeMessage | null,
  ): Promise<void> {
    if (mensaje === null || this.channel === null) {
      return;
    }

    try {
      await consumer.handle(mensaje);
    } catch (error) {
      // El consumer ya ACKeó el camino exitoso; aquí solo clasificamos el fallo:
      // un mensaje permanentemente inválido no puede repararse con redelivery.
      if (error instanceof MensajePreguntaEnviadaRevisionInvalidoError) {
        this.channel.nack(mensaje, false, false);
      } else {
        this.channel.nack(mensaje, false, true);
      }
    }
  }

  private iniciarPolling(dispatcher: RevisionFinalizadaOutboxDispatcher): void {
    this.pollingEnCurso = this.ejecutarCicloPolling(dispatcher);
  }

  private async ejecutarCicloPolling(dispatcher: RevisionFinalizadaOutboxDispatcher): Promise<void> {
    if (this.detenido) {
      return;
    }
    try {
      await dispatcher.dispatchPending();
    } catch (error) {
      // Un fallo de un ciclo de Outbox no debe tumbar el proceso: se reintenta
      // en el próximo ciclo si Rabbit/DB se recuperan.
      console.error('fallo en ciclo de polling del Outbox RevisionFinalizada', error);
    }
    if (!this.detenido) {
      this.temporizadorPolling = setTimeout(() => {
        this.pollingEnCurso = this.ejecutarCicloPolling(dispatcher);
      }, this.config.outboxPollIntervalMs);
    }
  }
}
