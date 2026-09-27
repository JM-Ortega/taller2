package co.edu.unicauca.saberpro.pregunta.application.service;

import co.edu.unicauca.saberpro.pregunta.application.exception.PreguntaNoEncontradaException;
import co.edu.unicauca.saberpro.pregunta.application.port.in.ObtenerPreguntaUseCase;
import co.edu.unicauca.saberpro.pregunta.domain.model.Pregunta;
import co.edu.unicauca.saberpro.pregunta.domain.repository.PreguntaRepository;

import java.util.UUID;

public class ObtenerPreguntaService implements ObtenerPreguntaUseCase {

    private final PreguntaRepository repository;

    public ObtenerPreguntaService(PreguntaRepository repository) {
        this.repository = repository;
    }

    @Override
    public Pregunta obtener(UUID preguntaId) {
        return repository.buscarPorId(preguntaId)
            .orElseThrow(() -> new PreguntaNoEncontradaException(preguntaId));
    }
}
