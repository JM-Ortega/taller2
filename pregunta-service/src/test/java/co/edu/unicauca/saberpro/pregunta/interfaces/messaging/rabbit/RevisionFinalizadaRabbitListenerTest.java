package co.edu.unicauca.saberpro.pregunta.interfaces.messaging.rabbit;

import co.edu.unicauca.saberpro.pregunta.application.exception.PreguntaNoEncontradaException;
import co.edu.unicauca.saberpro.pregunta.domain.exception.EstadoPreguntaIncompatibleException;
import co.edu.unicauca.saberpro.pregunta.domain.exception.ResultadoRevisionContradictorioException;
import co.edu.unicauca.saberpro.pregunta.domain.exception.VersionPreguntaIncompatibleException;
import com.rabbitmq.client.Channel;
import org.junit.jupiter.api.Test;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.core.MessageProperties;

import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoMoreInteractions;

class RevisionFinalizadaRabbitListenerTest {

    private Message mensaje(long deliveryTag) {
        MessageProperties properties = new MessageProperties();
        properties.setDeliveryTag(deliveryTag);
        return new Message(new byte[0], properties);
    }

    @Test
    void exitoNoHaceAckAdicionalPorqueElConsumerYaAckeoElCaminoSatisfactorio() throws Exception {
        RevisionFinalizadaConsumer consumer = mock(RevisionFinalizadaConsumer.class);
        Channel channel = mock(Channel.class);
        RevisionFinalizadaRabbitListener listener = new RevisionFinalizadaRabbitListener(consumer);
        Message mensaje = mensaje(1L);

        listener.recibir(mensaje, channel);

        verify(consumer).handle(mensaje, channel);
        verifyNoMoreInteractions(channel);
    }

    @Test
    void illegalArgumentExceptionHaceRejectSinRequeueYNoRelanza() throws Exception {
        RevisionFinalizadaConsumer consumer = mock(RevisionFinalizadaConsumer.class);
        Channel channel = mock(Channel.class);
        doThrow(new IllegalArgumentException("Published Language inválido"))
            .when(consumer).handle(any(), any());
        RevisionFinalizadaRabbitListener listener = new RevisionFinalizadaRabbitListener(consumer);

        listener.recibir(mensaje(7L), channel);

        verify(channel).basicReject(7L, false);
        verify(channel, never()).basicNack(anyLong(), anyBoolean(), anyBoolean());
    }

    @Test
    void preguntaNoEncontradaHaceRejectSinRequeue() throws Exception {
        RevisionFinalizadaConsumer consumer = mock(RevisionFinalizadaConsumer.class);
        Channel channel = mock(Channel.class);
        doThrow(new PreguntaNoEncontradaException(UUID.randomUUID()))
            .when(consumer).handle(any(), any());
        RevisionFinalizadaRabbitListener listener = new RevisionFinalizadaRabbitListener(consumer);

        listener.recibir(mensaje(3L), channel);

        verify(channel).basicReject(3L, false);
        verify(channel, never()).basicNack(anyLong(), anyBoolean(), anyBoolean());
    }

    @Test
    void estadoPreguntaIncompatibleHaceRejectSinRequeue() throws Exception {
        RevisionFinalizadaConsumer consumer = mock(RevisionFinalizadaConsumer.class);
        Channel channel = mock(Channel.class);
        doThrow(new EstadoPreguntaIncompatibleException("contradicción de resultado"))
            .when(consumer).handle(any(), any());
        RevisionFinalizadaRabbitListener listener = new RevisionFinalizadaRabbitListener(consumer);

        listener.recibir(mensaje(4L), channel);

        verify(channel).basicReject(4L, false);
        verify(channel, never()).basicNack(anyLong(), anyBoolean(), anyBoolean());
    }

    @Test
    void versionPreguntaIncompatibleHaceRejectSinRequeue() throws Exception {
        RevisionFinalizadaConsumer consumer = mock(RevisionFinalizadaConsumer.class);
        Channel channel = mock(Channel.class);
        doThrow(new VersionPreguntaIncompatibleException("versión obsoleta"))
            .when(consumer).handle(any(), any());
        RevisionFinalizadaRabbitListener listener = new RevisionFinalizadaRabbitListener(consumer);

        listener.recibir(mensaje(5L), channel);

        verify(channel).basicReject(5L, false);
        verify(channel, never()).basicNack(anyLong(), anyBoolean(), anyBoolean());
    }

    @Test
    void resultadoRevisionContradictorioHaceRejectSinRequeueYNoRelanza() throws Exception {
        RevisionFinalizadaConsumer consumer = mock(RevisionFinalizadaConsumer.class);
        Channel channel = mock(Channel.class);
        doThrow(new ResultadoRevisionContradictorioException("resultado contradictorio con el estado actual"))
            .when(consumer).handle(any(), any());
        RevisionFinalizadaRabbitListener listener = new RevisionFinalizadaRabbitListener(consumer);

        listener.recibir(mensaje(6L), channel);

        verify(channel).basicReject(6L, false);
        verify(channel, never()).basicNack(anyLong(), anyBoolean(), anyBoolean());
    }

    @Test
    void errorTecnicoGenericoHaceNackConRequeueYNoRelanza() throws Exception {
        RevisionFinalizadaConsumer consumer = mock(RevisionFinalizadaConsumer.class);
        Channel channel = mock(Channel.class);
        doThrow(new RuntimeException("base de datos temporalmente no disponible"))
            .when(consumer).handle(any(), any());
        RevisionFinalizadaRabbitListener listener = new RevisionFinalizadaRabbitListener(consumer);

        listener.recibir(mensaje(9L), channel);

        verify(channel).basicNack(9L, false, true);
        verify(channel, never()).basicReject(anyLong(), anyBoolean());
    }

    @Test
    void noHaceDobleRejectNiNackParaUnMismoMensaje() throws Exception {
        RevisionFinalizadaConsumer consumer = mock(RevisionFinalizadaConsumer.class);
        Channel channel = mock(Channel.class);
        doThrow(new IllegalArgumentException("inválido")).when(consumer).handle(any(), any());
        RevisionFinalizadaRabbitListener listener = new RevisionFinalizadaRabbitListener(consumer);

        listener.recibir(mensaje(11L), channel);

        verify(channel, org.mockito.Mockito.times(1)).basicReject(eq(11L), eq(false));
        verifyNoMoreInteractions(channel);
    }
}
