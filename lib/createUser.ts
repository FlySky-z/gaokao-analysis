import { prisma } from './prisma';
import bcrypt from 'bcrypt';

/**
 * 创建新用户
 * @param name 用户名称
 * @param username 用户登录名
 * @param email 电子邮件
 * @param password 密码（未加密）
 */
export async function createUser(name: string, username: string, email: string, password: string) {
  const hashedPassword = await bcrypt.hash(password, 10);
  
  try {
    const user = await prisma.user.create({
      data: {
        name,
        username,
        email,
        password: hashedPassword,
      },
    });
    return user;
  } catch (error) {
    console.error('Failed to create user:', error);
    throw new Error('Failed to create user.');
  }
}
