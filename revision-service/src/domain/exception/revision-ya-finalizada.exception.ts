export class RevisionYaFinalizadaException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RevisionYaFinalizadaException';
  }
}
