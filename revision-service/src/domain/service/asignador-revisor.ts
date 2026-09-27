import { AutorIncluidoComoRevisorException } from '../exception/autor-incluido-como-revisor.exception';

export class AsignadorRevisor {
  validarRevisionPorPares(autorId: string, revisorIds: readonly string[]): void {
    if (revisorIds.includes(autorId)) {
      throw new AutorIncluidoComoRevisorException(
        `el autor ${autorId} no puede ser revisor de su propia pregunta`,
      );
    }
  }
}
