import { ResultadoRevision } from '../../domain/model/resultado-revision';
import { RevisorNoAsignadoException } from '../../domain/exception/revisor-no-asignado.exception';
import { FakeIntegrationEventPublisher } from '../../test/fakes/fake-integration-event-publisher';
import { FakeRevisionRepository } from '../../test/fakes/fake-revision-repository';
import { FakeRevisionUnitOfWork } from '../../test/fakes/fake-revision-unit-of-work';
import { revisionValidaEnCurso } from '../../test/fixtures/revision-test-fixtures';
import { RevisionNoEncontradaException } from '../exception/revision-no-encontrada.exception';
import { RegistrarEvaluacionUseCase } from './registrar-evaluacion.use-case';

function crearUseCase(repository: FakeRevisionRepository, publisher: FakeIntegrationEventPublisher) {
  const unitOfWork = new FakeRevisionUnitOfWork({ revisions: repository, events: publisher });
  return new RegistrarEvaluacionUseCase(unitOfWork);
}

describe('RegistrarEvaluacionUseCase', () => {
  it('lanza error cuando la revisión no existe', async () => {
    const repository = new FakeRevisionRepository();
    const publisher = new FakeIntegrationEventPublisher();
    const useCase = crearUseCase(repository, publisher);

    await expect(
      useCase.execute({
        revisionId: 'inexistente',
        revisorId: 'revisor-1',
        criterios: [{ nombre: 'claridad', cumple: true }],
        observaciones: 'ok',
        resultado: 'FAVORABLE',
      }),
    ).rejects.toThrow(RevisionNoEncontradaException);
  });

  it('guarda una evaluación válida que aún no finaliza sin publicar eventos', async () => {
    const repository = new FakeRevisionRepository();
    const revision = revisionValidaEnCurso(['revisor-1', 'revisor-2']);
    repository.agregar(revision);
    const publisher = new FakeIntegrationEventPublisher();
    const useCase = crearUseCase(repository, publisher);

    await useCase.execute({
      revisionId: revision.getRevisionId(),
      revisorId: 'revisor-1',
      criterios: [{ nombre: 'claridad', cumple: true }],
      observaciones: 'ok',
      resultado: 'FAVORABLE',
    });

    expect(repository.contarGuardados()).toBe(1);
    expect(publisher.eventosPublicados()).toHaveLength(0);
  });

  it('publica el evento exacto cuando la última evaluación finaliza la revisión', async () => {
    const repository = new FakeRevisionRepository();
    const revision = revisionValidaEnCurso(['revisor-1']);
    repository.agregar(revision);
    const publisher = new FakeIntegrationEventPublisher();
    const useCase = crearUseCase(repository, publisher);

    const revisionActualizada = await useCase.execute({
      revisionId: revision.getRevisionId(),
      revisorId: 'revisor-1',
      criterios: [{ nombre: 'claridad', cumple: true }],
      observaciones: 'ok',
      resultado: 'FAVORABLE',
    });

    expect(repository.contarGuardados()).toBe(1);
    const eventos = publisher.eventosPublicados();
    expect(eventos).toHaveLength(1);
    expect(eventos[0].occurredAt).toBeInstanceOf(Date);
    expect(eventos[0]).toEqual({
      revisionId: revision.getRevisionId(),
      preguntaId: revision.getPreguntaId(),
      versionPregunta: revision.getVersionPregunta(),
      resultado: ResultadoRevision.FAVORABLE,
      occurredAt: eventos[0].occurredAt,
    });
    expect(revisionActualizada.getResultadoFinal()).toBe(ResultadoRevision.FAVORABLE);
  });

  it('no guarda ni publica cuando el dominio rechaza la evaluación', async () => {
    const repository = new FakeRevisionRepository();
    const revision = revisionValidaEnCurso(['revisor-1']);
    repository.agregar(revision);
    const publisher = new FakeIntegrationEventPublisher();
    const useCase = crearUseCase(repository, publisher);

    await expect(
      useCase.execute({
        revisionId: revision.getRevisionId(),
        revisorId: 'revisor-ajeno',
        criterios: [{ nombre: 'claridad', cumple: true }],
        observaciones: 'ok',
        resultado: 'FAVORABLE',
      }),
    ).rejects.toThrow(RevisorNoAsignadoException);

    expect(repository.contarGuardados()).toBe(0);
    expect(publisher.eventosPublicados()).toHaveLength(0);
  });
});
