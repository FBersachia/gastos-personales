import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: [
      { level: 'query', emit: 'event' },
      { level: 'error', emit: 'stdout' },
      { level: 'warn', emit: 'stdout' },
    ],
  });
};

declare global {
  // eslint-disable-next-line no-var
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prisma ?? prismaClientSingleton();

// Log queries in development
if (process.env.NODE_ENV === 'development') {
  prisma.$on('query' as never, (e: any) => {
    logger.debug('Query: ' + e.query);
    logger.debug('Duration: ' + e.duration + 'ms');
  });
}

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}

export { prisma };
