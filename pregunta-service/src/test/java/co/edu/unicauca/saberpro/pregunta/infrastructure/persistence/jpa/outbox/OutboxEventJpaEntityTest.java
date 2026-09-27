package co.edu.unicauca.saberpro.pregunta.infrastructure.persistence.jpa.outbox;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Field;
import java.time.Instant;
import java.util.Arrays;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class OutboxEventJpaEntityTest {

    @Test
    void esUnaEntidadJpaMapeadaATablaOutboxEvent() {
        assertTrue(OutboxEventJpaEntity.class.isAnnotationPresent(Entity.class));
        Table tabla = OutboxEventJpaEntity.class.getAnnotation(Table.class);
        assertEquals("outbox_event", tabla.name());
    }

    @Test
    void eventIdEsIdUuid() throws NoSuchFieldException {
        Field campo = OutboxEventJpaEntity.class.getDeclaredField("eventId");
        assertTrue(campo.isAnnotationPresent(Id.class));
        assertEquals(UUID.class, campo.getType());
    }

    @Test
    void eventTypeEsVarcharNotNull() throws NoSuchFieldException {
        Field campo = OutboxEventJpaEntity.class.getDeclaredField("eventType");
        Column columna = campo.getAnnotation(Column.class);
        assertEquals("event_type", columna.name());
        assertEquals("varchar", columna.columnDefinition());
        assertFalse(columna.nullable());
        assertEquals(String.class, campo.getType());
    }

    @Test
    void occurredAtEsTimestamptzNotNull() throws NoSuchFieldException {
        Field campo = OutboxEventJpaEntity.class.getDeclaredField("occurredAt");
        Column columna = campo.getAnnotation(Column.class);
        assertEquals("occurred_at", columna.name());
        assertEquals("timestamptz", columna.columnDefinition());
        assertFalse(columna.nullable());
        assertEquals(Instant.class, campo.getType());
    }

    @Test
    void payloadEsJsonbNotNullConTipoJdbcJson() throws NoSuchFieldException {
        Field campo = OutboxEventJpaEntity.class.getDeclaredField("payload");
        Column columna = campo.getAnnotation(Column.class);
        assertEquals("payload", columna.name());
        assertEquals("jsonb", columna.columnDefinition());
        assertFalse(columna.nullable());
        assertEquals(Map.class, campo.getType());

        JdbcTypeCode tipoJdbc = campo.getAnnotation(JdbcTypeCode.class);
        assertEquals(SqlTypes.JSON, tipoJdbc.value());
    }

    @Test
    void publishedAtEsTimestamptzNullable() throws NoSuchFieldException {
        Field campo = OutboxEventJpaEntity.class.getDeclaredField("publishedAt");
        Column columna = campo.getAnnotation(Column.class);
        assertEquals("published_at", columna.name());
        assertEquals("timestamptz", columna.columnDefinition());
        assertTrue(columna.nullable());
        assertEquals(Instant.class, campo.getType());
    }

    @Test
    void declaraExactamenteCincoPropiedadesPersistentes() {
        Set<String> propiedades = Arrays.stream(OutboxEventJpaEntity.class.getDeclaredFields())
            .map(Field::getName)
            .collect(Collectors.toSet());

        assertEquals(
            Set.of("eventId", "eventType", "occurredAt", "payload", "publishedAt"),
            propiedades
        );
    }
}
