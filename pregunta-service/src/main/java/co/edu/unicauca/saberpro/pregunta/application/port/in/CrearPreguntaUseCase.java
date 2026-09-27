package co.edu.unicauca.saberpro.pregunta.application.port.in;

import co.edu.unicauca.saberpro.pregunta.application.command.CrearPreguntaCommand;
import co.edu.unicauca.saberpro.pregunta.domain.model.Pregunta;

public interface CrearPreguntaUseCase {

    Pregunta crear(CrearPreguntaCommand command);
}
