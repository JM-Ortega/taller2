package co.edu.unicauca.saberpro.pregunta.domain.model;

import co.edu.unicauca.saberpro.pregunta.domain.exception.ResultadoRevisionContradictorioException;
import co.edu.unicauca.saberpro.pregunta.domain.exception.VersionPreguntaIncompatibleException;
import co.edu.unicauca.saberpro.pregunta.support.PreguntaTestFixtures;
import org.junit.jupiter.api.Test;

import java.time.Instant;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class PreguntaIdempotenciaRevisionTest {

    private static Pregunta enRevisionV1() {
        Pregunta pregunta = PreguntaTestFixtures.preguntaBorradorValida();
        pregunta.enviarARevision(Instant.now());
        pregunta.iniciarRevision(1);
        return pregunta;
    }

    private static Pregunta aprobadaV1() {
        Pregunta pregunta = enRevisionV1();
        pregunta.aprobarTrasRevision(1);
        return pregunta;
    }

    private static Pregunta rechazadaV1() {
        Pregunta pregunta = enRevisionV1();
        pregunta.rechazarTrasRevision(1);
        return pregunta;
    }

    private static Pregunta borradorV1TrasReapertura() {
        Pregunta pregunta = rechazadaV1();
        pregunta.reabrirParaCorreccion();
        return pregunta;
    }

    private static Pregunta enRevisionV2() {
        Pregunta pregunta = borradorV1TrasReapertura();
        pregunta.enviarARevision(Instant.now());
        pregunta.iniciarRevision(2);
        return pregunta;
    }

    @Test
    void enRevisionV1MasFavorableV1ApruebaYDevuelveTrue() {
        Pregunta pregunta = enRevisionV1();

        boolean cambio = pregunta.aprobarTrasRevision(1);

        assertTrue(cambio);
        assertEquals(EstadoPregunta.APROBADA, pregunta.getEstado());
    }

    @Test
    void aprobadaV1MasFavorableV1EsDuplicadoYDevuelveFalse() {
        Pregunta pregunta = aprobadaV1();

        boolean cambio = pregunta.aprobarTrasRevision(1);

        assertFalse(cambio);
        assertEquals(EstadoPregunta.APROBADA, pregunta.getEstado());
    }

    @Test
    void enRevisionV1MasDesfavorableV1RechazaYDevuelveTrue() {
        Pregunta pregunta = enRevisionV1();

        boolean cambio = pregunta.rechazarTrasRevision(1);

        assertTrue(cambio);
        assertEquals(EstadoPregunta.RECHAZADA, pregunta.getEstado());
    }

    @Test
    void rechazadaV1MasDesfavorableV1EsDuplicadoYDevuelveFalse() {
        Pregunta pregunta = rechazadaV1();

        boolean cambio = pregunta.rechazarTrasRevision(1);

        assertFalse(cambio);
        assertEquals(EstadoPregunta.RECHAZADA, pregunta.getEstado());
    }

    @Test
    void borradorV1TrasReaperturaMasDesfavorableV1EsRedeliveryCompatibleYDevuelveFalse() {
        Pregunta pregunta = borradorV1TrasReapertura();

        boolean cambio = pregunta.rechazarTrasRevision(1);

        assertFalse(cambio);
        assertEquals(EstadoPregunta.BORRADOR, pregunta.getEstado());
    }

    @Test
    void borradorV1TrasReaperturaMasFavorableV1EsContradictorio() {
        Pregunta pregunta = borradorV1TrasReapertura();

        assertThrows(ResultadoRevisionContradictorioException.class, () -> pregunta.aprobarTrasRevision(1));
    }

    @Test
    void versionMenorQueLaActualEsStaleYDevuelveFalse() {
        Pregunta pregunta = enRevisionV2();

        boolean cambio = pregunta.aprobarTrasRevision(1);

        assertFalse(cambio);
        assertEquals(EstadoPregunta.EN_REVISION, pregunta.getEstado());
    }

    @Test
    void versionMayorQueLaActualEsInconsistente() {
        Pregunta pregunta = enRevisionV1();

        assertThrows(VersionPreguntaIncompatibleException.class, () -> pregunta.aprobarTrasRevision(2));
    }

    @Test
    void aprobadaV1MasDesfavorableV1EsContradictorio() {
        Pregunta pregunta = aprobadaV1();

        assertThrows(ResultadoRevisionContradictorioException.class, () -> pregunta.rechazarTrasRevision(1));
    }

    @Test
    void rechazadaV1MasFavorableV1EsContradictorio() {
        Pregunta pregunta = rechazadaV1();

        assertThrows(ResultadoRevisionContradictorioException.class, () -> pregunta.aprobarTrasRevision(1));
    }
}
