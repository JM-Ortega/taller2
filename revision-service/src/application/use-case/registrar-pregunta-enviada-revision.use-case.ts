import { RegistrarPreguntaEnviadaRevisionCommand } from '../command/registrar-pregunta-enviada-revision.command';
import { PreguntaRevisionSolicitadaStore } from '../port/out/pregunta-revision-solicitada.store';

export class RegistrarPreguntaEnviadaRevisionUseCase {
  constructor(private readonly store: PreguntaRevisionSolicitadaStore) {}

  async execute(command: RegistrarPreguntaEnviadaRevisionCommand): Promise<void> {
    await this.store.register({
      preguntaId: command.preguntaId,
      versionPregunta: command.versionPregunta,
      autorId: command.autorId,
    });
  }
}
