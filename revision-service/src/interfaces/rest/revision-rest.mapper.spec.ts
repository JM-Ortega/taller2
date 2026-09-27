import 'reflect-metadata';
import { ResultadoEvaluacion } from '../../domain/model/resultado-evaluacion';
import { ResultadoRevision } from '../../domain/model/resultado-revision';
import { Revision } from '../../domain/model/revision';
import {
  evaluacionDesfavorable,
  evaluacionFavorable,
  snapshotValido,
} from '../../test/fixtures/revision-test-fixtures';
import { CrearRevisionRequest } from './dto/request/crear-revision.request';
import { CriterioRevisionRequest } from './dto/request/criterio-revision.request';
import { RegistrarEvaluacionRequest } from './dto/request/registrar-evaluacion.request';
import { RevisionRestMapper } from './revision-rest.mapper';

function criterioRequest(nombre: string, cumple: boolean): CriterioRevisionRequest {
  const criterio = new CriterioRevisionRequest();
  criterio.nombre = nombre;
  criterio.cumple = cumple;
  return criterio;
}

describe('RevisionRestMapper', () => {
  const mapper = new RevisionRestMapper();

  describe('toCrearRevisionCommand', () => {
    it('mapea preguntaId y revisorIds exactamente', () => {
      const request = new CrearRevisionRequest();
      request.preguntaId = 'pregunta-1';
      request.revisorIds = ['revisor-1', 'revisor-2'];

      const command = mapper.toCrearRevisionCommand(request);

      expect(command).toEqual({
        preguntaId: 'pregunta-1',
        revisorIds: ['revisor-1', 'revisor-2'],
      });
    });
  });

  describe('toRegistrarEvaluacionCommand', () => {
    it('mapea el revisionId del path junto al contenido del body', () => {
      const request = new RegistrarEvaluacionRequest();
      request.revisorId = 'revisor-1';
      request.criterios = [criterioRequest('claridad', true)];
      request.observaciones = 'ok';
      request.resultado = 'FAVORABLE';

      const command = mapper.toRegistrarEvaluacionCommand('revision-1', request);

      expect(command).toEqual({
        revisionId: 'revision-1',
        revisorId: 'revisor-1',
        criterios: [{ nombre: 'claridad', cumple: true }],
        observaciones: 'ok',
        resultado: 'FAVORABLE',
      });
    });
  });

  describe('toPendienteResponse', () => {
    it('no expone autorId', () => {
      const response = mapper.toPendienteResponse({
        preguntaId: 'pregunta-1',
        versionPregunta: 3,
        autorId: 'autor-1',
      });

      expect(response).toEqual({ preguntaId: 'pregunta-1', versionPregunta: 3 });
      expect(response).not.toHaveProperty('autorId');
    });
  });

  describe('toRevisionResponse', () => {
    it('mapea una revisión en curso con resultadoFinal null y el snapshot completo', () => {
      const revision = Revision.crear(
        'revision-1',
        'pregunta-1',
        2,
        ['revisor-1', 'revisor-2'],
        snapshotValido(),
      );

      const response = mapper.toRevisionResponse(revision);

      expect(response.revisionId).toBe('revision-1');
      expect(response.preguntaId).toBe('pregunta-1');
      expect(response.versionPregunta).toBe(2);
      expect(response.revisorIds).toEqual(['revisor-1', 'revisor-2']);
      expect(response.preguntaParaRevision).toEqual(snapshotValido());
      expect(response.evaluaciones).toEqual([]);
      expect(response.resultadoFinal).toBeNull();
    });

    it('mapea una revisión finalizada con el resultado global y evaluaciones con revisorId', () => {
      const revision = Revision.crear(
        'revision-1',
        'pregunta-1',
        1,
        ['revisor-1', 'revisor-2'],
        snapshotValido(),
      );
      revision.registrarEvaluacion('revisor-1', evaluacionFavorable(), new Date());
      revision.registrarEvaluacion('revisor-2', evaluacionDesfavorable(), new Date());

      const response = mapper.toRevisionResponse(revision);

      expect(response.resultadoFinal).toBe(ResultadoRevision.DESFAVORABLE);
      expect(response.evaluaciones).toHaveLength(2);
      expect(response.evaluaciones).toContainEqual({
        revisorId: 'revisor-1',
        criterios: [{ nombre: 'claridad', cumple: true }],
        observaciones: 'Todo correcto',
        resultado: ResultadoEvaluacion.FAVORABLE,
      });
      expect(response.evaluaciones).toContainEqual({
        revisorId: 'revisor-2',
        criterios: [{ nombre: 'claridad', cumple: false }],
        observaciones: 'Requiere ajustes',
        resultado: ResultadoEvaluacion.DESFAVORABLE,
      });
    });
  });
});
