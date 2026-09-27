import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ApiExceptionFilter } from './interfaces/rest/api-exception.filter';
import { crearPipeDeValidacionRest } from './interfaces/rest/validation-pipe.factory';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableShutdownHooks();
  app.useGlobalFilters(new ApiExceptionFilter());
  app.useGlobalPipes(crearPipeDeValidacionRest());
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
