package co.edu.unicauca.saberpro.pregunta.application.port.in;

import co.edu.unicauca.saberpro.pregunta.application.command.ProcesarRevisionFinalizadaCommand;

public interface ProcesarRevisionFinalizadaUseCase {

    void procesar(ProcesarRevisionFinalizadaCommand command);
}
