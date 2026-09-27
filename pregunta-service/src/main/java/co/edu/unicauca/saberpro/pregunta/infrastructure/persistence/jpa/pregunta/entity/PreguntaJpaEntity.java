package co.edu.unicauca.saberpro.pregunta.infrastructure.persistence.jpa.pregunta.entity;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OrderColumn;
import jakarta.persistence.Table;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "pregunta")
public class PreguntaJpaEntity {

    @Id
    @Column(name = "pregunta_id")
    private UUID preguntaId;

    @Column(name = "autor_id", nullable = false, columnDefinition = "text")
    private String autorId;

    @Column(name = "contexto", nullable = false, columnDefinition = "text")
    private String contexto;

    @Column(name = "pregunta_directa", nullable = false, columnDefinition = "text")
    private String preguntaDirecta;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "pregunta_opcion", joinColumns = @JoinColumn(name = "pregunta_id", nullable = false))
    @OrderColumn(name = "orden", nullable = false)
    private List<OpcionRespuestaJpaEmbeddable> opciones = new ArrayList<>();

    @Column(name = "justificacion", nullable = false, columnDefinition = "text")
    private String justificacion;

    @Column(name = "bibliografia", nullable = false, columnDefinition = "text")
    private String bibliografia;

    @Column(name = "competencia", nullable = false, columnDefinition = "text")
    private String competencia;

    @Column(name = "tema", nullable = false, columnDefinition = "text")
    private String tema;

    @Column(name = "subtema", nullable = false, columnDefinition = "text")
    private String subtema;

    @Column(name = "nivel_dificultad", nullable = false, columnDefinition = "text")
    private String nivelDificultad;

    @Column(name = "estado", nullable = false)
    private String estado;

    @Column(name = "numero_version_revision", nullable = false)
    private int numeroVersionRevision;

    protected PreguntaJpaEntity() {
    }

    public PreguntaJpaEntity(
        UUID preguntaId,
        String autorId,
        String contexto,
        String preguntaDirecta,
        List<OpcionRespuestaJpaEmbeddable> opciones,
        String justificacion,
        String bibliografia,
        String competencia,
        String tema,
        String subtema,
        String nivelDificultad,
        String estado,
        int numeroVersionRevision
    ) {
        this.preguntaId = preguntaId;
        this.autorId = autorId;
        this.contexto = contexto;
        this.preguntaDirecta = preguntaDirecta;
        this.opciones = new ArrayList<>(opciones);
        this.justificacion = justificacion;
        this.bibliografia = bibliografia;
        this.competencia = competencia;
        this.tema = tema;
        this.subtema = subtema;
        this.nivelDificultad = nivelDificultad;
        this.estado = estado;
        this.numeroVersionRevision = numeroVersionRevision;
    }

    public UUID getPreguntaId() {
        return preguntaId;
    }

    public String getAutorId() {
        return autorId;
    }

    public String getContexto() {
        return contexto;
    }

    public String getPreguntaDirecta() {
        return preguntaDirecta;
    }

    public List<OpcionRespuestaJpaEmbeddable> getOpciones() {
        return List.copyOf(opciones);
    }

    public String getJustificacion() {
        return justificacion;
    }

    public String getBibliografia() {
        return bibliografia;
    }

    public String getCompetencia() {
        return competencia;
    }

    public String getTema() {
        return tema;
    }

    public String getSubtema() {
        return subtema;
    }

    public String getNivelDificultad() {
        return nivelDificultad;
    }

    public String getEstado() {
        return estado;
    }

    public int getNumeroVersionRevision() {
        return numeroVersionRevision;
    }
}
