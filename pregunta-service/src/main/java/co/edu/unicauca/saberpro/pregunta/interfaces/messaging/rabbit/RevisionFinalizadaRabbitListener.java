package co.edu.unicauca.saberpro.pregunta.interfaces.messaging.rabbit;

import co.edu.unicauca.saberpro.pregunta.application.exception.PreguntaNoEncontradaException;
import co.edu.unicauca.saberpro.pregunta.domain.exception.EstadoPreguntaIncompatibleException;
import co.edu.unicauca.saberpro.pregunta.domain.exception.ResultadoRevisionContradictorioException;
import co.edu.unicauca.saberpro.pregunta.domain.exception.VersionPreguntaIncompatibleException;
import co.edu.unicauca.saberpro.pregunta.infrastructure.messaging.rabbit.RabbitTopologyConfiguration;
import com.rabbitmq.client.Channel;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
public class RevisionFinalizadaRabbitListener {

    private static final Logger LOG = LoggerFactory.getLogger(RevisionFinalizadaRabbitListener.class);

    private final RevisionFinalizadaConsumer consumer;

    public RevisionFinalizadaRabbitListener(RevisionFinalizadaConsumer consumer) {
        this.consumer = consumer;
    }

    @RabbitListener(queues = RabbitTopologyConfiguration.QUEUE, ackMode = "MANUAL")
    public void recibir(Message mensaje, Channel channel) throws IOException {
        long deliveryTag = mensaje.getMessageProperties().getDeliveryTag();
        try {
            consumer.handle(mensaje, channel);
        } catch (IllegalArgumentException
                 | PreguntaNoEncontradaException
                 | EstadoPreguntaIncompatibleException
                 | VersionPreguntaIncompatibleException
                 | ResultadoRevisionContradictorioException ex) {
            LOG.warn("mensaje RevisionFinalizada permanentemente inválido, se descarta sin requeue", ex);
            channel.basicReject(deliveryTag, false);
        } catch (Exception ex) {
            LOG.error("fallo técnico procesando RevisionFinalizada, se reintentará con requeue", ex);
            channel.basicNack(deliveryTag, false, true);
        }
    }
}
