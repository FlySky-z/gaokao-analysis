// 用于测试 Sequelize 连接和同步 User 表结构
import sequelize from '../lib/sequelize';
import User from '../models/user';

(async () => {
  try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');
    await User.sync(); // 只同步 User 表，不影响其他表
    console.log('User table synced.');
    process.exit(0);
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(1);
  }
})();
