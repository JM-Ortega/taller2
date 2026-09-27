package co.edu.unicauca.saberpro.pregunta.infrastructure.messaging.rabbit;

import org.junit.jupiter.api.Test;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

class PreguntaEnviadaRevisionOutboxSchedulerTest {

    @Test
    void pollDelegaEnDispatchPendingDelDispatcherExistente() {
        PreguntaEnviadaRevisionOutboxDispatcher dispatcher = mock(PreguntaEnviadaRevisionOutboxDispatcher.class);
        PreguntaEnviadaRevisionOutboxScheduler scheduler = new PreguntaEnviadaRevisionOutboxScheduler(dispatcher);

        scheduler.poll();

        verify(dispatcher).dispatchPending();
    }
}
