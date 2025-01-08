'use client';

import { useEffect, useRef, useState } from 'react';

export default function Editor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [points, setPoints] = useState<{x: number; y: number}[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [text, setText] = useState('');
  const [fontSize, setFontSize] = useState(16);
  const [letterSpacing, setLetterSpacing] = useState(2);
  const [lineHeight, setLineHeight] = useState(1.5);
  const [textColor, setTextColor] = useState('#000000');
  const [textDirection, setTextDirection] = useState<'horizontal' | 'vertical'>('horizontal');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 初始化画布设置
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#333';
    updateTextStyle(ctx);
  }, []);

  const updateTextStyle = (ctx: CanvasRenderingContext2D) => {
    ctx.font = `${fontSize}px Arial`;
    ctx.fillStyle = textColor;
  };

  const drawPoints = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (points.length > 0) {
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);

      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }

      if (isCompleted) {
        ctx.closePath();
      }

      ctx.stroke();

      // 绘制顶点
      points.forEach(point => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 3, 0, Math.PI * 2);
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

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isCompleted) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // 先绘制新点
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fill();

    // 如果已经有其他点，绘制连线
    if (points.length > 0) {
      ctx.beginPath();
      ctx.moveTo(points[points.length - 1].x, points[points.length - 1].y);
      ctx.lineTo(x, y);
      ctx.stroke();
    }

    // 更新点集合
    setPoints([...points, {x, y}]);
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
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setPoints([]);
    setIsDrawing(false);
    setIsCompleted(false);
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
      </div>
      <div className="flex flex-wrap gap-8">
        <div className="bg-white rounded-lg shadow-md p-4">
          <canvas
            ref={canvasRef}
            width={600}
            height={400}
            onClick={handleCanvasClick}
            className="border border-gray-300 cursor-crosshair"
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