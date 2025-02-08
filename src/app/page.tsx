'use client';

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

interface Creation {
  id: number;
  imageUrl: string;
  likes: number;
  title?: string;
}

interface Template {
  id: number;
  name: string;
  image_url: string;
  created_at: string;
  updated_at: string;
}

export default function Home() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/admin/templates');
      if (!res.ok) {
        throw new Error('获取模版列表失败');
      }
      const data = await res.json();
      setTemplates(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取模版列表失败');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="ml-16 p-8">
          <div className="text-center">加载中...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="ml-16 p-8">
          <div className="text-center text-red-500">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 侧边栏 */}
      <div className="fixed left-0 top-0 h-full w-16 bg-white shadow-lg flex flex-col items-center py-4 space-y-6">
        <div className="w-8 h-8">
          <Image src="/logo.svg" alt="Logo" width={32} height={32} />
        </div>
        <Link href="/" className="p-2 bg-gray-100 rounded-lg">
          <Image src="/home.svg" alt="Home" width={24} height={24} />
        </Link>
        <Link href="/creations" className="p-2">
          <Image src="/creations.svg" alt="Creations" width={24} height={24} />
        </Link>
      </div>

      {/* 主内容区 - 瀑布流布局 */}
      <div className="ml-16 p-8">
        <div className="max-w-[1600px] mx-auto">
          <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-5 2xl:columns-6 gap-6 space-y-6">
            {templates.map((template) => (
              <Link
                key={template.id}
                href={`/editor/${template.id}`}
                className="block relative break-inside-avoid overflow-hidden rounded-lg shadow-lg bg-white mb-6 hover:shadow-xl transition-shadow duration-300"
              >
                <div className="w-full">
                  <Image
                    src={template.image_url}
                    alt={template.name}
                    width={1000}
                    height={1500}
                    unoptimized
                    className="w-full h-auto"
                  />
                </div>
                <div className="absolute bottom-3 right-3 bg-black/50 px-2 py-1 rounded-full flex items-center space-x-1">
                  <Image src="/heart.svg" alt="Likes" width={16} height={16} className="invert" />
                  <span className="text-white text-sm">0</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
