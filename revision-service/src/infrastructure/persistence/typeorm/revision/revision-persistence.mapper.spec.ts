import { RevisionInvalidaException } from '../../../../domain/exception/revision-invalida.exception';
import { RevisorNoAsignadoException } from '../../../../domain/exception/revisor-no-asignado.exception';
import { ResultadoRevision } from '../../../../domain/model/resultado-revision';
import {
  evaluacionDesfavorable,
  evaluacionFavorable,
  revisionValidaEnCurso,
  snapshotValido,
} from '../../../../test/fixtures/revision-test-fixtures';
import { RevisionPersistenceMapper } from './revision-persistence.mapper';

describe('RevisionPersistenceMapper', () => {
  const mapper = new RevisionPersistenceMapper();

  it('mapea una revisión en curso de ORM a Domain conservando IDs, versión, revisores, snapshot y evaluaciones parciales', () => {
    const revision = revisionValidaEnCurso(['revisor-1', 'revisor-2']);
    revision.registrarEvaluacion('revisor-1', evaluacionFavorable(), new Date());

    const root = mapper.toRootEntity(revision);
    const revisores = mapper.toRevisorEntities(revision);
    const evaluaciones = mapper.toEvaluacionEntities(revision);

    const reconstruida = mapper.toDomain(root, revisores, evaluaciones);

    expect(reconstruida.getRevisionId()).toBe(revision.getRevisionId());
    expect(reconstruida.getPreguntaId()).toBe(revision.getPreguntaId());
    expect(reconstruida.getVersionPregunta()).toBe(revision.getVersionPregunta());
    expect(reconstruida.getRevisorIds()).toEqual(revision.getRevisorIds());
    expect(reconstruida.getResultadoFinal()).toBeNull();
    expect(reconstruida.getEvaluaciones().size).toBe(1);
  });

  it('mapea una revisión finalizada de ORM a Domain conservando el ResultadoRevision', () => {
    const revision = revisionValidaEnCurso(['revisor-1']);
    revision.registrarEvaluacion('revisor-1', evaluacionFavorable(), new Date());

    const root = mapper.toRootEntity(revision);
    const revisores = mapper.toRevisorEntities(revision);
    const evaluaciones = mapper.toEvaluacionEntities(revision);
    const reconstruida = mapper.toDomain(root, revisores, evaluaciones);

    expect(root.resultadoFinal).toBe(ResultadoRevision.FAVORABLE);
    expect(reconstruida.getResultadoFinal()).toBe(ResultadoRevision.FAVORABLE);
  });

  it('conserva criterios, observaciones y ResultadoEvaluacion por revisor', () => {
    const revision = revisionValidaEnCurso(['revisor-1', 'revisor-2']);
    revision.registrarEvaluacion('revisor-1', evaluacionFavorable(), new Date());
    revision.registrarEvaluacion('revisor-2', evaluacionDesfavorable(), new Date());

    const root = mapper.toRootEntity(revision);
    const revisores = mapper.toRevisorEntities(revision);
    const evaluaciones = mapper.toEvaluacionEntities(revision);
    const reconstruida = mapper.toDomain(root, revisores, evaluaciones);

    expect(reconstruida.getEvaluaciones().get('revisor-1')).toEqual(evaluacionFavorable());
    expect(reconstruida.getEvaluaciones().get('revisor-2')).toEqual(evaluacionDesfavorable());
  });

  it('conserva el snapshot JSON completo', () => {
    const revision = revisionValidaEnCurso(['revisor-1']);

    const root = mapper.toRootEntity(revision);

    expect(root.snapshotPregunta).toEqual(snapshotValido());
  });

  it('rechaza datos ORM imposibles a través de Revision.reconstituir', () => {
    const revision = revisionValidaEnCurso(['revisor-1']);
    const root = mapper.toRootEntity(revision);
    const revisores = mapper.toRevisorEntities(revision);
    const evaluacionDeRevisorNoAsignado = [
      {
        revisionId: root.revisionId,
        revisorId: 'revisor-ajeno',
        criterios: [{ nombre: 'claridad', cumple: true }],
        observaciones: 'ok',
        resultado: 'FAVORABLE',
      },
    ];

    expect(() => mapper.toDomain(root, revisores, evaluacionDeRevisorNoAsignado)).toThrow(
      RevisorNoAsignadoException,
    );
  });

  it('rechaza un resultado de evaluación persistido desconocido', () => {
    const revision = revisionValidaEnCurso(['revisor-1']);
    const root = mapper.toRootEntity(revision);
    const revisores = mapper.toRevisorEntities(revision);
    const evaluacionConResultadoDesconocido = [
      {
        revisionId: root.revisionId,
        revisorId: 'revisor-1',
        criterios: [{ nombre: 'claridad', cumple: true }],
        observaciones: 'ok',
        resultado: 'BOGUS',
      },
    ];

    expect(() => mapper.toDomain(root, revisores, evaluacionConResultadoDesconocido)).toThrow(
      RevisionInvalidaException,
    );
  });

  it('rechaza un resultado final persistido desconocido', () => {
    const revision = revisionValidaEnCurso(['revisor-1']);
    const root = mapper.toRootEntity(revision);
    const revisores = mapper.toRevisorEntities(revision);
    const raizConResultadoDesconocido = { ...root, resultadoFinal: 'BOGUS' };

    expect(() => mapper.toDomain(raizConResultadoDesconocido, revisores, [])).toThrow(
      RevisionInvalidaException,
    );
  });
});
