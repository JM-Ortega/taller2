package co.edu.unicauca.saberpro.pregunta.infrastructure.persistence.jpa.pregunta;

import co.edu.unicauca.saberpro.pregunta.domain.model.Pregunta;
import co.edu.unicauca.saberpro.pregunta.domain.repository.PreguntaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public class JpaPreguntaRepositoryAdapter implements PreguntaRepository {

    private final PreguntaJpaRepository jpaRepository;
    private final PreguntaPersistenceMapper mapper;

    public JpaPreguntaRepositoryAdapter(PreguntaJpaRepository jpaRepository, PreguntaPersistenceMapper mapper) {
        this.jpaRepository = jpaRepository;
        this.mapper = mapper;
    }

    @Override
    public Optional<Pregunta> buscarPorId(UUID preguntaId) {
        return jpaRepository.findById(preguntaId).map(mapper::toDomain);
    }

    @Override
    public void guardar(Pregunta pregunta) {
        jpaRepository.save(mapper.toJpaEntity(pregunta));
    }
}
