export class PreguntaRevisionSolicitadaInconsistenteException extends Error {
  constructor(
    preguntaId: string,
    versionPregunta: number,
    autorRegistrado: string,
    autorRecibido: string,
  ) {
    super(
      `la pregunta ${preguntaId} versión ${versionPregunta} ya fue solicitada a revisión por ` +
        `el autor ${autorRegistrado}, no por ${autorRecibido}`,
    );
    this.name = 'PreguntaRevisionSolicitadaInconsistenteException';
  }
}
