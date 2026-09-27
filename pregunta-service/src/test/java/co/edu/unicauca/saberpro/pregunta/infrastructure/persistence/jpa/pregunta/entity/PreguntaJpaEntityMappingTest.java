package co.edu.unicauca.saberpro.pregunta.infrastructure.persistence.jpa.pregunta.entity;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OrderColumn;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Field;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;

class PreguntaJpaEntityMappingTest {

    private static final List<String> CAMPOS_TEXTO = List.of(
        "autorId", "contexto", "preguntaDirecta", "justificacion",
        "bibliografia", "competencia", "tema", "subtema", "nivelDificultad"
    );

    @Test
    void camposDeTextoLibreUsanColumnDefinitionText() throws NoSuchFieldException {
        for (String nombreCampo : CAMPOS_TEXTO) {
            Field campo = PreguntaJpaEntity.class.getDeclaredField(nombreCampo);
            Column columna = campo.getAnnotation(Column.class);
            assertEquals("text", columna.columnDefinition(), "campo " + nombreCampo);
        }
    }

    @Test
    void estadoNoUsaColumnDefinitionText() throws NoSuchFieldException {
        Field campo = PreguntaJpaEntity.class.getDeclaredField("estado");
        Column columna = campo.getAnnotation(Column.class);

        assertFalse("text".equals(columna.columnDefinition()));
    }

    @Test
    void opcionesSeCarganDeFormaEagerConColumnasObligatorias() throws NoSuchFieldException {
        Field campo = PreguntaJpaEntity.class.getDeclaredField("opciones");

        ElementCollection elementCollection = campo.getAnnotation(ElementCollection.class);
        assertEquals(FetchType.EAGER, elementCollection.fetch());

        CollectionTable collectionTable = campo.getAnnotation(CollectionTable.class);
        JoinColumn joinColumn = collectionTable.joinColumns()[0];
        assertEquals("pregunta_id", joinColumn.name());
        assertFalse(joinColumn.nullable());

        OrderColumn orderColumn = campo.getAnnotation(OrderColumn.class);
        assertEquals("orden", orderColumn.name());
        assertFalse(orderColumn.nullable());
    }
}
