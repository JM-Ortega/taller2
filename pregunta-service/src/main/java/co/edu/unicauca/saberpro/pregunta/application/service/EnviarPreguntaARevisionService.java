package co.edu.unicauca.saberpro.pregunta.application.service;

import co.edu.unicauca.saberpro.pregunta.application.exception.PreguntaNoEncontradaException;
import co.edu.unicauca.saberpro.pregunta.application.port.in.EnviarPreguntaARevisionUseCase;
import co.edu.unicauca.saberpro.pregunta.application.port.out.IntegrationEventPublisher;
import co.edu.unicauca.saberpro.pregunta.domain.event.PreguntaEnviadaARevision;
import co.edu.unicauca.saberpro.pregunta.domain.model.Pregunta;
import co.edu.unicauca.saberpro.pregunta.domain.repository.PreguntaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
public class EnviarPreguntaARevisionService implements EnviarPreguntaARevisionUseCase {

    private final PreguntaRepository repository;
    private final IntegrationEventPublisher publisher;

    public EnviarPreguntaARevisionService(PreguntaRepository repository, IntegrationEventPublisher publisher) {
        this.repository = repository;
        this.publisher = publisher;
    }

    @Override
    @Transactional
    public Pregunta enviarARevision(UUID preguntaId) {
        Pregunta pregunta = repository.buscarPorId(preguntaId)
            .orElseThrow(() -> new PreguntaNoEncontradaException(preguntaId));
        PreguntaEnviadaARevision evento = pregunta.enviarARevision(Instant.now());
        repository.guardar(pregunta);
        publisher.publish(evento);
        return pregunta;
    }
}
