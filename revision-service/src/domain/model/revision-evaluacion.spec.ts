import { RevisionYaFinalizadaException } from '../exception/revision-ya-finalizada.exception';
import { RevisorNoAsignadoException } from '../exception/revisor-no-asignado.exception';
import { RevisorYaEvaluoException } from '../exception/revisor-ya-evaluo.exception';
import { Evaluacion } from './evaluacion';
import { ResultadoRevision } from './resultado-revision';
import { Revision } from './revision';
import {
  evaluacionDesfavorable,
  evaluacionFavorable,
  revisionValidaEnCurso,
} from '../../test/fixtures/revision-test-fixtures';

describe('Revision.registrarEvaluacion', () => {
  it('rechaza la evaluación de un revisor no asignado sin mutar la revisión', () => {
    const revision = revisionValidaEnCurso(['revisor-1', 'revisor-2']);

    expect(() =>
      revision.registrarEvaluacion('revisor-ajeno', evaluacionFavorable(), new Date()),
    ).toThrow(RevisorNoAsignadoException);
    expect(revision.getEvaluaciones().size).toBe(0);
    expect(revision.getResultadoFinal()).toBeNull();
  });

  it('la primera evaluación no finaliza la revisión', () => {
    const revision = revisionValidaEnCurso(['revisor-1', 'revisor-2']);

    const finalizada = revision.registrarEvaluacion(
      'revisor-1',
      evaluacionFavorable(),
      new Date(),
    );

    expect(finalizada).toBeNull();
    expect(revision.getResultadoFinal()).toBeNull();
    expect(revision.getEvaluaciones().size).toBe(1);
  });

  it('rechaza que el mismo revisor evalúe dos veces', () => {
    const revision = revisionValidaEnCurso(['revisor-1', 'revisor-2']);
    revision.registrarEvaluacion('revisor-1', evaluacionFavorable(), new Date());

    expect(() =>
      revision.registrarEvaluacion('revisor-1', evaluacionFavorable(), new Date()),
    ).toThrow(RevisorYaEvaluoException);
    expect(revision.getEvaluaciones().size).toBe(1);
  });

  it('finaliza FAVORABLE cuando todos evalúan favorablemente', () => {
    const revision = revisionValidaEnCurso(['revisor-1', 'revisor-2']);
    revision.registrarEvaluacion('revisor-1', evaluacionFavorable(), new Date());

    const finalizada = revision.registrarEvaluacion(
      'revisor-2',
      evaluacionFavorable(),
      new Date(),
    );

    expect(finalizada?.resultado).toBe(ResultadoRevision.FAVORABLE);
    expect(revision.getResultadoFinal()).toBe(ResultadoRevision.FAVORABLE);
  });

  it('no finaliza anticipadamente cuando una evaluación desfavorable no es la última', () => {
    const revision = revisionValidaEnCurso(['revisor-1', 'revisor-2', 'revisor-3']);

    const finalizada = revision.registrarEvaluacion(
      'revisor-1',
      evaluacionDesfavorable(),
      new Date(),
    );

    expect(finalizada).toBeNull();
    expect(revision.getResultadoFinal()).toBeNull();
  });

  it('finaliza DESFAVORABLE si al completarse alguna evaluación fue desfavorable', () => {
    const revision = revisionValidaEnCurso(['revisor-1', 'revisor-2']);
    revision.registrarEvaluacion('revisor-1', evaluacionDesfavorable(), new Date());

    const finalizada = revision.registrarEvaluacion(
      'revisor-2',
      evaluacionFavorable(),
      new Date(),
    );

    expect(finalizada?.resultado).toBe(ResultadoRevision.DESFAVORABLE);
    expect(revision.getResultadoFinal()).toBe(ResultadoRevision.DESFAVORABLE);
  });

  it('rechaza evaluar una revisión ya finalizada sin mutarla', () => {
    const revision = revisionValidaEnCurso(['revisor-1']);
    revision.registrarEvaluacion('revisor-1', evaluacionFavorable(), new Date());

    expect(() =>
      revision.registrarEvaluacion('revisor-1', evaluacionFavorable(), new Date()),
    ).toThrow(RevisionYaFinalizadaException);
    expect(revision.getEvaluaciones().size).toBe(1);
  });

  it('copia defensivamente los criterios y la evaluación recibidos', () => {
    const revision = revisionValidaEnCurso(['revisor-1']);
    const evaluacion: Evaluacion = evaluacionFavorable();

    revision.registrarEvaluacion('revisor-1', evaluacion, new Date());
    (evaluacion.criterios as { nombre: string; cumple: boolean }[]).push({
      nombre: 'otro',
      cumple: false,
    });

    const guardada = revision.getEvaluaciones().get('revisor-1');
    expect(guardada?.criterios).toHaveLength(1);

    (guardada?.criterios as { nombre: string; cumple: boolean }[]).push({
      nombre: 'externo',
      cumple: false,
    });
    expect(revision.getEvaluaciones().get('revisor-1')?.criterios).toHaveLength(1);
  });

  it('produce un RevisionFinalizada con los datos exactos de la revisión', () => {
    const revision = Revision.crear(
      'revision-77',
      'pregunta-77',
      3,
      ['revisor-1'],
      revisionValidaEnCurso(['revisor-1']).getPreguntaParaRevision(),
    );
    const occurredAt = new Date('2026-01-01T00:00:00Z');

    const finalizada = revision.registrarEvaluacion('revisor-1', evaluacionFavorable(), occurredAt);

    expect(finalizada).toEqual({
      revisionId: 'revision-77',
      preguntaId: 'pregunta-77',
      versionPregunta: 3,
      resultado: ResultadoRevision.FAVORABLE,
      occurredAt,
    });
  });
});
