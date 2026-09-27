package co.edu.unicauca.saberpro.pregunta.infrastructure.persistence.jpa.pregunta;

import co.edu.unicauca.saberpro.pregunta.infrastructure.persistence.jpa.pregunta.entity.PreguntaJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface PreguntaJpaRepository extends JpaRepository<PreguntaJpaEntity, UUID> {
}
