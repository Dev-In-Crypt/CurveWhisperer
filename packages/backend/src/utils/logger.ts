import pino from 'pino';

const isDev = process.env.NODE_ENV !== 'production';

export const logger = (pino as unknown as typeof pino.default)({
  level: process.env.LOG_LEVEL || 'info',
  transport: isDev
    ? { target: 'pino-pretty', options: { colorize: true } }
    : undefined,
});

export function createChildLogger(module: string) {
  return logger.child({ module });
}
