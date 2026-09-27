package co.edu.unicauca.saberpro.pregunta.domain.model;

import co.edu.unicauca.saberpro.pregunta.domain.event.PreguntaEnviadaARevision;
import co.edu.unicauca.saberpro.pregunta.domain.exception.EstadoPreguntaIncompatibleException;
import co.edu.unicauca.saberpro.pregunta.domain.exception.EstructuraPreguntaInvalidaException;
import co.edu.unicauca.saberpro.pregunta.domain.exception.ResultadoRevisionContradictorioException;
import co.edu.unicauca.saberpro.pregunta.domain.exception.VersionPreguntaIncompatibleException;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public final class Pregunta {

    private final UUID preguntaId;
    private final String autorId;
    private String contexto;
    private String preguntaDirecta;
    private List<OpcionRespuesta> opciones;
    private String justificacion;
    private String bibliografia;
    private Competencia competencia;
    private Tema tema;
    private Subtema subtema;
    private NivelDificultad nivelDificultad;
    private EstadoPregunta estado;
    private int numeroVersionRevision;

    private Pregunta(
        UUID preguntaId,
        String autorId,
        String contexto,
        String preguntaDirecta,
        List<OpcionRespuesta> opciones,
        String justificacion,
        String bibliografia,
        Competencia competencia,
        Tema tema,
        Subtema subtema,
        NivelDificultad nivelDificultad,
        EstadoPregunta estado,
        int numeroVersionRevision
    ) {
        this.preguntaId = preguntaId;
        this.autorId = autorId;
        this.contexto = contexto;
        this.preguntaDirecta = preguntaDirecta;
        this.opciones = opciones;
        this.justificacion = justificacion;
        this.bibliografia = bibliografia;
        this.competencia = competencia;
        this.tema = tema;
        this.subtema = subtema;
        this.nivelDificultad = nivelDificultad;
        this.estado = estado;
        this.numeroVersionRevision = numeroVersionRevision;
    }

    public static Pregunta crear(
        UUID preguntaId,
        String autorId,
        String contexto,
        String preguntaDirecta,
        List<OpcionRespuesta> opciones,
        String justificacion,
        String bibliografia,
        Competencia competencia,
        Tema tema,
        Subtema subtema,
        NivelDificultad nivelDificultad
    ) {
        validarEstructura(
            preguntaId, autorId, contexto, preguntaDirecta, opciones,
            justificacion, bibliografia, competencia, tema, subtema, nivelDificultad
        );
        return new Pregunta(
            preguntaId, autorId, contexto, preguntaDirecta, List.copyOf(opciones),
            justificacion, bibliografia, competencia, tema, subtema, nivelDificultad,
            EstadoPregunta.BORRADOR, 0
        );
    }

    public static Pregunta reconstituir(
        UUID preguntaId,
        String autorId,
        String contexto,
        String preguntaDirecta,
        List<OpcionRespuesta> opciones,
        String justificacion,
        String bibliografia,
        Competencia competencia,
        Tema tema,
        Subtema subtema,
        NivelDificultad nivelDificultad,
        EstadoPregunta estado,
        int numeroVersionRevision
    ) {
        if (estado == null) {
            throw new EstructuraPreguntaInvalidaException("estado es obligatorio");
        }
        if (numeroVersionRevision < 0) {
            throw new EstructuraPreguntaInvalidaException("numeroVersionRevision no puede ser negativo");
        }
        validarEstructura(
            preguntaId, autorId, contexto, preguntaDirecta, opciones,
            justificacion, bibliografia, competencia, tema, subtema, nivelDificultad
        );
        return new Pregunta(
            preguntaId, autorId, contexto, preguntaDirecta, List.copyOf(opciones),
            justificacion, bibliografia, competencia, tema, subtema, nivelDificultad,
            estado, numeroVersionRevision
        );
    }

    public void actualizar(
        String contexto,
        String preguntaDirecta,
        List<OpcionRespuesta> opciones,
        String justificacion,
        String bibliografia,
        Competencia competencia,
        Tema tema,
        Subtema subtema,
        NivelDificultad nivelDificultad
    ) {
        exigirEstado(EstadoPregunta.BORRADOR, "actualizar");
        validarEstructura(
            preguntaId, autorId, contexto, preguntaDirecta, opciones,
            justificacion, bibliografia, competencia, tema, subtema, nivelDificultad
        );
        this.contexto = contexto;
        this.preguntaDirecta = preguntaDirecta;
        this.opciones = List.copyOf(opciones);
        this.justificacion = justificacion;
        this.bibliografia = bibliografia;
        this.competencia = competencia;
        this.tema = tema;
        this.subtema = subtema;
        this.nivelDificultad = nivelDificultad;
    }

    public PreguntaEnviadaARevision enviarARevision(Instant occurredAt) {
        exigirEstado(EstadoPregunta.BORRADOR, "enviar a revisión");
        validarEstructura(
            preguntaId, autorId, contexto, preguntaDirecta, opciones,
            justificacion, bibliografia, competencia, tema, subtema, nivelDificultad
        );
        this.numeroVersionRevision = numeroVersionRevision + 1;
        this.estado = EstadoPregunta.PENDIENTE_REVISION;
        return new PreguntaEnviadaARevision(preguntaId, autorId, numeroVersionRevision, occurredAt);
    }

    public boolean iniciarRevision(int version) {
        if (version != numeroVersionRevision) {
            throw new VersionPreguntaIncompatibleException(
                "la versión " + version + " no coincide con la versión actual " + numeroVersionRevision
            );
        }
        if (estado == EstadoPregunta.PENDIENTE_REVISION) {
            estado = EstadoPregunta.EN_REVISION;
            return true;
        }
        if (estado == EstadoPregunta.EN_REVISION) {
            return false;
        }
        throw new EstadoPreguntaIncompatibleException(
            "no se puede iniciar revisión de la versión " + version + " estando en " + estado
        );
    }

    public boolean aprobarTrasRevision(int versionPregunta) {
        if (versionPregunta < numeroVersionRevision) {
            return false;
        }
        if (versionPregunta > numeroVersionRevision) {
            throw new VersionPreguntaIncompatibleException(
                "la versión " + versionPregunta + " es posterior a la versión actual " + numeroVersionRevision
            );
        }
        if (estado == EstadoPregunta.EN_REVISION) {
            estado = EstadoPregunta.APROBADA;
            return true;
        }
        if (estado == EstadoPregunta.APROBADA) {
            return false;
        }
        if (estado == EstadoPregunta.RECHAZADA) {
            throw new ResultadoRevisionContradictorioException(
                "resultado FAVORABLE contradice el estado RECHAZADA para la versión " + versionPregunta
            );
        }
        if (estado == EstadoPregunta.BORRADOR && versionPregunta > 0) {
            throw new ResultadoRevisionContradictorioException(
                "resultado FAVORABLE contradice una pregunta reabierta en BORRADOR para la versión " + versionPregunta
            );
        }
        throw new EstadoPreguntaIncompatibleException(
            "no se puede procesar un resultado de revisión estando en " + estado
        );
    }

    public boolean rechazarTrasRevision(int versionPregunta) {
        if (versionPregunta < numeroVersionRevision) {
            return false;
        }
        if (versionPregunta > numeroVersionRevision) {
            throw new VersionPreguntaIncompatibleException(
                "la versión " + versionPregunta + " es posterior a la versión actual " + numeroVersionRevision
            );
        }
        if (estado == EstadoPregunta.EN_REVISION) {
            estado = EstadoPregunta.RECHAZADA;
            return true;
        }
        if (estado == EstadoPregunta.RECHAZADA) {
            return false;
        }
        if (estado == EstadoPregunta.APROBADA) {
            throw new ResultadoRevisionContradictorioException(
                "resultado DESFAVORABLE contradice el estado APROBADA para la versión " + versionPregunta
            );
        }
        if (estado == EstadoPregunta.BORRADOR && versionPregunta > 0) {
            return false;
        }
        throw new EstadoPreguntaIncompatibleException(
            "no se puede procesar un resultado de revisión estando en " + estado
        );
    }

    public void reabrirParaCorreccion() {
        exigirEstado(EstadoPregunta.RECHAZADA, "reabrir para corrección");
        estado = EstadoPregunta.BORRADOR;
    }

    private void exigirEstado(EstadoPregunta esperado, String accion) {
        if (estado != esperado) {
            throw new EstadoPreguntaIncompatibleException(
                "no se puede " + accion + " una pregunta en estado " + estado
            );
        }
    }

    private static void validarEstructura(
        UUID preguntaId,
        String autorId,
        String contexto,
        String preguntaDirecta,
        List<OpcionRespuesta> opciones,
        String justificacion,
        String bibliografia,
        Competencia competencia,
        Tema tema,
        Subtema subtema,
        NivelDificultad nivelDificultad
    ) {
        if (preguntaId == null) {
            throw new EstructuraPreguntaInvalidaException("preguntaId es obligatorio");
        }
        exigirTexto(autorId, "autorId");
        exigirTexto(contexto, "contexto");
        exigirTexto(preguntaDirecta, "preguntaDirecta");
        exigirTexto(justificacion, "justificacion");
        exigirTexto(bibliografia, "bibliografia");
        exigirCompetencia(competencia);
        exigirTema(tema);
        exigirSubtema(subtema);
        exigirNivelDificultad(nivelDificultad);
        exigirOpciones(opciones);
    }

    private static void exigirCompetencia(Competencia competencia) {
        if (competencia == null) {
            throw new EstructuraPreguntaInvalidaException("competencia es obligatoria");
        }
        exigirTexto(competencia.valor(), "competencia");
    }

    private static void exigirTema(Tema tema) {
        if (tema == null) {
            throw new EstructuraPreguntaInvalidaException("tema es obligatorio");
        }
        exigirTexto(tema.valor(), "tema");
    }

    private static void exigirSubtema(Subtema subtema) {
        if (subtema == null) {
            throw new EstructuraPreguntaInvalidaException("subtema es obligatorio");
        }
        exigirTexto(subtema.valor(), "subtema");
    }

    private static void exigirNivelDificultad(NivelDificultad nivelDificultad) {
        if (nivelDificultad == null) {
            throw new EstructuraPreguntaInvalidaException("nivelDificultad es obligatorio");
        }
        exigirTexto(nivelDificultad.valor(), "nivelDificultad");
    }

    private static void exigirOpciones(List<OpcionRespuesta> opciones) {
        if (opciones == null) {
            throw new EstructuraPreguntaInvalidaException("opciones no puede ser nulo");
        }
        if (opciones.size() != 5) {
            throw new EstructuraPreguntaInvalidaException("se requieren exactamente 5 opciones de respuesta");
        }
        int correctas = 0;
        for (OpcionRespuesta opcion : opciones) {
            if (opcion == null) {
                throw new EstructuraPreguntaInvalidaException("ninguna opción puede ser nula");
            }
            exigirTexto(opcion.texto(), "texto de la opción");
            if (esExpresionProhibida(opcion.texto())) {
                throw new EstructuraPreguntaInvalidaException(
                    "el texto de la opción no puede ser \"" + opcion.texto().trim() + "\""
                );
            }
            if (opcion.correcta()) {
                correctas++;
            }
        }
        if (correctas != 1) {
            throw new EstructuraPreguntaInvalidaException("se requiere exactamente una opción correcta");
        }
        long distractores = opciones.stream().filter(opcion -> !opcion.correcta()).count();
        if (distractores != 4) {
            throw new EstructuraPreguntaInvalidaException("se requieren exactamente 4 distractores");
        }
    }

    private static boolean esExpresionProhibida(String texto) {
        String normalizado = texto.trim();
        return normalizado.equalsIgnoreCase("Todas las anteriores")
            || normalizado.equalsIgnoreCase("Ninguna de las anteriores");
    }

    private static void exigirTexto(String valor, String campo) {
        if (valor == null || valor.isBlank()) {
            throw new EstructuraPreguntaInvalidaException(campo + " no puede ser nulo ni estar en blanco");
        }
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

    public List<OpcionRespuesta> getOpciones() {
        return opciones;
    }

    public String getJustificacion() {
        return justificacion;
    }

    public String getBibliografia() {
        return bibliografia;
    }

    public Competencia getCompetencia() {
        return competencia;
    }

    public Tema getTema() {
        return tema;
    }

    public Subtema getSubtema() {
        return subtema;
    }

    public NivelDificultad getNivelDificultad() {
        return nivelDificultad;
    }

    public EstadoPregunta getEstado() {
        return estado;
    }

    public int getNumeroVersionRevision() {
        return numeroVersionRevision;
    }
}
