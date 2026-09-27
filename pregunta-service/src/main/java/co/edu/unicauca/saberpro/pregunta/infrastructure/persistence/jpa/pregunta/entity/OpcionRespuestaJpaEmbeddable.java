package co.edu.unicauca.saberpro.pregunta.infrastructure.persistence.jpa.pregunta.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

@Embeddable
public class OpcionRespuestaJpaEmbeddable {

    @Column(name = "texto", nullable = false, columnDefinition = "text")
    private String texto;

    @Column(name = "correcta", nullable = false)
    private boolean correcta;

    protected OpcionRespuestaJpaEmbeddable() {
    }

    public OpcionRespuestaJpaEmbeddable(String texto, boolean correcta) {
        this.texto = texto;
        this.correcta = correcta;
    }

    public String getTexto() {
        return texto;
    }

    public boolean isCorrecta() {
        return correcta;
    }
}
