package co.edu.unicauca.saberpro.pregunta.application.service;

import co.edu.unicauca.saberpro.pregunta.domain.model.EstadoPregunta;
import co.edu.unicauca.saberpro.pregunta.domain.model.Pregunta;
import co.edu.unicauca.saberpro.pregunta.support.PreguntaTestFixtures;
import org.junit.jupiter.api.Test;

import java.time.Instant;

import static org.junit.jupiter.api.Assertions.assertEquals;

class ReabrirPreguntaParaCorreccionServiceTest {

    @Test
    void reabrirGuardaTrasTransicionValida() {
        FakePreguntaRepository repository = new FakePreguntaRepository();
        Pregunta pregunta = PreguntaTestFixtures.preguntaBorradorValida();
        pregunta.enviarARevision(Instant.now());
        pregunta.iniciarRevision(1);
        pregunta.rechazarTrasRevision(1);
        repository.agregar(pregunta);
        ReabrirPreguntaParaCorreccionService service = new ReabrirPreguntaParaCorreccionService(repository);

        Pregunta reabierta = service.reabrir(pregunta.getPreguntaId());

        assertEquals(EstadoPregunta.BORRADOR, reabierta.getEstado());
        assertEquals(1, repository.vecesGuardado());
    }
}
