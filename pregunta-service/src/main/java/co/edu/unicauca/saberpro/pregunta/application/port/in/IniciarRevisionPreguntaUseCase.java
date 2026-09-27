package co.edu.unicauca.saberpro.pregunta.application.port.in;

import co.edu.unicauca.saberpro.pregunta.application.command.IniciarRevisionPreguntaCommand;
import co.edu.unicauca.saberpro.pregunta.domain.model.Pregunta;

public interface IniciarRevisionPreguntaUseCase {

    Pregunta iniciarRevision(IniciarRevisionPreguntaCommand command);
}
