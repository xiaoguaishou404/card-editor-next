import { NextResponse } from 'next/server';
import { SignJWT } from 'jose';

const secretKey = new TextEncoder().encode(
  process.env.JWT_SECRET_KEY || 'your-secret-key-min-32-chars-long!!'
);

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    // 验证环境变量中的用户名和密码
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin';

    if (username !== adminUsername || password !== adminPassword) {
      return NextResponse.json(
        { message: '用户名或密码错误' },
        { status: 401 }
      );
    }

    // 创建 JWT token
    const token = await new SignJWT({ username })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('24h')
      .sign(secretKey);

    // 创建响应
    const response = NextResponse.json({ message: '登录成功' });
    
    // 设置 cookie，服务器没有使用https，暂时不设置secure选项
    response.cookies.set('admin_token', token, {
      httpOnly: true,
    //   secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { message: '服务器错误' },
      { status: 500 }
    );
  }
} 