package co.edu.unicauca.saberpro.pregunta.infrastructure.messaging.rabbit;

import co.edu.unicauca.saberpro.pregunta.infrastructure.persistence.jpa.outbox.OutboxEventJpaEntity;
import co.edu.unicauca.saberpro.pregunta.infrastructure.persistence.jpa.outbox.OutboxEventJpaRepository;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.core.MessageProperties;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;
import tools.jackson.databind.ObjectMapper;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.List;

@Component
public class PreguntaEnviadaRevisionOutboxDispatcher {

    static final String EVENT_TYPE = "PreguntaEnviadaARevision";
    static final String EXCHANGE = "saberpro.events";
    static final String ROUTING_KEY = "pregunta.enviada_revision";

    private final OutboxEventJpaRepository outboxEventRepository;
    private final RabbitTemplate rabbitTemplate;
    private final ObjectMapper objectMapper;

    public PreguntaEnviadaRevisionOutboxDispatcher(
        OutboxEventJpaRepository outboxEventRepository,
        RabbitTemplate rabbitTemplate,
        ObjectMapper objectMapper
    ) {
        this.outboxEventRepository = outboxEventRepository;
        this.rabbitTemplate = rabbitTemplate;
        this.objectMapper = objectMapper;
    }

    public void dispatchPending() {
        List<OutboxEventJpaEntity> pendientes =
            outboxEventRepository.findByEventTypeAndPublishedAtIsNullOrderByOccurredAtAsc(EVENT_TYPE);

        for (OutboxEventJpaEntity evento : pendientes) {
            rabbitTemplate.send(EXCHANGE, ROUTING_KEY, construirMensaje(evento));

            // publishedAt solo se marca tras el envío exitoso: si falla el guardado
            // posterior el evento sigue elegible para reintento (at-least-once),
            // lo cual es aceptable porque el consumidor es idempotente.
            evento.marcarPublicado(Instant.now());
            outboxEventRepository.save(evento);
        }
    }

    private Message construirMensaje(OutboxEventJpaEntity evento) {
        byte[] body = objectMapper.writeValueAsBytes(evento.getPayload());

        MessageProperties properties = new MessageProperties();
        properties.setContentType("application/json");
        properties.setContentEncoding(StandardCharsets.UTF_8.name());
        return new Message(body, properties);
    }
}
