export class RevisionInvalidaException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RevisionInvalidaException';
  }
}
