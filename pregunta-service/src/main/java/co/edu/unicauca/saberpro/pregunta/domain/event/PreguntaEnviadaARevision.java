package co.edu.unicauca.saberpro.pregunta.domain.event;

import java.time.Instant;
import java.util.UUID;

public record PreguntaEnviadaARevision(
    UUID preguntaId,
    String autorId,
    int versionPregunta,
    Instant occurredAt
) {
}
