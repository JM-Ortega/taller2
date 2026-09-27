import { ClientGrpc } from '@nestjs/microservices';
import { PreguntaRevisionGateway } from '../../application/port/out/pregunta-revision.gateway';
import { PreguntaRevisionGrpcAdapter, PreguntaRevisionGrpcClient } from './pregunta-revision-grpc.adapter';

export const PREGUNTA_REVISION_SERVICE_NAME = 'PreguntaRevisionService';

export function crearPreguntaRevisionGateway(grpcClient: ClientGrpc): PreguntaRevisionGateway {
  const proxy = grpcClient.getService<PreguntaRevisionGrpcClient>(PREGUNTA_REVISION_SERVICE_NAME);
  return new PreguntaRevisionGrpcAdapter(proxy);
}
