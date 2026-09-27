package co.edu.unicauca.saberpro.pregunta.interfaces.grpc;

import co.edu.unicauca.saberpro.pregunta.application.command.IniciarRevisionPreguntaCommand;
import co.edu.unicauca.saberpro.pregunta.application.exception.PreguntaNoEncontradaException;
import co.edu.unicauca.saberpro.pregunta.application.port.in.IniciarRevisionPreguntaUseCase;
import co.edu.unicauca.saberpro.pregunta.domain.exception.EstadoPreguntaIncompatibleException;
import co.edu.unicauca.saberpro.pregunta.domain.exception.VersionPreguntaIncompatibleException;
import co.edu.unicauca.saberpro.pregunta.domain.model.Pregunta;
import co.edu.unicauca.saberpro.preguntas.grpc.IniciarRevisionRequest;
import co.edu.unicauca.saberpro.preguntas.grpc.IniciarRevisionResponse;
import co.edu.unicauca.saberpro.preguntas.grpc.OpcionRespuesta;
import co.edu.unicauca.saberpro.preguntas.grpc.PreguntaRevisionServiceGrpc;
import io.grpc.Status;
import io.grpc.stub.StreamObserver;
import org.springframework.grpc.server.service.GrpcService;

import java.util.UUID;

@GrpcService
public class PreguntaRevisionGrpcService
    extends PreguntaRevisionServiceGrpc.PreguntaRevisionServiceImplBase {

    private static final String MENSAJE_INTERNO = "Ha ocurrido un error inesperado.";

    private final IniciarRevisionPreguntaUseCase iniciarRevisionPreguntaUseCase;

    public PreguntaRevisionGrpcService(IniciarRevisionPreguntaUseCase iniciarRevisionPreguntaUseCase) {
        this.iniciarRevisionPreguntaUseCase = iniciarRevisionPreguntaUseCase;
    }

    @Override
    public void iniciarRevision(
        IniciarRevisionRequest request,
        StreamObserver<IniciarRevisionResponse> responseObserver
    ) {
        UUID preguntaId;
        try {
            preguntaId = validarPreguntaId(request.getPreguntaId());
            validarVersion(request.getVersion());
        } catch (IllegalArgumentException ex) {
            responseObserver.onError(
                Status.INVALID_ARGUMENT.withDescription(ex.getMessage()).asRuntimeException()
            );
            return;
        }

        try {
            Pregunta pregunta = iniciarRevisionPreguntaUseCase.iniciarRevision(
                new IniciarRevisionPreguntaCommand(preguntaId, request.getVersion())
            );
            responseObserver.onNext(toResponse(pregunta));
            responseObserver.onCompleted();
        } catch (PreguntaNoEncontradaException ex) {
            responseObserver.onError(
                Status.NOT_FOUND.withDescription(ex.getMessage()).asRuntimeException()
            );
        } catch (EstadoPreguntaIncompatibleException | VersionPreguntaIncompatibleException ex) {
            responseObserver.onError(
                Status.FAILED_PRECONDITION.withDescription(ex.getMessage()).asRuntimeException()
            );
        } catch (RuntimeException ex) {
            responseObserver.onError(
                Status.INTERNAL.withDescription(MENSAJE_INTERNO).asRuntimeException()
            );
        }
    }

    private UUID validarPreguntaId(String preguntaId) {
        if (preguntaId == null || preguntaId.isBlank()) {
            throw new IllegalArgumentException("pregunta_id no puede ser nulo ni estar en blanco");
        }
        try {
            return UUID.fromString(preguntaId);
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("pregunta_id debe ser un UUID válido");
        }
    }

    private void validarVersion(int version) {
        if (version < 1) {
            throw new IllegalArgumentException("version debe ser mayor o igual a 1");
        }
    }

    private IniciarRevisionResponse toResponse(Pregunta pregunta) {
        IniciarRevisionResponse.Builder builder = IniciarRevisionResponse.newBuilder()
            .setPreguntaId(pregunta.getPreguntaId().toString())
            .setVersion(pregunta.getNumeroVersionRevision())
            .setContexto(pregunta.getContexto())
            .setPreguntaDirecta(pregunta.getPreguntaDirecta())
            .setJustificacion(pregunta.getJustificacion())
            .setBibliografia(pregunta.getBibliografia())
            .setCompetencia(pregunta.getCompetencia().valor())
            .setTema(pregunta.getTema().valor())
            .setSubtema(pregunta.getSubtema().valor())
            .setNivelDificultad(pregunta.getNivelDificultad().valor());

        pregunta.getOpciones().forEach(opcion -> builder.addOpciones(
            OpcionRespuesta.newBuilder()
                .setTexto(opcion.texto())
                .setCorrecta(opcion.correcta())
                .build()
        ));

        return builder.build();
    }
}
