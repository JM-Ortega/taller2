import { FakeRevisionRepository } from '../../test/fakes/fake-revision-repository';
import { revisionValidaEnCurso } from '../../test/fixtures/revision-test-fixtures';
import { RevisionNoEncontradaException } from '../exception/revision-no-encontrada.exception';
import { ObtenerRevisionUseCase } from './obtener-revision.use-case';

describe('ObtenerRevisionUseCase', () => {
  it('retorna la revisión existente', async () => {
    const repository = new FakeRevisionRepository();
    const revision = revisionValidaEnCurso();
    repository.agregar(revision);
    const useCase = new ObtenerRevisionUseCase(repository);

    const obtenida = await useCase.execute(revision.getRevisionId());

    expect(obtenida).toBe(revision);
  });

  it('lanza error cuando la revisión no existe', async () => {
    const repository = new FakeRevisionRepository();
    const useCase = new ObtenerRevisionUseCase(repository);

    await expect(useCase.execute('inexistente')).rejects.toThrow(RevisionNoEncontradaException);
  });
});
