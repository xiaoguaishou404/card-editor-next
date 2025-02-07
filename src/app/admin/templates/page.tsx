'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface Template {
  id: number;
  name: string;
  image_url: string;
  created_at: string;
  updated_at: string;
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 获取模版列表
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

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/admin/templates', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error('上传失败');
      }

      const newTemplate = await res.json();
      setTemplates([newTemplate, ...templates]);
    } catch (err) {
      console.error('上传失败:', err);
      alert('上传失败，请重试');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这个模版吗？')) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/templates/${id}/edit`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('删除失败');
      }

      setTemplates(templates.filter(template => template.id !== id));
    } catch (err) {
      console.error('删除失败:', err);
      alert('删除失败，请重试');
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">加载中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center text-red-500">{error}</div>
      </div>
    );
  }

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

      {templates.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          暂无模版，请上传
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {templates.map((template) => (
            <div
              key={template.id}
              className="bg-white rounded-lg shadow-md overflow-hidden"
            >
              <div className="h-[200px] flex items-center justify-center bg-gray-50">
                <Image
                  src={template.image_url}
                  alt={template.name}
                  width={200}
                  height={200}
                  className="object-contain w-auto h-full"
                />
              </div>
              <div className="p-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold">{template.name}</h3>
                  <div className="flex gap-2">
                    <Link
                      href={`/admin/templates/${template.id}/edit`}
                      className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 transition-colors"
                    >
                      编辑
                    </Link>
                    <button
                      onClick={() => handleDelete(template.id)}
                      className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition-colors"
                    >
                      删除
                    </button>
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  <p>创建时间：{new Date(template.created_at).toLocaleDateString()}</p>
                  <p>更新时间：{new Date(template.updated_at).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 