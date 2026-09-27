package co.edu.unicauca.saberpro.pregunta.application.service;

import co.edu.unicauca.saberpro.pregunta.domain.model.Pregunta;
import co.edu.unicauca.saberpro.pregunta.domain.repository.PreguntaRepository;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

class FakePreguntaRepository implements PreguntaRepository {

    private final Map<UUID, Pregunta> almacen = new HashMap<>();
    private int vecesGuardado = 0;

    void agregar(Pregunta pregunta) {
        almacen.put(pregunta.getPreguntaId(), pregunta);
    }

    @Override
    public Optional<Pregunta> buscarPorId(UUID preguntaId) {
        return Optional.ofNullable(almacen.get(preguntaId));
    }

    @Override
    public void guardar(Pregunta pregunta) {
        almacen.put(pregunta.getPreguntaId(), pregunta);
        vecesGuardado++;
    }

    int vecesGuardado() {
        return vecesGuardado;
    }
}
