import prisma from '../db/prisma.js';

export const logger = {
  error: async (message: string, stack?: string, meta?: any) => {
    console.error('[ERROR]', message, meta);
    
    try {
      await prisma.errorLog.create({
        data: {
          level: 'ERROR',
          message,
          stack,
          meta: meta || {},
        },
      });
    } catch (err) {
      console.error('Failed to log error to database:', err);
    }
  },
  
  warn: async (message: string, meta?: any) => {
    console.warn('[WARN]', message, meta);
    
    try {
      await prisma.errorLog.create({
        data: {
          level: 'WARN',
          message,
          meta: meta || {},
        },
      });
    } catch (err) {
      console.error('Failed to log warning to database:', err);
    }
  },
  
  info: (message: string, meta?: any) => {
    console.log('[INFO]', message, meta);
  },
};
