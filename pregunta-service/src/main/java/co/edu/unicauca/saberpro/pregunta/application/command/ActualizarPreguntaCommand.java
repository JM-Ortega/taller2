package co.edu.unicauca.saberpro.pregunta.application.command;

import co.edu.unicauca.saberpro.pregunta.domain.model.OpcionRespuesta;

import java.util.List;
import java.util.UUID;

public record ActualizarPreguntaCommand(
    UUID preguntaId,
    String contexto,
    String preguntaDirecta,
    List<OpcionRespuesta> opciones,
    String justificacion,
    String bibliografia,
    String competencia,
    String tema,
    String subtema,
    String nivelDificultad
) {
}
