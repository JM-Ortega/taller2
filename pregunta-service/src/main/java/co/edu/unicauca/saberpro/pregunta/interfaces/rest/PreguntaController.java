package co.edu.unicauca.saberpro.pregunta.interfaces.rest;

import co.edu.unicauca.saberpro.pregunta.application.port.in.ActualizarPreguntaUseCase;
import co.edu.unicauca.saberpro.pregunta.application.port.in.CrearPreguntaUseCase;
import co.edu.unicauca.saberpro.pregunta.application.port.in.EnviarPreguntaARevisionUseCase;
import co.edu.unicauca.saberpro.pregunta.application.port.in.ObtenerPreguntaUseCase;
import co.edu.unicauca.saberpro.pregunta.application.port.in.ReabrirPreguntaParaCorreccionUseCase;
import co.edu.unicauca.saberpro.pregunta.domain.exception.EstructuraPreguntaInvalidaException;
import co.edu.unicauca.saberpro.pregunta.domain.model.Pregunta;
import co.edu.unicauca.saberpro.pregunta.interfaces.rest.dto.request.ActualizarPreguntaRequest;
import co.edu.unicauca.saberpro.pregunta.interfaces.rest.dto.request.CrearPreguntaRequest;
import co.edu.unicauca.saberpro.pregunta.interfaces.rest.dto.response.PreguntaResponse;
import co.edu.unicauca.saberpro.pregunta.interfaces.rest.exception.PreguntaNoAptaRevisionRestException;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/preguntas")
public class PreguntaController {

    private final CrearPreguntaUseCase crearPreguntaUseCase;
    private final ObtenerPreguntaUseCase obtenerPreguntaUseCase;
    private final ActualizarPreguntaUseCase actualizarPreguntaUseCase;
    private final EnviarPreguntaARevisionUseCase enviarPreguntaARevisionUseCase;
    private final ReabrirPreguntaParaCorreccionUseCase reabrirPreguntaParaCorreccionUseCase;
    private final PreguntaRestMapper mapper;

    public PreguntaController(
        CrearPreguntaUseCase crearPreguntaUseCase,
        ObtenerPreguntaUseCase obtenerPreguntaUseCase,
        ActualizarPreguntaUseCase actualizarPreguntaUseCase,
        EnviarPreguntaARevisionUseCase enviarPreguntaARevisionUseCase,
        ReabrirPreguntaParaCorreccionUseCase reabrirPreguntaParaCorreccionUseCase
    ) {
        this.crearPreguntaUseCase = crearPreguntaUseCase;
        this.obtenerPreguntaUseCase = obtenerPreguntaUseCase;
        this.actualizarPreguntaUseCase = actualizarPreguntaUseCase;
        this.enviarPreguntaARevisionUseCase = enviarPreguntaARevisionUseCase;
        this.reabrirPreguntaParaCorreccionUseCase = reabrirPreguntaParaCorreccionUseCase;
        this.mapper = new PreguntaRestMapper();
    }

    @PostMapping
    public ResponseEntity<PreguntaResponse> crear(@Valid @RequestBody CrearPreguntaRequest request) {
        Pregunta pregunta = crearPreguntaUseCase.crear(mapper.toCommand(request));
        PreguntaResponse response = mapper.toResponse(pregunta);
        return ResponseEntity
            .created(URI.create("/api/v1/preguntas/" + response.preguntaId()))
            .body(response);
    }

    @GetMapping("/{id}")
    public PreguntaResponse obtener(@PathVariable UUID id) {
        return mapper.toResponse(obtenerPreguntaUseCase.obtener(id));
    }

    @PutMapping("/{id}")
    public PreguntaResponse actualizar(
        @PathVariable UUID id,
        @Valid @RequestBody ActualizarPreguntaRequest request
    ) {
        return mapper.toResponse(actualizarPreguntaUseCase.actualizar(mapper.toCommand(id, request)));
    }

    @PostMapping("/{id}/envios-revision")
    public PreguntaResponse enviarARevision(@PathVariable UUID id) {
        try {
            return mapper.toResponse(enviarPreguntaARevisionUseCase.enviarARevision(id));
        } catch (EstructuraPreguntaInvalidaException ex) {
            throw new PreguntaNoAptaRevisionRestException(ex.getMessage());
        }
    }

    @PostMapping("/{id}/reaperturas")
    public PreguntaResponse reabrir(@PathVariable UUID id) {
        return mapper.toResponse(reabrirPreguntaParaCorreccionUseCase.reabrir(id));
    }
}
