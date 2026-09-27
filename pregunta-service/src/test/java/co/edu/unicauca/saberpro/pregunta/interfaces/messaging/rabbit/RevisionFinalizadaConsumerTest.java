package co.edu.unicauca.saberpro.pregunta.interfaces.messaging.rabbit;

import co.edu.unicauca.saberpro.pregunta.application.command.ProcesarRevisionFinalizadaCommand;
import co.edu.unicauca.saberpro.pregunta.application.port.in.ProcesarRevisionFinalizadaUseCase;
import com.rabbitmq.client.Channel;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.InOrder;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.core.MessageProperties;
import tools.jackson.databind.ObjectMapper;

import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;

class RevisionFinalizadaConsumerTest {

    private static final long DELIVERY_TAG = 42L;
    private static final UUID PREGUNTA_ID = UUID.fromString("7d444840-9dc0-11d1-b245-5ffdce74fad2");

    private final ObjectMapper objectMapper = new ObjectMapper();

    private Map<String, Object> payloadValido() {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("eventId", "550e8400-e29b-41d4-a716-446655440000");
        payload.put("eventType", "RevisionFinalizada");
        payload.put("occurredAt", "2026-09-27T12:00:00Z");
        payload.put("revisionId", "04d6ea25-e7a0-4a0a-a85e-1cac79fd5c94");
        payload.put("preguntaId", PREGUNTA_ID.toString());
        payload.put("versionPregunta", 1);
        payload.put("resultado", "FAVORABLE");
        return payload;
    }

    private Message mensajeDesdePayload(Map<String, Object> payload) {
        byte[] body = objectMapper.writeValueAsBytes(payload);
        MessageProperties properties = new MessageProperties();
        properties.setDeliveryTag(DELIVERY_TAG);
        return new Message(body, properties);
    }

    private Message mensajeConTexto(String texto) {
        MessageProperties properties = new MessageProperties();
        properties.setDeliveryTag(DELIVERY_TAG);
        return new Message(texto.getBytes(StandardCharsets.UTF_8), properties);
    }

    @Test
    void mensajeFavorableValidoInvocaElUseCaseConElCommandExactoYHaceAckDespuesDeQueResuelve() throws Exception {
        ProcesarRevisionFinalizadaUseCase useCase = mock(ProcesarRevisionFinalizadaUseCase.class);
        Channel channel = mock(Channel.class);
        RevisionFinalizadaConsumer consumer = new RevisionFinalizadaConsumer(useCase, objectMapper);

        consumer.handle(mensajeDesdePayload(payloadValido()), channel);

        ArgumentCaptor<ProcesarRevisionFinalizadaCommand> captor =
            ArgumentCaptor.forClass(ProcesarRevisionFinalizadaCommand.class);
        InOrder orden = inOrder(useCase, channel);
        orden.verify(useCase).procesar(captor.capture());
        orden.verify(channel).basicAck(DELIVERY_TAG, false);

        assertEquals(PREGUNTA_ID, captor.getValue().preguntaId());
        assertEquals(1, captor.getValue().versionPregunta());
        assertEquals(ProcesarRevisionFinalizadaCommand.Resultado.FAVORABLE, captor.getValue().resultado());
    }

    @Test
    void mensajeDesfavorableValidoMapeaElResultadoExacto() throws Exception {
        ProcesarRevisionFinalizadaUseCase useCase = mock(ProcesarRevisionFinalizadaUseCase.class);
        Channel channel = mock(Channel.class);
        RevisionFinalizadaConsumer consumer = new RevisionFinalizadaConsumer(useCase, objectMapper);
        Map<String, Object> payload = payloadValido();
        payload.put("resultado", "DESFAVORABLE");

        consumer.handle(mensajeDesdePayload(payload), channel);

        ArgumentCaptor<ProcesarRevisionFinalizadaCommand> captor =
            ArgumentCaptor.forClass(ProcesarRevisionFinalizadaCommand.class);
        verify(useCase).procesar(captor.capture());
        assertEquals(ProcesarRevisionFinalizadaCommand.Resultado.DESFAVORABLE, captor.getValue().resultado());
        verify(channel).basicAck(DELIVERY_TAG, false);
    }

    @Test
    void jsonInvalidoNoInvocaElUseCaseNiHaceAckYPropagaError() {
        ProcesarRevisionFinalizadaUseCase useCase = mock(ProcesarRevisionFinalizadaUseCase.class);
        Channel channel = mock(Channel.class);
        RevisionFinalizadaConsumer consumer = new RevisionFinalizadaConsumer(useCase, objectMapper);

        assertThrows(
            IllegalArgumentException.class,
            () -> consumer.handle(mensajeConTexto("{esto no es json"), channel)
        );

        verifyNoInteractions(useCase);
        verifyNoInteractions(channel);
    }

    @Test
    void eventTypeIncorrectoNoInvocaElUseCaseNiHaceAck() {
        ProcesarRevisionFinalizadaUseCase useCase = mock(ProcesarRevisionFinalizadaUseCase.class);
        Channel channel = mock(Channel.class);
        RevisionFinalizadaConsumer consumer = new RevisionFinalizadaConsumer(useCase, objectMapper);
        Map<String, Object> payload = payloadValido();
        payload.put("eventType", "OtroEvento");

        assertThrows(
            IllegalArgumentException.class,
            () -> consumer.handle(mensajeDesdePayload(payload), channel)
        );

        verifyNoInteractions(useCase);
        verifyNoInteractions(channel);
    }

    @Test
    void eventIdUuidInvalidoNoInvocaElUseCaseNiHaceAck() {
        ProcesarRevisionFinalizadaUseCase useCase = mock(ProcesarRevisionFinalizadaUseCase.class);
        Channel channel = mock(Channel.class);
        RevisionFinalizadaConsumer consumer = new RevisionFinalizadaConsumer(useCase, objectMapper);
        Map<String, Object> payload = payloadValido();
        payload.put("eventId", "no-es-un-uuid");

        assertThrows(
            IllegalArgumentException.class,
            () -> consumer.handle(mensajeDesdePayload(payload), channel)
        );

        verifyNoInteractions(useCase);
        verifyNoInteractions(channel);
    }

    @Test
    void revisionIdUuidInvalidoNoInvocaElUseCaseNiHaceAck() {
        ProcesarRevisionFinalizadaUseCase useCase = mock(ProcesarRevisionFinalizadaUseCase.class);
        Channel channel = mock(Channel.class);
        RevisionFinalizadaConsumer consumer = new RevisionFinalizadaConsumer(useCase, objectMapper);
        Map<String, Object> payload = payloadValido();
        payload.put("revisionId", "no-es-un-uuid");

        assertThrows(
            IllegalArgumentException.class,
            () -> consumer.handle(mensajeDesdePayload(payload), channel)
        );

        verifyNoInteractions(useCase);
        verifyNoInteractions(channel);
    }

    @Test
    void preguntaIdUuidInvalidoNoInvocaElUseCaseNiHaceAck() {
        ProcesarRevisionFinalizadaUseCase useCase = mock(ProcesarRevisionFinalizadaUseCase.class);
        Channel channel = mock(Channel.class);
        RevisionFinalizadaConsumer consumer = new RevisionFinalizadaConsumer(useCase, objectMapper);
        Map<String, Object> payload = payloadValido();
        payload.put("preguntaId", "no-es-un-uuid");

        assertThrows(
            IllegalArgumentException.class,
            () -> consumer.handle(mensajeDesdePayload(payload), channel)
        );

        verifyNoInteractions(useCase);
        verifyNoInteractions(channel);
    }

    @Test
    void preguntaIdUuidNoCanonicoEsRechazadoAunqueUuidFromStringLoAceptePermisivamente() {
        ProcesarRevisionFinalizadaUseCase useCase = mock(ProcesarRevisionFinalizadaUseCase.class);
        Channel channel = mock(Channel.class);
        RevisionFinalizadaConsumer consumer = new RevisionFinalizadaConsumer(useCase, objectMapper);
        Map<String, Object> payload = payloadValido();
        payload.put("preguntaId", "1-1-1-1-1");

        assertThrows(
            IllegalArgumentException.class,
            () -> consumer.handle(mensajeDesdePayload(payload), channel)
        );

        verifyNoInteractions(useCase);
        verifyNoInteractions(channel);
    }

    @Test
    void versionPreguntaMenorAUnoNoInvocaElUseCaseNiHaceAck() {
        ProcesarRevisionFinalizadaUseCase useCase = mock(ProcesarRevisionFinalizadaUseCase.class);
        Channel channel = mock(Channel.class);
        RevisionFinalizadaConsumer consumer = new RevisionFinalizadaConsumer(useCase, objectMapper);
        Map<String, Object> payload = payloadValido();
        payload.put("versionPregunta", 0);

        assertThrows(
            IllegalArgumentException.class,
            () -> consumer.handle(mensajeDesdePayload(payload), channel)
        );

        verifyNoInteractions(useCase);
        verifyNoInteractions(channel);
    }

    @Test
    void versionPreguntaNoEnteroNoInvocaElUseCaseNiHaceAck() {
        ProcesarRevisionFinalizadaUseCase useCase = mock(ProcesarRevisionFinalizadaUseCase.class);
        Channel channel = mock(Channel.class);
        RevisionFinalizadaConsumer consumer = new RevisionFinalizadaConsumer(useCase, objectMapper);
        Map<String, Object> payload = payloadValido();
        payload.put("versionPregunta", 1.5);

        assertThrows(
            IllegalArgumentException.class,
            () -> consumer.handle(mensajeDesdePayload(payload), channel)
        );

        verifyNoInteractions(useCase);
        verifyNoInteractions(channel);
    }

    @Test
    void resultadoFueraDelEnumNoInvocaElUseCaseNiHaceAck() {
        ProcesarRevisionFinalizadaUseCase useCase = mock(ProcesarRevisionFinalizadaUseCase.class);
        Channel channel = mock(Channel.class);
        RevisionFinalizadaConsumer consumer = new RevisionFinalizadaConsumer(useCase, objectMapper);
        Map<String, Object> payload = payloadValido();
        payload.put("resultado", "PENDIENTE");

        assertThrows(
            IllegalArgumentException.class,
            () -> consumer.handle(mensajeDesdePayload(payload), channel)
        );

        verifyNoInteractions(useCase);
        verifyNoInteractions(channel);
    }

    @Test
    void occurredAtInvalidoNoInvocaElUseCaseNiHaceAck() {
        ProcesarRevisionFinalizadaUseCase useCase = mock(ProcesarRevisionFinalizadaUseCase.class);
        Channel channel = mock(Channel.class);
        RevisionFinalizadaConsumer consumer = new RevisionFinalizadaConsumer(useCase, objectMapper);
        Map<String, Object> payload = payloadValido();
        payload.put("occurredAt", "no-es-una-fecha");

        assertThrows(
            IllegalArgumentException.class,
            () -> consumer.handle(mensajeDesdePayload(payload), channel)
        );

        verifyNoInteractions(useCase);
        verifyNoInteractions(channel);
    }

    @Test
    void fechaSinHoraEsRechazada() {
        ProcesarRevisionFinalizadaUseCase useCase = mock(ProcesarRevisionFinalizadaUseCase.class);
        Channel channel = mock(Channel.class);
        RevisionFinalizadaConsumer consumer = new RevisionFinalizadaConsumer(useCase, objectMapper);
        Map<String, Object> payload = payloadValido();
        payload.put("occurredAt", "2026-09-27");

        assertThrows(
            IllegalArgumentException.class,
            () -> consumer.handle(mensajeDesdePayload(payload), channel)
        );

        verifyNoInteractions(useCase);
        verifyNoInteractions(channel);
    }

    @Test
    void dateTimeConZEsAceptado() throws Exception {
        ProcesarRevisionFinalizadaUseCase useCase = mock(ProcesarRevisionFinalizadaUseCase.class);
        Channel channel = mock(Channel.class);
        RevisionFinalizadaConsumer consumer = new RevisionFinalizadaConsumer(useCase, objectMapper);
        Map<String, Object> payload = payloadValido();
        payload.put("occurredAt", "2026-09-27T12:00:00Z");

        consumer.handle(mensajeDesdePayload(payload), channel);

        verify(useCase).procesar(any());
        verify(channel).basicAck(DELIVERY_TAG, false);
    }

    @Test
    void dateTimeConOffsetNumericoEsAceptado() throws Exception {
        ProcesarRevisionFinalizadaUseCase useCase = mock(ProcesarRevisionFinalizadaUseCase.class);
        Channel channel = mock(Channel.class);
        RevisionFinalizadaConsumer consumer = new RevisionFinalizadaConsumer(useCase, objectMapper);
        Map<String, Object> payload = payloadValido();
        payload.put("occurredAt", "2026-09-27T07:00:00-05:00");

        consumer.handle(mensajeDesdePayload(payload), channel);

        verify(useCase).procesar(any());
        verify(channel).basicAck(DELIVERY_TAG, false);
    }

    @Test
    void dateTimeConFraccionDeSegundosYZEsAceptado() throws Exception {
        ProcesarRevisionFinalizadaUseCase useCase = mock(ProcesarRevisionFinalizadaUseCase.class);
        Channel channel = mock(Channel.class);
        RevisionFinalizadaConsumer consumer = new RevisionFinalizadaConsumer(useCase, objectMapper);
        Map<String, Object> payload = payloadValido();
        payload.put("occurredAt", "2026-09-27T12:00:00.123Z");

        consumer.handle(mensajeDesdePayload(payload), channel);

        verify(useCase).procesar(any());
        verify(channel).basicAck(DELIVERY_TAG, false);
    }

    @Test
    void dateTimeSinSegundosEsRechazadoAunqueIsoOffsetDateTimeLoAcepteDeFormaMasAmplia() {
        ProcesarRevisionFinalizadaUseCase useCase = mock(ProcesarRevisionFinalizadaUseCase.class);
        Channel channel = mock(Channel.class);
        RevisionFinalizadaConsumer consumer = new RevisionFinalizadaConsumer(useCase, objectMapper);
        Map<String, Object> payload = payloadValido();
        payload.put("occurredAt", "2026-09-27T12:00Z");

        assertThrows(
            IllegalArgumentException.class,
            () -> consumer.handle(mensajeDesdePayload(payload), channel)
        );

        verifyNoInteractions(useCase);
        verifyNoInteractions(channel);
    }

    @Test
    void dateTimeConOffsetDeSegundosEsRechazadoAunqueIsoOffsetDateTimeLoAcepteDeFormaMasAmplia() {
        ProcesarRevisionFinalizadaUseCase useCase = mock(ProcesarRevisionFinalizadaUseCase.class);
        Channel channel = mock(Channel.class);
        RevisionFinalizadaConsumer consumer = new RevisionFinalizadaConsumer(useCase, objectMapper);
        Map<String, Object> payload = payloadValido();
        payload.put("occurredAt", "2026-09-27T12:00:00+05:30:15");

        assertThrows(
            IllegalArgumentException.class,
            () -> consumer.handle(mensajeDesdePayload(payload), channel)
        );

        verifyNoInteractions(useCase);
        verifyNoInteractions(channel);
    }

    @Test
    void propiedadAdicionalEsRechazadaPorAdditionalPropertiesFalse() {
        ProcesarRevisionFinalizadaUseCase useCase = mock(ProcesarRevisionFinalizadaUseCase.class);
        Channel channel = mock(Channel.class);
        RevisionFinalizadaConsumer consumer = new RevisionFinalizadaConsumer(useCase, objectMapper);
        Map<String, Object> payload = payloadValido();
        payload.put("schemaVersion", 1);

        assertThrows(
            IllegalArgumentException.class,
            () -> consumer.handle(mensajeDesdePayload(payload), channel)
        );

        verifyNoInteractions(useCase);
        verifyNoInteractions(channel);
    }

    @Test
    void siElUseCaseFallaNoHaceAckYPropagaElMismoError() throws Exception {
        ProcesarRevisionFinalizadaUseCase useCase = mock(ProcesarRevisionFinalizadaUseCase.class);
        Channel channel = mock(Channel.class);
        RuntimeException errorUseCase = new RuntimeException("fallo de dominio");
        doThrow(errorUseCase).when(useCase).procesar(any());
        RevisionFinalizadaConsumer consumer = new RevisionFinalizadaConsumer(useCase, objectMapper);

        RuntimeException lanzado = assertThrows(
            RuntimeException.class,
            () -> consumer.handle(mensajeDesdePayload(payloadValido()), channel)
        );

        assertEquals(errorUseCase, lanzado);
        verify(channel, never()).basicAck(anyLong(), anyBoolean());
    }

    @Test
    void deliveryExitosoOderNoOpCompatibleSiempreAckeaSinConocerElEstadoDelAggregate() throws Exception {
        ProcesarRevisionFinalizadaUseCase useCase = mock(ProcesarRevisionFinalizadaUseCase.class);
        Channel channel = mock(Channel.class);
        RevisionFinalizadaConsumer consumer = new RevisionFinalizadaConsumer(useCase, objectMapper);

        consumer.handle(mensajeDesdePayload(payloadValido()), channel);
        consumer.handle(mensajeDesdePayload(payloadValido()), channel);

        verify(useCase, times(2)).procesar(any());
        verify(channel, times(2)).basicAck(DELIVERY_TAG, false);
    }
}
