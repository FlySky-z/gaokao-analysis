import { createUser } from '../lib/createUser';

async function main() {
  console.log('开始创建管理员用户...');
  try {
    // 创建管理员用户
    const admin = await createUser('管理员', 'admin', 'admin@example.com', 'admin');
    console.log('创建管理员用户成功:', JSON.stringify(admin, null, 2));
  } catch (error) {
    console.error('创建管理员用户失败:', error);
  }
  console.log('脚本执行完毕');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
