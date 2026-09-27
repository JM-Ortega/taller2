package co.edu.unicauca.saberpro.pregunta.infrastructure.persistence.jpa.outbox;

import co.edu.unicauca.saberpro.pregunta.domain.event.PreguntaEnviadaARevision;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.time.Instant;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

class JpaOutboxIntegrationEventPublisherTest {

    @Test
    void publicaExactamenteUnaVezConEventIdYEventTypeCompartidosConElPayload() {
        EntityManager entityManager = mock(EntityManager.class);
        JpaOutboxIntegrationEventPublisher publisher = new JpaOutboxIntegrationEventPublisher(entityManager);
        Instant occurredAt = Instant.parse("2026-01-01T00:00:00Z");
        PreguntaEnviadaARevision evento = new PreguntaEnviadaARevision(
            UUID.randomUUID(), "autor-1", 2, occurredAt
        );

        publisher.publish(evento);

        ArgumentCaptor<OutboxEventJpaEntity> captor = ArgumentCaptor.forClass(OutboxEventJpaEntity.class);
        verify(entityManager).persist(captor.capture());
        OutboxEventJpaEntity guardado = captor.getValue();

        assertNotNull(guardado.getEventId());
        assertEquals("PreguntaEnviadaARevision", guardado.getEventType());
        assertEquals(occurredAt, guardado.getOccurredAt());
        assertNull(guardado.getPublishedAt());

        Map<String, Object> payload = guardado.getPayload();
        assertEquals(guardado.getEventId().toString(), payload.get("eventId"));
        assertEquals("PreguntaEnviadaARevision", payload.get("eventType"));
        assertEquals(occurredAt.toString(), payload.get("occurredAt"));
        assertEquals(evento.preguntaId().toString(), payload.get("preguntaId"));
        assertEquals("autor-1", payload.get("autorId"));
        assertEquals(2, payload.get("versionPregunta"));

        assertEquals(
            Set.of("eventId", "eventType", "occurredAt", "preguntaId", "autorId", "versionPregunta"),
            payload.keySet()
        );
    }
}
