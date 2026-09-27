package co.edu.unicauca.saberpro.pregunta.interfaces.rest;

import co.edu.unicauca.saberpro.pregunta.application.command.ActualizarPreguntaCommand;
import co.edu.unicauca.saberpro.pregunta.application.command.CrearPreguntaCommand;
import co.edu.unicauca.saberpro.pregunta.domain.model.Pregunta;
import co.edu.unicauca.saberpro.pregunta.interfaces.rest.dto.request.ActualizarPreguntaRequest;
import co.edu.unicauca.saberpro.pregunta.interfaces.rest.dto.request.CrearPreguntaRequest;
import co.edu.unicauca.saberpro.pregunta.interfaces.rest.dto.request.OpcionRespuestaRequest;
import co.edu.unicauca.saberpro.pregunta.interfaces.rest.dto.response.OpcionRespuestaResponse;
import co.edu.unicauca.saberpro.pregunta.interfaces.rest.dto.response.PreguntaResponse;
import co.edu.unicauca.saberpro.pregunta.support.PreguntaTestFixtures;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;

class PreguntaRestMapperTest {

    private final PreguntaRestMapper mapper = new PreguntaRestMapper();

    private List<OpcionRespuestaRequest> opcionesRequest() {
        return List.of(
            new OpcionRespuestaRequest("Opción A", true),
            new OpcionRespuestaRequest("Opción B", false),
            new OpcionRespuestaRequest("Opción C", false),
            new OpcionRespuestaRequest("Opción D", false),
            new OpcionRespuestaRequest("Opción E", false)
        );
    }

    @Test
    void mapeaCrearPreguntaRequestACommandConCamposYOpcionesExactas() {
        CrearPreguntaRequest request = new CrearPreguntaRequest(
            "autor-1", "contexto", "pregunta directa", opcionesRequest(),
            "justificacion", "bibliografia", "competencia", "tema", "subtema", "nivel"
        );

        CrearPreguntaCommand command = mapper.toCommand(request);

        assertEquals("autor-1", command.autorId());
        assertEquals("contexto", command.contexto());
        assertEquals("pregunta directa", command.preguntaDirecta());
        assertEquals("justificacion", command.justificacion());
        assertEquals("bibliografia", command.bibliografia());
        assertEquals("competencia", command.competencia());
        assertEquals("tema", command.tema());
        assertEquals("subtema", command.subtema());
        assertEquals("nivel", command.nivelDificultad());
        assertEquals(5, command.opciones().size());
        for (int i = 0; i < 5; i++) {
            assertEquals(request.opciones().get(i).texto(), command.opciones().get(i).texto());
            assertEquals(request.opciones().get(i).correcta(), command.opciones().get(i).correcta());
        }
    }

    @Test
    void mapeaActualizarPreguntaRequestACommandConIdDelPathYSoloContenidoEditable() {
        UUID preguntaId = UUID.randomUUID();
        ActualizarPreguntaRequest request = new ActualizarPreguntaRequest(
            "contexto actualizado", "pregunta actualizada", opcionesRequest(),
            "justificacion", "bibliografia", "competencia", "tema", "subtema", "nivel"
        );

        ActualizarPreguntaCommand command = mapper.toCommand(preguntaId, request);

        assertEquals(preguntaId, command.preguntaId());
        assertEquals("contexto actualizado", command.contexto());
        assertEquals("pregunta actualizada", command.preguntaDirecta());
        assertEquals("justificacion", command.justificacion());
        assertEquals("bibliografia", command.bibliografia());
        assertEquals("competencia", command.competencia());
        assertEquals("tema", command.tema());
        assertEquals("subtema", command.subtema());
        assertEquals("nivel", command.nivelDificultad());
        assertEquals(5, command.opciones().size());
        for (int i = 0; i < 5; i++) {
            assertEquals(request.opciones().get(i).texto(), command.opciones().get(i).texto());
            assertEquals(request.opciones().get(i).correcta(), command.opciones().get(i).correcta());
        }
    }

    @Test
    void mapeaPreguntaAResponseConEscalaresValueObjectsComoStringYOrdenDeOpciones() {
        Pregunta pregunta = PreguntaTestFixtures.preguntaBorradorValida();

        PreguntaResponse response = mapper.toResponse(pregunta);

        assertEquals(pregunta.getPreguntaId(), response.preguntaId());
        assertEquals(pregunta.getAutorId(), response.autorId());
        assertEquals(pregunta.getContexto(), response.contexto());
        assertEquals(pregunta.getPreguntaDirecta(), response.preguntaDirecta());
        assertEquals(pregunta.getJustificacion(), response.justificacion());
        assertEquals(pregunta.getBibliografia(), response.bibliografia());
        assertEquals(pregunta.getCompetencia().valor(), response.competencia());
        assertEquals(pregunta.getTema().valor(), response.tema());
        assertEquals(pregunta.getSubtema().valor(), response.subtema());
        assertEquals(pregunta.getNivelDificultad().valor(), response.nivelDificultad());
        assertEquals(pregunta.getEstado().name(), response.estado());
        assertEquals(pregunta.getNumeroVersionRevision(), response.numeroVersionRevision());

        assertEquals(pregunta.getOpciones().size(), response.opciones().size());
        for (int i = 0; i < pregunta.getOpciones().size(); i++) {
            OpcionRespuestaResponse opcionResponse = response.opciones().get(i);
            assertEquals(pregunta.getOpciones().get(i).texto(), opcionResponse.texto());
            assertEquals(pregunta.getOpciones().get(i).correcta(), opcionResponse.correcta());
        }
    }
}
