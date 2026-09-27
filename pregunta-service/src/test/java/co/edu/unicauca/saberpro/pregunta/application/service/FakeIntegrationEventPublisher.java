package co.edu.unicauca.saberpro.pregunta.application.service;

import co.edu.unicauca.saberpro.pregunta.application.port.out.IntegrationEventPublisher;
import co.edu.unicauca.saberpro.pregunta.domain.event.PreguntaEnviadaARevision;

import java.util.ArrayList;
import java.util.List;

class FakeIntegrationEventPublisher implements IntegrationEventPublisher {

    private final List<PreguntaEnviadaARevision> publicados = new ArrayList<>();

    @Override
    public void publish(PreguntaEnviadaARevision event) {
        publicados.add(event);
    }

    List<PreguntaEnviadaARevision> publicados() {
        return publicados;
    }
}
