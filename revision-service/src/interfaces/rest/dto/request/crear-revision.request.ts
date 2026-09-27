import { ArrayMinSize, ArrayUnique, IsArray, IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CrearRevisionRequest {
  @IsUUID()
  preguntaId!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  revisorIds!: string[];
}
