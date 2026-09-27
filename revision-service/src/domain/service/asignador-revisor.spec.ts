import { AutorIncluidoComoRevisorException } from '../exception/autor-incluido-como-revisor.exception';
import { AsignadorRevisor } from './asignador-revisor';

describe('AsignadorRevisor', () => {
  it('permite la asignación cuando el autor no está entre los revisores', () => {
    const asignador = new AsignadorRevisor();

    expect(() =>
      asignador.validarRevisionPorPares('autor-1', ['revisor-1', 'revisor-2']),
    ).not.toThrow();
  });

  it('rechaza la asignación cuando el autor está entre los revisores', () => {
    const asignador = new AsignadorRevisor();

    expect(() =>
      asignador.validarRevisionPorPares('autor-1', ['revisor-1', 'autor-1']),
    ).toThrow(AutorIncluidoComoRevisorException);
  });
});
