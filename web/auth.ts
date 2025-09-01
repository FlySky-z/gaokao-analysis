import NextAuth from 'next-auth';
import { authConfig } from './auth.config';
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod';
import type { User } from '@/lib/model/authModel';
import bcrypt from 'bcrypt';
import UserModel from './models/user';

async function getUser(username: string): Promise<User | undefined> {
    try {
        const user = await UserModel.findOne({
            where: { username }
        });
        return user ? {
            id: user.id,
            name: user.name,
            username: user.username,
            email: user.email,
            password: user.password
        } : undefined;
    } catch (error) {
        console.error('Failed to fetch user:', error);
        throw new Error('Failed to fetch user.');
    }
}

export const { auth, signIn, signOut } = NextAuth({
    ...authConfig,
    providers: [
        Credentials({
            name: 'Credentials',
            credentials: {
                username: { label: '用户名', type: 'text', placeholder: '请输入用户名' },
                password: { label: '密码', type: 'password', placeholder: '请输入密码' },
            },
            async authorize(credentials) {
                const parsedCredentials = z
                    .object({ username: z.string(), password: z.string().min(5) })
                    .safeParse(credentials);

                if (parsedCredentials.success) {
                    const { username, password } = parsedCredentials.data;
                    const user = await getUser(username);
                    if (!user) return null;
                    const isPasswordValid = await bcrypt.compare(password, user.password);
                    if (isPasswordValid) return user;
                }
                return null;
            },
        }),
    ],
});