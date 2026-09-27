package co.edu.unicauca.saberpro.pregunta.interfaces.rest.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record OpcionRespuestaRequest(
    @NotBlank(message = "texto no puede estar vacío") String texto,
    @NotNull(message = "correcta es obligatorio") Boolean correcta
) {
}
