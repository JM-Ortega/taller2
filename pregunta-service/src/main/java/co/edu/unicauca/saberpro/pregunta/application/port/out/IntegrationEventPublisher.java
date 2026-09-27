package co.edu.unicauca.saberpro.pregunta.application.port.out;

import co.edu.unicauca.saberpro.pregunta.domain.event.PreguntaEnviadaARevision;

public interface IntegrationEventPublisher {

    void publish(PreguntaEnviadaARevision event);
}
