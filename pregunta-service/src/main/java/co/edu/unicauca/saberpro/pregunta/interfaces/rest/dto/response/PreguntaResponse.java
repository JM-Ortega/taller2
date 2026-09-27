package co.edu.unicauca.saberpro.pregunta.interfaces.rest.dto.response;

import java.util.List;
import java.util.UUID;

public record PreguntaResponse(
    UUID preguntaId,
    String autorId,
    String contexto,
    String preguntaDirecta,
    List<OpcionRespuestaResponse> opciones,
    String justificacion,
    String bibliografia,
    String competencia,
    String tema,
    String subtema,
    String nivelDificultad,
    String estado,
    int numeroVersionRevision
) {
}
