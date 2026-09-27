package co.edu.unicauca.saberpro.pregunta.domain.repository;

import co.edu.unicauca.saberpro.pregunta.domain.model.Pregunta;

import java.util.Optional;
import java.util.UUID;

public interface PreguntaRepository {

    Optional<Pregunta> buscarPorId(UUID preguntaId);

    void guardar(Pregunta pregunta);
}
