package co.edu.unicauca.saberpro.pregunta.infrastructure.persistence.jpa.pregunta.entity;

import jakarta.persistence.Column;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Field;

import static org.junit.jupiter.api.Assertions.assertEquals;

class OpcionRespuestaJpaEmbeddableMappingTest {

    @Test
    void textoUsaColumnDefinitionText() throws NoSuchFieldException {
        Field campo = OpcionRespuestaJpaEmbeddable.class.getDeclaredField("texto");
        Column columna = campo.getAnnotation(Column.class);

        assertEquals("text", columna.columnDefinition());
    }
}
