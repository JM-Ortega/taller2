import { Controller, Get, UseFilters } from '@nestjs/common';
import { ListarPreguntasPendientesUseCase } from '../../application/use-case/listar-preguntas-pendientes.use-case';
import { ApiExceptionFilter } from './api-exception.filter';
import { PreguntaPendienteRevisionResponse } from './dto/response/pregunta-pendiente-revision.response';
import { RevisionRestMapper } from './revision-rest.mapper';

@Controller('api/v1/preguntas-pendientes-revision')
@UseFilters(new ApiExceptionFilter())
export class PreguntasPendientesRevisionController {
  private readonly mapper = new RevisionRestMapper();

  constructor(
    private readonly listarPreguntasPendientesUseCase: ListarPreguntasPendientesUseCase,
  ) {}

  @Get()
  async listar(): Promise<readonly PreguntaPendienteRevisionResponse[]> {
    const solicitudes = await this.listarPreguntasPendientesUseCase.execute();
    return solicitudes.map((solicitud) => this.mapper.toPendienteResponse(solicitud));
  }
}
