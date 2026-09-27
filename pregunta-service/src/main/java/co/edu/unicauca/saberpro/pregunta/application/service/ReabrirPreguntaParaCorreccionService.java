package co.edu.unicauca.saberpro.pregunta.application.service;

import co.edu.unicauca.saberpro.pregunta.application.exception.PreguntaNoEncontradaException;
import co.edu.unicauca.saberpro.pregunta.application.port.in.ReabrirPreguntaParaCorreccionUseCase;
import co.edu.unicauca.saberpro.pregunta.domain.model.Pregunta;
import co.edu.unicauca.saberpro.pregunta.domain.repository.PreguntaRepository;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class ReabrirPreguntaParaCorreccionService implements ReabrirPreguntaParaCorreccionUseCase {

    private final PreguntaRepository repository;

    public ReabrirPreguntaParaCorreccionService(PreguntaRepository repository) {
        this.repository = repository;
    }

    @Override
    public Pregunta reabrir(UUID preguntaId) {
        Pregunta pregunta = repository.buscarPorId(preguntaId)
            .orElseThrow(() -> new PreguntaNoEncontradaException(preguntaId));
        pregunta.reabrirParaCorreccion();
        repository.guardar(pregunta);
        return pregunta;
    }
}
