package co.edu.unicauca.saberpro.pregunta.application.command;

import java.util.UUID;

public record IniciarRevisionPreguntaCommand(UUID preguntaId, int version) {
}
