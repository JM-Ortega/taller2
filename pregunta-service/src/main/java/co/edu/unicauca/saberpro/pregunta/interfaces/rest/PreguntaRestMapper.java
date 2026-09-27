package co.edu.unicauca.saberpro.pregunta.interfaces.rest;

import co.edu.unicauca.saberpro.pregunta.application.command.ActualizarPreguntaCommand;
import co.edu.unicauca.saberpro.pregunta.application.command.CrearPreguntaCommand;
import co.edu.unicauca.saberpro.pregunta.domain.model.OpcionRespuesta;
import co.edu.unicauca.saberpro.pregunta.domain.model.Pregunta;
import co.edu.unicauca.saberpro.pregunta.interfaces.rest.dto.request.ActualizarPreguntaRequest;
import co.edu.unicauca.saberpro.pregunta.interfaces.rest.dto.request.CrearPreguntaRequest;
import co.edu.unicauca.saberpro.pregunta.interfaces.rest.dto.request.OpcionRespuestaRequest;
import co.edu.unicauca.saberpro.pregunta.interfaces.rest.dto.response.OpcionRespuestaResponse;
import co.edu.unicauca.saberpro.pregunta.interfaces.rest.dto.response.PreguntaResponse;

import java.util.List;
import java.util.UUID;

public class PreguntaRestMapper {

    public CrearPreguntaCommand toCommand(CrearPreguntaRequest request) {
        return new CrearPreguntaCommand(
            request.autorId(),
            request.contexto(),
            request.preguntaDirecta(),
            toOpciones(request.opciones()),
            request.justificacion(),
            request.bibliografia(),
            request.competencia(),
            request.tema(),
            request.subtema(),
            request.nivelDificultad()
        );
    }

    public ActualizarPreguntaCommand toCommand(UUID preguntaId, ActualizarPreguntaRequest request) {
        return new ActualizarPreguntaCommand(
            preguntaId,
            request.contexto(),
            request.preguntaDirecta(),
            toOpciones(request.opciones()),
            request.justificacion(),
            request.bibliografia(),
            request.competencia(),
            request.tema(),
            request.subtema(),
            request.nivelDificultad()
        );
    }

    public PreguntaResponse toResponse(Pregunta pregunta) {
        List<OpcionRespuestaResponse> opciones = pregunta.getOpciones().stream()
            .map(opcion -> new OpcionRespuestaResponse(opcion.texto(), opcion.correcta()))
            .toList();
        return new PreguntaResponse(
            pregunta.getPreguntaId(),
            pregunta.getAutorId(),
            pregunta.getContexto(),
            pregunta.getPreguntaDirecta(),
            opciones,
            pregunta.getJustificacion(),
            pregunta.getBibliografia(),
            pregunta.getCompetencia().valor(),
            pregunta.getTema().valor(),
            pregunta.getSubtema().valor(),
            pregunta.getNivelDificultad().valor(),
            pregunta.getEstado().name(),
            pregunta.getNumeroVersionRevision()
        );
    }

    private List<OpcionRespuesta> toOpciones(List<OpcionRespuestaRequest> opciones) {
        return opciones.stream()
            .map(opcion -> new OpcionRespuesta(opcion.texto(), opcion.correcta()))
            .toList();
    }
}
