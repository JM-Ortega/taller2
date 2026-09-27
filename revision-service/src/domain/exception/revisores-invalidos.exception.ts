export class RevisoresInvalidosException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RevisoresInvalidosException';
  }
}
