package co.edu.unicauca.saberpro.pregunta.interfaces.rest.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ApiErrorResponse(String code, String message, List<ApiErrorDetail> details) {

    public ApiErrorResponse(String code, String message) {
        this(code, message, null);
    }
}
