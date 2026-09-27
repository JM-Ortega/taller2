export class RevisorYaEvaluoException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RevisorYaEvaluoException';
  }
}
