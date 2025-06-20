'use server';
import { signIn, signOut } from '@/auth';
import { AuthError } from 'next-auth';

export async function authenticate(
  prevState: string | undefined,
  formData: FormData,
) {
  try {
    await signIn('credentials', formData);
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return '用户名或密码错误，请重试。';
        default:
          return '一些错误发生了，请稍后再试。';
      }
    }
    throw error;
  }
}

export async function logout() {
  await signOut({
    redirectTo: '/',
  });
  return '已成功登出。';
}