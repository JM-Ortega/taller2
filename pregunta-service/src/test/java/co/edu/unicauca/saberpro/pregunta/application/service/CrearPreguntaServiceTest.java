package co.edu.unicauca.saberpro.pregunta.application.service;

import co.edu.unicauca.saberpro.pregunta.application.command.CrearPreguntaCommand;
import co.edu.unicauca.saberpro.pregunta.domain.model.Pregunta;
import co.edu.unicauca.saberpro.pregunta.support.PreguntaTestFixtures;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class CrearPreguntaServiceTest {

    @Test
    void creaGeneraIdGuardaYDevuelveLaPregunta() {
        FakePreguntaRepository repository = new FakePreguntaRepository();
        CrearPreguntaService service = new CrearPreguntaService(repository);

        CrearPreguntaCommand command = new CrearPreguntaCommand(
            "autor-1",
            "Contexto de ejemplo",
            "¿Cuál es la respuesta correcta?",
            PreguntaTestFixtures.opcionesValidas(),
            "Justificación de ejemplo",
            "Bibliografía de ejemplo",
            "Comunicación escrita",
            "Tema ejemplo",
            "Subtema ejemplo",
            "MEDIO"
        );

        Pregunta creada = service.crear(command);

        assertNotNull(creada.getPreguntaId());
        assertEquals(1, repository.vecesGuardado());
        assertTrue(repository.buscarPorId(creada.getPreguntaId()).isPresent());
    }
}
