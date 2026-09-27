package co.edu.unicauca.saberpro.pregunta.application.service;

import co.edu.unicauca.saberpro.pregunta.application.command.ProcesarRevisionFinalizadaCommand;
import co.edu.unicauca.saberpro.pregunta.application.exception.PreguntaNoEncontradaException;
import co.edu.unicauca.saberpro.pregunta.application.port.in.ProcesarRevisionFinalizadaUseCase;
import co.edu.unicauca.saberpro.pregunta.domain.model.Pregunta;
import co.edu.unicauca.saberpro.pregunta.domain.repository.PreguntaRepository;
import org.springframework.stereotype.Service;

@Service
public class ProcesarRevisionFinalizadaService implements ProcesarRevisionFinalizadaUseCase {

    private final PreguntaRepository repository;

    public ProcesarRevisionFinalizadaService(PreguntaRepository repository) {
        this.repository = repository;
    }

    @Override
    public void procesar(ProcesarRevisionFinalizadaCommand command) {
        Pregunta pregunta = repository.buscarPorId(command.preguntaId())
            .orElseThrow(() -> new PreguntaNoEncontradaException(command.preguntaId()));
        boolean cambio = switch (command.resultado()) {
            case FAVORABLE -> pregunta.aprobarTrasRevision(command.versionPregunta());
            case DESFAVORABLE -> pregunta.rechazarTrasRevision(command.versionPregunta());
        };
        if (cambio) {
            repository.guardar(pregunta);
        }
    }
}
