package co.edu.unicauca.saberpro.pregunta.application.service;

import co.edu.unicauca.saberpro.pregunta.application.command.IniciarRevisionPreguntaCommand;
import co.edu.unicauca.saberpro.pregunta.domain.model.EstadoPregunta;
import co.edu.unicauca.saberpro.pregunta.domain.model.Pregunta;
import co.edu.unicauca.saberpro.pregunta.support.PreguntaTestFixtures;
import org.junit.jupiter.api.Test;

import java.time.Instant;

import static org.junit.jupiter.api.Assertions.assertEquals;

class IniciarRevisionPreguntaServiceTest {

    @Test
    void iniciarConCambioGuarda() {
        FakePreguntaRepository repository = new FakePreguntaRepository();
        Pregunta pregunta = PreguntaTestFixtures.preguntaBorradorValida();
        pregunta.enviarARevision(Instant.now());
        repository.agregar(pregunta);
        IniciarRevisionPreguntaService service = new IniciarRevisionPreguntaService(repository);

        Pregunta resultado = service.iniciarRevision(new IniciarRevisionPreguntaCommand(pregunta.getPreguntaId(), 1));

        assertEquals(EstadoPregunta.EN_REVISION, resultado.getEstado());
        assertEquals(1, repository.vecesGuardado());
    }

    @Test
    void retryIniciarNoGuarda() {
        FakePreguntaRepository repository = new FakePreguntaRepository();
        Pregunta pregunta = PreguntaTestFixtures.preguntaBorradorValida();
        pregunta.enviarARevision(Instant.now());
        pregunta.iniciarRevision(1);
        repository.agregar(pregunta);
        IniciarRevisionPreguntaService service = new IniciarRevisionPreguntaService(repository);

        service.iniciarRevision(new IniciarRevisionPreguntaCommand(pregunta.getPreguntaId(), 1));

        assertEquals(0, repository.vecesGuardado());
    }
}
