import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { updateTemplateState, getTemplateById } from '@/db';

// 获取模板详情
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    if (isNaN(Number(id))) {
      return NextResponse.json(
        { error: '无效的模版ID' },
        { status: 400 }
      );
    }

    const template = await getTemplateById(Number(id));
    if (!template) {
      return NextResponse.json(
        { error: '模版不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json(template);
  } catch (error) {
    console.error('获取模版详情失败:', error);
    return NextResponse.json(
      { error: '获取模版详情失败' },
      { status: 500 }
    );
  }
}

// 更新模板状态
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    if (isNaN(Number(id))) {
      return NextResponse.json(
        { error: '无效的模版ID' },
        { status: 400 }
      );
    }

    const editorState = await request.json();
    const template = await updateTemplateState(Number(id), editorState);

    return NextResponse.json(template);
  } catch (error) {
    console.error('保存模版状态失败:', error);
    return NextResponse.json(
      { error: '保存模版状态失败' },
      { status: 500 }
    );
  }
} 