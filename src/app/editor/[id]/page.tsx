'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface EditorState {
  points: Array<{x: number; y: number}>;
  text: string;
  fontSize: number;
  letterSpacing: number;
  lineHeight: number;
  textColor: string;
  textDirection: 'horizontal' | 'vertical';
}

export default function TemplateEditor() {
  const params = useParams();
  const templateId = params.id;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [text, setText] = useState('');
  const [fontSize, setFontSize] = useState(16);
  const [letterSpacing, setLetterSpacing] = useState(2);
  const [lineHeight, setLineHeight] = useState(1.5);
  const [textColor, setTextColor] = useState('#000000');
  const [textDirection, setTextDirection] = useState<'horizontal' | 'vertical'>('horizontal');
  const [backgroundImage, setBackgroundImage] = useState<HTMLImageElement | null>(null);
  const [points, setPoints] = useState<{x: number; y: number}[]>([]);

  // 初始化画布和背景图片，加载模版数据
  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        const res = await fetch(`/api/admin/templates/${templateId}/edit`);
        if (!res.ok) {
          throw new Error('获取模版失败');
        }
        const data = await res.json();
        
        // 设置背景图片
        const img = new window.Image();
        img.src = data.image_url;
        img.onload = () => {
          setBackgroundImage(img);
          
          // 如果有保存的编辑状态，加载多边形坐标和预设值
          if (data.editor_state) {
            const state = data.editor_state;
            setPoints(state.points || []);
            setText(state.text || ''); // 加载保存的文字内容

            // 加载预设值
            if (state.presets) {
              setFontSize(state.presets.fontSize || 16);
              setLetterSpacing(state.presets.letterSpacing || 2);
              setLineHeight(state.presets.lineHeight || 1.5);
              setTextColor(state.presets.textColor || '#000000');
              setTextDirection(state.presets.textDirection || 'horizontal');
            }
          }
        };
      } catch (error) {
        console.error('获取模版失败:', error);
        alert('获取模版失败，请重试');
      }
    };

    if (templateId) {
      fetchTemplate();
    }
  }, [templateId]);

  // 当背景图片加载完成后初始化画布
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !backgroundImage) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = backgroundImage.width * dpr;
    canvas.height = backgroundImage.height * dpr;
    // canvas.style.width = `${backgroundImage.width}px`;
    // canvas.style.height = `${backgroundImage.height}px`;
    // canvas.style.width = '832px';
    canvas.style.height = '800px';

    ctx.scale(dpr, dpr);
    
    drawPoints();
  }, [backgroundImage]);

  // 当文字状态改变时重新绘制
  useEffect(() => {
    if (!backgroundImage || points.length === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    ctx.drawImage(backgroundImage, 0, 0, canvas.width / dpr, canvas.height / dpr);

    drawPoints();
    if (text) {
      fillTextInPolygon();
    }
  }, [backgroundImage, text, fontSize, letterSpacing, lineHeight, textColor, textDirection]);

  const updateTextStyle = (ctx: CanvasRenderingContext2D) => {
    ctx.font = `${fontSize}px Arial`;
    ctx.fillStyle = textColor;
  };

  const drawPoints = () => {
    const canvas = canvasRef.current;
    if (!canvas || !backgroundImage) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    
    // 清除画布并重新绘制背景图片
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    ctx.drawImage(backgroundImage, 0, 0, canvas.width / dpr, canvas.height / dpr);

    if (points.length > 0) {
      // 绘制多边形路径
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);

      // 绘制所有点之间的连线
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }

      // 连接最后一个点和第一个点
      ctx.lineTo(points[0].x, points[0].y);

      // 设置线条样式
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  };

  // 检查点是否在多边形内
  const isPointInPolygon = (x: number, y: number) => {
    let inside = false;
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
      const xi = points[i].x, yi = points[i].y;
      const xj = points[j].x, yj = points[j].y;

      const intersect = ((yi > y) !== (yj > y)) &&
        (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  };

  const fillTextInPolygon = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    updateTextStyle(ctx);

    // 获取多边形的边界
    const minX = Math.min(...points.map(p => p.x));
    const maxX = Math.max(...points.map(p => p.x));
    const minY = Math.min(...points.map(p => p.y));
    const maxY = Math.max(...points.map(p => p.y));

    // 添加边距
    const padding = fontSize / 2;

    // 计算实际行高
    const actualLineHeight = fontSize * lineHeight;

    // 在边界范围内填充文字
    let textIndex = 0;
    if (textDirection === 'vertical') {
      // 纵向排列
      for (let x = minX + padding; x <= maxX - padding; x += (fontSize + letterSpacing)) {
        for (let y = minY + fontSize; y <= maxY - padding; y += actualLineHeight) {
          const corners = [
            {x: x - padding, y: y - padding},
            {x: x + fontSize + padding, y: y - padding},
            {x: x - padding, y: y + padding},
            {x: x + fontSize + padding, y: y + padding}
          ];

          if (corners.every(corner => isPointInPolygon(corner.x, corner.y)) && textIndex < text.length) {
            ctx.fillText(text[textIndex], x, y);
            textIndex++;
          }
        }
      }
    } else {
      // 横向排列
      for (let y = minY + fontSize; y <= maxY - padding; y += actualLineHeight) {
        let currentX = minX + padding;

        while (currentX <= maxX - padding && textIndex < text.length) {
          const char = text[textIndex];
          const charWidth = ctx.measureText(char).width;

          const corners = [
            {x: currentX - padding, y: y - fontSize + padding},
            {x: currentX + charWidth + padding, y: y - fontSize + padding},
            {x: currentX - padding, y: y + padding},
            {x: currentX + charWidth + padding, y: y + padding}
          ];

          if (corners.every(corner => isPointInPolygon(corner.x, corner.y))) {
            ctx.fillText(char, currentX, y);
            currentX += charWidth + letterSpacing;
            textIndex++;
          } else {
            currentX += fontSize / 2;
          }
        }
      }
    }
  };

  const handleClear = () => {
    setText('');
    drawPoints();
  };

  // 添加重置为预设值的功能
  const handleResetToPresets = async () => {
    try {
      const res = await fetch(`/api/admin/templates/${templateId}/edit`);
      if (!res.ok) {
        throw new Error('获取预设值失败');
      }
      const data = await res.json();
      
      if (data.editor_state?.presets) {
        const { presets } = data.editor_state;
        setFontSize(presets.fontSize || 16);
        setLetterSpacing(presets.letterSpacing || 2);
        setLineHeight(presets.lineHeight || 1.5);
        setTextColor(presets.textColor || '#000000');
        setTextDirection(presets.textDirection || 'horizontal');
      }
    } catch (error) {
      console.error('重置预设值失败:', error);
      alert('重置预设值失败，请重试');
    }
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">编辑文字</h1>
        <div className="flex gap-4">
          <Link
            href="/"
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            返回首页
          </Link>
          <button
            onClick={handleClear}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            清除文字
          </button>
          <button
            onClick={handleResetToPresets}
            className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
          >
            重置样式
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-8">
        <div className="bg-white rounded-lg shadow-md p-4">
          <canvas
            ref={canvasRef}
            className=""
            style={{ maxWidth: '100%', height: '100%' }}
          />
        </div>
        <div className="bg-white rounded-lg shadow-md p-4 flex-1">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="请输入要排版的文字"
            className="w-full h-32 p-2 mb-4 border border-gray-300 rounded resize-none"
          />
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">文字大小</label>
              <input
                type="range"
                min="12"
                max="36"
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="w-full"
              />
              <span className="text-sm text-gray-500">{fontSize}px</span>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">字间距</label>
              <input
                type="range"
                min="0"
                max="20"
                value={letterSpacing}
                onChange={(e) => setLetterSpacing(Number(e.target.value))}
                className="w-full"
              />
              <span className="text-sm text-gray-500">{letterSpacing}px</span>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">行高</label>
              <input
                type="range"
                min="1"
                max="3"
                step="0.1"
                value={lineHeight}
                onChange={(e) => setLineHeight(Number(e.target.value))}
                className="w-full"
              />
              <span className="text-sm text-gray-500">{lineHeight}</span>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">文字颜色</label>
              <input
                type="color"
                value={textColor}
                onChange={(e) => setTextColor(e.target.value)}
                className="w-full h-10"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">文字方向</label>
              <select
                value={textDirection}
                onChange={(e) => setTextDirection(e.target.value as 'horizontal' | 'vertical')}
                className="w-full p-2 border border-gray-300 rounded"
              >
                <option value="horizontal">横向排列</option>
                <option value="vertical">纵向排列</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 