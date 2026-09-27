package co.edu.unicauca.saberpro.pregunta.interfaces.rest.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

public record ActualizarPreguntaRequest(
    @NotBlank(message = "contexto no puede estar vacío") String contexto,
    @NotBlank(message = "preguntaDirecta no puede estar vacío") String preguntaDirecta,
    @NotNull(message = "opciones es obligatorio")
    @Size(min = 5, max = 5, message = "Debe contener exactamente cinco opciones.")
    List<@NotNull(message = "La opción es obligatoria.") @Valid OpcionRespuestaRequest> opciones,
    @NotBlank(message = "justificacion no puede estar vacío") String justificacion,
    @NotBlank(message = "bibliografia no puede estar vacío") String bibliografia,
    @NotBlank(message = "competencia no puede estar vacío") String competencia,
    @NotBlank(message = "tema no puede estar vacío") String tema,
    @NotBlank(message = "subtema no puede estar vacío") String subtema,
    @NotBlank(message = "nivelDificultad no puede estar vacío") String nivelDificultad
) {
}
