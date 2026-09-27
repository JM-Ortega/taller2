import { Channel, ConsumeMessage } from 'amqplib';
import { isRFC3339, isUUID } from 'class-validator';
import { RegistrarPreguntaEnviadaRevisionCommand } from '../../../application/command/registrar-pregunta-enviada-revision.command';
import { RegistrarPreguntaEnviadaRevisionUseCase } from '../../../application/use-case/registrar-pregunta-enviada-revision.use-case';
import { MensajePreguntaEnviadaRevisionInvalidoError } from './mensaje-pregunta-enviada-revision-invalido.error';

const EVENT_TYPE = 'PreguntaEnviadaARevision';
const CAMPOS_PERMITIDOS: readonly string[] = [
  'eventId',
  'eventType',
  'occurredAt',
  'preguntaId',
  'autorId',
  'versionPregunta',
];

type PreguntaEnviadaARevisionWireMessage = Readonly<{
  eventId: string;
  eventType: typeof EVENT_TYPE;
  occurredAt: string;
  preguntaId: string;
  autorId: string;
  versionPregunta: number;
}>;

function esWireMessageValido(valor: unknown): valor is PreguntaEnviadaARevisionWireMessage {
  if (valor === null || typeof valor !== 'object') {
    return false;
  }
  const candidato = valor as Record<string, unknown>;

  if (Object.keys(candidato).some((propiedad) => !CAMPOS_PERMITIDOS.includes(propiedad))) {
    return false;
  }
  if (typeof candidato.eventId !== 'string' || !isUUID(candidato.eventId)) {
    return false;
  }
  if (candidato.eventType !== EVENT_TYPE) {
    return false;
  }
  if (typeof candidato.occurredAt !== 'string' || !isRFC3339(candidato.occurredAt)) {
    return false;
  }
  if (typeof candidato.preguntaId !== 'string' || !isUUID(candidato.preguntaId)) {
    return false;
  }
  if (typeof candidato.autorId !== 'string' || candidato.autorId.length < 1) {
    return false;
  }
  if (
    typeof candidato.versionPregunta !== 'number' ||
    !Number.isInteger(candidato.versionPregunta) ||
    candidato.versionPregunta < 1
  ) {
    return false;
  }
  return true;
}

export class PreguntaEnviadaRevisionConsumer {
  constructor(
    private readonly channel: Channel,
    private readonly useCase: RegistrarPreguntaEnviadaRevisionUseCase,
  ) {}

  async handle(mensaje: ConsumeMessage | null): Promise<void> {
    if (mensaje === null) {
      return;
    }

    let contenido: unknown;
    try {
      contenido = JSON.parse(mensaje.content.toString('utf-8'));
    } catch {
      throw new MensajePreguntaEnviadaRevisionInvalidoError(
        'mensaje Rabbit con JSON inválido para PreguntaEnviadaARevision',
      );
    }

    if (!esWireMessageValido(contenido)) {
      throw new MensajePreguntaEnviadaRevisionInvalidoError(
        'mensaje Rabbit no cumple el Published Language de PreguntaEnviadaARevision',
      );
    }

    const command: RegistrarPreguntaEnviadaRevisionCommand = {
      preguntaId: contenido.preguntaId,
      versionPregunta: contenido.versionPregunta,
      autorId: contenido.autorId,
    };

    await this.useCase.execute(command);

    // ACK después del efecto local: si la persistencia falla, el mensaje no se
    // pierde y queda disponible para redelivery.
    this.channel.ack(mensaje);
  }
}
