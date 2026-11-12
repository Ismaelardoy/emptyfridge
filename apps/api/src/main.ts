import 'reflect-metadata';
import { loadEnvFile } from 'node:process';

// Permite `pnpm dev` desde apps/api sin exportar variables a mano.
for (const path of ['.env', '../../.env']) {
  try {
    loadEnvFile(path);
    break;
  } catch {
    // Sin fichero .env: usamos las variables del entorno.
  }
}

import fastifyCookie from '@fastify/cookie';
import { type LogLevel, Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from './app.module';
import { type Env, env } from './shared/config/env';

const LOG_LEVELS: Record<Env['LOG_LEVEL'], LogLevel[]> = {
  fatal: ['error'],
  error: ['error'],
  warn: ['error', 'warn'],
  info: ['error', 'warn', 'log'],
  debug: ['error', 'warn', 'log', 'debug'],
  trace: ['error', 'warn', 'log', 'debug', 'verbose'],
};

async function bootstrap(): Promise<void> {
  const config = env();
  Logger.overrideLogger(LOG_LEVELS[config.LOG_LEVEL]);

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ trustProxy: true, bodyLimit: 1_048_576 }),
  );

  // El plugin aumenta FastifyInstance (request.cookies, reply.setCookie); el
  // cast evita el choque entre esa augmentación global y la firma de Nest.
  await app.register(fastifyCookie as any);
  app.setGlobalPrefix('api');
  app.enableShutdownHooks();

  await app.listen(config.PORT, '0.0.0.0');
  Logger.log(`API escuchando en http://0.0.0.0:${config.PORT}/api`, 'bootstrap');
}

bootstrap().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
