package co.edu.unicauca.saberpro.pregunta.application.service;

import co.edu.unicauca.saberpro.pregunta.application.command.CrearPreguntaCommand;
import co.edu.unicauca.saberpro.pregunta.application.port.in.CrearPreguntaUseCase;
import co.edu.unicauca.saberpro.pregunta.domain.model.Competencia;
import co.edu.unicauca.saberpro.pregunta.domain.model.NivelDificultad;
import co.edu.unicauca.saberpro.pregunta.domain.model.Pregunta;
import co.edu.unicauca.saberpro.pregunta.domain.model.Subtema;
import co.edu.unicauca.saberpro.pregunta.domain.model.Tema;
import co.edu.unicauca.saberpro.pregunta.domain.repository.PreguntaRepository;

import java.util.UUID;

public class CrearPreguntaService implements CrearPreguntaUseCase {

    private final PreguntaRepository repository;

    public CrearPreguntaService(PreguntaRepository repository) {
        this.repository = repository;
    }

    @Override
    public Pregunta crear(CrearPreguntaCommand command) {
        Pregunta pregunta = Pregunta.crear(
            UUID.randomUUID(),
            command.autorId(),
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
