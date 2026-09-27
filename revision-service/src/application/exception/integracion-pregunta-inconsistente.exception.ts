export class IntegracionPreguntaInconsistenteException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'IntegracionPreguntaInconsistenteException';
  }
}
