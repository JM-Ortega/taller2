package co.edu.unicauca.saberpro.pregunta.infrastructure.persistence.jpa.pregunta;

import co.edu.unicauca.saberpro.pregunta.domain.exception.EstructuraPreguntaInvalidaException;
import co.edu.unicauca.saberpro.pregunta.domain.model.Competencia;
import co.edu.unicauca.saberpro.pregunta.domain.model.EstadoPregunta;
import co.edu.unicauca.saberpro.pregunta.domain.model.NivelDificultad;
import co.edu.unicauca.saberpro.pregunta.domain.model.OpcionRespuesta;
import co.edu.unicauca.saberpro.pregunta.domain.model.Pregunta;
import co.edu.unicauca.saberpro.pregunta.domain.model.Subtema;
import co.edu.unicauca.saberpro.pregunta.domain.model.Tema;
import co.edu.unicauca.saberpro.pregunta.infrastructure.persistence.jpa.pregunta.entity.OpcionRespuestaJpaEmbeddable;
import co.edu.unicauca.saberpro.pregunta.infrastructure.persistence.jpa.pregunta.entity.PreguntaJpaEntity;
import co.edu.unicauca.saberpro.pregunta.support.PreguntaTestFixtures;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class PreguntaPersistenceMapperTest {

    private final PreguntaPersistenceMapper mapper = new PreguntaPersistenceMapper();

    @Test
    void domainAJpaPreservaEscalares() {
        Pregunta pregunta = PreguntaTestFixtures.preguntaBorradorValida();

        PreguntaJpaEntity entity = mapper.toJpaEntity(pregunta);

        assertEquals(pregunta.getPreguntaId(), entity.getPreguntaId());
        assertEquals(pregunta.getAutorId(), entity.getAutorId());
        assertEquals(pregunta.getContexto(), entity.getContexto());
        assertEquals(pregunta.getPreguntaDirecta(), entity.getPreguntaDirecta());
        assertEquals(pregunta.getJustificacion(), entity.getJustificacion());
        assertEquals(pregunta.getBibliografia(), entity.getBibliografia());
        assertEquals(pregunta.getCompetencia().valor(), entity.getCompetencia());
        assertEquals(pregunta.getTema().valor(), entity.getTema());
        assertEquals(pregunta.getSubtema().valor(), entity.getSubtema());
        assertEquals(pregunta.getNivelDificultad().valor(), entity.getNivelDificultad());
        assertEquals(pregunta.getEstado().name(), entity.getEstado());
        assertEquals(pregunta.getNumeroVersionRevision(), entity.getNumeroVersionRevision());
    }

    @Test
    void domainAJpaPreservaOpcionesYOrden() {
        Pregunta pregunta = PreguntaTestFixtures.preguntaBorradorValida();

        PreguntaJpaEntity entity = mapper.toJpaEntity(pregunta);

        List<OpcionRespuesta> opcionesOriginales = pregunta.getOpciones();
        List<OpcionRespuestaJpaEmbeddable> opcionesMapeadas = entity.getOpciones();
        assertEquals(opcionesOriginales.size(), opcionesMapeadas.size());
        for (int i = 0; i < opcionesOriginales.size(); i++) {
            assertEquals(opcionesOriginales.get(i).texto(), opcionesMapeadas.get(i).getTexto());
            assertEquals(opcionesOriginales.get(i).correcta(), opcionesMapeadas.get(i).isCorrecta());
        }
    }

    @Test
    void jpaADomainReconstituyeConservandoTodo() {
        UUID preguntaId = UUID.randomUUID();
        List<OpcionRespuestaJpaEmbeddable> opciones = List.of(
            new OpcionRespuestaJpaEmbeddable("Opción correcta", true),
            new OpcionRespuestaJpaEmbeddable("Distractor 1", false),
            new OpcionRespuestaJpaEmbeddable("Distractor 2", false),
            new OpcionRespuestaJpaEmbeddable("Distractor 3", false),
            new OpcionRespuestaJpaEmbeddable("Distractor 4", false)
        );
        PreguntaJpaEntity entity = new PreguntaJpaEntity(
            preguntaId,
            "autor-1",
            "Contexto",
            "¿Pregunta?",
            opciones,
            "Justificación",
            "Bibliografía",
            "Competencia X",
            "Tema X",
            "Subtema X",
            "ALTO",
            "APROBADA",
            3
        );

        Pregunta pregunta = mapper.toDomain(entity);

        assertEquals(preguntaId, pregunta.getPreguntaId());
        assertEquals("autor-1", pregunta.getAutorId());
        assertEquals("Contexto", pregunta.getContexto());
        assertEquals("¿Pregunta?", pregunta.getPreguntaDirecta());
        assertEquals("Justificación", pregunta.getJustificacion());
        assertEquals("Bibliografía", pregunta.getBibliografia());
        assertEquals("Competencia X", pregunta.getCompetencia().valor());
        assertEquals("Tema X", pregunta.getTema().valor());
        assertEquals("Subtema X", pregunta.getSubtema().valor());
        assertEquals("ALTO", pregunta.getNivelDificultad().valor());
        assertEquals(EstadoPregunta.APROBADA, pregunta.getEstado());
        assertEquals(3, pregunta.getNumeroVersionRevision());
        assertEquals(5, pregunta.getOpciones().size());
        assertEquals("Opción correcta", pregunta.getOpciones().get(0).texto());
        assertEquals("Distractor 4", pregunta.getOpciones().get(4).texto());
    }

    @Test
    void roundTripConservaEstadoObservableCompleto() {
        Pregunta original = PreguntaTestFixtures.preguntaBorradorValida();

        Pregunta reconstruida = mapper.toDomain(mapper.toJpaEntity(original));

        assertEquals(original.getPreguntaId(), reconstruida.getPreguntaId());
        assertEquals(original.getAutorId(), reconstruida.getAutorId());
        assertEquals(original.getContexto(), reconstruida.getContexto());
        assertEquals(original.getPreguntaDirecta(), reconstruida.getPreguntaDirecta());
        assertEquals(original.getJustificacion(), reconstruida.getJustificacion());
        assertEquals(original.getBibliografia(), reconstruida.getBibliografia());
        assertEquals(original.getCompetencia(), reconstruida.getCompetencia());
        assertEquals(original.getTema(), reconstruida.getTema());
        assertEquals(original.getSubtema(), reconstruida.getSubtema());
        assertEquals(original.getNivelDificultad(), reconstruida.getNivelDificultad());
        assertEquals(original.getEstado(), reconstruida.getEstado());
        assertEquals(original.getNumeroVersionRevision(), reconstruida.getNumeroVersionRevision());
        assertEquals(original.getOpciones(), reconstruida.getOpciones());
    }

    @Test
    void roundTripDeEstadoDistintoDeBorradorNoReiniciaEstadoNiVersion() {
        Pregunta enRevision = Pregunta.reconstituir(
            UUID.randomUUID(),
            "autor-1",
            "Contexto",
            "¿Pregunta?",
            PreguntaTestFixtures.opcionesValidas(),
            "Justificación",
            "Bibliografía",
            new Competencia("Comunicación escrita"),
            new Tema("Tema"),
            new Subtema("Subtema"),
            new NivelDificultad("MEDIO"),
            EstadoPregunta.EN_REVISION,
            2
        );

        Pregunta reconstruida = mapper.toDomain(mapper.toJpaEntity(enRevision));

        assertEquals(EstadoPregunta.EN_REVISION, reconstruida.getEstado());
        assertEquals(2, reconstruida.getNumeroVersionRevision());
    }

    @Test
    void datosPersistidosEstructuralmenteInvalidosFallanAlReconstituir() {
        List<OpcionRespuestaJpaEmbeddable> opcionesInvalidas = List.of(
            new OpcionRespuestaJpaEmbeddable("Opción correcta", true),
            new OpcionRespuestaJpaEmbeddable("Distractor 1", false),
            new OpcionRespuestaJpaEmbeddable("Distractor 2", false),
            new OpcionRespuestaJpaEmbeddable("Distractor 3", false)
        );
        PreguntaJpaEntity entity = new PreguntaJpaEntity(
            UUID.randomUUID(),
            "autor-1",
            "Contexto",
            "¿Pregunta?",
            opcionesInvalidas,
            "Justificación",
            "Bibliografía",
            "Competencia X",
            "Tema X",
            "Subtema X",
            "ALTO",
            "BORRADOR",
            0
        );

        assertThrows(EstructuraPreguntaInvalidaException.class, () -> mapper.toDomain(entity));
    }
}
