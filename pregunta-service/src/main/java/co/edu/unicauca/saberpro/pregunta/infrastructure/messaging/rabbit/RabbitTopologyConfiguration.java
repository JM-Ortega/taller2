package co.edu.unicauca.saberpro.pregunta.infrastructure.messaging.rabbit;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitTopologyConfiguration {

    public static final String EXCHANGE = "saberpro.events";
    public static final String QUEUE = "pregunta.revision-finalizada.queue";
    public static final String ROUTING_KEY = "revision.finalizada";

    @Bean
    TopicExchange saberProEventsExchange() {
        return new TopicExchange(EXCHANGE, true, false);
    }

    @Bean
    Queue revisionFinalizadaQueue() {
        return new Queue(QUEUE, true, false, false);
    }

    @Bean
    Binding revisionFinalizadaBinding(TopicExchange saberProEventsExchange, Queue revisionFinalizadaQueue) {
        return BindingBuilder.bind(revisionFinalizadaQueue).to(saberProEventsExchange).with(ROUTING_KEY);
    }
}
