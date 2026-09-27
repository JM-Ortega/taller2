package co.edu.unicauca.saberpro.pregunta.application.service;

import co.edu.unicauca.saberpro.pregunta.application.port.out.IntegrationEventPublisher;
import co.edu.unicauca.saberpro.pregunta.domain.event.PreguntaEnviadaARevision;
import co.edu.unicauca.saberpro.pregunta.domain.model.EstadoPregunta;
import co.edu.unicauca.saberpro.pregunta.domain.model.Pregunta;
import co.edu.unicauca.saberpro.pregunta.domain.repository.PreguntaRepository;
import co.edu.unicauca.saberpro.pregunta.support.PreguntaTestFixtures;
import org.junit.jupiter.api.Test;
import org.mockito.InOrder;
import org.springframework.transaction.annotation.Transactional;

import java.lang.reflect.Method;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

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

    @Test
    void guardaLaPreguntaAntesDePublicarElEvento() {
        PreguntaRepository repository = mock(PreguntaRepository.class);
        IntegrationEventPublisher publisher = mock(IntegrationEventPublisher.class);
        Pregunta pregunta = PreguntaTestFixtures.preguntaBorradorValida();
        when(repository.buscarPorId(pregunta.getPreguntaId())).thenReturn(Optional.of(pregunta));
        EnviarPreguntaARevisionService service = new EnviarPreguntaARevisionService(repository, publisher);

        service.enviarARevision(pregunta.getPreguntaId());

        InOrder orden = inOrder(repository, publisher);
        orden.verify(repository).guardar(pregunta);
        orden.verify(publisher).publish(any(PreguntaEnviadaARevision.class));
    }

    @Test
    void enviarARevisionEsTransaccional() throws NoSuchMethodException {
        Method metodo = EnviarPreguntaARevisionService.class.getMethod("enviarARevision", UUID.class);

        assertTrue(metodo.isAnnotationPresent(Transactional.class));
    }
}
