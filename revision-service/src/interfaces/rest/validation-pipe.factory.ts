import { BadRequestException, ValidationError, ValidationPipe } from '@nestjs/common';
import { ApiErrorDetail } from './dto/response/api-error.response';

function aplanarErroresDeValidacion(
  errores: readonly ValidationError[],
  rutaBase = '',
): ApiErrorDetail[] {
  const detalles: ApiErrorDetail[] = [];
  for (const error of errores) {
    const ruta = rutaBase ? `${rutaBase}.${error.property}` : error.property;
    if (error.constraints) {
      for (const mensaje of Object.values(error.constraints)) {
        detalles.push({ field: ruta, message: mensaje });
      }
    }
    if (error.children && error.children.length > 0) {
      detalles.push(...aplanarErroresDeValidacion(error.children, ruta));
    }
  }
  return detalles;
}

export function crearPipeDeValidacionRest(): ValidationPipe {
  return new ValidationPipe({
    transform: true,
    whitelist: true,
    exceptionFactory: (errores: ValidationError[]) =>
      new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'La solicitud contiene campos inválidos.',
        details: aplanarErroresDeValidacion(errores),
      }),
  });
}
