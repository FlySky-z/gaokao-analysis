import { PrismaClient } from '@prisma/client';

// 声明全局变量，以便在开发模式下不会重复创建实例
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// 防止在开发环境中创建多个PrismaClient实例
export const prisma = globalThis.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}
