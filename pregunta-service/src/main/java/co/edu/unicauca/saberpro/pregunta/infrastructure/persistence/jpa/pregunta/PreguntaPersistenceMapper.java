package co.edu.unicauca.saberpro.pregunta.infrastructure.persistence.jpa.pregunta;

import co.edu.unicauca.saberpro.pregunta.domain.model.Competencia;
import co.edu.unicauca.saberpro.pregunta.domain.model.EstadoPregunta;
import co.edu.unicauca.saberpro.pregunta.domain.model.NivelDificultad;
import co.edu.unicauca.saberpro.pregunta.domain.model.OpcionRespuesta;
import co.edu.unicauca.saberpro.pregunta.domain.model.Pregunta;
import co.edu.unicauca.saberpro.pregunta.domain.model.Subtema;
import co.edu.unicauca.saberpro.pregunta.domain.model.Tema;
import co.edu.unicauca.saberpro.pregunta.infrastructure.persistence.jpa.pregunta.entity.OpcionRespuestaJpaEmbeddable;
import co.edu.unicauca.saberpro.pregunta.infrastructure.persistence.jpa.pregunta.entity.PreguntaJpaEntity;

import java.util.List;
import java.util.stream.Collectors;

public class PreguntaPersistenceMapper {

    public PreguntaJpaEntity toJpaEntity(Pregunta pregunta) {
        List<OpcionRespuestaJpaEmbeddable> opciones = pregunta.getOpciones().stream()
            .map(opcion -> new OpcionRespuestaJpaEmbeddable(opcion.texto(), opcion.correcta()))
            .collect(Collectors.toList());

        return new PreguntaJpaEntity(
            pregunta.getPreguntaId(),
            pregunta.getAutorId(),
            pregunta.getContexto(),
            pregunta.getPreguntaDirecta(),
            opciones,
            pregunta.getJustificacion(),
            pregunta.getBibliografia(),
            pregunta.getCompetencia().valor(),
            pregunta.getTema().valor(),
            pregunta.getSubtema().valor(),
            pregunta.getNivelDificultad().valor(),
            pregunta.getEstado().name(),
            pregunta.getNumeroVersionRevision()
        );
    }

    public Pregunta toDomain(PreguntaJpaEntity entity) {
        List<OpcionRespuesta> opciones = entity.getOpciones().stream()
            .map(opcion -> new OpcionRespuesta(opcion.getTexto(), opcion.isCorrecta()))
            .collect(Collectors.toList());

        return Pregunta.reconstituir(
            entity.getPreguntaId(),
            entity.getAutorId(),
            entity.getContexto(),
            entity.getPreguntaDirecta(),
            opciones,
            entity.getJustificacion(),
            entity.getBibliografia(),
            new Competencia(entity.getCompetencia()),
            new Tema(entity.getTema()),
            new Subtema(entity.getSubtema()),
            new NivelDificultad(entity.getNivelDificultad()),
            EstadoPregunta.valueOf(entity.getEstado()),
            entity.getNumeroVersionRevision()
        );
    }
}
