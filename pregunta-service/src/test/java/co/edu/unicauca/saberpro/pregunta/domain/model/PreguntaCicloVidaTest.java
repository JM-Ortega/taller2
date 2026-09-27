package co.edu.unicauca.saberpro.pregunta.domain.model;

import co.edu.unicauca.saberpro.pregunta.domain.event.PreguntaEnviadaARevision;
import co.edu.unicauca.saberpro.pregunta.domain.exception.EstadoPreguntaIncompatibleException;
import co.edu.unicauca.saberpro.pregunta.domain.exception.EstructuraPreguntaInvalidaException;
import co.edu.unicauca.saberpro.pregunta.domain.exception.VersionPreguntaIncompatibleException;
import co.edu.unicauca.saberpro.pregunta.support.PreguntaTestFixtures;
import org.junit.jupiter.api.Test;

import java.time.Instant;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class PreguntaCicloVidaTest {

    @Test
    void actualizacionValidaEnBorradorMutaLosCampos() {
        Pregunta pregunta = PreguntaTestFixtures.preguntaBorradorValida();

        pregunta.actualizar(
            "Nuevo contexto",
            "¿Nueva pregunta directa?",
            PreguntaTestFixtures.opcionesValidas(),
            "Nueva justificación",
            "Nueva bibliografía",
            new Competencia("Otra competencia"),
            new Tema("Otro tema"),
            new Subtema("Otro subtema"),
            new NivelDificultad("ALTO")
        );

        assertEquals("Nuevo contexto", pregunta.getContexto());
        assertEquals("¿Nueva pregunta directa?", pregunta.getPreguntaDirecta());
        assertEquals(EstadoPregunta.BORRADOR, pregunta.getEstado());
        assertEquals(0, pregunta.getNumeroVersionRevision());
    }

    @Test
    void actualizacionInvalidaNoMutaParcialmente() {
        Pregunta pregunta = PreguntaTestFixtures.preguntaBorradorValida();
        String contextoOriginal = pregunta.getContexto();
        String preguntaDirectaOriginal = pregunta.getPreguntaDirecta();

        assertThrows(EstructuraPreguntaInvalidaException.class, () -> pregunta.actualizar(
            "Nuevo contexto",
            " ",
            PreguntaTestFixtures.opcionesValidas(),
            "Nueva justificación",
            "Nueva bibliografía",
            new Competencia("Otra competencia"),
            new Tema("Otro tema"),
            new Subtema("Otro subtema"),
            new NivelDificultad("ALTO")
        ));

        assertEquals(contextoOriginal, pregunta.getContexto());
        assertEquals(preguntaDirectaOriginal, pregunta.getPreguntaDirecta());
    }

    @Test
    void actualizarFueraDeBorradorLanzaError() {
        Pregunta pregunta = PreguntaTestFixtures.preguntaBorradorValida();
        pregunta.enviarARevision(Instant.now());

        assertThrows(EstadoPreguntaIncompatibleException.class, () -> pregunta.actualizar(
            "Nuevo contexto",
            "¿Nueva pregunta directa?",
            PreguntaTestFixtures.opcionesValidas(),
            "Nueva justificación",
            "Nueva bibliografía",
            new Competencia("Otra competencia"),
            new Tema("Otro tema"),
            new Subtema("Otro subtema"),
            new NivelDificultad("ALTO")
        ));
    }

    @Test
    void enviarDesdeBorradorPasaAPendienteRevisionIncrementaVersionYProduceEvento() {
        Pregunta pregunta = PreguntaTestFixtures.preguntaBorradorValida();
        Instant occurredAt = Instant.parse("2026-01-01T00:00:00Z");

        PreguntaEnviadaARevision evento = pregunta.enviarARevision(occurredAt);

        assertEquals(EstadoPregunta.PENDIENTE_REVISION, pregunta.getEstado());
        assertEquals(1, pregunta.getNumeroVersionRevision());
        assertEquals(pregunta.getPreguntaId(), evento.preguntaId());
        assertEquals(pregunta.getAutorId(), evento.autorId());
        assertEquals(1, evento.versionPregunta());
        assertEquals(occurredAt, evento.occurredAt());
    }

    @Test
    void enviarFueraDeBorradorLanzaError() {
        Pregunta pregunta = PreguntaTestFixtures.preguntaBorradorValida();
        pregunta.enviarARevision(Instant.now());

        assertThrows(EstadoPreguntaIncompatibleException.class, () -> pregunta.enviarARevision(Instant.now()));
    }

    @Test
    void iniciarRevisionEnVersionActualPasaAEnRevisionYDevuelveTrue() {
        Pregunta pregunta = PreguntaTestFixtures.preguntaBorradorValida();
        pregunta.enviarARevision(Instant.now());

        boolean cambio = pregunta.iniciarRevision(1);

        assertTrue(cambio);
        assertEquals(EstadoPregunta.EN_REVISION, pregunta.getEstado());
    }

    @Test
    void retryIniciarRevisionMismaVersionDevuelveFalse() {
        Pregunta pregunta = PreguntaTestFixtures.preguntaBorradorValida();
        pregunta.enviarARevision(Instant.now());
        pregunta.iniciarRevision(1);

        boolean cambio = pregunta.iniciarRevision(1);

        assertFalse(cambio);
        assertEquals(EstadoPregunta.EN_REVISION, pregunta.getEstado());
    }

    @Test
    void iniciarRevisionConVersionIncompatibleLanzaError() {
        Pregunta pregunta = PreguntaTestFixtures.preguntaBorradorValida();
        pregunta.enviarARevision(Instant.now());

        assertThrows(VersionPreguntaIncompatibleException.class, () -> pregunta.iniciarRevision(2));
    }

    @Test
    void iniciarRevisionConEstadoIncompatibleLanzaError() {
        Pregunta pregunta = PreguntaTestFixtures.preguntaBorradorValida();

        assertThrows(EstadoPreguntaIncompatibleException.class, () -> pregunta.iniciarRevision(0));
    }

    @Test
    void reabrirDesdeRechazadaVuelveABorradorConservandoVersion() {
        Pregunta pregunta = PreguntaTestFixtures.preguntaBorradorValida();
        pregunta.enviarARevision(Instant.now());
        pregunta.iniciarRevision(1);
        pregunta.rechazarTrasRevision(1);

        pregunta.reabrirParaCorreccion();

        assertEquals(EstadoPregunta.BORRADOR, pregunta.getEstado());
        assertEquals(1, pregunta.getNumeroVersionRevision());
    }

    @Test
    void reabrirDesdeOtroEstadoLanzaError() {
        Pregunta pregunta = PreguntaTestFixtures.preguntaBorradorValida();

        assertThrows(EstadoPreguntaIncompatibleException.class, pregunta::reabrirParaCorreccion);
    }
}
