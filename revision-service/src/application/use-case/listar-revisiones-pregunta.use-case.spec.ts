import { FakeRevisionRepository } from '../../test/fakes/fake-revision-repository';
import { revisionValidaEnCurso } from '../../test/fixtures/revision-test-fixtures';
import { ListarRevisionesPreguntaUseCase } from './listar-revisiones-pregunta.use-case';

describe('ListarRevisionesPreguntaUseCase', () => {
  it('delega en el repositorio por preguntaId y retorna su resultado', async () => {
    const repository = new FakeRevisionRepository();
    const revision = revisionValidaEnCurso();
    repository.agregar(revision);
    const useCase = new ListarRevisionesPreguntaUseCase(repository);

    const revisiones = await useCase.execute(revision.getPreguntaId());

    expect(revisiones).toEqual([revision]);
  });
});
