export class RevisionNoEncontradaException extends Error {
  constructor(revisionId: string) {
    super(`no existe una revisión con id ${revisionId}`);
    this.name = 'RevisionNoEncontradaException';
  }
}
