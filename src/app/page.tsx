'use client';

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

interface Creation {
  id: number;
  imageUrl: string;
  likes: number;
  title?: string;
}

export default function Home() {
  const [creations] = useState<Creation[]>([
    { id: 1, imageUrl: '/images/portrait.jpg', likes: 8 },
    { id: 2, imageUrl: '/images/moonlight.jpg', likes: 5 },
    { id: 3, imageUrl: '/images/building.jpg', likes: 3 },
    { id: 4, imageUrl: '/images/computer.jpg', likes: 2 },
    { id: 5, imageUrl: '/images/forest.jpg', likes: 1 },
    { id: 6, imageUrl: '/images/beach.jpg', likes: 16 },
    { id: 7, imageUrl: '/images/sports.jpg', likes: 4 },
    { id: 8, imageUrl: '/images/crown.jpg', likes: 3 },
    { id: 9, imageUrl: '/images/couple.jpg', likes: 6 },
    { id: 10, imageUrl: '/images/frame.jpg', likes: 2 },
    { id: 11, imageUrl: '/images/cyberpunk.jpg', likes: 7 },
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

      {/* 主内容区 */}
      <div className="ml-16 p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {creations.map((creation) => (
            <div
              key={creation.id}
              className="relative group overflow-hidden rounded-lg shadow-lg bg-white"
            >
              <div className="aspect-w-1 aspect-h-1">
                <Image
                  src={creation.imageUrl}
                  alt={creation.title || `Creation ${creation.id}`}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-110"
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
