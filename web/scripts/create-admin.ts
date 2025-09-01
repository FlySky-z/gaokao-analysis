// 创建管理员用户脚本
import bcrypt from 'bcrypt';
import sequelize from '../lib/sequelize';
import User from '../models/user';

const createAdmin = async () => {
  try {
    // 确保数据库连接正常
    await sequelize.authenticate();
    console.log('数据库连接成功');

    // 同步 User 表结构
    await User.sync();
    console.log('User 表同步完成');

    // 检查是否已存在 admin 用户
    const existingAdmin = await User.findOne({
      where: { username: 'admin' }
    });

    if (existingAdmin) {
      console.log('Admin 用户已存在，跳过创建');
      return;
    }

    // 创建管理员用户
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash('admin', saltRounds);

    const adminUser = await User.create({
      name: '系统管理员',
      username: 'admin',
      email: 'admin@gaokao.com',
      password: hashedPassword,
    });

    console.log('✅ Admin 用户创建成功:');
    console.log(`- ID: ${adminUser.id}`);
    console.log(`- 用户名: ${adminUser.username}`);
    console.log(`- 邮箱: ${adminUser.email}`);
    console.log(`- 默认密码: admin`);
    console.log('\n⚠️  请登录后立即修改默认密码！');

  } catch (error) {
    console.error('❌ 创建 Admin 用户失败:', error);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
};

// 执行创建脚本
createAdmin();
