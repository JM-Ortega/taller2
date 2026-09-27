import 'reflect-metadata';
import { ApiExceptionFilter } from './interfaces/rest/api-exception.filter';

jest.mock('@nestjs/core', () => ({
  NestFactory: { create: jest.fn() },
}));

describe('bootstrap (main.ts)', () => {
  it('registra el ApiExceptionFilter y el ValidationPipe existentes globalmente antes de escuchar', async () => {
    const orden: string[] = [];
    const app = {
      enableShutdownHooks: jest.fn(() => {
        orden.push('shutdown-hooks');
      }),
      useGlobalFilters: jest.fn((_filter: unknown) => {
        orden.push('filters');
      }),
      useGlobalPipes: jest.fn((_pipe: unknown) => {
        orden.push('pipes');
      }),
      listen: jest.fn().mockImplementation(async () => {
        orden.push('listen');
      }),
    };

    const { NestFactory } = await import('@nestjs/core');
    (NestFactory.create as jest.Mock).mockResolvedValue(app);

    await import('./main');
    await new Promise((resolve) => setImmediate(resolve));

    expect(app.enableShutdownHooks).toHaveBeenCalledTimes(1);
    expect(app.useGlobalFilters).toHaveBeenCalledTimes(1);
    expect(app.useGlobalFilters.mock.calls[0][0]).toBeInstanceOf(ApiExceptionFilter);
    expect(app.useGlobalPipes).toHaveBeenCalledTimes(1);
    expect(app.listen).toHaveBeenCalledTimes(1);
    expect(orden).toEqual(['shutdown-hooks', 'filters', 'pipes', 'listen']);
  });
});
