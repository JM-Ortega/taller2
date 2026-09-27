package co.edu.unicauca.saberpro.pregunta.application.port.in;

import co.edu.unicauca.saberpro.pregunta.domain.model.Pregunta;

import java.util.UUID;

public interface ObtenerPreguntaUseCase {

    Pregunta obtener(UUID preguntaId);
}
