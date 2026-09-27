package co.edu.unicauca.saberpro.pregunta.interfaces.rest;

import co.edu.unicauca.saberpro.pregunta.application.exception.PreguntaNoEncontradaException;
import co.edu.unicauca.saberpro.pregunta.domain.exception.EstadoPreguntaIncompatibleException;
import co.edu.unicauca.saberpro.pregunta.domain.exception.EstructuraPreguntaInvalidaException;
import co.edu.unicauca.saberpro.pregunta.interfaces.rest.dto.response.ApiErrorDetail;
import co.edu.unicauca.saberpro.pregunta.interfaces.rest.dto.response.ApiErrorResponse;
import co.edu.unicauca.saberpro.pregunta.interfaces.rest.exception.PreguntaNoAptaRevisionRestException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.util.List;

@RestControllerAdvice
public class ApiExceptionHandler {

    private static final String MENSAJE_VALIDACION = "La solicitud contiene campos inválidos.";

    @ExceptionHandler(PreguntaNoEncontradaException.class)
    public ResponseEntity<ApiErrorResponse> handlePreguntaNoEncontrada(PreguntaNoEncontradaException ex) {
        return build(HttpStatus.NOT_FOUND, "PREGUNTA_NO_ENCONTRADA", ex.getMessage());
    }

    @ExceptionHandler(EstadoPreguntaIncompatibleException.class)
    public ResponseEntity<ApiErrorResponse> handleEstadoIncompatible(EstadoPreguntaIncompatibleException ex) {
        return build(HttpStatus.CONFLICT, "PREGUNTA_ESTADO_INVALIDO", ex.getMessage());
    }

    @ExceptionHandler(PreguntaNoAptaRevisionRestException.class)
    public ResponseEntity<ApiErrorResponse> handleNoAptaRevision(PreguntaNoAptaRevisionRestException ex) {
        return build(HttpStatus.UNPROCESSABLE_ENTITY, "PREGUNTA_NO_APTA_REVISION", ex.getMessage());
    }

    @ExceptionHandler(EstructuraPreguntaInvalidaException.class)
    public ResponseEntity<ApiErrorResponse> handleEstructuraInvalida(EstructuraPreguntaInvalidaException ex) {
        return build(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", MENSAJE_VALIDACION);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiErrorResponse> handleValidacionDeCampos(MethodArgumentNotValidException ex) {
        List<ApiErrorDetail> details = ex.getBindingResult().getFieldErrors().stream()
            .map(error -> new ApiErrorDetail(error.getField(), error.getDefaultMessage()))
            .toList();
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
            .body(new ApiErrorResponse("VALIDATION_ERROR", MENSAJE_VALIDACION, details));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiErrorResponse> handleMensajeNoLegible(HttpMessageNotReadableException ex) {
        return build(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", MENSAJE_VALIDACION);
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ApiErrorResponse> handleTipoInvalido(MethodArgumentTypeMismatchException ex) {
        return build(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", MENSAJE_VALIDACION);
    }

    private ResponseEntity<ApiErrorResponse> build(HttpStatus status, String code, String message) {
        return ResponseEntity.status(status).body(new ApiErrorResponse(code, message));
    }
}
