import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const secretKey = new TextEncoder().encode(
  process.env.JWT_SECRET_KEY || 'your-secret-key-min-32-chars-long!!'
);

export async function middleware(request: NextRequest) {
  // 只处理管理员路由
  if (!request.nextUrl.pathname.startsWith('/admin')) {
    return NextResponse.next();
  }

  // 登录页面不需要验证
  if (request.nextUrl.pathname === '/admin') {
    return NextResponse.next();
  }

  const token = request.cookies.get('admin_token')?.value;

  if (!token) {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  try {
    await jwtVerify(token, secretKey);
    return NextResponse.next();
  } catch (error) {
    return NextResponse.redirect(new URL('/admin', request.url));
  }
}

export const config = {
  matcher: '/admin/:path*',
}; 