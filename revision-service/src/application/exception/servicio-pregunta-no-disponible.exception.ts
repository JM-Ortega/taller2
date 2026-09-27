export class ServicioPreguntaNoDisponibleException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ServicioPreguntaNoDisponibleException';
  }
}
