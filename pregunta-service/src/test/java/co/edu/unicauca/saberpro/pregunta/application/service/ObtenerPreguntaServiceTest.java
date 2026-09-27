package co.edu.unicauca.saberpro.pregunta.application.service;

import co.edu.unicauca.saberpro.pregunta.application.exception.PreguntaNoEncontradaException;
import co.edu.unicauca.saberpro.pregunta.domain.model.Pregunta;
import co.edu.unicauca.saberpro.pregunta.support.PreguntaTestFixtures;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class ObtenerPreguntaServiceTest {

    @Test
    void obtenerInexistenteLanzaError() {
        FakePreguntaRepository repository = new FakePreguntaRepository();
        ObtenerPreguntaService service = new ObtenerPreguntaService(repository);

        assertThrows(PreguntaNoEncontradaException.class, () -> service.obtener(UUID.randomUUID()));
    }

    @Test
    void obtenerExistenteDevuelveLaPregunta() {
        FakePreguntaRepository repository = new FakePreguntaRepository();
        Pregunta pregunta = PreguntaTestFixtures.preguntaBorradorValida();
        repository.agregar(pregunta);
        ObtenerPreguntaService service = new ObtenerPreguntaService(repository);

        Pregunta obtenida = service.obtener(pregunta.getPreguntaId());

        assertEquals(pregunta.getPreguntaId(), obtenida.getPreguntaId());
    }
}
