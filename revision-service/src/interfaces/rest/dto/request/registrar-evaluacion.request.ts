import { Type } from 'class-transformer';
import { IsArray, IsIn, IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { CriterioRevisionRequest } from './criterio-revision.request';

export class RegistrarEvaluacionRequest {
  @IsString()
  @IsNotEmpty()
  revisorId!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CriterioRevisionRequest)
  criterios!: CriterioRevisionRequest[];

  @IsString()
  observaciones!: string;

  @IsIn(['FAVORABLE', 'DESFAVORABLE'])
  resultado!: 'FAVORABLE' | 'DESFAVORABLE';
}
