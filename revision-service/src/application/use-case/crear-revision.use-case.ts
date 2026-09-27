import { randomUUID } from 'node:crypto';
import { AsignadorRevisor } from '../../domain/service/asignador-revisor';
import { Revision } from '../../domain/model/revision';
import { RevisionRepository } from '../../domain/repository/revision.repository';
import { CrearRevisionCommand } from '../command/crear-revision.command';
import { PreguntaNoDisponibleParaRevisionException } from '../exception/pregunta-no-disponible-para-revision.exception';
import { PreguntaRevisionGateway } from '../port/out/pregunta-revision.gateway';
import { PreguntaRevisionSolicitadaStore } from '../port/out/pregunta-revision-solicitada.store';

export class CrearRevisionUseCase {
  private readonly asignadorRevisor = new AsignadorRevisor();

  constructor(
    private readonly store: PreguntaRevisionSolicitadaStore,
    private readonly gateway: PreguntaRevisionGateway,
    private readonly repository: RevisionRepository,
  ) {}

  async execute(command: CrearRevisionCommand): Promise<Revision> {
    const solicitud = await this.store.findPendingByPreguntaId(command.preguntaId);
    if (solicitud === null) {
      throw new PreguntaNoDisponibleParaRevisionException(command.preguntaId);
    }

    this.asignadorRevisor.validarRevisionPorPares(solicitud.autorId, command.revisorIds);

    const snapshot = await this.gateway.iniciarRevision(
      command.preguntaId,
      solicitud.versionPregunta,
    );

    const revisionId = randomUUID();
    const revision = Revision.crear(
      revisionId,
      command.preguntaId,
      solicitud.versionPregunta,
      command.revisorIds,
      snapshot,
    );

    await this.repository.save(revision);
    return revision;
  }
}
