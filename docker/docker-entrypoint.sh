#!/bin/sh

# 等待数据库文件目录存在
mkdir -p /app/prisma

# 检查 .env 文件是否存在
if [ -f ".env" ]; then
    # 检查 .env 文件中是否有 AUTH_SECRET
    if ! grep -q "^AUTH_SECRET=" .env; then
        if [ -n "$AUTH_SECRET" ]; then
            echo "AUTH_SECRET 未在 .env 文件中设置，使用环境变量中的 AUTH_SECRET..."
            echo "AUTH_SECRET=$AUTH_SECRET" >> .env
        else
            echo "AUTH_SECRET 未在 .env 文件中设置，正在生成随机密钥..."
            AUTH_SECRET=$(openssl rand -hex 32)
            echo "AUTH_SECRET=$AUTH_SECRET" >> .env
        fi
    fi
else
    if [ -n "$AUTH_SECRET" ]; then
        echo ".env 文件不存在，正在创建并使用环境变量中的 AUTH_SECRET..."
        echo "AUTH_SECRET=$AUTH_SECRET" > .env
    else
        echo ".env 文件不存在，正在创建并生成 AUTH_SECRET..."
        AUTH_SECRET=$(openssl rand -hex 32)
        echo "AUTH_SECRET=$AUTH_SECRET" > .env
    fi
fi


# 检查数据库中是否存在管理员用户，如果不存在则创建
# 设置默认管理员用户信息（如果环境变量未设置）
ADMIN_USERNAME=${ADMIN_USERNAME:-admin}
ADMIN_EMAIL=${ADMIN_EMAIL:-admin@example.com}
ADMIN_PASSWORD=${ADMIN_PASSWORD:-admin}

echo "检查数据库中是否存在管理员用户..."

node -e "
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const adminUsername = process.env.ADMIN_USERNAME || 'admin';
const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
const adminPassword = process.env.ADMIN_PASSWORD || 'admin';

async function ensureAdmin() {
    const prisma = new PrismaClient();
    try {
        const existingAdmin = await prisma.user.findUnique({
            where: { username: adminUsername }
        });

        if (!existingAdmin) {
            const hashedPassword = await bcrypt.hash(adminPassword, 10);
            await prisma.user.create({
                data: {
                    name: '管理员',
                    username: adminUsername,
                    email: adminEmail,
                    password: hashedPassword,
                },
            });
            console.log('管理员用户创建成功！');
            console.log('用户名: ' + adminUsername);
            console.log('邮箱: ' + adminEmail);
            console.log('密码: ' + adminPassword);
        } else {
            console.log('管理员用户已存在');
        }
    } catch (error) {
        console.error('检查/创建管理员用户失败:', error);
        process.exit(1);
    } finally {
        await prisma.\$disconnect();
    }
}

ensureAdmin();
"

# 启动Next.js应用
exec node server.js
