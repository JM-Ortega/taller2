package co.edu.unicauca.saberpro.pregunta.application.service;

import co.edu.unicauca.saberpro.pregunta.application.command.ActualizarPreguntaCommand;
import co.edu.unicauca.saberpro.pregunta.domain.exception.EstructuraPreguntaInvalidaException;
import co.edu.unicauca.saberpro.pregunta.domain.model.Pregunta;
import co.edu.unicauca.saberpro.pregunta.support.PreguntaTestFixtures;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class ActualizarPreguntaServiceTest {

    @Test
    void actualizarGuardaSoloSiExito() {
        FakePreguntaRepository repository = new FakePreguntaRepository();
        Pregunta pregunta = PreguntaTestFixtures.preguntaBorradorValida();
        repository.agregar(pregunta);
        ActualizarPreguntaService service = new ActualizarPreguntaService(repository);

        ActualizarPreguntaCommand comandoInvalido = new ActualizarPreguntaCommand(
            pregunta.getPreguntaId(),
            " ",
            "¿Nueva pregunta directa?",
            PreguntaTestFixtures.opcionesValidas(),
            "Nueva justificación",
            "Nueva bibliografía",
            "Otra competencia",
            "Otro tema",
            "Otro subtema",
            "ALTO"
        );

        assertThrows(EstructuraPreguntaInvalidaException.class, () -> service.actualizar(comandoInvalido));
        assertEquals(0, repository.vecesGuardado());

        ActualizarPreguntaCommand comandoValido = new ActualizarPreguntaCommand(
            pregunta.getPreguntaId(),
            "Nuevo contexto",
            "¿Nueva pregunta directa?",
            PreguntaTestFixtures.opcionesValidas(),
            "Nueva justificación",
            "Nueva bibliografía",
            "Otra competencia",
            "Otro tema",
            "Otro subtema",
            "ALTO"
        );

        Pregunta actualizada = service.actualizar(comandoValido);

        assertEquals("Nuevo contexto", actualizada.getContexto());
        assertEquals(1, repository.vecesGuardado());
    }
}
