import { RevisionInvalidaException } from '../exception/revision-invalida.exception';
import { RevisorNoAsignadoException } from '../exception/revisor-no-asignado.exception';
import { RevisoresInvalidosException } from '../exception/revisores-invalidos.exception';
import { Evaluacion } from './evaluacion';
import { PreguntaParaRevision } from './pregunta-para-revision';
import { ResultadoRevision } from './resultado-revision';
import { Revision } from './revision';
import { evaluacionFavorable, snapshotValido } from '../../test/fixtures/revision-test-fixtures';

describe('Revision.crear', () => {
  it('crea una revisión válida en curso', () => {
    const revision = Revision.crear('revision-1', 'pregunta-1', 1, ['revisor-1'], snapshotValido());

    expect(revision.getRevisionId()).toBe('revision-1');
    expect(revision.getPreguntaId()).toBe('pregunta-1');
    expect(revision.getVersionPregunta()).toBe(1);
    expect(revision.getRevisorIds()).toEqual(['revisor-1']);
    expect(revision.getEvaluaciones().size).toBe(0);
    expect(revision.getResultadoFinal()).toBeNull();
  });

  it('rechaza versionPregunta menor que 1', () => {
    expect(() =>
      Revision.crear('revision-1', 'pregunta-1', 0, ['revisor-1'], snapshotValido()),
    ).toThrow(RevisionInvalidaException);
  });

  it('rechaza una lista de revisores vacía', () => {
    expect(() => Revision.crear('revision-1', 'pregunta-1', 1, [], snapshotValido())).toThrow(
      RevisoresInvalidosException,
    );
  });

  it('rechaza revisores duplicados', () => {
    expect(() =>
      Revision.crear(
        'revision-1',
        'pregunta-1',
        1,
        ['revisor-1', 'revisor-1'],
        snapshotValido(),
      ),
    ).toThrow(RevisoresInvalidosException);
  });

  it('rechaza un snapshot ausente', () => {
    expect(() =>
      Revision.crear(
        'revision-1',
        'pregunta-1',
        1,
        ['revisor-1'],
        null as unknown as PreguntaParaRevision,
      ),
    ).toThrow(RevisionInvalidaException);
  });

  it('copia defensivamente los revisorIds recibidos', () => {
    const revisorIds = ['revisor-1', 'revisor-2'];
    const revision = Revision.crear('revision-1', 'pregunta-1', 1, revisorIds, snapshotValido());

    revisorIds.push('revisor-3');
    const obtenidos = revision.getRevisorIds() as string[];
    obtenidos.push('revisor-4');

    expect(revision.getRevisorIds()).toEqual(['revisor-1', 'revisor-2']);
  });

  it('copia defensivamente el snapshot y sus opciones', () => {
    const snapshot = snapshotValido();
    const revision = Revision.crear('revision-1', 'pregunta-1', 1, ['revisor-1'], snapshot);

    (snapshot.opciones as { texto: string; correcta: boolean }[]).push({
      texto: 'Nueva opción',
      correcta: false,
    });
    const obtenido = revision.getPreguntaParaRevision();
    (obtenido.opciones as { texto: string; correcta: boolean }[]).push({
      texto: 'Otra opción',
      correcta: false,
    });

    expect(revision.getPreguntaParaRevision().opciones).toHaveLength(5);
  });
});

describe('Revision.reconstituir', () => {
  it('reconstituye una revisión en curso sin generar eventos', () => {
    const revision = Revision.reconstituir({
      revisionId: 'revision-1',
      preguntaId: 'pregunta-1',
      versionPregunta: 1,
      revisorIds: ['revisor-1', 'revisor-2'],
      preguntaParaRevision: snapshotValido(),
      evaluaciones: new Map(),
      resultadoFinal: null,
    });

    expect(revision.getResultadoFinal()).toBeNull();
    expect(revision.getEvaluaciones().size).toBe(0);
  });

  it('reconstituye una revisión finalizada conservando estado', () => {
    const evaluaciones = new Map<string, Evaluacion>([
      ['revisor-1', evaluacionFavorable()],
      ['revisor-2', evaluacionFavorable()],
    ]);

    const revision = Revision.reconstituir({
      revisionId: 'revision-1',
      preguntaId: 'pregunta-1',
      versionPregunta: 1,
      revisorIds: ['revisor-1', 'revisor-2'],
      preguntaParaRevision: snapshotValido(),
      evaluaciones,
      resultadoFinal: ResultadoRevision.FAVORABLE,
    });

    expect(revision.getResultadoFinal()).toBe(ResultadoRevision.FAVORABLE);
    expect(revision.getEvaluaciones().size).toBe(2);
  });

  it('rechaza una evaluación de un revisor no asignado', () => {
    const evaluaciones = new Map<string, Evaluacion>([['revisor-ajeno', evaluacionFavorable()]]);

    expect(() =>
      Revision.reconstituir({
        revisionId: 'revision-1',
        preguntaId: 'pregunta-1',
        versionPregunta: 1,
        revisorIds: ['revisor-1'],
        preguntaParaRevision: snapshotValido(),
        evaluaciones,
        resultadoFinal: null,
      }),
    ).toThrow(RevisorNoAsignadoException);
  });

  it('rechaza un resultadoFinal cuando faltan evaluaciones', () => {
    const evaluaciones = new Map<string, Evaluacion>([['revisor-1', evaluacionFavorable()]]);

    expect(() =>
      Revision.reconstituir({
        revisionId: 'revision-1',
        preguntaId: 'pregunta-1',
        versionPregunta: 1,
        revisorIds: ['revisor-1', 'revisor-2'],
        preguntaParaRevision: snapshotValido(),
        evaluaciones,
        resultadoFinal: ResultadoRevision.FAVORABLE,
      }),
    ).toThrow(RevisionInvalidaException);
  });

  it('rechaza un resultadoFinal contradictorio con las evaluaciones', () => {
    const evaluaciones = new Map<string, Evaluacion>([
      ['revisor-1', evaluacionFavorable()],
      ['revisor-2', evaluacionFavorable()],
    ]);

    expect(() =>
      Revision.reconstituir({
        revisionId: 'revision-1',
        preguntaId: 'pregunta-1',
        versionPregunta: 1,
        revisorIds: ['revisor-1', 'revisor-2'],
        preguntaParaRevision: snapshotValido(),
        evaluaciones,
        resultadoFinal: ResultadoRevision.DESFAVORABLE,
      }),
    ).toThrow(RevisionInvalidaException);
  });

  it('rechaza cuando todos evaluaron pero no hay resultadoFinal', () => {
    const evaluaciones = new Map<string, Evaluacion>([
      ['revisor-1', evaluacionFavorable()],
      ['revisor-2', evaluacionFavorable()],
    ]);

    expect(() =>
      Revision.reconstituir({
        revisionId: 'revision-1',
        preguntaId: 'pregunta-1',
        versionPregunta: 1,
        revisorIds: ['revisor-1', 'revisor-2'],
        preguntaParaRevision: snapshotValido(),
        evaluaciones,
        resultadoFinal: null,
      }),
    ).toThrow(RevisionInvalidaException);
  });
});
