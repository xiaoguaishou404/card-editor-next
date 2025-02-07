import { config } from 'dotenv';
import { sql } from '@vercel/postgres';
import { readFileSync } from 'fs';
import { join } from 'path';

// 加载环境变量
config();

async function migrate() {
  try {
    // 读取 schema.sql 文件
    const schemaPath = join(process.cwd(), 'src', 'db', 'schema.sql');
    const schema = readFileSync(schemaPath, 'utf8');

    // 执行 SQL
    await sql.query(schema);
    console.log('数据库迁移成功！');
  } catch (error) {
    console.error('数据库迁移失败:', error);
    process.exit(1);
  }
}

migrate(); 