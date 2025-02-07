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
  const [points, setPoints] = useState<{x: number; y: number}[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isNearFirstPoint, setIsNearFirstPoint] = useState(false);
  const [text, setText] = useState('');
  const [fontSize, setFontSize] = useState(16);
  const [letterSpacing, setLetterSpacing] = useState(2);
  const [lineHeight, setLineHeight] = useState(1.5);
  const [textColor, setTextColor] = useState('#000000');
  const [textDirection, setTextDirection] = useState<'horizontal' | 'vertical'>('horizontal');
  const [backgroundImage, setBackgroundImage] = useState<HTMLImageElement | null>(null);

  // 初始化画布和背景图片
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
          
          // 如果有保存的编辑状态，加载它
          if (data.editor_state) {
            const state = data.editor_state;
            setPoints(state.points);
            setText(state.text);
            setFontSize(state.fontSize);
            setLetterSpacing(state.letterSpacing);
            setLineHeight(state.lineHeight);
            setTextColor(state.textColor);
            setTextDirection(state.textDirection);
            setIsCompleted(true);
            setTimeout(() => {
              drawPoints();
              fillTextInPolygon();
            }, 100);
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
    canvas.style.width = `${backgroundImage.width}px`;
    canvas.style.height = `${backgroundImage.height}px`;
    ctx.scale(dpr, dpr);
    
    drawPoints();
  }, [backgroundImage]);

  // 当点或文字状态改变时重新绘制
  useEffect(() => {
    if (!backgroundImage) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    ctx.drawImage(backgroundImage, 0, 0, canvas.width / dpr, canvas.height / dpr);

    if (isCompleted && points.length > 0) {
      drawPoints();
      if (text) {
        fillTextInPolygon();
      }
    }
  }, [backgroundImage, points, isCompleted, text, fontSize, letterSpacing, lineHeight, textColor, textDirection]);

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

      // 如果多边形已完成，连接最后一个点和第一个点
      if (isCompleted) {
        ctx.lineTo(points[0].x, points[0].y);
      }

      // 设置线条样式
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 2;
      ctx.stroke();

      // 绘制所有顶点
      points.forEach((point, index) => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 3, 0, Math.PI * 2);
        // 第一个点使用不同的颜色
        ctx.fillStyle = index === 0 ? '#4CAF50' : '#333';
        ctx.fill();
      });
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

  // 检查点是否靠近第一个点
  const isNearPoint = (x: number, y: number, targetX: number, targetY: number) => {
    const distance = Math.sqrt(Math.pow(x - targetX, 2) + Math.pow(y - targetY, 2));
    return distance < 10; // 10像素的判定范围
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isCompleted || points.length === 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const x = (e.clientX - rect.left) * (canvas.width / (rect.width * dpr));
    const y = (e.clientY - rect.top) * (canvas.height / (rect.height * dpr));

    // 检查是否靠近第一个点
    const isNear = isNearPoint(x, y, points[0].x, points[0].y);
    setIsNearFirstPoint(isNear);

    // 实时绘制预览线
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 重新绘制所有内容
    drawPoints();

    // 绘制当前移动点到最后一个点的连线
    ctx.beginPath();
    ctx.moveTo(points[points.length - 1].x, points[points.length - 1].y);
    ctx.lineTo(x, y);
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 如果靠近第一个点且有足够的点，绘制提示
    if (isNear && points.length > 2) {
      // 预览最后一个点到第一个点的连线
      ctx.beginPath();
      ctx.moveTo(points[points.length - 1].x, points[points.length - 1].y);
      ctx.lineTo(points[0].x, points[0].y);
      ctx.strokeStyle = '#4CAF50';
      ctx.lineWidth = 2;
      ctx.stroke();

      // 绘制第一个点的高亮效果
      ctx.beginPath();
      ctx.arc(points[0].x, points[0].y, 8, 0, Math.PI * 2);
      ctx.strokeStyle = '#4CAF50';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isCompleted) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const x = (e.clientX - rect.left) * (canvas.width / (rect.width * dpr));
    const y = (e.clientY - rect.top) * (canvas.height / (rect.height * dpr));

    // 如果靠近第一个点且已经有至少3个点，则封闭多边形
    if (points.length >= 3 && isNearFirstPoint) {
      setIsCompleted(true);
      setIsDrawing(false);
      
      // 使用当前点集合绘制完整的多边形（包括封闭线）
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
        ctx.drawImage(backgroundImage!, 0, 0, canvas.width / dpr, canvas.height / dpr);
        
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
          ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.lineTo(points[0].x, points[0].y);
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // 重新绘制所有顶点
        points.forEach((point, index) => {
          ctx.beginPath();
          ctx.arc(point.x, point.y, 3, 0, Math.PI * 2);
          ctx.fillStyle = index === 0 ? '#4CAF50' : '#333';
          ctx.fill();
        });
      }

      // 如果已经有文字，立即填充
      if (text) {
        fillTextInPolygon();
      }

      // 保存当前状态
      const data = {
        points,
        text,
        fontSize,
        letterSpacing,
        lineHeight,
        textColor,
        textDirection
      };
      localStorage.setItem(`editorState_${templateId}`, JSON.stringify(data));
      return;
    }

    const newPoints = [...points, {x, y}];
    setPoints(newPoints);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas || !backgroundImage) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    ctx.drawImage(backgroundImage, 0, 0, canvas.width / dpr, canvas.height / dpr);
    setPoints([]);
    setIsDrawing(false);
    setIsCompleted(false);
    setIsNearFirstPoint(false);
    setText('');  // 清除文字
    // 清除保存的状态
    localStorage.removeItem(`editorState_${templateId}`);
  };

  const handleEdit = () => {
    setIsCompleted(false);
    setIsDrawing(false);
    setIsNearFirstPoint(false);
    drawPoints();
  };

  const handleSave = async () => {
    if (!isCompleted) {
      alert('请先完成多边形绘制！');
      return;
    }

    const data = {
      points,
      text,
      fontSize,
      letterSpacing,
      lineHeight,
      textColor,
      textDirection
    };

    try {
      const res = await fetch(`/api/admin/templates/${templateId}/edit`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!res.ok) {
        throw new Error('保存失败');
      }

      alert('保存成功！');
    } catch (error) {
      console.error('保存失败:', error);
      alert('保存失败，请重试！');
    }
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">编辑模版</h1>
        <div className="flex gap-4">
          <Link
            href="/admin/templates"
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            返回列表
          </Link>
          <button
            onClick={handleClear}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            清除画布
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            保存修改
          </button>
          {isCompleted && (
            <button
              onClick={handleEdit}
              className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
            >
              编辑多边形
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-8">
        <div className="bg-white rounded-lg shadow-md p-4">
          <canvas
            ref={canvasRef}
            onClick={handleCanvasClick}
            onMouseMove={handleCanvasMouseMove}
            className={`border border-gray-300 ${
              isNearFirstPoint && points.length > 2 ? 'cursor-pointer' : 'cursor-crosshair'
            }`}
            style={{ maxWidth: '100%', height: '100%' }}
          />
        </div>
        <div className="bg-white rounded-lg shadow-md p-4 flex-1">
          <textarea
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              if (isCompleted) {
                drawPoints();
                fillTextInPolygon();
              }
            }}
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
                onChange={(e) => {
                  setFontSize(Number(e.target.value));
                  if (isCompleted) {
                    drawPoints();
                    fillTextInPolygon();
                  }
                }}
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
                onChange={(e) => {
                  setLetterSpacing(Number(e.target.value));
                  if (isCompleted) {
                    drawPoints();
                    fillTextInPolygon();
                  }
                }}
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
                onChange={(e) => {
                  setLineHeight(Number(e.target.value));
                  if (isCompleted) {
                    drawPoints();
                    fillTextInPolygon();
                  }
                }}
                className="w-full"
              />
              <span className="text-sm text-gray-500">{lineHeight}</span>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">文字颜色</label>
              <input
                type="color"
                value={textColor}
                onChange={(e) => {
                  setTextColor(e.target.value);
                  if (isCompleted) {
                    drawPoints();
                    fillTextInPolygon();
                  }
                }}
                className="w-full h-10"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">文字方向</label>
              <select
                value={textDirection}
                onChange={(e) => {
                  setTextDirection(e.target.value as 'horizontal' | 'vertical');
                  if (isCompleted) {
                    drawPoints();
                    fillTextInPolygon();
                  }
                }}
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