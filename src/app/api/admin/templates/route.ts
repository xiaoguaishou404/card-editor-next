import { NextRequest, NextResponse } from 'next/server';
import { createTemplate, getTemplates } from '@/db';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: '请上传模版图片' },
        { status: 400 }
      );
    }

    const template = await createTemplate(file.name, file);
    return NextResponse.json(template);
  } catch (error) {
    console.error('上传模版失败:', error);
    return NextResponse.json(
      { error: '上传模版失败' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const templates = await getTemplates();
    return NextResponse.json(templates);
  } catch (error) {
    console.error('获取模版列表失败:', error);
    return NextResponse.json(
      { error: '获取模版列表失败' },
      { status: 500 }
    );
  }
} 