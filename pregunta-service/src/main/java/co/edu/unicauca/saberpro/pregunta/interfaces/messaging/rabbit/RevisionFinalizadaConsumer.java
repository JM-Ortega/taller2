package co.edu.unicauca.saberpro.pregunta.interfaces.messaging.rabbit;

import co.edu.unicauca.saberpro.pregunta.application.command.ProcesarRevisionFinalizadaCommand;
import co.edu.unicauca.saberpro.pregunta.application.port.in.ProcesarRevisionFinalizadaUseCase;
import com.rabbitmq.client.Channel;
import org.springframework.amqp.core.Message;
import org.springframework.stereotype.Component;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Pattern;

@Component
public class RevisionFinalizadaConsumer {

    private static final String EVENT_TYPE = "RevisionFinalizada";
    private static final Set<String> CAMPOS_PERMITIDOS = Set.of(
        "eventId", "eventType", "occurredAt", "revisionId", "preguntaId", "versionPregunta", "resultado"
    );
    private static final Pattern OCCURRED_AT_PATTERN = Pattern.compile(
        "^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(\\.\\d+)?(Z|[+-]\\d{2}:\\d{2})$"
    );

    private final ProcesarRevisionFinalizadaUseCase useCase;
    private final ObjectMapper objectMapper;

    public RevisionFinalizadaConsumer(ProcesarRevisionFinalizadaUseCase useCase, ObjectMapper objectMapper) {
        this.useCase = useCase;
        this.objectMapper = objectMapper;
    }

    public void handle(Message mensaje, Channel channel) throws IOException {
        JsonNode nodo;
        try {
            nodo = objectMapper.readTree(mensaje.getBody());
        } catch (JacksonException ex) {
            throw new IllegalArgumentException(
                "mensaje Rabbit con JSON inválido para RevisionFinalizada", ex
            );
        }

        ProcesarRevisionFinalizadaCommand command = validarYMapear(nodo);

        useCase.procesar(command);

        // ACK después del Use Case: evita perder el evento si falla el efecto local.
        channel.basicAck(mensaje.getMessageProperties().getDeliveryTag(), false);
    }

    private ProcesarRevisionFinalizadaCommand validarYMapear(JsonNode nodo) {
        if (nodo == null || !nodo.isObject()) {
            throw new IllegalArgumentException("mensaje Rabbit no es un objeto JSON válido");
        }
        for (String propiedad : nodo.propertyNames()) {
            if (!CAMPOS_PERMITIDOS.contains(propiedad)) {
                throw new IllegalArgumentException(
                    "mensaje Rabbit contiene una propiedad no permitida: " + propiedad
                );
            }
        }

        validarUuid(nodo, "eventId");
        validarEventType(nodo);
        validarOccurredAt(nodo);
        validarUuid(nodo, "revisionId");
        UUID preguntaId = validarUuid(nodo, "preguntaId");
        int versionPregunta = validarVersion(nodo);
        ProcesarRevisionFinalizadaCommand.Resultado resultado = validarResultado(nodo);

        return new ProcesarRevisionFinalizadaCommand(preguntaId, versionPregunta, resultado);
    }

    private JsonNode requerirCampo(JsonNode nodo, String campo) {
        JsonNode valor = nodo.get(campo);
        if (valor == null || valor.isMissingNode() || valor.isNull()) {
            throw new IllegalArgumentException("falta el campo requerido: " + campo);
        }
        return valor;
    }

    private UUID validarUuid(JsonNode nodo, String campo) {
        JsonNode valor = requerirCampo(nodo, campo);
        if (!valor.isTextual()) {
            throw new IllegalArgumentException(campo + " debe ser un string UUID");
        }
        String texto = valor.asText();
        UUID uuid;
        try {
            uuid = UUID.fromString(texto);
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException(campo + " debe ser un UUID válido", ex);
        }
        if (!uuid.toString().equalsIgnoreCase(texto)) {
            throw new IllegalArgumentException(campo + " debe ser un UUID en forma canónica");
        }
        return uuid;
    }

    private void validarEventType(JsonNode nodo) {
        JsonNode valor = requerirCampo(nodo, "eventType");
        if (!valor.isTextual() || !EVENT_TYPE.equals(valor.asText())) {
            throw new IllegalArgumentException("eventType debe ser exactamente " + EVENT_TYPE);
        }
    }

    private void validarOccurredAt(JsonNode nodo) {
        JsonNode valor = requerirCampo(nodo, "occurredAt");
        if (!valor.isTextual()) {
            throw new IllegalArgumentException("occurredAt debe ser un string date-time");
        }
        String texto = valor.asText();
        if (!OCCURRED_AT_PATTERN.matcher(texto).matches()) {
            throw new IllegalArgumentException("occurredAt debe tener el formato date-time RFC3339 esperado");
        }
        try {
            OffsetDateTime.parse(texto, DateTimeFormatter.ISO_OFFSET_DATE_TIME);
        } catch (DateTimeParseException ex) {
            throw new IllegalArgumentException("occurredAt debe ser un date-time RFC3339 válido", ex);
        }
    }

    private int validarVersion(JsonNode nodo) {
        JsonNode valor = requerirCampo(nodo, "versionPregunta");
        if (!valor.isInt() || valor.asInt() < 1) {
            throw new IllegalArgumentException("versionPregunta debe ser un entero >= 1");
        }
        return valor.asInt();
    }

    private ProcesarRevisionFinalizadaCommand.Resultado validarResultado(JsonNode nodo) {
        JsonNode valor = requerirCampo(nodo, "resultado");
        if (!valor.isTextual()) {
            throw new IllegalArgumentException("resultado debe ser un string");
        }
        try {
            return ProcesarRevisionFinalizadaCommand.Resultado.valueOf(valor.asText());
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("resultado debe ser FAVORABLE o DESFAVORABLE", ex);
        }
    }
}
