'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';

interface EditorState {
  points: Array<{x: number; y: number}>;
  text: string;
  fontSize: number;
  letterSpacing: number;
  lineHeight: number;
  textColor: string;
  textDirection: 'horizontal' | 'vertical';
}

export default function Editor() {
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
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 获取设备像素比
    const dpr = window.devicePixelRatio || 1;
    
    // 加载背景图片
    const img = new window.Image();
    img.src = '/template.png';
    img.onload = () => {
      setBackgroundImage(img);
      
      // 设置画布的实际尺寸（考虑设备像素比）
      canvas.width = img.width * dpr;
      canvas.height = img.height * dpr;
      
      // 设置画布的显示尺寸
      canvas.style.width = `${img.width}px`;
      canvas.style.height = `${img.height}px`;
      
      // 根据设备像素比缩放上下文
      ctx.scale(dpr, dpr);
      
      // 绘制背景图片（使用显示尺寸）
      ctx.drawImage(img, 0, 0, img.width, img.height);
      
      // 如果有保存的坐标，加载它们
      const savedPoints = localStorage.getItem('polygonPoints');
      if (savedPoints) {
        const parsedPoints = JSON.parse(savedPoints);
        setPoints(parsedPoints);
        drawPoints();
      }
    };
  }, []);

  // 当背景图片或点发生变化时重新绘制
  useEffect(() => {
    if (!backgroundImage) return;
    drawPoints();
  }, [backgroundImage, points]);

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
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);

      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }

      if (isCompleted) {
        ctx.closePath();
      }

      ctx.strokeStyle = '#333';
      ctx.lineWidth = 2;
      ctx.stroke();

      // 绘制顶点
      points.forEach(point => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#333';
        ctx.fill();
      });
    }
  };

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
    drawPoints();
    if (points.length > 0) {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.beginPath();
      ctx.moveTo(points[points.length - 1].x, points[points.length - 1].y);
      ctx.lineTo(x, y);
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 2;
      ctx.stroke();

      // 如果靠近第一个点，绘制一个特殊的提示圆圈
      if (isNear && points.length > 2) {
        ctx.beginPath();
        ctx.arc(points[0].x, points[0].y, 8, 0, Math.PI * 2);
        ctx.strokeStyle = '#4CAF50';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
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
      drawPoints();
      fillTextInPolygon();
      return;
    }

    const newPoints = [...points, {x, y}];
    setPoints(newPoints);
    localStorage.setItem('polygonPoints', JSON.stringify(newPoints));
  };

  const handleComplete = () => {
    if (points.length < 3) {
      alert('请至少绘制三个点来形成多边形！');
      return;
    }

    setIsCompleted(true);
    setIsDrawing(false);
    drawPoints();
    fillTextInPolygon();
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas || !backgroundImage) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(backgroundImage, 0, 0);
    setPoints([]);
    setIsDrawing(false);
    setIsCompleted(false);
    // 清除保存的坐标
    localStorage.removeItem('polygonPoints');
  };

  const handleSave = () => {
    const data = {
      points,
      text,
      fontSize,
      letterSpacing,
      lineHeight,
      textColor,
      textDirection
    };
    localStorage.setItem('editorState', JSON.stringify(data));
    alert('保存成功！');
  };

  const handleLoad = () => {
    const savedState = localStorage.getItem('editorState');
    if (savedState) {
      const data = JSON.parse(savedState);
      setPoints(data.points);
      setText(data.text);
      setFontSize(data.fontSize);
      setLetterSpacing(data.letterSpacing);
      setLineHeight(data.lineHeight);
      setTextColor(data.textColor);
      setTextDirection(data.textDirection);
      setIsCompleted(true);
      drawPoints();
      setTimeout(() => {
        fillTextInPolygon();
      }, 100);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">文字多边形排版工具</h1>
      <div className="flex gap-4 mb-4">
        <button
          onClick={handleClear}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          清除画布
        </button>
        <button
          onClick={handleComplete}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          完成绘制
        </button>
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          保存状态
        </button>
        <button
          onClick={handleLoad}
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
        >
          加载状态
        </button>
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
            style={{ maxWidth: '100%', height: 'auto' }}
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