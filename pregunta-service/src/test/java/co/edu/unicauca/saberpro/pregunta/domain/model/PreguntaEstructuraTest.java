package co.edu.unicauca.saberpro.pregunta.domain.model;

import co.edu.unicauca.saberpro.pregunta.domain.exception.EstructuraPreguntaInvalidaException;
import co.edu.unicauca.saberpro.pregunta.support.PreguntaTestFixtures;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class PreguntaEstructuraTest {

    private static String autorValido() {
        return "autor-1";
    }

    private static String contextoValido() {
        return "Contexto de ejemplo";
    }

    private static String preguntaDirectaValida() {
        return "¿Cuál es la respuesta correcta?";
    }

    private static String justificacionValida() {
        return "Justificación de ejemplo";
    }

    private static String bibliografiaValida() {
        return "Bibliografía de ejemplo";
    }

    private static Competencia competenciaValida() {
        return new Competencia("Comunicación escrita");
    }

    private static Tema temaValido() {
        return new Tema("Tema ejemplo");
    }

    private static Subtema subtemaValido() {
        return new Subtema("Subtema ejemplo");
    }

    private static NivelDificultad nivelDificultadValido() {
        return new NivelDificultad("MEDIO");
    }

    private static Pregunta crear(
        String autorId,
        String contexto,
        String preguntaDirecta,
        List<OpcionRespuesta> opciones,
        String justificacion,
        String bibliografia,
        Competencia competencia,
        Tema tema,
        Subtema subtema,
        NivelDificultad nivelDificultad
    ) {
        return Pregunta.crear(
            UUID.randomUUID(), autorId, contexto, preguntaDirecta, opciones,
            justificacion, bibliografia, competencia, tema, subtema, nivelDificultad
        );
    }

    @Test
    void creacionValidaQuedaEnBorradorConVersionCeroYConservaAutor() {
        Pregunta pregunta = PreguntaTestFixtures.preguntaBorradorValida();

        assertEquals(EstadoPregunta.BORRADOR, pregunta.getEstado());
        assertEquals(0, pregunta.getNumeroVersionRevision());
        assertEquals("autor-1", pregunta.getAutorId());
        assertEquals(5, pregunta.getOpciones().size());
    }

    @Test
    void listaDeOpcionesNoPuedeModificarseExternamente() {
        Pregunta pregunta = PreguntaTestFixtures.preguntaBorradorValida();

        assertThrows(UnsupportedOperationException.class,
            () -> pregunta.getOpciones().add(new OpcionRespuesta("otra", false)));
    }

    @Test
    void autorVacioEsRechazado() {
        assertThrows(EstructuraPreguntaInvalidaException.class, () -> crear(
            " ", contextoValido(), preguntaDirectaValida(), PreguntaTestFixtures.opcionesValidas(),
            justificacionValida(), bibliografiaValida(), competenciaValida(), temaValido(), subtemaValido(), nivelDificultadValido()
        ));
    }

    @Test
    void contextoVacioEsRechazado() {
        assertThrows(EstructuraPreguntaInvalidaException.class, () -> crear(
            autorValido(), " ", preguntaDirectaValida(), PreguntaTestFixtures.opcionesValidas(),
            justificacionValida(), bibliografiaValida(), competenciaValida(), temaValido(), subtemaValido(), nivelDificultadValido()
        ));
    }

    @Test
    void preguntaDirectaVaciaEsRechazada() {
        assertThrows(EstructuraPreguntaInvalidaException.class, () -> crear(
            autorValido(), contextoValido(), " ", PreguntaTestFixtures.opcionesValidas(),
            justificacionValida(), bibliografiaValida(), competenciaValida(), temaValido(), subtemaValido(), nivelDificultadValido()
        ));
    }

    @Test
    void justificacionVaciaEsRechazada() {
        assertThrows(EstructuraPreguntaInvalidaException.class, () -> crear(
            autorValido(), contextoValido(), preguntaDirectaValida(), PreguntaTestFixtures.opcionesValidas(),
            " ", bibliografiaValida(), competenciaValida(), temaValido(), subtemaValido(), nivelDificultadValido()
        ));
    }

    @Test
    void bibliografiaVaciaEsRechazada() {
        assertThrows(EstructuraPreguntaInvalidaException.class, () -> crear(
            autorValido(), contextoValido(), preguntaDirectaValida(), PreguntaTestFixtures.opcionesValidas(),
            justificacionValida(), " ", competenciaValida(), temaValido(), subtemaValido(), nivelDificultadValido()
        ));
    }

    @Test
    void competenciaConValorVacioEsRechazada() {
        assertThrows(EstructuraPreguntaInvalidaException.class, () -> crear(
            autorValido(), contextoValido(), preguntaDirectaValida(), PreguntaTestFixtures.opcionesValidas(),
            justificacionValida(), bibliografiaValida(), new Competencia(" "), temaValido(), subtemaValido(), nivelDificultadValido()
        ));
    }

    @Test
    void competenciaNulaEsRechazada() {
        assertThrows(EstructuraPreguntaInvalidaException.class, () -> crear(
            autorValido(), contextoValido(), preguntaDirectaValida(), PreguntaTestFixtures.opcionesValidas(),
            justificacionValida(), bibliografiaValida(), null, temaValido(), subtemaValido(), nivelDificultadValido()
        ));
    }

    @Test
    void temaConValorVacioEsRechazado() {
        assertThrows(EstructuraPreguntaInvalidaException.class, () -> crear(
            autorValido(), contextoValido(), preguntaDirectaValida(), PreguntaTestFixtures.opcionesValidas(),
            justificacionValida(), bibliografiaValida(), competenciaValida(), new Tema(" "), subtemaValido(), nivelDificultadValido()
        ));
    }

    @Test
    void subtemaConValorVacioEsRechazado() {
        assertThrows(EstructuraPreguntaInvalidaException.class, () -> crear(
            autorValido(), contextoValido(), preguntaDirectaValida(), PreguntaTestFixtures.opcionesValidas(),
            justificacionValida(), bibliografiaValida(), competenciaValida(), temaValido(), new Subtema(" "), nivelDificultadValido()
        ));
    }

    @Test
    void nivelDificultadConValorVacioEsRechazado() {
        assertThrows(EstructuraPreguntaInvalidaException.class, () -> crear(
            autorValido(), contextoValido(), preguntaDirectaValida(), PreguntaTestFixtures.opcionesValidas(),
            justificacionValida(), bibliografiaValida(), competenciaValida(), temaValido(), subtemaValido(), new NivelDificultad(" ")
        ));
    }

    @Test
    void opcionConTextoVacioEsRechazada() {
        List<OpcionRespuesta> opciones = List.of(
            new OpcionRespuesta(" ", true),
            new OpcionRespuesta("Distractor 1", false),
            new OpcionRespuesta("Distractor 2", false),
            new OpcionRespuesta("Distractor 3", false),
            new OpcionRespuesta("Distractor 4", false)
        );

        assertThrows(EstructuraPreguntaInvalidaException.class, () -> crear(
            autorValido(), contextoValido(), preguntaDirectaValida(), opciones,
            justificacionValida(), bibliografiaValida(), competenciaValida(), temaValido(), subtemaValido(), nivelDificultadValido()
        ));
    }

    @Test
    void cantidadDeOpcionesDistintaDeCincoEsRechazada() {
        List<OpcionRespuesta> opciones = List.of(
            new OpcionRespuesta("Opción correcta", true),
            new OpcionRespuesta("Distractor 1", false),
            new OpcionRespuesta("Distractor 2", false),
            new OpcionRespuesta("Distractor 3", false)
        );

        assertThrows(EstructuraPreguntaInvalidaException.class, () -> crear(
            autorValido(), contextoValido(), preguntaDirectaValida(), opciones,
            justificacionValida(), bibliografiaValida(), competenciaValida(), temaValido(), subtemaValido(), nivelDificultadValido()
        ));
    }

    @Test
    void masDeUnaOpcionCorrectaEsRechazada() {
        List<OpcionRespuesta> opciones = List.of(
            new OpcionRespuesta("Opción correcta 1", true),
            new OpcionRespuesta("Opción correcta 2", true),
            new OpcionRespuesta("Distractor 1", false),
            new OpcionRespuesta("Distractor 2", false),
            new OpcionRespuesta("Distractor 3", false)
        );

        assertThrows(EstructuraPreguntaInvalidaException.class, () -> crear(
            autorValido(), contextoValido(), preguntaDirectaValida(), opciones,
            justificacionValida(), bibliografiaValida(), competenciaValida(), temaValido(), subtemaValido(), nivelDificultadValido()
        ));
    }

    @Test
    void ningunaOpcionCorrectaEsRechazada() {
        List<OpcionRespuesta> opciones = List.of(
            new OpcionRespuesta("Distractor 1", false),
            new OpcionRespuesta("Distractor 2", false),
            new OpcionRespuesta("Distractor 3", false),
            new OpcionRespuesta("Distractor 4", false),
            new OpcionRespuesta("Distractor 5", false)
        );

        assertThrows(EstructuraPreguntaInvalidaException.class, () -> crear(
            autorValido(), contextoValido(), preguntaDirectaValida(), opciones,
            justificacionValida(), bibliografiaValida(), competenciaValida(), temaValido(), subtemaValido(), nivelDificultadValido()
        ));
    }

    @Test
    void opcionTodasLasAnterioresEsRechazada() {
        List<OpcionRespuesta> opciones = List.of(
            new OpcionRespuesta("Todas las anteriores", true),
            new OpcionRespuesta("Distractor 1", false),
            new OpcionRespuesta("Distractor 2", false),
            new OpcionRespuesta("Distractor 3", false),
            new OpcionRespuesta("Distractor 4", false)
        );

        assertThrows(EstructuraPreguntaInvalidaException.class, () -> crear(
            autorValido(), contextoValido(), preguntaDirectaValida(), opciones,
            justificacionValida(), bibliografiaValida(), competenciaValida(), temaValido(), subtemaValido(), nivelDificultadValido()
        ));
    }

    @Test
    void opcionNingunaDeLasAnterioresEsRechazada() {
        List<OpcionRespuesta> opciones = List.of(
            new OpcionRespuesta("Opción correcta", true),
            new OpcionRespuesta("Ninguna de las anteriores", false),
            new OpcionRespuesta("Distractor 1", false),
            new OpcionRespuesta("Distractor 2", false),
            new OpcionRespuesta("Distractor 3", false)
        );

        assertThrows(EstructuraPreguntaInvalidaException.class, () -> crear(
            autorValido(), contextoValido(), preguntaDirectaValida(), opciones,
            justificacionValida(), bibliografiaValida(), competenciaValida(), temaValido(), subtemaValido(), nivelDificultadValido()
        ));
    }

    @Test
    void reconstitucionInvalidaEsRechazada() {
        assertThrows(EstructuraPreguntaInvalidaException.class, () -> Pregunta.reconstituir(
            UUID.randomUUID(), " ", contextoValido(), preguntaDirectaValida(), PreguntaTestFixtures.opcionesValidas(),
            justificacionValida(), bibliografiaValida(), competenciaValida(), temaValido(), subtemaValido(), nivelDificultadValido(),
            EstadoPregunta.BORRADOR, 0
        ));
    }

    @Test
    void reconstitucionConVersionNegativaEsRechazada() {
        assertThrows(EstructuraPreguntaInvalidaException.class, () -> Pregunta.reconstituir(
            UUID.randomUUID(), autorValido(), contextoValido(), preguntaDirectaValida(), PreguntaTestFixtures.opcionesValidas(),
            justificacionValida(), bibliografiaValida(), competenciaValida(), temaValido(), subtemaValido(), nivelDificultadValido(),
            EstadoPregunta.BORRADOR, -1
        ));
    }

    @Test
    void reconstitucionValidaConservaEstadoYVersion() {
        Pregunta pregunta = Pregunta.reconstituir(
            UUID.randomUUID(), autorValido(), contextoValido(), preguntaDirectaValida(), PreguntaTestFixtures.opcionesValidas(),
            justificacionValida(), bibliografiaValida(), competenciaValida(), temaValido(), subtemaValido(), nivelDificultadValido(),
            EstadoPregunta.APROBADA, 3
        );

        assertEquals(EstadoPregunta.APROBADA, pregunta.getEstado());
        assertEquals(3, pregunta.getNumeroVersionRevision());
        assertEquals(5, pregunta.getOpciones().size());
    }
}
