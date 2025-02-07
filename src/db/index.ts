import { sql } from '@vercel/postgres';
import { put, del } from '@vercel/blob';

export async function createTemplate(name: string, imageFile: File) {
  try {
    // 上传图片到 Vercel Blob
    const blob = await put(name, imageFile, {
      access: 'public',
    });

    // 保存模版信息到数据库
    const result = await sql`
      INSERT INTO templates (name, image_url, blob_url)
      VALUES (${name}, ${blob.url}, ${blob.pathname})
      RETURNING id, name, image_url, created_at, updated_at
    `;

    return result.rows[0];
  } catch (error) {
    console.error('创建模版失败:', error);
    throw error;
  }
}

export async function updateTemplateState(id: number, editorState: any) {
  try {
    const result = await sql`
      UPDATE templates
      SET editor_state = ${JSON.stringify(editorState)},
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING id, name, image_url, editor_state, updated_at
    `;

    return result.rows[0];
  } catch (error) {
    console.error('更新模版状态失败:', error);
    throw error;
  }
}

export async function getTemplates() {
  try {
    const result = await sql`
      SELECT id, name, image_url, editor_state, created_at, updated_at
      FROM templates
      ORDER BY created_at DESC
    `;

    return result.rows;
  } catch (error) {
    console.error('获取模版列表失败:', error);
    throw error;
  }
}

export async function getTemplateById(id: number) {
  try {
    const result = await sql`
      SELECT id, name, image_url, blob_url, editor_state, created_at, updated_at
      FROM templates
      WHERE id = ${id}
    `;

    return result.rows[0];
  } catch (error) {
    console.error('获取模版详情失败:', error);
    throw error;
  }
}

export async function deleteTemplate(id: number) {
  try {
    // 先获取模版信息
    const template = await getTemplateById(id);
    if (!template) {
      throw new Error('模版不存在');
    }

    // 删除 Blob 存储中的图片
    if (template.blob_url) {
      await del(template.blob_url);
    }

    // 删除数据库记录
    await sql`
      DELETE FROM templates
      WHERE id = ${id}
    `;

    return true;
  } catch (error) {
    console.error('删除模版失败:', error);
    throw error;
  }
} 