package co.edu.unicauca.saberpro.pregunta.interfaces.grpc;

import co.edu.unicauca.saberpro.pregunta.application.command.IniciarRevisionPreguntaCommand;
import co.edu.unicauca.saberpro.pregunta.application.exception.PreguntaNoEncontradaException;
import co.edu.unicauca.saberpro.pregunta.application.port.in.IniciarRevisionPreguntaUseCase;
import co.edu.unicauca.saberpro.pregunta.domain.exception.EstadoPreguntaIncompatibleException;
import co.edu.unicauca.saberpro.pregunta.domain.exception.VersionPreguntaIncompatibleException;
import co.edu.unicauca.saberpro.pregunta.domain.model.Competencia;
import co.edu.unicauca.saberpro.pregunta.domain.model.EstadoPregunta;
import co.edu.unicauca.saberpro.pregunta.domain.model.NivelDificultad;
import co.edu.unicauca.saberpro.pregunta.domain.model.Pregunta;
import co.edu.unicauca.saberpro.pregunta.domain.model.Subtema;
import co.edu.unicauca.saberpro.pregunta.domain.model.Tema;
import co.edu.unicauca.saberpro.pregunta.support.PreguntaTestFixtures;
import co.edu.unicauca.saberpro.preguntas.grpc.IniciarRevisionRequest;
import co.edu.unicauca.saberpro.preguntas.grpc.IniciarRevisionResponse;
import io.grpc.Status;
import io.grpc.stub.StreamObserver;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class PreguntaRevisionGrpcServiceTest {

    private final IniciarRevisionPreguntaUseCase useCase = mock(IniciarRevisionPreguntaUseCase.class);
    private final PreguntaRevisionGrpcService service = new PreguntaRevisionGrpcService(useCase);

    @SuppressWarnings("unchecked")
    private final StreamObserver<IniciarRevisionResponse> responseObserver = mock(StreamObserver.class);

    private Pregunta preguntaEnRevision(UUID preguntaId, int version) {
        return Pregunta.reconstituir(
            preguntaId,
            "autor-1",
            "Contexto de ejemplo",
            "¿Cuál es la respuesta correcta?",
            PreguntaTestFixtures.opcionesValidas(),
            "Justificación de ejemplo",
            "Bibliografía de ejemplo",
            new Competencia("Comunicación escrita"),
            new Tema("Tema ejemplo"),
            new Subtema("Subtema ejemplo"),
            new NivelDificultad("MEDIO"),
            EstadoPregunta.EN_REVISION,
            version
        );
    }

    private static Status statusEnviado(StreamObserver<IniciarRevisionResponse> observer) {
        ArgumentCaptor<Throwable> captor = ArgumentCaptor.forClass(Throwable.class);
        verify(observer).onError(captor.capture());
        return Status.fromThrowable(captor.getValue());
    }

    @Test
    void requestValidoConstruyeElCommandExactoEInvocaUnaVezElUseCase() {
        UUID preguntaId = UUID.randomUUID();
        Pregunta pregunta = preguntaEnRevision(preguntaId, 2);
        when(useCase.iniciarRevision(any(IniciarRevisionPreguntaCommand.class))).thenReturn(pregunta);

        IniciarRevisionRequest request = IniciarRevisionRequest.newBuilder()
            .setPreguntaId(preguntaId.toString())
            .setVersion(2)
            .build();

        service.iniciarRevision(request, responseObserver);

        ArgumentCaptor<IniciarRevisionPreguntaCommand> captor =
            ArgumentCaptor.forClass(IniciarRevisionPreguntaCommand.class);
        verify(useCase).iniciarRevision(captor.capture());
        assertEquals(preguntaId, captor.getValue().preguntaId());
        assertEquals(2, captor.getValue().version());

        ArgumentCaptor<IniciarRevisionResponse> responseCaptor =
            ArgumentCaptor.forClass(IniciarRevisionResponse.class);
        verify(responseObserver).onNext(responseCaptor.capture());
        verify(responseObserver).onCompleted();
        IniciarRevisionResponse response = responseCaptor.getValue();

        assertEquals(preguntaId.toString(), response.getPreguntaId());
        assertEquals(2, response.getVersion());
        assertEquals(pregunta.getContexto(), response.getContexto());
        assertEquals(pregunta.getPreguntaDirecta(), response.getPreguntaDirecta());
        assertEquals(pregunta.getJustificacion(), response.getJustificacion());
        assertEquals(pregunta.getBibliografia(), response.getBibliografia());
        assertEquals(pregunta.getCompetencia().valor(), response.getCompetencia());
        assertEquals(pregunta.getTema().valor(), response.getTema());
        assertEquals(pregunta.getSubtema().valor(), response.getSubtema());
        assertEquals(pregunta.getNivelDificultad().valor(), response.getNivelDificultad());
    }

    @Test
    void responseConservaOrdenYCorrectaDeLasOpciones() {
        UUID preguntaId = UUID.randomUUID();
        Pregunta pregunta = preguntaEnRevision(preguntaId, 1);
        when(useCase.iniciarRevision(any(IniciarRevisionPreguntaCommand.class))).thenReturn(pregunta);

        IniciarRevisionRequest request = IniciarRevisionRequest.newBuilder()
            .setPreguntaId(preguntaId.toString())
            .setVersion(1)
            .build();

        service.iniciarRevision(request, responseObserver);

        ArgumentCaptor<IniciarRevisionResponse> responseCaptor =
            ArgumentCaptor.forClass(IniciarRevisionResponse.class);
        verify(responseObserver).onNext(responseCaptor.capture());
        IniciarRevisionResponse response = responseCaptor.getValue();

        assertEquals(pregunta.getOpciones().size(), response.getOpcionesCount());
        for (int i = 0; i < pregunta.getOpciones().size(); i++) {
            assertEquals(pregunta.getOpciones().get(i).texto(), response.getOpciones(i).getTexto());
            assertEquals(pregunta.getOpciones().get(i).correcta(), response.getOpciones(i).getCorrecta());
        }
    }

    @Test
    void uuidInvalidoRetornaInvalidArgumentYNoInvocaApplication() {
        IniciarRevisionRequest request = IniciarRevisionRequest.newBuilder()
            .setPreguntaId("no-es-un-uuid")
            .setVersion(1)
            .build();

        service.iniciarRevision(request, responseObserver);

        assertEquals(Status.Code.INVALID_ARGUMENT, statusEnviado(responseObserver).getCode());
        verify(useCase, never()).iniciarRevision(any());
    }

    @Test
    void uuidBlankRetornaInvalidArgumentYNoInvocaApplication() {
        IniciarRevisionRequest request = IniciarRevisionRequest.newBuilder()
            .setPreguntaId("   ")
            .setVersion(1)
            .build();

        service.iniciarRevision(request, responseObserver);

        assertEquals(Status.Code.INVALID_ARGUMENT, statusEnviado(responseObserver).getCode());
        verify(useCase, never()).iniciarRevision(any());
    }

    @Test
    void versionMenorAUnoRetornaInvalidArgumentYNoInvocaApplication() {
        IniciarRevisionRequest request = IniciarRevisionRequest.newBuilder()
            .setPreguntaId(UUID.randomUUID().toString())
            .setVersion(0)
            .build();

        service.iniciarRevision(request, responseObserver);

        assertEquals(Status.Code.INVALID_ARGUMENT, statusEnviado(responseObserver).getCode());
        verify(useCase, never()).iniciarRevision(any());
    }

    @Test
    void preguntaNoEncontradaRetornaNotFound() {
        UUID preguntaId = UUID.randomUUID();
        when(useCase.iniciarRevision(any(IniciarRevisionPreguntaCommand.class)))
            .thenThrow(new PreguntaNoEncontradaException(preguntaId));

        IniciarRevisionRequest request = IniciarRevisionRequest.newBuilder()
            .setPreguntaId(preguntaId.toString())
            .setVersion(1)
            .build();

        service.iniciarRevision(request, responseObserver);

        assertEquals(Status.Code.NOT_FOUND, statusEnviado(responseObserver).getCode());
    }

    @Test
    void estadoIncompatibleRetornaFailedPrecondition() {
        when(useCase.iniciarRevision(any(IniciarRevisionPreguntaCommand.class)))
            .thenThrow(new EstadoPreguntaIncompatibleException("no se puede iniciar revisión estando en BORRADOR"));

        IniciarRevisionRequest request = IniciarRevisionRequest.newBuilder()
            .setPreguntaId(UUID.randomUUID().toString())
            .setVersion(1)
            .build();

        service.iniciarRevision(request, responseObserver);

        assertEquals(Status.Code.FAILED_PRECONDITION, statusEnviado(responseObserver).getCode());
    }

    @Test
    void versionIncompatibleRetornaFailedPrecondition() {
        when(useCase.iniciarRevision(any(IniciarRevisionPreguntaCommand.class)))
            .thenThrow(new VersionPreguntaIncompatibleException("la versión 3 no coincide con la versión actual 1"));

        IniciarRevisionRequest request = IniciarRevisionRequest.newBuilder()
            .setPreguntaId(UUID.randomUUID().toString())
            .setVersion(3)
            .build();

        service.iniciarRevision(request, responseObserver);

        assertEquals(Status.Code.FAILED_PRECONDITION, statusEnviado(responseObserver).getCode());
    }

    @Test
    void excepcionInesperadaRetornaInternalSinFiltrarDetalles() {
        when(useCase.iniciarRevision(any(IniciarRevisionPreguntaCommand.class)))
            .thenThrow(new IllegalStateException("detalle interno sensible de infraestructura"));

        IniciarRevisionRequest request = IniciarRevisionRequest.newBuilder()
            .setPreguntaId(UUID.randomUUID().toString())
            .setVersion(1)
            .build();

        service.iniciarRevision(request, responseObserver);

        Status status = statusEnviado(responseObserver);
        assertEquals(Status.Code.INTERNAL, status.getCode());
        assertFalse(status.getDescription().contains("detalle interno sensible"));
        assertTrue(status.getDescription().length() > 0);
    }
}
