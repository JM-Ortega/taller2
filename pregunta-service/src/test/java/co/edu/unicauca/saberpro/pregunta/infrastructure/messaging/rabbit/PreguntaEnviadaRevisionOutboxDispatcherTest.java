package co.edu.unicauca.saberpro.pregunta.infrastructure.messaging.rabbit;

import co.edu.unicauca.saberpro.pregunta.infrastructure.persistence.jpa.outbox.OutboxEventJpaEntity;
import co.edu.unicauca.saberpro.pregunta.infrastructure.persistence.jpa.outbox.OutboxEventJpaRepository;
import tools.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.rabbit.core.RabbitTemplate;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class PreguntaEnviadaRevisionOutboxDispatcherTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    private OutboxEventJpaEntity eventoPendiente(UUID eventId, Instant occurredAt, Map<String, Object> payload) {
        return new OutboxEventJpaEntity(eventId, "PreguntaEnviadaARevision", occurredAt, payload, null);
    }

    private Map<String, Object> payloadCompleto(UUID eventId, Instant occurredAt) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("eventId", eventId.toString());
        payload.put("eventType", "PreguntaEnviadaARevision");
        payload.put("occurredAt", occurredAt.toString());
        payload.put("preguntaId", UUID.randomUUID().toString());
        payload.put("autorId", "autor-001");
        payload.put("versionPregunta", 3);
        return payload;
    }

    @Test
    void soloTomaEventosPendientesDelTipoCorrecto() {
        OutboxEventJpaRepository repository = mock(OutboxEventJpaRepository.class);
        RabbitTemplate rabbitTemplate = mock(RabbitTemplate.class);
        when(repository.findByEventTypeAndPublishedAtIsNullOrderByOccurredAtAsc("PreguntaEnviadaARevision"))
            .thenReturn(List.of());

        new PreguntaEnviadaRevisionOutboxDispatcher(repository, rabbitTemplate, objectMapper).dispatchPending();

        verify(repository).findByEventTypeAndPublishedAtIsNullOrderByOccurredAtAsc("PreguntaEnviadaARevision");
        verify(rabbitTemplate, never()).send(any(), any(), any(Message.class));
    }

    @Test
    void publicaConExchangeYRoutingKeyExactos() {
        OutboxEventJpaRepository repository = mock(OutboxEventJpaRepository.class);
        RabbitTemplate rabbitTemplate = mock(RabbitTemplate.class);
        UUID eventId = UUID.randomUUID();
        Instant occurredAt = Instant.parse("2026-01-01T00:00:00Z");
        OutboxEventJpaEntity evento = eventoPendiente(eventId, occurredAt, payloadCompleto(eventId, occurredAt));
        when(repository.findByEventTypeAndPublishedAtIsNullOrderByOccurredAtAsc("PreguntaEnviadaARevision"))
            .thenReturn(List.of(evento));

        new PreguntaEnviadaRevisionOutboxDispatcher(repository, rabbitTemplate, objectMapper).dispatchPending();

        verify(rabbitTemplate).send(eq("saberpro.events"), eq("pregunta.enviada_revision"), any(Message.class));
    }

    @Test
    void bodyJsonContieneExactamenteElPayloadPersistidoYEsPortable() throws Exception {
        OutboxEventJpaRepository repository = mock(OutboxEventJpaRepository.class);
        RabbitTemplate rabbitTemplate = mock(RabbitTemplate.class);
        UUID eventId = UUID.randomUUID();
        Instant occurredAt = Instant.parse("2026-01-01T00:00:00Z");
        Map<String, Object> payload = payloadCompleto(eventId, occurredAt);
        OutboxEventJpaEntity evento = eventoPendiente(eventId, occurredAt, payload);
        when(repository.findByEventTypeAndPublishedAtIsNullOrderByOccurredAtAsc("PreguntaEnviadaARevision"))
            .thenReturn(List.of(evento));

        new PreguntaEnviadaRevisionOutboxDispatcher(repository, rabbitTemplate, objectMapper).dispatchPending();

        org.mockito.ArgumentCaptor<Message> captor = org.mockito.ArgumentCaptor.forClass(Message.class);
        verify(rabbitTemplate).send(eq("saberpro.events"), eq("pregunta.enviada_revision"), captor.capture());

        Message mensaje = captor.getValue();
        Map<?, ?> cuerpo = objectMapper.readValue(mensaje.getBody(), Map.class);
        assertEquals(payload, cuerpo);
    }

    @Test
    void publishedAtNoNuloSoloDespuesDePublicarSatisfactoriamente() {
        OutboxEventJpaRepository repository = mock(OutboxEventJpaRepository.class);
        RabbitTemplate rabbitTemplate = mock(RabbitTemplate.class);
        UUID eventId = UUID.randomUUID();
        Instant occurredAt = Instant.parse("2026-01-01T00:00:00Z");
        OutboxEventJpaEntity evento = eventoPendiente(eventId, occurredAt, payloadCompleto(eventId, occurredAt));
        when(repository.findByEventTypeAndPublishedAtIsNullOrderByOccurredAtAsc("PreguntaEnviadaARevision"))
            .thenReturn(List.of(evento));

        new PreguntaEnviadaRevisionOutboxDispatcher(repository, rabbitTemplate, objectMapper).dispatchPending();

        assertNotNull(evento.getPublishedAt());
        verify(repository).save(evento);
    }

    @Test
    void siRabbitTemplateLanzaErrorNoMarcaPublicadoYPropagaElError() {
        OutboxEventJpaRepository repository = mock(OutboxEventJpaRepository.class);
        RabbitTemplate rabbitTemplate = mock(RabbitTemplate.class);
        UUID eventId = UUID.randomUUID();
        Instant occurredAt = Instant.parse("2026-01-01T00:00:00Z");
        OutboxEventJpaEntity evento = eventoPendiente(eventId, occurredAt, payloadCompleto(eventId, occurredAt));
        when(repository.findByEventTypeAndPublishedAtIsNullOrderByOccurredAtAsc("PreguntaEnviadaARevision"))
            .thenReturn(List.of(evento));
        doThrow(new RuntimeException("broker no disponible"))
            .when(rabbitTemplate).send(any(), any(), any(Message.class));

        PreguntaEnviadaRevisionOutboxDispatcher dispatcher =
            new PreguntaEnviadaRevisionOutboxDispatcher(repository, rabbitTemplate, objectMapper);

        assertThrows(RuntimeException.class, dispatcher::dispatchPending);

        assertNull(evento.getPublishedAt());
        verify(repository, never()).save(any());
    }

    @Test
    void noReconstruyeElPayloadNiElEventIdDesdeElDominio() throws Exception {
        OutboxEventJpaRepository repository = mock(OutboxEventJpaRepository.class);
        RabbitTemplate rabbitTemplate = mock(RabbitTemplate.class);
        UUID eventIdPersistido = UUID.randomUUID();
        Instant occurredAt = Instant.parse("2026-01-01T00:00:00Z");
        Map<String, Object> payload = payloadCompleto(eventIdPersistido, occurredAt);
        OutboxEventJpaEntity evento = eventoPendiente(eventIdPersistido, occurredAt, payload);
        when(repository.findByEventTypeAndPublishedAtIsNullOrderByOccurredAtAsc("PreguntaEnviadaARevision"))
            .thenReturn(List.of(evento));

        new PreguntaEnviadaRevisionOutboxDispatcher(repository, rabbitTemplate, objectMapper).dispatchPending();

        org.mockito.ArgumentCaptor<Message> captor = org.mockito.ArgumentCaptor.forClass(Message.class);
        verify(rabbitTemplate).send(eq("saberpro.events"), eq("pregunta.enviada_revision"), captor.capture());
        Map<?, ?> cuerpo = objectMapper.readValue(captor.getValue().getBody(), Map.class);

        assertEquals(eventIdPersistido.toString(), cuerpo.get("eventId"));
        assertEquals(payload.get("preguntaId"), cuerpo.get("preguntaId"));
    }
}
