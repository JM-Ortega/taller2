import type { ClientGrpc } from '@nestjs/microservices';
import { PreguntaRevisionGrpcAdapter } from './pregunta-revision-grpc.adapter';
import {
  crearPreguntaRevisionGateway,
  PREGUNTA_REVISION_SERVICE_NAME,
} from './pregunta-revision-grpc.provider';

describe('crearPreguntaRevisionGateway', () => {
  it('obtiene el proxy PreguntaRevisionService del ClientGrpc y lo envuelve en PreguntaRevisionGrpcAdapter', () => {
    const proxyFalso = { iniciarRevision: jest.fn() };
    const getService = jest.fn().mockReturnValue(proxyFalso);
    const grpcClient = { getService } as unknown as ClientGrpc;

    const gateway = crearPreguntaRevisionGateway(grpcClient);

    expect(getService).toHaveBeenCalledWith(PREGUNTA_REVISION_SERVICE_NAME);
    expect(gateway).toBeInstanceOf(PreguntaRevisionGrpcAdapter);
  });
});
