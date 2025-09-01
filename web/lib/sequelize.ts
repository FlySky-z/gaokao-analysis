// Sequelize 初始化配置，自动读取 .env
import mysql2 from 'mysql2'
import { Sequelize } from 'sequelize';

// 确保在服务端环境中运行
if (typeof window !== 'undefined') {
  throw new Error('Sequelize should only be used on the server side');
}

// 使用 DATABASE_URL 连接字符串
const DATABASE_URL = process.env.DATABASE_URL || `mysql://${process.env.MYSQL_USER}:${process.env.MYSQL_PASSWORD}@${process.env.MYSQL_HOST}:${process.env.MYSQL_PORT}/${process.env.MYSQL_DATABASE}?charset=${process.env.MYSQL_CHARSET || 'utf8mb4'}`;

const sequelize = new Sequelize(DATABASE_URL, {
  dialect: 'mysql',
  dialectModule: mysql2,
  define: {
    freezeTableName: true,
    timestamps: false
  },
  dialectOptions: {
    charset: 'utf8mb4',
  },
});

export default sequelize;
