package co.edu.unicauca.saberpro.pregunta.infrastructure.persistence.jpa.outbox;

import co.edu.unicauca.saberpro.pregunta.application.port.out.IntegrationEventPublisher;
import co.edu.unicauca.saberpro.pregunta.domain.event.PreguntaEnviadaARevision;
import jakarta.persistence.EntityManager;
import org.springframework.stereotype.Component;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

@Component
public class JpaOutboxIntegrationEventPublisher implements IntegrationEventPublisher {

    private static final String EVENT_TYPE = "PreguntaEnviadaARevision";

    private final EntityManager entityManager;

    public JpaOutboxIntegrationEventPublisher(EntityManager entityManager) {
        this.entityManager = entityManager;
    }

    @Override
    public void publish(PreguntaEnviadaARevision event) {
        UUID eventId = UUID.randomUUID();

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("eventId", eventId.toString());
        payload.put("eventType", EVENT_TYPE);
        payload.put("occurredAt", event.occurredAt().toString());
        payload.put("preguntaId", event.preguntaId().toString());
        payload.put("autorId", event.autorId());
        payload.put("versionPregunta", event.versionPregunta());

        OutboxEventJpaEntity outboxEvent = new OutboxEventJpaEntity(
            eventId,
            EVENT_TYPE,
            event.occurredAt(),
            payload,
            null
        );

        entityManager.persist(outboxEvent);
    }
}
