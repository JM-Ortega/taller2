package co.edu.unicauca.saberpro.pregunta.application.service;

import co.edu.unicauca.saberpro.pregunta.application.command.ActualizarPreguntaCommand;
import co.edu.unicauca.saberpro.pregunta.application.exception.PreguntaNoEncontradaException;
import co.edu.unicauca.saberpro.pregunta.application.port.in.ActualizarPreguntaUseCase;
import co.edu.unicauca.saberpro.pregunta.domain.model.Competencia;
import co.edu.unicauca.saberpro.pregunta.domain.model.NivelDificultad;
import co.edu.unicauca.saberpro.pregunta.domain.model.Pregunta;
import co.edu.unicauca.saberpro.pregunta.domain.model.Subtema;
import co.edu.unicauca.saberpro.pregunta.domain.model.Tema;
import co.edu.unicauca.saberpro.pregunta.domain.repository.PreguntaRepository;

public class ActualizarPreguntaService implements ActualizarPreguntaUseCase {

    private final PreguntaRepository repository;

    public ActualizarPreguntaService(PreguntaRepository repository) {
        this.repository = repository;
    }

    @Override
    public Pregunta actualizar(ActualizarPreguntaCommand command) {
        Pregunta pregunta = repository.buscarPorId(command.preguntaId())
            .orElseThrow(() -> new PreguntaNoEncontradaException(command.preguntaId()));
        pregunta.actualizar(
            command.contexto(),
            command.preguntaDirecta(),
            command.opciones(),
            command.justificacion(),
            command.bibliografia(),
            new Competencia(command.competencia()),
            new Tema(command.tema()),
            new Subtema(command.subtema()),
            new NivelDificultad(command.nivelDificultad())
        );
        repository.guardar(pregunta);
        return pregunta;
    }
}
