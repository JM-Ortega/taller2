package co.edu.unicauca.saberpro.pregunta.application.service;

import co.edu.unicauca.saberpro.pregunta.application.command.IniciarRevisionPreguntaCommand;
import co.edu.unicauca.saberpro.pregunta.application.exception.PreguntaNoEncontradaException;
import co.edu.unicauca.saberpro.pregunta.application.port.in.IniciarRevisionPreguntaUseCase;
import co.edu.unicauca.saberpro.pregunta.domain.model.Pregunta;
import co.edu.unicauca.saberpro.pregunta.domain.repository.PreguntaRepository;

public class IniciarRevisionPreguntaService implements IniciarRevisionPreguntaUseCase {

    private final PreguntaRepository repository;

    public IniciarRevisionPreguntaService(PreguntaRepository repository) {
        this.repository = repository;
    }

    @Override
    public Pregunta iniciarRevision(IniciarRevisionPreguntaCommand command) {
        Pregunta pregunta = repository.buscarPorId(command.preguntaId())
            .orElseThrow(() -> new PreguntaNoEncontradaException(command.preguntaId()));
        boolean cambio = pregunta.iniciarRevision(command.version());
        if (cambio) {
            repository.guardar(pregunta);
        }
        return pregunta;
    }
}
