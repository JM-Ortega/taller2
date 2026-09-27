package co.edu.unicauca.saberpro.pregunta.interfaces.rest;

import co.edu.unicauca.saberpro.pregunta.application.command.ActualizarPreguntaCommand;
import co.edu.unicauca.saberpro.pregunta.application.command.CrearPreguntaCommand;
import co.edu.unicauca.saberpro.pregunta.application.exception.PreguntaNoEncontradaException;
import co.edu.unicauca.saberpro.pregunta.application.port.in.ActualizarPreguntaUseCase;
import co.edu.unicauca.saberpro.pregunta.application.port.in.CrearPreguntaUseCase;
import co.edu.unicauca.saberpro.pregunta.application.port.in.EnviarPreguntaARevisionUseCase;
import co.edu.unicauca.saberpro.pregunta.application.port.in.ObtenerPreguntaUseCase;
import co.edu.unicauca.saberpro.pregunta.application.port.in.ReabrirPreguntaParaCorreccionUseCase;
import co.edu.unicauca.saberpro.pregunta.domain.exception.EstadoPreguntaIncompatibleException;
import co.edu.unicauca.saberpro.pregunta.domain.exception.EstructuraPreguntaInvalidaException;
import co.edu.unicauca.saberpro.pregunta.domain.model.EstadoPregunta;
import co.edu.unicauca.saberpro.pregunta.domain.model.Pregunta;
import co.edu.unicauca.saberpro.pregunta.support.PreguntaTestFixtures;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.Instant;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class PreguntaControllerTest {

    private CrearPreguntaUseCase crearPreguntaUseCase;
    private ObtenerPreguntaUseCase obtenerPreguntaUseCase;
    private ActualizarPreguntaUseCase actualizarPreguntaUseCase;
    private EnviarPreguntaARevisionUseCase enviarPreguntaARevisionUseCase;
    private ReabrirPreguntaParaCorreccionUseCase reabrirPreguntaParaCorreccionUseCase;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        crearPreguntaUseCase = mock(CrearPreguntaUseCase.class);
        obtenerPreguntaUseCase = mock(ObtenerPreguntaUseCase.class);
        actualizarPreguntaUseCase = mock(ActualizarPreguntaUseCase.class);
        enviarPreguntaARevisionUseCase = mock(EnviarPreguntaARevisionUseCase.class);
        reabrirPreguntaParaCorreccionUseCase = mock(ReabrirPreguntaParaCorreccionUseCase.class);

        PreguntaController controller = new PreguntaController(
            crearPreguntaUseCase,
            obtenerPreguntaUseCase,
            actualizarPreguntaUseCase,
            enviarPreguntaARevisionUseCase,
            reabrirPreguntaParaCorreccionUseCase
        );

        mockMvc = MockMvcBuilders.standaloneSetup(controller)
            .setControllerAdvice(new ApiExceptionHandler())
            .build();
    }

    private static final String CREAR_REQUEST_JSON = """
        {
          "autorId": "user-123",
          "contexto": "Contexto de la pregunta...",
          "preguntaDirecta": "¿Cuál opción es correcta?",
          "opciones": [
            { "texto": "Opción A", "correcta": true },
            { "texto": "Opción B", "correcta": false },
            { "texto": "Opción C", "correcta": false },
            { "texto": "Opción D", "correcta": false },
            { "texto": "Opción E", "correcta": false }
          ],
          "justificacion": "Justificación...",
          "bibliografia": "Referencia...",
          "competencia": "Competencia...",
          "tema": "Tema...",
          "subtema": "Subtema...",
          "nivelDificultad": "Nivel..."
        }
        """;

    private static final String ACTUALIZAR_REQUEST_JSON = """
        {
          "contexto": "Contexto actualizado...",
          "preguntaDirecta": "¿Pregunta actualizada?",
          "opciones": [
            { "texto": "A", "correcta": true },
            { "texto": "B", "correcta": false },
            { "texto": "C", "correcta": false },
            { "texto": "D", "correcta": false },
            { "texto": "E", "correcta": false }
          ],
          "justificacion": "Justificación...",
          "bibliografia": "Referencia...",
          "competencia": "Competencia...",
          "tema": "Tema...",
          "subtema": "Subtema...",
          "nivelDificultad": "Nivel..."
        }
        """;

    // --- crear ---

    @Test
    void crearConRequestValidoRetorna201ConLocationYBodyYComandoExacto() throws Exception {
        Pregunta creada = PreguntaTestFixtures.preguntaBorradorValida();
        when(crearPreguntaUseCase.crear(any(CrearPreguntaCommand.class))).thenReturn(creada);

        mockMvc.perform(post("/api/v1/preguntas")
                .contentType(MediaType.APPLICATION_JSON)
                .content(CREAR_REQUEST_JSON))
            .andExpect(status().isCreated())
            .andExpect(header().string("Location", "/api/v1/preguntas/" + creada.getPreguntaId()))
            .andExpect(jsonPath("$.preguntaId").value(creada.getPreguntaId().toString()))
            .andExpect(jsonPath("$.estado").value("BORRADOR"))
            .andExpect(jsonPath("$.numeroVersionRevision").value(0));

        ArgumentCaptor<CrearPreguntaCommand> captor = ArgumentCaptor.forClass(CrearPreguntaCommand.class);
        verify(crearPreguntaUseCase).crear(captor.capture());
        CrearPreguntaCommand command = captor.getValue();
        assertEquals("user-123", command.autorId());
        assertEquals("Contexto de la pregunta...", command.contexto());
        assertEquals("¿Cuál opción es correcta?", command.preguntaDirecta());
        assertEquals(5, command.opciones().size());
        assertEquals("Opción A", command.opciones().get(0).texto());
        assertEquals(true, command.opciones().get(0).correcta());
        assertEquals("Justificación...", command.justificacion());
        assertEquals("Referencia...", command.bibliografia());
        assertEquals("Competencia...", command.competencia());
        assertEquals("Tema...", command.tema());
        assertEquals("Subtema...", command.subtema());
        assertEquals("Nivel...", command.nivelDificultad());
    }

    @Test
    void crearConCampoRequeridoEnBlancoRetorna400YNoInvocaApplication() throws Exception {
        String jsonInvalido = CREAR_REQUEST_JSON.replace(
            "\"contexto\": \"Contexto de la pregunta...\",",
            "\"contexto\": \"\","
        );

        mockMvc.perform(post("/api/v1/preguntas")
                .contentType(MediaType.APPLICATION_JSON)
                .content(jsonInvalido))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));

        verifyNoInteractions(crearPreguntaUseCase);
    }

    @Test
    void crearConListaDeOpcionesDistintaDeCincoRetorna400() throws Exception {
        String jsonInvalido = """
            {
              "autorId": "user-123",
              "contexto": "Contexto",
              "preguntaDirecta": "Pregunta",
              "opciones": [
                { "texto": "Opción A", "correcta": true },
                { "texto": "Opción B", "correcta": false }
              ],
              "justificacion": "Justificación",
              "bibliografia": "Referencia",
              "competencia": "Competencia",
              "tema": "Tema",
              "subtema": "Subtema",
              "nivelDificultad": "Nivel"
            }
            """;

        mockMvc.perform(post("/api/v1/preguntas")
                .contentType(MediaType.APPLICATION_JSON)
                .content(jsonInvalido))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));

        verifyNoInteractions(crearPreguntaUseCase);
    }

    @Test
    void crearConOpcionNulaEnLaListaRetorna400YNoInvocaApplication() throws Exception {
        String jsonInvalido = """
            {
              "autorId": "user-123",
              "contexto": "Contexto",
              "preguntaDirecta": "Pregunta",
              "opciones": [
                { "texto": "Opción A", "correcta": true },
                null,
                { "texto": "Opción C", "correcta": false },
                { "texto": "Opción D", "correcta": false },
                { "texto": "Opción E", "correcta": false }
              ],
              "justificacion": "Justificación",
              "bibliografia": "Referencia",
              "competencia": "Competencia",
              "tema": "Tema",
              "subtema": "Subtema",
              "nivelDificultad": "Nivel"
            }
            """;

        mockMvc.perform(post("/api/v1/preguntas")
                .contentType(MediaType.APPLICATION_JSON)
                .content(jsonInvalido))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));

        verifyNoInteractions(crearPreguntaUseCase);
    }

    @Test
    void crearConEstructuraDeDominioInvalidaRetorna400() throws Exception {
        when(crearPreguntaUseCase.crear(any(CrearPreguntaCommand.class)))
            .thenThrow(new EstructuraPreguntaInvalidaException("se requiere exactamente una opción correcta"));

        mockMvc.perform(post("/api/v1/preguntas")
                .contentType(MediaType.APPLICATION_JSON)
                .content(CREAR_REQUEST_JSON))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
    }

    // --- obtener ---

    @Test
    void obtenerConUuidExistenteRetorna200ConPreguntaResponse() throws Exception {
        Pregunta pregunta = PreguntaTestFixtures.preguntaBorradorValida();
        when(obtenerPreguntaUseCase.obtener(pregunta.getPreguntaId())).thenReturn(pregunta);

        mockMvc.perform(get("/api/v1/preguntas/{id}", pregunta.getPreguntaId()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.preguntaId").value(pregunta.getPreguntaId().toString()))
            .andExpect(jsonPath("$.autorId").value(pregunta.getAutorId()));
    }

    @Test
    void obtenerConUuidInexistenteRetorna404() throws Exception {
        UUID id = UUID.randomUUID();
        when(obtenerPreguntaUseCase.obtener(id)).thenThrow(new PreguntaNoEncontradaException(id));

        mockMvc.perform(get("/api/v1/preguntas/{id}", id))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.code").value("PREGUNTA_NO_ENCONTRADA"));
    }

    @Test
    void obtenerConUuidInvalidoRetorna400YNoInvocaUseCase() throws Exception {
        mockMvc.perform(get("/api/v1/preguntas/{id}", "no-es-un-uuid"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));

        verifyNoInteractions(obtenerPreguntaUseCase);
    }

    // --- actualizar ---

    @Test
    void actualizarValidoEnBorradorRetorna200() throws Exception {
        Pregunta pregunta = PreguntaTestFixtures.preguntaBorradorValida();
        when(actualizarPreguntaUseCase.actualizar(any(ActualizarPreguntaCommand.class))).thenReturn(pregunta);

        mockMvc.perform(put("/api/v1/preguntas/{id}", pregunta.getPreguntaId())
                .contentType(MediaType.APPLICATION_JSON)
                .content(ACTUALIZAR_REQUEST_JSON))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.autorId").value(pregunta.getAutorId()));

        ArgumentCaptor<ActualizarPreguntaCommand> captor = ArgumentCaptor.forClass(ActualizarPreguntaCommand.class);
        verify(actualizarPreguntaUseCase).actualizar(captor.capture());
        assertEquals(pregunta.getPreguntaId(), captor.getValue().preguntaId());
        assertEquals("Contexto actualizado...", captor.getValue().contexto());
    }

    @Test
    void actualizarPreguntaInexistenteRetorna404() throws Exception {
        UUID id = UUID.randomUUID();
        when(actualizarPreguntaUseCase.actualizar(any(ActualizarPreguntaCommand.class)))
            .thenThrow(new PreguntaNoEncontradaException(id));

        mockMvc.perform(put("/api/v1/preguntas/{id}", id)
                .contentType(MediaType.APPLICATION_JSON)
                .content(ACTUALIZAR_REQUEST_JSON))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.code").value("PREGUNTA_NO_ENCONTRADA"));
    }

    @Test
    void actualizarConEstadoIncompatibleRetorna409() throws Exception {
        when(actualizarPreguntaUseCase.actualizar(any(ActualizarPreguntaCommand.class)))
            .thenThrow(new EstadoPreguntaIncompatibleException("no se puede actualizar una pregunta en estado PENDIENTE_REVISION"));

        mockMvc.perform(put("/api/v1/preguntas/{id}", UUID.randomUUID())
                .contentType(MediaType.APPLICATION_JSON)
                .content(ACTUALIZAR_REQUEST_JSON))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.code").value("PREGUNTA_ESTADO_INVALIDO"));
    }

    @Test
    void actualizarConRequestInvalidoRetorna400() throws Exception {
        String jsonInvalido = ACTUALIZAR_REQUEST_JSON.replace(
            "\"contexto\": \"Contexto actualizado...\",",
            "\"contexto\": \"\","
        );

        mockMvc.perform(put("/api/v1/preguntas/{id}", UUID.randomUUID())
                .contentType(MediaType.APPLICATION_JSON)
                .content(jsonInvalido))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));

        verifyNoInteractions(actualizarPreguntaUseCase);
    }

    @Test
    void actualizarConOpcionNulaEnLaListaRetorna400YNoInvocaApplication() throws Exception {
        String jsonInvalido = ACTUALIZAR_REQUEST_JSON.replace(
            "{ \"texto\": \"B\", \"correcta\": false },",
            "null,"
        );

        mockMvc.perform(put("/api/v1/preguntas/{id}", UUID.randomUUID())
                .contentType(MediaType.APPLICATION_JSON)
                .content(jsonInvalido))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));

        verifyNoInteractions(actualizarPreguntaUseCase);
    }

    // --- enviar a revisión ---

    @Test
    void enviarARevisionValidoRetorna200SinRequerirBody() throws Exception {
        Pregunta pregunta = PreguntaTestFixtures.preguntaBorradorValida();
        pregunta.enviarARevision(Instant.now());
        when(enviarPreguntaARevisionUseCase.enviarARevision(pregunta.getPreguntaId())).thenReturn(pregunta);

        mockMvc.perform(post("/api/v1/preguntas/{id}/envios-revision", pregunta.getPreguntaId()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.estado").value("PENDIENTE_REVISION"))
            .andExpect(jsonPath("$.numeroVersionRevision").value(1));
    }

    @Test
    void enviarARevisionPreguntaInexistenteRetorna404() throws Exception {
        UUID id = UUID.randomUUID();
        when(enviarPreguntaARevisionUseCase.enviarARevision(id)).thenThrow(new PreguntaNoEncontradaException(id));

        mockMvc.perform(post("/api/v1/preguntas/{id}/envios-revision", id))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.code").value("PREGUNTA_NO_ENCONTRADA"));
    }

    @Test
    void enviarARevisionConEstadoIncompatibleRetorna409() throws Exception {
        UUID id = UUID.randomUUID();
        when(enviarPreguntaARevisionUseCase.enviarARevision(id))
            .thenThrow(new EstadoPreguntaIncompatibleException("no se puede enviar a revisión una pregunta en estado PENDIENTE_REVISION"));

        mockMvc.perform(post("/api/v1/preguntas/{id}/envios-revision", id))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.code").value("PREGUNTA_ESTADO_INVALIDO"));
    }

    @Test
    void enviarARevisionConEstructuraInvalidaRetorna422ConCodigoEspecifico() throws Exception {
        UUID id = UUID.randomUUID();
        when(enviarPreguntaARevisionUseCase.enviarARevision(id))
            .thenThrow(new EstructuraPreguntaInvalidaException("se requiere exactamente una opción correcta"));

        mockMvc.perform(post("/api/v1/preguntas/{id}/envios-revision", id))
            .andExpect(status().isUnprocessableEntity())
            .andExpect(jsonPath("$.code").value("PREGUNTA_NO_APTA_REVISION"));
    }

    // --- reabrir ---

    @Test
    void reabrirPreguntaRechazadaRetorna200ConEstadoBorrador() throws Exception {
        Pregunta pregunta = PreguntaTestFixtures.preguntaBorradorValida();
        pregunta.enviarARevision(Instant.now());
        pregunta.iniciarRevision(1);
        pregunta.rechazarTrasRevision(1);
        pregunta.reabrirParaCorreccion();
        when(reabrirPreguntaParaCorreccionUseCase.reabrir(pregunta.getPreguntaId())).thenReturn(pregunta);

        mockMvc.perform(post("/api/v1/preguntas/{id}/reaperturas", pregunta.getPreguntaId()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.estado").value(EstadoPregunta.BORRADOR.name()));
    }

    @Test
    void reabrirPreguntaInexistenteRetorna404() throws Exception {
        UUID id = UUID.randomUUID();
        when(reabrirPreguntaParaCorreccionUseCase.reabrir(id)).thenThrow(new PreguntaNoEncontradaException(id));

        mockMvc.perform(post("/api/v1/preguntas/{id}/reaperturas", id))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.code").value("PREGUNTA_NO_ENCONTRADA"));
    }

    @Test
    void reabrirConEstadoIncompatibleRetorna409() throws Exception {
        UUID id = UUID.randomUUID();
        when(reabrirPreguntaParaCorreccionUseCase.reabrir(id))
            .thenThrow(new EstadoPreguntaIncompatibleException("no se puede reabrir para corrección una pregunta en estado BORRADOR"));

        mockMvc.perform(post("/api/v1/preguntas/{id}/reaperturas", id))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.code").value("PREGUNTA_ESTADO_INVALIDO"));
    }

    // --- JSON mal formado ---

    @Test
    void crearConJsonMalFormadoRetorna400SinRespuestaPorDefectoDeSpring() throws Exception {
        mockMvc.perform(post("/api/v1/preguntas")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{ \"autorId\": "))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"))
            .andExpect(jsonPath("$.message").value("La solicitud contiene campos inválidos."));
    }
}
