export type RegistrarPreguntaEnviadaRevisionCommand = Readonly<{
  preguntaId: string;
  versionPregunta: number;
  autorId: string;
}>;
