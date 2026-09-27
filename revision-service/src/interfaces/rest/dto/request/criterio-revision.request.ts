import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';

export class CriterioRevisionRequest {
  @IsString()
  @IsNotEmpty()
  nombre!: string;

  @IsBoolean()
  cumple!: boolean;
}
