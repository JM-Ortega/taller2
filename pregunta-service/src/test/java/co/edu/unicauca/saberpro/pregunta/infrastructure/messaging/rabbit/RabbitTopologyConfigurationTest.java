package co.edu.unicauca.saberpro.pregunta.infrastructure.messaging.rabbit;

import org.junit.jupiter.api.Test;
import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class RabbitTopologyConfigurationTest {

    private final RabbitTopologyConfiguration configuracion = new RabbitTopologyConfiguration();

    @Test
    void declaraElExchangeTopicDurableEsperado() {
        TopicExchange exchange = configuracion.saberProEventsExchange();

        assertEquals("saberpro.events", exchange.getName());
        assertEquals("topic", exchange.getType());
        assertTrue(exchange.isDurable());
        assertFalse(exchange.isAutoDelete());
    }

    @Test
    void declaraLaQueuePropiaDurableNoExclusivaNoAutoDelete() {
        Queue queue = configuracion.revisionFinalizadaQueue();

        assertEquals("pregunta.revision-finalizada.queue", queue.getName());
        assertTrue(queue.isDurable());
        assertFalse(queue.isExclusive());
        assertFalse(queue.isAutoDelete());
    }

    @Test
    void noDeclaraLaQueueDelOtroConsumidor() {
        Queue queue = configuracion.revisionFinalizadaQueue();

        assertFalse(queue.getName().contains("pregunta-enviada"));
    }

    @Test
    void enlazaLaQueueAlExchangeConLaRoutingKeyExacta() {
        TopicExchange exchange = configuracion.saberProEventsExchange();
        Queue queue = configuracion.revisionFinalizadaQueue();

        Binding binding = configuracion.revisionFinalizadaBinding(exchange, queue);

        assertEquals("saberpro.events", binding.getExchange());
        assertEquals("pregunta.revision-finalizada.queue", binding.getDestination());
        assertEquals("revision.finalizada", binding.getRoutingKey());
        assertEquals(Binding.DestinationType.QUEUE, binding.getDestinationType());
    }
}
