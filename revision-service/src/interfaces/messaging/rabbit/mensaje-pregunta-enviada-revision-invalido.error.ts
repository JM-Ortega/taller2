export class MensajePreguntaEnviadaRevisionInvalidoError extends Error {
  constructor(mensaje: string) {
    super(mensaje);
    this.name = 'MensajePreguntaEnviadaRevisionInvalidoError';
  }
}
