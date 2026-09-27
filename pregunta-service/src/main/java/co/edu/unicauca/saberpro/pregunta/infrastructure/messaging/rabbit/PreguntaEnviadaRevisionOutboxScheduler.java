package co.edu.unicauca.saberpro.pregunta.infrastructure.messaging.rabbit;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(
    name = "pregunta.outbox.scheduler.enabled",
    havingValue = "true",
    matchIfMissing = true
)
public class PreguntaEnviadaRevisionOutboxScheduler {

    private final PreguntaEnviadaRevisionOutboxDispatcher dispatcher;

    public PreguntaEnviadaRevisionOutboxScheduler(PreguntaEnviadaRevisionOutboxDispatcher dispatcher) {
        this.dispatcher = dispatcher;
    }

    @Scheduled(fixedDelayString = "${outbox.poll-interval-ms:1000}")
    public void poll() {
        dispatcher.dispatchPending();
    }
}
