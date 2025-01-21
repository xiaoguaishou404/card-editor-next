'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface Template {
  id: number;
  imageUrl: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([
    {
      id: 1,
      imageUrl: '/template.png',
      name: '气球模版',
      createdAt: '2024-01-10',
      updatedAt: '2024-01-10'
    },
    // 后续会从API获取数据
  ]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 这里后续需要接入实际的上传API
    const formData = new FormData();
    formData.append('file', file);

    try {
      // const response = await fetch('/api/admin/templates/upload', {
      //   method: 'POST',
      //   body: formData
      // });
      // const data = await response.json();
      
      // 模拟新增模版
      const newTemplate: Template = {
        id: templates.length + 1,
        imageUrl: URL.createObjectURL(file),
        name: file.name,
        createdAt: new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString().split('T')[0]
      };

      setTemplates([...templates, newTemplate]);
    } catch (error) {
      console.error('上传失败:', error);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">模版管理</h1>
        <label className="px-4 py-2 bg-blue-500 text-white rounded cursor-pointer hover:bg-blue-600 transition-colors">
          上传模版
          <input
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleUpload}
          />
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {templates.map((template) => (
          <div
            key={template.id}
            className="bg-white rounded-lg shadow-md overflow-hidden"
          >
            <div className="relative aspect-[4/3]">
              <Image
                src={template.imageUrl}
                alt={template.name}
                fill
                className="object-cover"
              />
            </div>
            <div className="p-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold">{template.name}</h3>
                <Link
                  href={`/admin/templates/${template.id}/edit`}
                  className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 transition-colors"
                >
                  编辑
                </Link>
              </div>
              <div className="text-sm text-gray-500">
                <p>创建时间：{template.createdAt}</p>
                <p>更新时间：{template.updatedAt}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 