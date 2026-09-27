package co.edu.unicauca.saberpro.pregunta.application.service;

import co.edu.unicauca.saberpro.pregunta.application.command.ProcesarRevisionFinalizadaCommand;
import co.edu.unicauca.saberpro.pregunta.domain.model.EstadoPregunta;
import co.edu.unicauca.saberpro.pregunta.domain.model.Pregunta;
import co.edu.unicauca.saberpro.pregunta.support.PreguntaTestFixtures;
import org.junit.jupiter.api.Test;

import java.time.Instant;

import static org.junit.jupiter.api.Assertions.assertEquals;

class ProcesarRevisionFinalizadaServiceTest {

    @Test
    void procesarConCambioGuarda() {
        FakePreguntaRepository repository = new FakePreguntaRepository();
        Pregunta pregunta = PreguntaTestFixtures.preguntaBorradorValida();
        pregunta.enviarARevision(Instant.now());
        pregunta.iniciarRevision(1);
        repository.agregar(pregunta);
        ProcesarRevisionFinalizadaService service = new ProcesarRevisionFinalizadaService(repository);

        service.procesar(new ProcesarRevisionFinalizadaCommand(
            pregunta.getPreguntaId(), 1, ProcesarRevisionFinalizadaCommand.Resultado.FAVORABLE
        ));

        assertEquals(1, repository.vecesGuardado());
        assertEquals(EstadoPregunta.APROBADA, repository.buscarPorId(pregunta.getPreguntaId()).orElseThrow().getEstado());
    }

    @Test
    void procesarSinCambioNoGuarda() {
        FakePreguntaRepository repository = new FakePreguntaRepository();
        Pregunta pregunta = PreguntaTestFixtures.preguntaBorradorValida();
        pregunta.enviarARevision(Instant.now());
        pregunta.iniciarRevision(1);
        pregunta.aprobarTrasRevision(1);
        repository.agregar(pregunta);
        ProcesarRevisionFinalizadaService service = new ProcesarRevisionFinalizadaService(repository);

        service.procesar(new ProcesarRevisionFinalizadaCommand(
            pregunta.getPreguntaId(), 1, ProcesarRevisionFinalizadaCommand.Resultado.FAVORABLE
        ));

        assertEquals(0, repository.vecesGuardado());
    }
}
