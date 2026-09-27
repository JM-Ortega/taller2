package co.edu.unicauca.saberpro.pregunta.support;

import co.edu.unicauca.saberpro.pregunta.domain.model.Competencia;
import co.edu.unicauca.saberpro.pregunta.domain.model.NivelDificultad;
import co.edu.unicauca.saberpro.pregunta.domain.model.OpcionRespuesta;
import co.edu.unicauca.saberpro.pregunta.domain.model.Pregunta;
import co.edu.unicauca.saberpro.pregunta.domain.model.Subtema;
import co.edu.unicauca.saberpro.pregunta.domain.model.Tema;

import java.util.List;
import java.util.UUID;

public final class PreguntaTestFixtures {

    private PreguntaTestFixtures() {
    }

    public static List<OpcionRespuesta> opcionesValidas() {
        return List.of(
            new OpcionRespuesta("Opción correcta", true),
            new OpcionRespuesta("Distractor 1", false),
            new OpcionRespuesta("Distractor 2", false),
            new OpcionRespuesta("Distractor 3", false),
            new OpcionRespuesta("Distractor 4", false)
        );
    }

    public static Pregunta preguntaBorradorValida() {
        return Pregunta.crear(
            UUID.randomUUID(),
            "autor-1",
            "Contexto de ejemplo",
            "¿Cuál es la respuesta correcta?",
            opcionesValidas(),
            "Justificación de ejemplo",
            "Bibliografía de ejemplo",
            new Competencia("Comunicación escrita"),
            new Tema("Tema ejemplo"),
            new Subtema("Subtema ejemplo"),
            new NivelDificultad("MEDIO")
        );
    }
}
