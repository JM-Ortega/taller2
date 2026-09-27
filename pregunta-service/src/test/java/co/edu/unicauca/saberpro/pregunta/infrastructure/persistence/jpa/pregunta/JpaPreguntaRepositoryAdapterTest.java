package co.edu.unicauca.saberpro.pregunta.infrastructure.persistence.jpa.pregunta;

import co.edu.unicauca.saberpro.pregunta.domain.model.Pregunta;
import co.edu.unicauca.saberpro.pregunta.infrastructure.persistence.jpa.pregunta.entity.PreguntaJpaEntity;
import co.edu.unicauca.saberpro.pregunta.support.PreguntaTestFixtures;
import org.junit.jupiter.api.Test;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class JpaPreguntaRepositoryAdapterTest {

    private final PreguntaJpaRepository jpaRepository = mock(PreguntaJpaRepository.class);
    private final PreguntaPersistenceMapper mapper = new PreguntaPersistenceMapper();
    private final JpaPreguntaRepositoryAdapter adapter =
        new JpaPreguntaRepositoryAdapter(jpaRepository, mapper);

    @Test
    void buscarPorIdExistenteRetornaElAggregateMapeado() {
        Pregunta pregunta = PreguntaTestFixtures.preguntaBorradorValida();
        PreguntaJpaEntity entity = mapper.toJpaEntity(pregunta);
        when(jpaRepository.findById(pregunta.getPreguntaId())).thenReturn(Optional.of(entity));

        Optional<Pregunta> resultado = adapter.buscarPorId(pregunta.getPreguntaId());

        assertTrue(resultado.isPresent());
        assertEquals(pregunta.getPreguntaId(), resultado.get().getPreguntaId());
        assertEquals(pregunta.getAutorId(), resultado.get().getAutorId());
        assertEquals(pregunta.getEstado(), resultado.get().getEstado());
    }

    @Test
    void buscarPorIdInexistenteRetornaOptionalVacio() {
        UUID preguntaId = UUID.randomUUID();
        when(jpaRepository.findById(preguntaId)).thenReturn(Optional.empty());

        Optional<Pregunta> resultado = adapter.buscarPorId(preguntaId);

        assertFalse(resultado.isPresent());
    }

    @Test
    void guardarLlamaSaveUnaVezConEntidadEquivalente() {
        Pregunta pregunta = PreguntaTestFixtures.preguntaBorradorValida();

        adapter.guardar(pregunta);

        verify(jpaRepository).save(argThat(entity ->
            entity.getPreguntaId().equals(pregunta.getPreguntaId())
                && entity.getAutorId().equals(pregunta.getAutorId())
                && entity.getEstado().equals(pregunta.getEstado().name())
                && entity.getNumeroVersionRevision() == pregunta.getNumeroVersionRevision()
        ));
    }
}
