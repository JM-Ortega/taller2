package co.edu.unicauca.saberpro.pregunta.infrastructure.persistence.jpa.outbox;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface OutboxEventJpaRepository extends JpaRepository<OutboxEventJpaEntity, UUID> {

    List<OutboxEventJpaEntity> findByEventTypeAndPublishedAtIsNullOrderByOccurredAtAsc(String eventType);
}
