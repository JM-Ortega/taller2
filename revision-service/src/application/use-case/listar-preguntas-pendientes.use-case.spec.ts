import { FakePreguntaRevisionSolicitadaStore } from '../../test/fakes/fake-pregunta-revision-solicitada.store';
import { ListarPreguntasPendientesUseCase } from './listar-preguntas-pendientes.use-case';

describe('ListarPreguntasPendientesUseCase', () => {
  it('retorna las solicitudes pendientes del store', async () => {
    const store = new FakePreguntaRevisionSolicitadaStore();
    store.agregarPendiente({ preguntaId: 'pregunta-1', versionPregunta: 1, autorId: 'autor-1' });
    const useCase = new ListarPreguntasPendientesUseCase(store);

    const pendientes = await useCase.execute();

    expect(pendientes).toEqual([
      { preguntaId: 'pregunta-1', versionPregunta: 1, autorId: 'autor-1' },
    ]);
  });
});
