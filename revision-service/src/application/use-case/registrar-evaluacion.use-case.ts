import { Evaluacion } from '../../domain/model/evaluacion';
import { ResultadoEvaluacion } from '../../domain/model/resultado-evaluacion';
import { Revision } from '../../domain/model/revision';
import { RegistrarEvaluacionCommand } from '../command/registrar-evaluacion.command';
import { RevisionNoEncontradaException } from '../exception/revision-no-encontrada.exception';
import { RevisionUnitOfWork } from '../port/out/revision-unit-of-work';

export class RegistrarEvaluacionUseCase {
  constructor(private readonly unitOfWork: RevisionUnitOfWork) {}

  async execute(command: RegistrarEvaluacionCommand): Promise<Revision> {
    const evaluacion: Evaluacion = {
      criterios: command.criterios,
      observaciones: command.observaciones,
      resultado: ResultadoEvaluacion[command.resultado],
    };

    return this.unitOfWork.execute(async ({ revisions, events }) => {
      const revision = await revisions.findById(command.revisionId);
      if (revision === null) {
        throw new RevisionNoEncontradaException(command.revisionId);
      }

      const finalizada = revision.registrarEvaluacion(command.revisorId, evaluacion, new Date());

      await revisions.save(revision);

      if (finalizada !== null) {
        await events.publish(finalizada);
      }

      return revision;
    });
  }
}
