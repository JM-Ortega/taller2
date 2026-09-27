import { FakePreguntaRevisionSolicitadaStore } from '../../test/fakes/fake-pregunta-revision-solicitada.store';
import { RegistrarPreguntaEnviadaRevisionUseCase } from './registrar-pregunta-enviada-revision.use-case';

describe('RegistrarPreguntaEnviadaRevisionUseCase', () => {
  it('registra la solicitud con los datos exactos del comando', async () => {
    const store = new FakePreguntaRevisionSolicitadaStore();
    const useCase = new RegistrarPreguntaEnviadaRevisionUseCase(store);

    await useCase.execute({ preguntaId: 'pregunta-1', versionPregunta: 2, autorId: 'autor-1' });

    await expect(store.findPendingByPreguntaId('pregunta-1')).resolves.toEqual({
      preguntaId: 'pregunta-1',
      versionPregunta: 2,
      autorId: 'autor-1',
    });
  });
});
