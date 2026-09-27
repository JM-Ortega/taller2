package co.edu.unicauca.saberpro.pregunta.application.port.in;

import co.edu.unicauca.saberpro.pregunta.application.command.ActualizarPreguntaCommand;
import co.edu.unicauca.saberpro.pregunta.domain.model.Pregunta;

public interface ActualizarPreguntaUseCase {

    Pregunta actualizar(ActualizarPreguntaCommand command);
}
