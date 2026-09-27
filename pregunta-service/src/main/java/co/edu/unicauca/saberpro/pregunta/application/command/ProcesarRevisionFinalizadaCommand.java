package co.edu.unicauca.saberpro.pregunta.application.command;

import java.util.UUID;

public record ProcesarRevisionFinalizadaCommand(
    UUID preguntaId,
    int versionPregunta,
    Resultado resultado
) {
    public enum Resultado {
        FAVORABLE,
        DESFAVORABLE
    }
}
