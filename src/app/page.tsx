'use client';

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

interface Creation {
  id: number;
  imageUrl: string;
  likes: number;
  title?: string;
  height?: number;
}

export default function Home() {
  const [creations] = useState<Creation[]>([
    { id: 1, imageUrl: '/round-balloon.png', likes: 8, height: 200 },
    { id: 2, imageUrl: '/round-balloon.png', likes: 5, height: 300 },
    { id: 3, imageUrl: '/round-balloon.png', likes: 3, height: 250 },
    { id: 4, imageUrl: '/round-balloon.png', likes: 2, height: 280 },
    { id: 5, imageUrl: '/round-balloon.png', likes: 1, height: 220 },
    { id: 6, imageUrl: '/round-balloon.png', likes: 16, height: 320 },
    { id: 7, imageUrl: '/round-balloon.png', likes: 4, height: 240 },
    { id: 8, imageUrl: '/round-balloon.png', likes: 3, height: 260 },
    { id: 9, imageUrl: '/round-balloon.png', likes: 6, height: 290 },
    { id: 10, imageUrl: '/round-balloon.png', likes: 2, height: 270 },
    { id: 11, imageUrl: '/round-balloon.png', likes: 7, height: 310 },
  ]);

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
        <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
          {creations.map((creation) => (
            <div
              key={creation.id}
              className="relative break-inside-avoid overflow-hidden rounded-lg shadow-lg bg-white"
            >
              <div className="relative" style={{ height: creation.height }}>
                <Image
                  src={creation.imageUrl}
                  alt={creation.title || `Creation ${creation.id}`}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="absolute bottom-3 right-3 bg-black/50 px-2 py-1 rounded-full flex items-center space-x-1">
                <Image src="/heart.svg" alt="Likes" width={16} height={16} className="invert" />
                <span className="text-white text-sm">{creation.likes}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
