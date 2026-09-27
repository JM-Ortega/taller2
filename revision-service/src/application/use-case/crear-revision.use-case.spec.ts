import { AutorIncluidoComoRevisorException } from '../../domain/exception/autor-incluido-como-revisor.exception';
import { FakePreguntaRevisionGateway } from '../../test/fakes/fake-pregunta-revision.gateway';
import { FakePreguntaRevisionSolicitadaStore } from '../../test/fakes/fake-pregunta-revision-solicitada.store';
import { FakeRevisionRepository } from '../../test/fakes/fake-revision-repository';
import { snapshotValido } from '../../test/fixtures/revision-test-fixtures';
import { PreguntaNoDisponibleParaRevisionException } from '../exception/pregunta-no-disponible-para-revision.exception';
import { CrearRevisionUseCase } from './crear-revision.use-case';

describe('CrearRevisionUseCase', () => {
  it('rechaza cuando no hay una solicitud pendiente para la pregunta', async () => {
    const store = new FakePreguntaRevisionSolicitadaStore();
    const gateway = new FakePreguntaRevisionGateway(snapshotValido());
    const repository = new FakeRevisionRepository();
    const useCase = new CrearRevisionUseCase(store, gateway, repository);

    await expect(
      useCase.execute({ preguntaId: 'pregunta-1', revisorIds: ['revisor-1'] }),
    ).rejects.toThrow(PreguntaNoDisponibleParaRevisionException);
    expect(gateway.contarLlamadas()).toBe(0);
    expect(repository.contarGuardados()).toBe(0);
  });

  it('rechaza cuando el autor está entre los revisores propuestos', async () => {
    const store = new FakePreguntaRevisionSolicitadaStore();
    store.agregarPendiente({ preguntaId: 'pregunta-1', versionPregunta: 1, autorId: 'autor-1' });
    const gateway = new FakePreguntaRevisionGateway(snapshotValido());
    const repository = new FakeRevisionRepository();
    const useCase = new CrearRevisionUseCase(store, gateway, repository);

    await expect(
      useCase.execute({ preguntaId: 'pregunta-1', revisorIds: ['autor-1'] }),
    ).rejects.toThrow(AutorIncluidoComoRevisorException);
    expect(gateway.contarLlamadas()).toBe(0);
    expect(repository.contarGuardados()).toBe(0);
  });

  it('crea la revisión con el snapshot de la versión de la solicitud pendiente', async () => {
    const store = new FakePreguntaRevisionSolicitadaStore();
    store.agregarPendiente({ preguntaId: 'pregunta-1', versionPregunta: 3, autorId: 'autor-1' });
    const gateway = new FakePreguntaRevisionGateway(snapshotValido());
    const repository = new FakeRevisionRepository();
    const useCase = new CrearRevisionUseCase(store, gateway, repository);

    const revision = await useCase.execute({
      preguntaId: 'pregunta-1',
      revisorIds: ['revisor-1', 'revisor-2'],
    });

    expect(gateway.ultimaLlamada()).toEqual({ preguntaId: 'pregunta-1', versionPregunta: 3 });
    expect(repository.contarGuardados()).toBe(1);
    expect(revision.getPreguntaId()).toBe('pregunta-1');
    expect(revision.getVersionPregunta()).toBe(3);
    expect(revision.getRevisorIds()).toEqual(['revisor-1', 'revisor-2']);
  });
});
