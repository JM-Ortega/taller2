export class PreguntaNoDisponibleParaRevisionException extends Error {
  constructor(preguntaId: string) {
    super(`la pregunta ${preguntaId} no está disponible para revisión`);
    this.name = 'PreguntaNoDisponibleParaRevisionException';
  }
}
