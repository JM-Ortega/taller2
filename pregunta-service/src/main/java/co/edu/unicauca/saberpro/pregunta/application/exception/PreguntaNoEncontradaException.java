package co.edu.unicauca.saberpro.pregunta.application.exception;

import java.util.UUID;

public class PreguntaNoEncontradaException extends RuntimeException {

    public PreguntaNoEncontradaException(UUID preguntaId) {
        super("no existe una pregunta con id " + preguntaId);
    }
}
