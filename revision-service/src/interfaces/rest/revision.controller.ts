import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Res,
  UseFilters,
  UsePipes,
} from '@nestjs/common';
import { isUUID } from 'class-validator';
import { CrearRevisionUseCase } from '../../application/use-case/crear-revision.use-case';
import { ListarRevisionesPreguntaUseCase } from '../../application/use-case/listar-revisiones-pregunta.use-case';
import { ObtenerRevisionUseCase } from '../../application/use-case/obtener-revision.use-case';
import { RegistrarEvaluacionUseCase } from '../../application/use-case/registrar-evaluacion.use-case';
import { ApiExceptionFilter } from './api-exception.filter';
import { CrearRevisionRequest } from './dto/request/crear-revision.request';
import { RegistrarEvaluacionRequest } from './dto/request/registrar-evaluacion.request';
import { RevisionResponse } from './dto/response/revision.response';
import { RevisionRestMapper } from './revision-rest.mapper';
import { crearPipeDeValidacionRest } from './validation-pipe.factory';

interface RespuestaHttpConHeaders {
  setHeader(nombre: string, valor: string): void;
}

@Controller('api/v1/revisiones')
@UseFilters(new ApiExceptionFilter())
export class RevisionController {
  private readonly mapper = new RevisionRestMapper();

  constructor(
    private readonly crearRevisionUseCase: CrearRevisionUseCase,
    private readonly obtenerRevisionUseCase: ObtenerRevisionUseCase,
    private readonly listarRevisionesPreguntaUseCase: ListarRevisionesPreguntaUseCase,
    private readonly registrarEvaluacionUseCase: RegistrarEvaluacionUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(crearPipeDeValidacionRest())
  async crear(
    @Body() request: CrearRevisionRequest,
    @Res({ passthrough: true }) res: RespuestaHttpConHeaders,
  ): Promise<RevisionResponse> {
    const revision = await this.crearRevisionUseCase.execute(
      this.mapper.toCrearRevisionCommand(request),
    );
    const response = this.mapper.toRevisionResponse(revision);
    res.setHeader('Location', `/api/v1/revisiones/${response.revisionId}`);
    return response;
  }

  @Get(':id')
  async obtener(@Param('id', new ParseUUIDPipe()) id: string): Promise<RevisionResponse> {
    const revision = await this.obtenerRevisionUseCase.execute(id);
    return this.mapper.toRevisionResponse(revision);
  }

  @Get()
  async listarPorPregunta(
    @Query('preguntaId') preguntaId?: string,
  ): Promise<readonly RevisionResponse[]> {
    if (preguntaId === undefined || !isUUID(preguntaId)) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'La solicitud contiene campos inválidos.',
        details: [{ field: 'preguntaId', message: 'preguntaId debe ser un UUID válido.' }],
      });
    }
    const revisiones = await this.listarRevisionesPreguntaUseCase.execute(preguntaId);
    return revisiones.map((revision) => this.mapper.toRevisionResponse(revision));
  }

  @Post(':id/evaluaciones')
  @HttpCode(HttpStatus.OK)
  @UsePipes(crearPipeDeValidacionRest())
  async registrarEvaluacion(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() request: RegistrarEvaluacionRequest,
  ): Promise<RevisionResponse> {
    const command = this.mapper.toRegistrarEvaluacionCommand(id, request);
    const revision = await this.registrarEvaluacionUseCase.execute(command);
    return this.mapper.toRevisionResponse(revision);
  }
}
