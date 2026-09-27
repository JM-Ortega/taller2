package co.edu.unicauca.saberpro.pregunta.application.service;

import co.edu.unicauca.saberpro.pregunta.domain.model.EstadoPregunta;
import co.edu.unicauca.saberpro.pregunta.domain.model.Pregunta;
import co.edu.unicauca.saberpro.pregunta.support.PreguntaTestFixtures;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class EnviarPreguntaARevisionServiceTest {

    @Test
    void enviarGuardaYPublicaElEventoDevuelto() {
        FakePreguntaRepository repository = new FakePreguntaRepository();
        FakeIntegrationEventPublisher publisher = new FakeIntegrationEventPublisher();
        Pregunta pregunta = PreguntaTestFixtures.preguntaBorradorValida();
        repository.agregar(pregunta);
        EnviarPreguntaARevisionService service = new EnviarPreguntaARevisionService(repository, publisher);

        Pregunta enviada = service.enviarARevision(pregunta.getPreguntaId());

        assertEquals(EstadoPregunta.PENDIENTE_REVISION, enviada.getEstado());
        assertEquals(1, repository.vecesGuardado());
        assertEquals(1, publisher.publicados().size());
        assertEquals(pregunta.getPreguntaId(), publisher.publicados().get(0).preguntaId());
        assertEquals(1, publisher.publicados().get(0).versionPregunta());
    }
}
