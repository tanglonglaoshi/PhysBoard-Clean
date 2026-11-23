/* ============================================================================
 *  电子白板 · 图形库  shapes.js
 *  ---------------------------------------------------------------------------
 *  用法：
 *    1) 把本文件和 HTML 放在同一个文件夹；
 *    2) 在 HTML 里、主 <script> 之前引入： <script src="shapes.js"></script>
 *
 *  加新图形：
 *    在文件最末尾追加一段 shape({...}) 即可，保存刷新页面就生效。
 * ============================================================================ */

(function () {
'use strict';

/* ==========================================================================
 * 0. 全局注册表
 * ========================================================================== */
const PB = window.PhysBoard = window.PhysBoard || {
  shapes: {},
  paramDefs: {},
  categories: [],
  register(d) { this.shapes[d.key] = d; },
  category(id, label) { this.categories.push({ id, label }); },
  param(key, def) { this.paramDefs[key] = def; }
};

const shape = (d) => PB.register(d);
const cat   = (id, label) => PB.category(id, label);
const param = (key, def) => PB.param(key, def);

/* ==========================================================================
 * 1. 分类
 * ========================================================================== */
cat('basic',  '基础');
cat('mech',   '力学');
cat('wave',   '振动与波');
cat('optics', '光学');
cat('em',     '电磁');
cat('text',   '文字');
cat('sketch', '简笔画');
cat('anim',   '动画');


/* ==========================================================================
 * 2. 可调参数定义（同名参数只保留一份最终定义）
 *    注意：原文件中部分参数重复定义，此处保留最后一次生效的版本。
 * ========================================================================== */

/* ---- 基础几何 / 力学 ---- */
param('a0',     { label: '起始角', min: -180, max: 180, step: 1, def: -90, unit: '°' });
param('sweep',  { label: '张角',   min: 0,    max: 360, step: 1, def: 90,  unit: '°' });
param('thick',  { label: '槽宽',   min: 2,    max: 80,  step: 1, def: 16 });
param('coils',  { label: '圈数',   min: 2,    max: 30,  step: 1, def: 8 });
param('paraP',  { label: '开口',   min: 1,    max: 5,   step: 0.1,  def: 2 });
param('spiralT',{ label: '圈数',   min: 1,    max: 20,  step: 1,    def: 5 });
param('cycR',   { label: '半径比', min: 0.2,  max: 1.5, step: 0.05, def: 1 });
param('cycN',   { label: '拱数',   min: 1,    max: 8,   step: 1,    def: 3 });
param('fillPattern', { label: '填充', min: 0, max: 2, step: 1, def: 0, unit: '0纯色1⊗向里2⊙向外' });
/* ---- 网格 / 坐标系 ---- */
param('step',   { label: '网格间距', min: 8, max: 200, step: 1, def: 40, unit: 'px' });

/* ---- 新增可调参数 ---- */
param('amp',        { label: '振幅',   min: 0,    max: 1,    step: 0.05, def: 0.5 });
param('tickGap',    { label: '刻度距', min: 4,    max: 40,   step: 1,    def: 10   });
param('groundGap',  { label: '阴影距', min: 6,    max: 40,   step: 1,    def: 18   });
param('axisTick',   { label: '刻度',   min: 0,    max: 1,    step: 1,    def: 1    });
param('springAmp',  { label: '弹簧幅', min: 0.03, max: 0.25, step: 0.01, def: 0.09 });

param('bowlPeriod', { label: '周期',     min: 0.3, max: 6,  step: 0.1, def: 1.6, unit: 's' });
param('bowlAmp',    { label: '最大摆角', min: 0,   max: 90, step: 1,   def: 60,  unit: '°' });
param('bowlBallR',  { label: '球半径',   min: 2,   max: 20, step: 0.5, def: 6 });

/* ---- 波动 ---- */
param('cycles',   { label: '周期数', min: 0.5, max: 10,  step: 0.5,  def: 2 });
param('phase',    { label: '相位',   min: 0,   max: 360, step: 5,    def: 0, unit: '°' });
param('waveAxis', { label: '坐标轴', min: 0,   max: 1,   step: 1,    def: 1, unit: '0无1有' });

/* ---- 电磁 / 场 ---- */
param('ringTheta0', { label: '初始摆角', min: 5,   max: 90,  step: 1,    def: 60,  unit: '°' });
param('ringK',      { label: '质量比k',  min: 0.2, max: 8,   step: 0.1,  def: 2 });
param('ringLen',    { label: '绳长比',   min: 0.3, max: 1.0, step: 0.05, def: 0.7 });
param('ringPeriod', { label: '基准周期', min: 0.5, max: 4,   step: 0.1,  def: 1.5, unit: 's' });

/* ---- 光学 ---- */
param('hue7',    { label: '颜色',     min: 0,   max: 6,  step: 1,    def: 0 });
param('density', { label: '条纹密度', min: 3,   max: 30, step: 1,    def: 12 });
param('distort', { label: '畸变强度', min: 0,   max: 100, step: 1,   def: 30, unit: '%' });

/* ==========================================================================
 * 3. 共用绘制片段
 * ========================================================================== */

/* ===== 磁场填充画笔：纯色 或 磁场符号图案 ===== */
function __fillPaint(c, U, o, alpha) {
  const pat = (o.fillPattern | 0);
  if (pat === 0) return U.alpha(o.color, alpha);

  const color = o.color || '#e6edf7';
  const size = 28;
  const cv = document.createElement('canvas');
  cv.width = cv.height = size;
  const cx = cv.getContext('2d');
  cx.strokeStyle = color;
  cx.fillStyle   = color;
  cx.globalAlpha = Math.max(0.40, Math.min(1, alpha + 0.30));
  cx.lineCap  = 'round';
  cx.lineJoin = 'round';

  const h = size / 2;
  if (pat === 1) {
    /* ⊗ 垂直纸面向里：叉号 */
    const d = size * 0.20;
    cx.lineWidth = Math.max(1.3, size * 0.065);
    cx.beginPath();
    cx.moveTo(h - d, h - d); cx.lineTo(h + d, h + d);
    cx.moveTo(h + d, h - d); cx.lineTo(h - d, h + d);
    cx.stroke();
  } else {
    /* ⊙ 垂直纸面向外：实心圆点 */
    const r = size * 0.11;
    cx.beginPath();
    cx.arc(h, h, r, 0, Math.PI * 2);
    cx.fill();
  }
  try { return c.createPattern(cv, 'repeat'); }
  catch (e) { return color; }
}



/* 正多边形工厂 */
function polyDraw(n) {
  return function (c, o, U) {
    const b = U.bbox(o);
    const cx = b.x1 + b.w / 2, cy = b.y1 + b.h / 2;
    const rx = b.w / 2, ry = b.h / 2;
    c.beginPath();
    for (let i = 0; i < n; i++) {
      const a = -Math.PI / 2 + i * 2 * Math.PI / n;
      const x = cx + rx * Math.cos(a);
      const y = cy + ry * Math.sin(a);
      i ? c.lineTo(x, y) : c.moveTo(x, y);
    }
    c.closePath();
    if (o.fill) { c.fillStyle = __fillPaint(c, U, o, 0.22); c.fill(); }   /* ← 改 */
    c.stroke();
  };
}

/* ==========================================================================
 * 4. 基础图形
 * ========================================================================== */

/* ---- 画笔（工具栏用，不出现在图形栏） ---- */
shape({
  key: 'pen', cat: 'basic', geom: 'path', label: '画笔', hidden: true,
  icon: '<path d="M16.6 3.4a2.1 2.1 0 0 1 3 3L8.2 17.8 4 19l1.2-4.2L16.6 3.4z"/>',
  draw(c, o) {
    if (o.points.length === 1) {
      const p = o.points[0];
      c.beginPath();
      c.arc(p.x, p.y, (o.size || 4) / 2, 0, Math.PI * 2);
      c.fillStyle = o.color;
      c.fill();
    } else {
      c.beginPath();
      o.points.forEach((p, i) => i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y));
      c.stroke();
    }
  }
});

/* ---- 橡皮（工具栏用） ---- */
shape({
  key: 'eraser', cat: 'basic', geom: 'path', label: '橡皮', hidden: true,
  icon: '<path d="M8.5 20l-4.2-4.2a2 2 0 0 1 0-2.8l7.3-7.3a2 2 0 0 1 2.8 0l4.7 4.7a2 2 0 0 1 0 2.8L13.2 20H8.5z"/><path d="M20 20h-9"/>',
  draw(c, o) {
    c.save();
    c.globalCompositeOperation = 'destination-out';
    const w = Math.max(10, (o.size || 4) * 3);
    c.lineWidth = w;
    c.strokeStyle = 'rgba(0,0,0,1)';
    if (o.points.length === 1) {
      const p = o.points[0];
      c.beginPath();
      c.arc(p.x, p.y, w / 2, 0, Math.PI * 2);
      c.fillStyle = 'rgba(0,0,0,1)';
      c.fill();
    } else {
      c.beginPath();
      o.points.forEach((p, i) => i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y));
      c.stroke();
    }
    c.restore();
  }
});

/* ---- 1. 实线段 ---- */
shape({
  key: 'line', cat: 'basic', geom: 'line', label: '实线段',
  icon: '<path d="M4 20L20 4"/>',
  draw(c, o) {
    c.save();
    c.setLineDash([]);
    c.beginPath();
    c.moveTo(o.x1, o.y1);
    c.lineTo(o.x2, o.y2);
    c.stroke();
    c.restore();
  }
});

/* ---- 2. 虚线段 ---- */
shape({
  key: 'dashedLine', cat: 'basic', geom: 'line', label: '虚线段',
  icon: '<path d="M4 20L20 4" stroke-dasharray="3 3"/>',
  draw(c, o) {
    const lw = o.size || 4;
    c.save();
    c.setLineDash([lw * 2.6, lw * 2.2]);
    c.beginPath();
    c.moveTo(o.x1, o.y1);
    c.lineTo(o.x2, o.y2);
    c.stroke();
    c.restore();
  }
});

/* ---- 3. 箭头 ---- */
shape({
  key: 'arrow', cat: 'basic', geom: 'line', label: '箭头',
  icon: '<path d="M4 20L20 4"/><path d="M13 4h7v7"/>',
  draw(c, o, U) {
    c.beginPath();
    c.moveTo(o.x1, o.y1);
    c.lineTo(o.x2, o.y2);
    c.stroke();
    U.arrowHead(c, o.x1, o.y1, o.x2, o.y2, o.size || 4);
  }
});

/* ---- 4. 双箭头 ---- */
shape({
  key: 'dblArrow', cat: 'basic', geom: 'line', label: '双箭头',
  icon: '<path d="M4 12h16"/><path d="M7 9l-3 3 3 3"/><path d="M17 9l3 3-3 3"/>',
  draw(c, o, U) {
    c.beginPath();
    c.moveTo(o.x1, o.y1);
    c.lineTo(o.x2, o.y2);
    c.stroke();
    U.arrowHead(c, o.x1, o.y1, o.x2, o.y2, o.size || 4);
    U.arrowHead(c, o.x2, o.y2, o.x1, o.y1, o.size || 4);
  }
});

/* ---- 5. 矩形 ---- */
shape({
  key: 'rect', cat: 'basic', geom: 'box', label: '矩形', fill: true,
  icon: '<rect x="4" y="6" width="16" height="12" rx="1"/>',
params: ['fillPattern'],  
  draw(c, o, U) {
    const b = U.bbox(o);
    c.beginPath();
    c.rect(b.x1, b.y1, b.w, b.h);
    if (o.fill) { c.fillStyle = __fillPaint(c, U, o, 0.22); c.fill(); }   /* ← 改 */
    c.stroke();
  }
});

/* ---- 圆角矩形 ---- */
shape({
  key: 'roundedRect', cat: 'basic', geom: 'box', label: '圆角矩形', fill: true,
  icon: '<rect x="4" y="6" width="16" height="12" rx="3"/>',
  draw(c, o, U) {
    const b = U.bbox(o);
    const r = Math.min(b.w, b.h) * 0.18;
    c.beginPath();
    if (c.roundRect) {
      c.roundRect(b.x1, b.y1, b.w, b.h, r);
    } else {
      c.moveTo(b.x1 + r, b.y1);
      c.lineTo(b.x2 - r, b.y1);
      c.quadraticCurveTo(b.x2, b.y1, b.x2, b.y1 + r);
      c.lineTo(b.x2, b.y2 - r);
      c.quadraticCurveTo(b.x2, b.y2, b.x2 - r, b.y2);
      c.lineTo(b.x1 + r, b.y2);
      c.quadraticCurveTo(b.x1, b.y2, b.x1, b.y2 - r);
      c.lineTo(b.x1, b.y1 + r);
      c.quadraticCurveTo(b.x1, b.y1, b.x1 + r, b.y1);
      c.closePath();
    }
    if (o.fill) { c.fillStyle = U.alpha(o.color, 0.22); c.fill(); }
    c.stroke();
  }
});

/* ---- 6. 圆形 ---- */
shape({
  key: 'circle', cat: 'basic', geom: 'box', label: '圆形', fill: true,
  icon: '<circle cx="12" cy="12" r="8.5"/>',
params: ['fillPattern'],  
  draw(c, o, U) {
    const b = U.bbox(o);
    const cx = b.x1 + b.w / 2;
    const cy = b.y1 + b.h / 2;
    const r = Math.min(b.w, b.h) / 2;
    c.beginPath();
    c.arc(cx, cy, Math.max(r, 0.1), 0, Math.PI * 2);
    if (o.fill) { c.fillStyle = __fillPaint(c, U, o, 0.22); c.fill(); }   /* ← 改 */
    c.stroke();
  }
});

/* ---- 6b. 椭圆 ---- */
shape({
  key: 'ellipse', cat: 'basic', geom: 'box', label: '椭圆', fill: true,
  icon: '<ellipse cx="12" cy="12" rx="8.5" ry="6"/>',
  draw(c, o, U) {
    const b = U.bbox(o);
    c.beginPath();
    c.ellipse(b.x1 + b.w / 2, b.y1 + b.h / 2,
              Math.max(b.w / 2, 0.1), Math.max(b.h / 2, 0.1), 0, 0, Math.PI * 2);
    if (o.fill) { c.fillStyle = U.alpha(o.color, 0.22); c.fill(); }
    c.stroke();
  }
});

/* ---- 7. 扇形 ---- */
shape({
  key: 'sector', cat: 'basic', geom: 'box', label: '扇形', fill: true,
  icon: '<path d="M6 18V7A11 11 0 0 1 17 18Z"/>',
params: ['fillPattern'],  
  params: ['a0', 'sweep'],
  draw(c, o, U) {
    const b = U.bbox(o);
    const cx = b.x1 + b.w / 2, cy = b.y1 + b.h / 2;
    const r = Math.min(b.w, b.h) / 2;
    const a0 = U.rad(o.a0 ?? -90);
    const sw = U.rad(o.sweep ?? 90);
    c.beginPath();
    c.moveTo(cx, cy);
    c.arc(cx, cy, Math.max(r, 1), a0, a0 + sw);
    c.closePath();
    if (o.fill) { c.fillStyle = __fillPaint(c, U, o, 0.22); c.fill(); }   /* ← 改 */
    c.stroke();
  }
});

shape({
  key: 'isoTriangle', cat: 'basic', geom: 'box', label: '等腰三角形', fill: true,
  icon: '<path d="M12 4l9 16H3z"/>',
params: ['fillPattern'],  
  draw(c, o, U) {
    const b = U.bbox(o);
    c.beginPath();
    c.moveTo(b.x1 + b.w / 2, b.y1);
    c.lineTo(b.x1 + b.w, b.y1 + b.h);
    c.lineTo(b.x1, b.y1 + b.h);
    c.closePath();
    if (o.fill) { c.fillStyle = __fillPaint(c, U, o, 0.22); c.fill(); }   /* ← 改 */
    c.stroke();
  }
});

/* ---- 9. 直角三角形（方向随拖动自动判断） ---- */
shape({
  key: 'rightTriangle', cat: 'basic', geom: 'box', label: '直角三角形', fill: true,
  icon: '<path d="M4 4v16h16z"/>',
params: ['fillPattern'],  
  draw(c, o, U) {
    const b = U.bbox(o);

    /* 根据原始起止点的水平位移判断倾角方向：
     *   o.x2 > o.x1（向右拖）→ 斜边朝右，直角在左下
     *   o.x2 < o.x1（向左拖）→ 斜边朝左，直角在右下
     *   水平位移过小（近乎竖直拖动）→ 默认斜边朝右 */
    const dx = (o.x2 ?? 0) - (o.x1 ?? 0);
    const flip = Math.abs(dx) > 1 ? (dx < 0 ? 1 : 0) : 0;

    c.beginPath();
    if (!flip) {
      c.moveTo(b.x1, b.y1);
      c.lineTo(b.x1, b.y2);
      c.lineTo(b.x2, b.y2);
    } else {
      c.moveTo(b.x2, b.y1);
      c.lineTo(b.x2, b.y2);
      c.lineTo(b.x1, b.y2);
    }
    c.closePath();
    if (o.fill) { c.fillStyle = __fillPaint(c, U, o, 0.22); c.fill(); }   /* ← 改 */
    c.stroke();
  }
});
/* ---- 10. 平行四边形 ---- */
param('paraSkew', { label: '倾斜量', min: 0, max: 100, step: 1, def: 20, unit: '%' });
param('paraDir',  { label: '倾斜方向', min: 0, max: 1, step: 1, def: 0, unit: '0左1右' });

shape({
  key: 'parallelogram', cat: 'basic', geom: 'box', label: '平行四边形', fill: true,
  icon: '<path d="M6 6h14l-4 12H2z"/>',
  params: ['paraSkew', 'paraDir'],
  draw(c, o, U) {
    const b = U.bbox(o);
    const pct = Math.max(0, Math.min(100, o.paraSkew ?? 20));
    const offset = b.w * (pct / 100);
    const toRight = (o.paraDir ?? 0) < 0.5;

    c.beginPath();
    if (toRight) {
      c.moveTo(b.x1 + offset, b.y1);
      c.lineTo(b.x2, b.y1);
      c.lineTo(b.x2 - offset, b.y2);
      c.lineTo(b.x1, b.y2);
    } else {
      c.moveTo(b.x1, b.y1);
      c.lineTo(b.x2 - offset, b.y1);
      c.lineTo(b.x2, b.y2);
      c.lineTo(b.x1 + offset, b.y2);
    }
    c.closePath();
    if (o.fill) { c.fillStyle = U.alpha(o.color, 0.22); c.fill(); }
    c.stroke();
  }
});

/* ---- 11. 菱形 ---- */
shape({
  key: 'diamond', cat: 'basic', geom: 'box', label: '菱形', fill: true,
  icon: '<path d="M12 3l9 9-9 9-9-9z"/>',
  draw(c, o, U) {
    const b = U.bbox(o);
    const cx = b.x1 + b.w / 2, cy = b.y1 + b.h / 2;
    c.beginPath();
    c.moveTo(cx, b.y1);
    c.lineTo(b.x2, cy);
    c.lineTo(cx, b.y2);
    c.lineTo(b.x1, cy);
    c.closePath();
    if (o.fill) { c.fillStyle = U.alpha(o.color, 0.22); c.fill(); }
    c.stroke();
  }
});

/* ---- 12. 梯形 ---- */
param('trapTop',  { label: '上边宽度', min: 0, max: 100, step: 1, def: 70, unit: '%' });
param('trapType', { label: '形状', min: 0, max: 2, step: 1, def: 1, unit: '——0左1等腰2右' });

shape({
  key: 'trapezoid', cat: 'basic', geom: 'box', label: '等腰梯形', fill: true,
  icon: '<path d="M6 6h12l3 12H3z"/>',
  params: ['trapTop', 'trapType'],
  draw(c, o, U) {
    const b = U.bbox(o);
    const topW = b.w * (Math.max(0, Math.min(100, o.trapTop ?? 70)) / 100);
    const type = Math.round(o.trapType ?? 1);

    c.beginPath();
    if (type === 0) {
      c.moveTo(b.x1, b.y1);
      c.lineTo(b.x1 + topW, b.y1);
      c.lineTo(b.x2, b.y2);
      c.lineTo(b.x1, b.y2);
    } else if (type === 2) {
      c.moveTo(b.x2 - topW, b.y1);
      c.lineTo(b.x2, b.y1);
      c.lineTo(b.x2, b.y2);
      c.lineTo(b.x1, b.y2);
    } else {
      const inset = (b.w - topW) / 2;
      c.moveTo(b.x1 + inset, b.y1);
      c.lineTo(b.x2 - inset, b.y1);
      c.lineTo(b.x2, b.y2);
      c.lineTo(b.x1, b.y2);
    }
    c.closePath();
    if (o.fill) { c.fillStyle = U.alpha(o.color, 0.22); c.fill(); }
    c.stroke();
  }
});

/* ---- 13. 五边形 ---- */
shape({
  key: 'pentagon', cat: 'basic', geom: 'box', label: '五边形', fill: true,
  icon: '<path d="M12 3.5l8.5 6.2-3.2 10H6.7l-3.2-10z"/>',
params: ['fillPattern'], 
  draw: polyDraw(5)
});

/* ---- 14. 六边形 ---- */
shape({
  key: 'hexagon', cat: 'basic', geom: 'box', label: '六边形', fill: true,
  icon: '<path d="M12 3l7.8 4.5v9L12 21l-7.8-4.5v-9z"/>',
params: ['fillPattern'],  
  draw: polyDraw(6)
});

/* ---- 地面 ---- */
param('groundUp', { label: '锯齿方向', min: 0, max: 1, step: 1, def: 0, unit: '0下1上' });

shape({
  key: 'ground', cat: 'basic', geom: 'line', label: '地面',
  icon: '<path d="M3 15h18"/><path d="M5 15l-2 4M9 15l-2 4M13 15l-2 4M17 15l-2 4M21 15l-2 4"/>',
  params: ['groundGap', 'groundUp'],
  draw(c, o) {
    c.beginPath();
    c.moveTo(o.x1, o.y1);
    c.lineTo(o.x2, o.y2);
    c.stroke();

    const dx = o.x2 - o.x1, dy = o.y2 - o.y1;
    const len = Math.hypot(dx, dy);
    if (len < 2) return;
    const ux = dx / len, uy = dy / len;
    let nx = -uy, ny = ux;
    const up = (o.groundUp ?? 0) >= 0.5;
    if (up ? ny > 0 : ny < 0) { nx = -nx; ny = -ny; }
    const tickLen = 10;
    const spacing = Math.max(6, o.groundGap ?? 18);

    c.save();
    c.lineWidth = Math.max(0.7, (o.size || 4) * 0.5);
    for (let s = 0; s <= len; s += spacing) {
      const px = o.x1 + ux * s;
      const py = o.y1 + uy * s;
      c.beginPath();
      c.moveTo(px, py);
      c.lineTo(px + nx * tickLen - ux * tickLen * 0.5,
               py + ny * tickLen - uy * tickLen * 0.5);
      c.stroke();
    }
    c.restore();
  }
});


/* ---- 打点计时器纸带 ---- */
param('tapeDots',  { label: '点数',   min: 3,  max: 20, step: 1,   def: 7   });
param('tapeAccel', { label: '加速度', min: -3, max: 3,  step: 0.1, def: 1.5 });

shape({
  key: 'tickerTape', cat: 'basic', geom: 'box', label: '纸带',
  icon: '<rect x="2" y="9" width="20" height="6" rx="1"/>' +
        '<circle cx="5.5"  cy="12" r="0.8" fill="currentColor"/>' +
        '<circle cx="8.5"  cy="12" r="0.8" fill="currentColor"/>' +
        '<circle cx="12.5" cy="12" r="0.8" fill="currentColor"/>' +
        '<circle cx="18"   cy="12" r="0.8" fill="currentColor"/>',
  params: ['tapeDots', 'tapeAccel'],
  draw(c, o, U) {
    const b = U.bbox(o);
    const { x1, y1, x2, y2, w, h } = b;
    const cy = (y1 + y2) / 2;

    c.save();
    c.fillStyle = '#ffffff';
    c.fillRect(x1, y1, w, h);
    c.strokeRect(x1, y1, w, h);
    c.restore();

    const n = Math.max(4, Math.round(o.tapeDots ?? 7));
    const a = Math.max(-3, Math.min(3, o.tapeAccel ?? 1.5));
    const t = a / 3;
    const dd = t * (0.9 / (n - 1));
    const d0 = 1 - ((n - 2) / 2) * dd;

    const positions = [0];
    let d = d0;
    for (let i = 1; i < n; i++) {
      positions.push(positions[i - 1] + d);
      d += dd;
    }
    const total = positions[n - 1];

    const margin = 0.06;
    const usable = 1 - 2 * margin;
    const dotR = Math.min(h * 0.16, (w / n) * 0.28);

    c.save();
    c.fillStyle = o.dotColor || '#000000';
    for (let i = 0; i < n; i++) {
      const px = x1 + w * (margin + usable * positions[i] / total);
      c.beginPath();
      c.arc(px, cy, Math.max(1, dotR), 0, Math.PI * 2);
      c.fill();
    }
    c.restore();
  }
});


/* ---- 18. 网格 ---- */
shape({
  key: 'grid', cat: 'basic', geom: 'box', label: '网格',
  icon: '<path d="M3 9h18M3 15h18M9 3v18M15 3v18"/>',
  params: ['step'],
  draw(c, o, U) {
    const b = U.bbox(o);
    const step = Math.max(8, o.step ?? 40);
    c.save();
    c.lineWidth = Math.max(0.5, (o.size || 4) * 0.28);
    c.strokeStyle = U.alpha(o.color, 0.45);
    for (let x = b.x1; x <= b.x2 + 0.5; x += step) {
      c.beginPath(); c.moveTo(x, b.y1); c.lineTo(x, b.y2); c.stroke();
    }
    for (let y = b.y1; y <= b.y2 + 0.5; y += step) {
      c.beginPath(); c.moveTo(b.x1, y); c.lineTo(b.x2, y); c.stroke();
    }
    c.restore();
    c.strokeRect(b.x1, b.y1, b.w, b.h);
  }
});

/* ---- 直角坐标系 ---- */
param('axisXDir',  { label: 'x 方向',     min: 0, max: 1,  step: 1, def: 0, unit: '0右1左' });
param('axisYDir',  { label: 'y 方向',     min: 0, max: 1,  step: 1, def: 0, unit: '0上1下' });
param('axisMajor', { label: '主网格',     min: 0, max: 20, step: 1, def: 0, unit: '格' });
param('axisMinor', { label: '次网格等分', min: 0, max: 20, step: 1, def: 0, unit: '份' });

shape({
  key: 'axis', cat: 'basic', geom: 'box', label: '直角坐标系',
  icon: '<path d="M4 20V4M4 20h16"/><path d="M1 7l3-3 3 3"/><path d="M17 17l3 3-3 3"/>',
  params: ['axisXDir', 'axisYDir', 'axisMajor', 'axisMinor'],
  draw(c, o, U) {
    const b = U.bbox(o);
    const xRight = (o.axisXDir ?? 0) < 0.5;
    const yUp    = (o.axisYDir ?? 0) < 0.5;

    const ox   = xRight ? b.x1 : b.x2;
    const oy   = yUp    ? b.y2 : b.y1;
    const xEnd = xRight ? b.x2 : b.x1;
    const yEnd = yUp    ? b.y1 : b.y2;

    const N = Math.max(0, Math.round(o.axisMajor ?? 0));
    const M = Math.max(0, Math.round(o.axisMinor ?? 0));

    const mainCells = N > 0 ? N : 1;
    const cw = b.w / mainCells;
    const ch = b.h / mainCells;

    if (N > 0) {
      c.save();
      c.lineWidth = Math.max(0.5, (o.size || 4) * 0.28);
      c.strokeStyle = U.alpha(o.color, 0.45);
      for (let i = 1; i < N; i++) {
        const x = b.x1 + i * cw;
        c.beginPath(); c.moveTo(x, b.y1); c.lineTo(x, b.y2); c.stroke();
        const y = b.y1 + i * ch;
        c.beginPath(); c.moveTo(b.x1, y); c.lineTo(b.x2, y); c.stroke();
      }
      c.restore();
    }

    if (M > 0) {
      c.save();
      c.setLineDash([3, 3]);
      c.lineWidth = Math.max(0.3, (o.size || 4) * 0.14);
      c.strokeStyle = U.alpha(o.color, 0.25);
      for (let i = 0; i < mainCells; i++) {
        for (let j = 1; j < M; j++) {
          const x = b.x1 + i * cw + (cw / M) * j;
          c.beginPath(); c.moveTo(x, b.y1); c.lineTo(x, b.y2); c.stroke();
          const y = b.y1 + i * ch + (ch / M) * j;
          c.beginPath(); c.moveTo(b.x1, y); c.lineTo(b.x2, y); c.stroke();
        }
      }
      c.restore();
    }

    c.beginPath();
    c.moveTo(ox, oy); c.lineTo(xEnd, oy);
    c.moveTo(ox, oy); c.lineTo(ox, yEnd);
    c.stroke();
    U.arrowHead(c, ox, oy, xEnd, oy, o.size || 4);
    U.arrowHead(c, ox, oy, ox, yEnd, o.size || 4);

    const step = 40;
    const tick = 5;
    c.save();
    c.lineWidth = Math.max(0.6, (o.size || 4) * 0.4);

    const tickYDir = yUp ? 1 : -1;
    for (let d = step; d < b.w - 4; d += step) {
      const x = xRight ? ox + d : ox - d;
      c.beginPath();
      c.moveTo(x, oy);
      c.lineTo(x, oy + tick * tickYDir);
      c.stroke();
    }

    const tickXDir = xRight ? 1 : -1;
    for (let d = step; d < b.h - 4; d += step) {
      const y = yUp ? oy - d : oy + d;
      c.beginPath();
      c.moveTo(ox, y);
      c.lineTo(ox + tick * tickXDir, y);
      c.stroke();
    }
    c.restore();
  }
});


/* ==========================================================================
 * 5. 力学
 * ========================================================================== */









/* ---- 斜面与物块 ---- */
param('slopeAngle',  { label: '斜面倾角', min: 10, max: 75, step: 1,    def: 30,  unit: '°' });
param('slopePos',    { label: '物块位置', min: 0,  max: 1,  step: 0.02, def: 0.35 });
param('slopeBlockW', { label: '物块大小', min: 10, max: 70, step: 1,    def: 28 });

shape({
  key: 'blockOnSlope', cat: 'mech', geom: 'box', label: '斜面物块', fill: true,
  icon: '<path d="M3 20 L21 20 L21 8 Z"/>' +
        '<rect x="9.7" y="8.4" width="5" height="5" ' +
        'transform="rotate(146 12.2 10.9)"/>',
  params: ['slopeAngle', 'slopePos', 'slopeBlockW'],
  draw(c, o, U) {
    const b = U.bbox(o);
    const theta  = Math.max(5, Math.min(85, o.slopeAngle ?? 30)) * Math.PI / 180;
    const pos    = Math.max(0, Math.min(1, o.slopePos ?? 0.35));
    const sizeIn = Math.max(6, o.slopeBlockW ?? 28);

    /* 倾角方向完全由拖动方向决定：
     *   向右拖 (x2 > x1) → 右侧升高
     *   向左拖 (x2 < x1) → 左侧升高 */
    const dx      = (o.x2 ?? 0) - (o.x1 ?? 0);
    const rightUp = dx >= 0;

    const tanT = Math.tan(theta);
    let baseW = b.w;
    let H     = baseW * tanT;
    if (H > b.h) { H = b.h; baseW = H / tanT; }
    if (baseW < 6 || H < 6) return;

    /* P1 = 斜面的底端（低点）
     * P2 = 直角顶点
     * P3 = 斜面的顶端（高点）
     * 斜边始终是 P1–P3 */
    let P1, P2, P3;
    if (rightUp) {
      P1 = { x: b.x1,         y: b.y2 };
      P2 = { x: b.x1 + baseW, y: b.y2 };
      P3 = { x: b.x1 + baseW, y: b.y2 - H };
    } else {
      P1 = { x: b.x2,         y: b.y2 };
      P2 = { x: b.x2 - baseW, y: b.y2 };
      P3 = { x: b.x2 - baseW, y: b.y2 - H };
    }

    /* ---- 三角形本体 ---- */
    c.beginPath();
    c.moveTo(P1.x, P1.y);
    c.lineTo(P2.x, P2.y);
    c.lineTo(P3.x, P3.y);
    c.closePath();
    if (o.fill) { c.fillStyle = U.alpha(o.color, 0.16); c.fill(); }
    c.stroke();

    /* ---- 地面阴影线 ---- */
    c.save();
    c.lineWidth = Math.max(0.7, (o.size || 4) * 0.45);
    const gx0 = Math.min(P1.x, P2.x);
    const gx1 = Math.max(P1.x, P2.x);
    for (let x = gx0 + 6; x < gx1 - 2; x += 12) {
      c.beginPath();
      c.moveTo(x, b.y2);
      c.lineTo(x - 6, b.y2 + 8);
      c.stroke();
    }
    c.restore();

    /* ---- 物块：沿斜边 P1–P3 摆放，方向与斜面一致 ---- */
    const dxs = P1.x - P3.x, dys = P1.y - P3.y;   // 从顶端指向底端（下坡）
    const L   = Math.hypot(dxs, dys);
    if (L < 10) return;

    const ux = dxs / L, uy = dys / L;             // 沿斜面向下坡的单位向量
    let nx = -uy, ny = ux;                        // 斜面法线
    if (ny > 0) { nx = -nx; ny = -ny; }           // 取朝屏幕上方的那一侧

    const s     = Math.min(sizeIn, L * 0.55);
    const half  = s / 2;
    const aMin  = half + 2;
    const aMax  = Math.max(aMin, L - half - 2);
    const along = aMin + pos * (aMax - aMin);     // 从顶端出发的距离

    const scx = P3.x + ux * along;                // 斜面上的接触点
    const scy = P3.y + uy * along;
    const bcx = scx + nx * half;                  // 物块中心（沿法线抬起 half）
    const bcy = scy + ny * half;
    const rot = Math.atan2(uy, ux);

    c.save();
    c.translate(bcx, bcy);
    c.rotate(rot);
    c.beginPath();
    c.rect(-half, -half, s, s);
    if (o.fill) { c.fillStyle = U.alpha(o.color, 0.28); c.fill(); }
    c.stroke();
    c.restore();
  }
});


/* ---- 斜面挡板 + 细绳 + 小球 ---- */
param('bsbAngle', { label: '斜面倾角', min: 10, max: 75, step: 1,    def: 30,  unit: '°' });
param('bsbR',     { label: '小球半径', min: 4,  max: 40, step: 1,    def: 14 });
param('bsbRope',  { label: '细绳长度', min: 0,  max: 1,  step: 0.02, def: 0.5, unit: '×斜边' });
param('bsbTilt',  { label: '细绳倾角', min: 0,  max: 90, step: 1,    def: 0,   unit: '°' });

shape({
  key: 'ballOnSlopeBoard', cat: 'mech', geom: 'box', label: '斜面挡板小球', fill: true,
  icon: '<path d="M4 20h16v-14z"/>' +
        '<line x1="20" y1="6" x2="17.5" y2="4"/>' +
        '<line x1="18.7" y1="5" x2="12" y2="10.5"/>' +
        '<circle cx="10.5" cy="11.5" r="2"/>',
  params: ['bsbAngle', 'bsbR', 'bsbRope', 'bsbTilt'],
  draw(c, o, U) {
    const b = U.bbox(o);
    const theta = Math.max(5, Math.min(85, o.bsbAngle ?? 30)) * Math.PI / 180;
    const r     = Math.max(3, o.bsbR ?? 14);
    const ropeRatio = Math.max(0, Math.min(1, o.bsbRope ?? 0.5));
    const tiltDeg   = Math.max(0, Math.min(90, o.bsbTilt ?? 0));

    /* 倾角方向由拖动方向决定：
     *   向右拖 (x2 > x1) → 右侧升高
     *   向左拖 (x2 < x1) → 左侧升高 */
    const dx      = (o.x2 ?? 0) - (o.x1 ?? 0);
    const rightUp = dx >= 0;

    const tanT = Math.tan(theta);
    let baseW = b.w;
    let H     = baseW * tanT;
    if (H > b.h) { H = b.h; baseW = H / tanT; }
    if (baseW < 10 || H < 10) return;

    /* P1 = 斜面底端（低点），P2 = 直角顶点，P3 = 斜面顶端（高点） */
    let P1, P2, P3;
    if (rightUp) {
      P1 = { x: b.x1,         y: b.y2 };
      P2 = { x: b.x1 + baseW, y: b.y2 };
      P3 = { x: b.x1 + baseW, y: b.y2 - H };
    } else {
      P1 = { x: b.x2,         y: b.y2 };
      P2 = { x: b.x2 - baseW, y: b.y2 };
      P3 = { x: b.x2 - baseW, y: b.y2 - H };
    }

    /* ---- 三角形本体 ---- */
    c.beginPath();
    c.moveTo(P1.x, P1.y);
    c.lineTo(P2.x, P2.y);
    c.lineTo(P3.x, P3.y);
    c.closePath();
    if (o.fill) { c.fillStyle = U.alpha(o.color, 0.12); c.fill(); }
    c.stroke();

    /* ---- 地面阴影线 ---- */
    c.save();
    c.lineWidth = Math.max(0.7, (o.size || 4) * 0.45);
    const gx0 = Math.min(P1.x, P2.x);
    const gx1 = Math.max(P1.x, P2.x);
    for (let x = gx0 + 6; x < gx1 - 2; x += 12) {
      c.beginPath();
      c.moveTo(x, b.y2);
      c.lineTo(x - 6, b.y2 + 8);
      c.stroke();
    }
    c.restore();

    /* ---- 斜面坐标系：u 沿斜面向上，n 指向斜面外侧（屏幕上方） ---- */
    const dxs = P3.x - P1.x, dys = P3.y - P1.y;
    const L  = Math.hypot(dxs, dys);
    const ux = dxs / L, uy = dys / L;
    let nx = -uy, ny = ux;
    if (ny > 0) { nx = -nx; ny = -ny; }

    /* 挡板固定在斜面最顶端，高 2r，中心在法向高度 r */
    const sBoard = L;
    const boardFoot   = { x: P1.x + ux * sBoard,               y: P1.y + uy * sBoard };
    const boardTop    = { x: P1.x + ux * sBoard + nx * 2 * r,  y: P1.y + uy * sBoard + ny * 2 * r };
    const boardCenter = { x: P1.x + ux * sBoard + nx * r,      y: P1.y + uy * sBoard + ny * r };

    /* 细绳长度：按斜边比例，最大不超过斜边长 */
    const ropePx = Math.min(ropeRatio * L, L);

    /* 默认细绳方向：从挡板中心指向斜面低端（即 -u） */
    const d0x = -ux, d0y = -uy;

    /* 绕挡板中心旋转 bsbTilt 度（逆时针，正值使小球向上飘） */
    const phi = tiltDeg * Math.PI / 180;
    const cosP = Math.cos(phi), sinP = Math.sin(phi);
    const dxRope = d0x * cosP - d0y * sinP;
    const dyRope = d0x * sinP + d0y * cosP;

    /* 细绳末端（小球边缘连接点） */
    const edgeX = boardCenter.x + dxRope * ropePx;
    const edgeY = boardCenter.y + dyRope * ropePx;

    /* 小球球心：沿细绳方向再延伸 r */
    const ballX = edgeX + dxRope * r;
    const ballY = edgeY + dyRope * r;

    /* ---- 细绳 ---- */
    c.beginPath();
    c.moveTo(boardCenter.x, boardCenter.y);
    c.lineTo(edgeX, edgeY);
    c.stroke();

    /* ---- 挡板 ---- */
    c.beginPath();
    c.moveTo(boardFoot.x, boardFoot.y);
    c.lineTo(boardTop.x, boardTop.y);
    c.stroke();
    /* 挡板底端加粗，表示固定在斜面上 */
    c.save();
    c.lineWidth = Math.max(2, (o.size || 4) * 0.9);
    c.beginPath();
    c.moveTo(boardFoot.x - ux * 3, boardFoot.y - uy * 3);
    c.lineTo(boardFoot.x + ux * 3, boardFoot.y + uy * 3);
    c.stroke();
    c.restore();

    /* ---- 小球 ---- */
    c.beginPath();
    c.arc(ballX, ballY, r, 0, Math.PI * 2);
    if (o.fill) { c.fillStyle = U.alpha(o.color, 0.28); c.fill(); }
    c.stroke();
  }
});

/* ---- 传送带 ---- */
param('convPos',  { label: '物块位置', min: 0, max: 1,  step: 0.02, def: 0.4  });
param('convSize', { label: '物块大小', min: 8, max: 70, step: 1,    def: 50 });

shape({
  key: 'conveyor', cat: 'mech', geom: 'box', label: '传送带', fill: true,
  icon: '<circle cx="6" cy="12" r="3"/><circle cx="18" cy="12" r="3"/>' +
        '<path d="M6 9h12M6 15h12"/>',
  params: ['convPos', 'convSize'],
  draw(c, o, U) {
    const b  = U.bbox(o);
    const cy = (b.y1 + b.y2) / 2;
    const R  = Math.max(4, Math.min(b.h / 2, b.w / 4));
    const cx1 = b.x1 + R;
    const cx2 = b.x2 - R;

    /* ---- 传送带本体 ---- */
    c.beginPath();
    c.moveTo(cx1, cy - R);
    c.lineTo(cx2, cy - R);
    c.moveTo(cx1, cy + R);
    c.lineTo(cx2, cy + R);
    c.stroke();

    c.beginPath();
    c.moveTo(cx1 + R, cy);
    c.arc(cx1, cy, R, 0, Math.PI * 2);
    c.moveTo(cx2 + R, cy);
    c.arc(cx2, cy, R, 0, Math.PI * 2);
    if (o.fill) { c.fillStyle = U.alpha(o.color, 0.18); c.fill(); }
    c.stroke();

    /* ---- 传送带上的物块：位置可调 ---- */
    const pos  = Math.max(0, Math.min(1, o.convPos ?? 0.4));
    const span = Math.max(1, cx2 - cx1);
    const bw   = Math.min(Math.max(8, o.convSize ?? 28), span * 0.5);
    const bh   = bw;
    const topY = cy - R;
    const bx   = cx1 + span * pos;

    c.beginPath();
    c.rect(bx - bw / 2, topY - bh, bw, bh);
    if (o.fill) { c.fillStyle = U.alpha(o.color, 0.28); c.fill(); }
    c.stroke();

    if (bw >= 14) {
      c.save();
      c.fillStyle = U.alpha(o.color, 0.9);
      c.font = 'italic bold ' + (bw * 0.5) + 'px system-ui, sans-serif';
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillText('m', bx, topY - bh / 2);
      c.restore();
    }
  }
});

/* ---- 板块模型 ---- */
param('plateShift', { label: '物块位置', min: 0, max: 1, step: 0.02, def: 0.25 });

shape({
  key: 'blockOnBoard', cat: 'mech', geom: 'box', label: '板块模型',
  icon: '<rect x="2"   y="14" width="20" height="4"/>' +
        '<rect x="5.5" y="8.5" width="5.5" height="5.5"/>' +
        '<path d="M2 18h20"/>',
  params: ['plateShift'],
  draw(c, o, U) {
    const b = U.bbox(o);
    const { x1, y1, x2, y2, w, h } = b;

    /* ---- 板：更厚，视觉上不再"薄如纸" ---- */
    const boardH   = Math.max(6, h * 0.24);
    const boardTop = y2 - boardH;
    const boardBot = y2;

    /* ---- 物块：比板高，且宽度有上限避免过扁 ---- */
    const blockH   = h * 0.42;
    const blockW   = Math.min(w * 0.22, blockH * 1.2);
    const blockBot = boardTop;
    const blockTop = blockBot - blockH;

    /* ---- 物块位置：0 = 贴板的左端，1 = 贴板的右端 ---- */
    const shift  = Math.max(0, Math.min(1, o.plateShift ?? 0.25));
    const usable = Math.max(0, w - blockW);
    const blockL = x1 + usable * shift;
    const blockR = blockL + blockW;

    /* ---- 地面线 ---- */
    c.beginPath();
    c.moveTo(x1, y2);
    c.lineTo(x2, y2);
    c.stroke();

    /* ---- 地面阴影线 ---- */
    c.save();
    c.lineWidth = Math.max(0.7, (o.size || 4) * 0.45);
    for (let sx = x1 + 4; sx <= x2 - 4; sx += 12) {
      c.beginPath();
      c.moveTo(sx, y2);
      c.lineTo(sx - 6, y2 + 8);
      c.stroke();
    }
    c.restore();

    /* ---- 板本体 ---- */
    c.save();
    c.beginPath();
    c.rect(x1, boardTop, w, boardH);
    c.fillStyle = 'rgba(180,150,110,0.55)';
    c.fill();
    c.stroke();
    c.restore();

    /* ---- 物块本体 ---- */
    c.beginPath();
    c.rect(blockL, blockTop, blockW, blockH);
    if (o.fill) { c.fillStyle = U.alpha(o.color, 0.32); c.fill(); }
    c.stroke();
  }
});


/* ---- 连接体1：两个物块由细绳连接，放在水平面上 ---- */
param('conn1Size', { label: '物块大小', min: 10, max: 70,  step: 1,    def: 50 });
param('conn1Gap',  { label: '细绳长度', min: 5,  max: 200, step: 1,    def: 150 });
param('conn1Pos',  { label: '水平位置', min: 0,  max: 1,   step: 0.02, def: 0.5 });

shape({
  key: 'twoBlocksRope', cat: 'mech', geom: 'box', label: '连接体1', fill: true,
  icon: '<path d="M1 20h22"/>' +
        '<rect x="2" y="15" width="5" height="5"/>' +
        '<rect x="17" y="15" width="5" height="5"/>' +
        '<path d="M7 17.5h10"/>',
  params: ['conn1Size', 'conn1Gap', 'conn1Pos'],
  draw(c, o, U) {
    const b = U.bbox(o);
    const groundY = b.y2;

    /* ---- 尺寸限制：确保两物块 + 细绳能放入包围盒 ---- */
    let size = Math.max(6, Math.min(o.conn1Size ?? 28, b.h * 0.55, b.w * 0.28));
    let gap  = Math.max(4, o.conn1Gap ?? 60);
    if (2 * size + gap > b.w - 12) {
      gap = Math.max(4, b.w - 12 - 2 * size);
    }
    if (size < 6) return;

    const totalW = 2 * size + gap;
    const slideRange = Math.max(0, b.w - totalW - 12);
    const pos = Math.max(0, Math.min(1, o.conn1Pos ?? 0.5));
    const startX = b.x1 + 6 + slideRange * pos;

    /* ---- 地面 ---- */
    c.beginPath();
    c.moveTo(b.x1, groundY);
    c.lineTo(b.x2, groundY);
    c.stroke();

    /* ---- 地面阴影线 ---- */
    c.save();
    c.lineWidth = Math.max(0.7, (o.size || 4) * 0.45);
    for (let x = b.x1 + 6; x < b.x2 - 2; x += 12) {
      c.beginPath();
      c.moveTo(x, groundY);
      c.lineTo(x - 6, groundY + 8);
      c.stroke();
    }
    c.restore();

    /* ---- 左侧物块 ---- */
    const blockY = groundY - size;
    c.beginPath();
    c.rect(startX, blockY, size, size);
    if (o.fill) { c.fillStyle = U.alpha(o.color, 0.26); c.fill(); }
    c.stroke();

    /* ---- 右侧物块 ---- */
    c.beginPath();
    c.rect(startX + size + gap, blockY, size, size);
    if (o.fill) { c.fillStyle = U.alpha(o.color, 0.26); c.fill(); }
    c.stroke();

    /* ---- 细绳（连接两物块侧面中点） ---- */
    const ropeY = blockY + size * 0.5;
    c.beginPath();
    c.moveTo(startX + size, ropeY);
    c.lineTo(startX + size + gap, ropeY);
    c.stroke();
  }
});


/* ---- 连接体 ---- */
shape({
  key: 'connectorBlocks', cat: 'mech', geom: 'box', label: '连接体',
  icon: '<path d="M2 8.5h18"/>' +                                  /* 桌面 */
        '<rect x="2.5" y="4.5" width="5" height="4"/>' +           /* 桌面上的物块 */
        '<circle cx="20" cy="8" r="1.5"/>' +                       /* 滑轮外圈 */
        '<circle cx="20" cy="8" r="0.3" fill="currentColor"/>' +   /* 滑轮轴心 */
        '<path d="M7.5 6.5h12.5M21.5 8v12"/>' +                    /* 水平绳 + 竖直悬挂绳 */
        '<rect x="19.5" y="20" width="4" height="3.5"/>',          /* 悬挂的物块 */
  draw(c, o, U) {
    const b = U.bbox(o);
    const w = b.w, h = b.h;
    const tableY = b.y1 + h * 0.35;
    c.beginPath();
    c.moveTo(b.x1, tableY); c.lineTo(b.x2 - w * 0.20, tableY);
    c.stroke();
    const blkW = w * 0.22, blkH = h * 0.18;
    c.beginPath();
    c.rect(b.x1 + w * 0.05, tableY - blkH, blkW, blkH);
    c.stroke();

    const ropeY = tableY - blkH / 2;

    const pulR = h * 0.06;
    const pulX = b.x2 - w * 0.08;
    const pulY = ropeY + pulR;
    c.beginPath(); c.arc(pulX, pulY, pulR, 0, Math.PI * 2); c.stroke();
    c.beginPath(); c.arc(pulX, pulY, pulR * 0.15, 0, Math.PI * 2);
    c.fillStyle = o.color; c.fill();

    c.beginPath();
    c.moveTo(b.x1 + w * 0.05 + blkW, ropeY);
    c.lineTo(pulX, ropeY);
    c.stroke();

    const hangX = pulX + pulR;
    const hangTop = b.y2 - h * 0.18;
    c.beginPath();
    c.moveTo(hangX, pulY);
    c.lineTo(hangX, hangTop);
    c.stroke();
    c.beginPath();
    c.rect(hangX - w * 0.09, hangTop, w * 0.18, h * 0.18);
    c.stroke();
  }
});



/* ---- 单摆 ---- */
shape({
  key: 'pendulum', cat: 'mech', geom: 'line', label: '单摆',
  icon: '<path d="M12 3v13"/><circle cx="12" cy="18" r="3"/>',
  draw(c, o, U) {
    c.beginPath();
    c.moveTo(o.x1, o.y1);
    c.lineTo(o.x2, o.y2);
    c.stroke();
    c.beginPath();
    c.arc(o.x1, o.y1, Math.max(3, (o.size || 4) * 1.2), 0, Math.PI * 2);
    c.fillStyle = o.color;
    c.fill();
    const r = Math.max(6, (o.size || 4) * 2.2);
    c.beginPath();
    c.arc(o.x2, o.y2, r, 0, Math.PI * 2);
    c.fillStyle = U.alpha(o.color, 0.55);
    c.fill();
    c.stroke();
  }
});

/* ---- 33.9 木板连接物块（可调两物块位置） ---- */
param('beamBlock1',  { label: '物块1位置', min: -0.95, max: 0.95, step: 0.02, def: -0.67, unit: '×L' });
param('beamBlock2',  { label: '物块2位置', min: -0.95, max: 0.95, step: 0.02, def:  0.33, unit: '×L' });
param('beamBlockSz', { label: '物块大小',  min: 10,    max: 60,   step: 1,    def: 40 });
param('beamRope',    { label: '显示细绳',  min: 0,     max: 1,    step: 1,    def: 1 });

shape({
  key: 'beamTwoBlocks', cat: 'mech', geom: 'box', label: '圆盘物块', fill: true,
  /* 缩略图：厚木板 + 中心轴虚线 + 两个物块（-2/3L 与 +1/3L）+ 细绳 */
  icon: '<rect x="1" y="14" width="22" height="2.6" fill="currentColor"/>' +
        '<path d="M12 3v18" stroke-dasharray="1.6 1.6"/>' +
        '<rect x="2.7"  y="8.5" width="4" height="5.5" fill="none"/>' +
        '<rect x="13.7" y="8.5" width="4" height="5.5" fill="none"/>' +
        '<path d="M6.7 11.2h7"/>',
  params: ['beamBlock1', 'beamBlock2', 'beamBlockSz', 'beamRope'],
  draw(c, o, U) {
    const b  = U.bbox(o);
    const cx = b.x1 + b.w / 2;
    const cy = (b.y1 + b.y2) / 2;

    /* ---- 木板：长度 = 包围盒宽的 92%，板身更厚 ---- */
    const beamW   = b.w * 0.92;
    const halfL   = beamW / 2;
    const beamH   = Math.max(8, Math.min(b.h * 0.14, 16));
    const beamTop = cy - beamH / 2;
    const beamBot = cy + beamH / 2;
    const beamL   = cx - halfL;
    const beamR   = cx + halfL;

    /* ---- 物块尺寸 ---- */
    const bsz = Math.max(6, Math.min(o.beamBlockSz ?? 40, halfL * 0.55, b.h * 0.45));

    /* ---- 两物块位置（单位：L） ---- */
    const pos1 = Math.max(-0.95, Math.min(0.95, o.beamBlock1 ?? -0.67));
    const pos2 = Math.max(-0.95, Math.min(0.95, o.beamBlock2 ??  0.33));
    const c1   = cx + pos1 * halfL;
    const c2   = cx + pos2 * halfL;

    const blkBot = beamTop;
    const blkTop = beamTop - bsz;

    /* ---- 木板本体 ---- */
    c.beginPath();
    c.rect(beamL, beamTop, beamW, beamH);
    if (o.fill) { c.fillStyle = U.alpha(o.color, 0.18); c.fill(); }
    c.stroke();

    /* ---- 中心轴：竖直虚线贯穿整张图 ---- */
    c.save();
    c.setLineDash([5, 4]);
    c.lineWidth = Math.max(1, (o.size || 4) * 0.45);
    c.beginPath();
    c.moveTo(cx, b.y1 + 2);
    c.lineTo(cx, b.y2 - 2);
    c.stroke();
    c.restore();



    /* ---- 细绳：连接两物块最靠近的侧面 ---- */
    if ((o.beamRope ?? 1) >= 0.5) {
      const lx = Math.min(c1, c2);
      const rx = Math.max(c1, c2);
      if (rx - lx > bsz + 2) {
        const ropeY = blkTop + bsz * 0.5;
        c.beginPath();
        c.moveTo(lx + bsz / 2, ropeY);
        c.lineTo(rx - bsz / 2, ropeY);
        c.stroke();
      }
    }

    /* ---- 两个物块（内部不显示任何字母） ---- */
    [c1, c2].forEach(bx => {
      c.beginPath();
      c.rect(bx - bsz / 2, blkTop, bsz, bsz);
      if (o.fill) { c.fillStyle = U.alpha(o.color, 0.32); c.fill(); }
      c.stroke();
    });
  }
});


/* ---- 铁轨截面 ---- */
shape({
  key: 'railCross', cat: 'mech', geom: 'box', label: '铁轨截面',
  icon: '<rect x="3" y="2" width="4" height="8"/>' +
        '<rect x="17" y="2" width="4" height="8"/>' +
        '<rect x="1" y="10" width="22" height="3"/>' +
        '<path d="M3 13h18l2 7H1z"/>',
  draw(c, o, U) {
    const b = U.bbox(o);
    const { x1, y1, x2, y2, w, h } = b;

    const railTopY   = y1;
    const railBotY   = y1 + h * 0.40;
    const sleeperTop = y1 + h * 0.38;
    const sleeperBot = y1 + h * 0.58;
    const ballastTop = y1 + h * 0.52;
    const ballastBot = y2;

    const btInset = w * 0.10;
    const bbInset = w * 0.02;
    c.beginPath();
    c.moveTo(x1 + btInset, ballastTop);
    c.lineTo(x2 - btInset, ballastTop);
    c.lineTo(x2 - bbInset, ballastBot);
    c.lineTo(x1 + bbInset, ballastBot);
    c.closePath();
    c.fillStyle = 'rgba(161,136,127,0.35)';
    c.fill();
    c.stroke();

    c.save();
    c.fillStyle = 'rgba(120,100,95,0.45)';
    const ballastH = ballastBot - ballastTop;
    const dotCount = 36;
    for (let i = 0; i < dotCount; i++) {
      const s1 = Math.sin(i * 12.9898 + 4.1414) * 43758.5453;
      const s2 = Math.sin(i * 78.2330 + 1.2345) * 43758.5453;
      const rx = s1 - Math.floor(s1);
      const ry = s2 - Math.floor(s2);
      const yFrac = ry;
      const leftX  = x1 + btInset + (bbInset - btInset) * yFrac;
      const rightX = x2 - btInset - (bbInset - btInset) * yFrac;
      const px = leftX + rx * (rightX - leftX);
      const py = ballastTop + 4 + ry * (ballastH - 8);
      c.beginPath();
      c.arc(px, py, 1.3, 0, Math.PI * 2);
      c.fill();
    }
    c.restore();

    const slInset = w * 0.06;
    c.beginPath();
    c.rect(x1 + slInset, sleeperTop, w - slInset * 2, sleeperBot - sleeperTop);
    c.fillStyle = 'rgba(141,110,99,0.75)';
    c.fill();
    c.stroke();

    const railW    = w * 0.09;
    const railPos  = [x1 + w * 0.28, x1 + w * 0.72];
    const railTotH = railBotY - railTopY;
    const headH = railTotH * 0.30;
    const webH  = railTotH * 0.40;
    const footH = railTotH * 0.30;
    const footW = railW * 1.15;

    railPos.forEach(rxc => {
      c.beginPath();
      c.rect(rxc - railW / 2, railTopY, railW, headH);
      c.fillStyle = '#9e9e9e';
      c.fill();
      c.stroke();

      const webW = railW * 0.35;
      c.beginPath();
      c.rect(rxc - webW / 2, railTopY + headH, webW, webH);
      c.fillStyle = '#bdbdbd';
      c.fill();
      c.stroke();

      c.beginPath();
      c.rect(rxc - footW / 2, railTopY + headH + webH, footW, footH);
      c.fillStyle = '#9e9e9e';
      c.fill();
      c.stroke();
    });
  }
});

/* ---- 33.10 中心天体与环绕天体（椭圆轨道，焦点在中心天体） ---- */
param('orbitA',    { label: '半长轴',   min: 0.30, max: 1.00, step: 0.02, def: 1 });
param('orbitE',    { label: '离心率',   min: 0.00, max: 0.99, step: 0.01, def: 0.45 });
param('orbitPos',  { label: '天体位置', min: 0,    max: 360,  step: 2,    def: 45, unit: '°' });
param('orbitStar', { label: '中心天体', min: 0.01, max: 0.10, step: 0.01, def: 0.04 });

shape({
  key: 'centralOrbit', cat: 'mech', geom: 'box', label: '椭圆轨道', fill: false,
  icon: '<ellipse cx="10" cy="12" rx="8.5" ry="6" fill="none"/>' +
        '<circle cx="15.5" cy="12" r="1.6" fill="currentColor"/>' +
        '<circle cx="3.2"  cy="9"  r="1"/>' +
        '<path d="M15.5 12L3.2 9" stroke-dasharray="1.5 1.5"/>',
  params: ['orbitA', 'orbitE', 'orbitPos', 'orbitStar'],
  draw(c, o, U) {
    const b  = U.bbox(o);
    const cx = b.x1 + b.w / 2;
    const cy = b.y1 + b.h / 2;

    /* ---- 参数 ---- */
    const aFrac = Math.max(0.30, Math.min(1.00, o.orbitA ?? 0.80));
    const e     = Math.max(0.00, Math.min(0.85, o.orbitE ?? 0.45));
    const pos   = (o.orbitPos ?? 45) * Math.PI / 180;
    const starFrac = Math.max(0.04, Math.min(0.20, o.orbitStar ?? 0.10));

    /* ---- 椭圆半轴（像素） ---- */
    const maxA = Math.min(b.w, b.h) * 0.45;
    const A    = maxA * aFrac;
    const B    = A * Math.sqrt(1 - e * e);
    const focusC = A * e;                     /* 中心到焦点的距离 */
    if (A < 8 || B < 2) return;

    /* ---- 中心天体位置（右焦点） ---- */
    const starX = cx + focusC;
    const starY = cy;
    const starR = Math.max(3, Math.min(b.w, b.h) * starFrac);

    /* ---- 环绕天体位置（用偏近点角 pos 参数化椭圆） ---- */
    const bx = cx + A * Math.cos(pos);
    const by = cy - B * Math.sin(pos);

    /* ---- 椭圆轨道（虚线） ---- */
    c.save();
    c.setLineDash([6, 4]);
    c.lineWidth = Math.max(1, (o.size || 4) * 0.45);
    c.beginPath();
    c.ellipse(cx, cy, A, B, 0, 0, Math.PI * 2);
    c.stroke();
    c.restore();

    /* ---- 半长轴水平虚线（经过椭圆中心） ---- */
    c.save();
    c.setLineDash([3, 4]);
    c.lineWidth = Math.max(0.8, (o.size || 4) * 0.30);
    c.strokeStyle = U.alpha(o.color, 0.35);
    c.beginPath();
    c.moveTo(cx - A, cy);
    c.lineTo(cx + A, cy);
    c.stroke();
    c.restore();

    /* ---- 中心天体到环绕天体的连线（表示当前矢径） ---- */
    c.save();
    c.setLineDash([3, 3]);
    c.lineWidth = Math.max(0.8, (o.size || 4) * 0.35);
    c.strokeStyle = U.alpha(o.color, 0.45);
    c.beginPath();
    c.moveTo(starX, starY);
    c.lineTo(bx, by);
    c.stroke();
    c.restore();

    /* ---- 中心天体（实心圆，暖色） ---- */
    c.beginPath();
    c.arc(starX, starY, starR, 0, Math.PI * 2);
    c.fillStyle = '#fbc02d';
    c.fill();
    c.strokeStyle = o.color;
    c.lineWidth = Math.max(1, (o.size || 4) * 0.5);
    c.stroke();

    /* ---- 环绕天体（实心小圆） ---- */
    const planetR = Math.max(3, starR * 0.55);
    c.beginPath();
    c.arc(bx, by, planetR, 0, Math.PI * 2);
    c.fillStyle = U.alpha(o.color, 0.75);
    c.fill();
    c.strokeStyle = o.color;
    c.lineWidth = Math.max(1, (o.size || 4) * 0.45);
    c.stroke();

    /* ---- 公转方向指示箭头（沿椭圆切线） ---- */
    const tangentX = -A * Math.sin(pos);
    const tangentY = -B * Math.cos(pos);
    const tm = Math.hypot(tangentX, tangentY);
    if (tm > 1) {
      const ux = tangentX / tm;
      const uy = tangentY / tm;
      const L = Math.min(A * 0.22, 40);
      const ex = bx + ux * L;
      const ey = by + uy * L;
      c.save();
      c.strokeStyle = U.alpha(o.color, 0.55);
      c.fillStyle   = U.alpha(o.color, 0.55);
      c.lineWidth = Math.max(1.2, (o.size || 4) * 0.5);
      c.beginPath();
      c.moveTo(bx + ux * (planetR + 2), by + uy * (planetR + 2));
      c.lineTo(ex, ey);
      c.stroke();
      U.arrowHead(c,
        bx + ux * (planetR + 2), by + uy * (planetR + 2),
        ex, ey, Math.max(5, planetR * 0.9));
      c.restore();
    }
  }
});


/* ---- 33.11 万有引力 / 向心力 / 重力 分解示意图 ---- */
param('glat', { label: '纬度', min: 0, max: 90, step: 1, def: 45, unit: '°' });

shape({
  key: 'gravityDecomp', cat: 'mech', geom: 'box', label: '重力分解',
  /* 缩略图：地球 + 轴/赤道虚线 + 球面物块 + 三个力箭头 */
  icon: '<circle cx="9" cy="13" r="7" fill="none"/>' +
        '<path d="M9 3v20" stroke-dasharray="1.5 1.5"/>' +
        '<path d="M2 13h14" stroke-dasharray="1.5 1.5"/>' +
        '<circle cx="14" cy="8" r="1.2" fill="currentColor"/>' +
        '<path d="M14 8L9 13"/>' +
        '<path d="M14 8L10 8"/>' +
        '<path d="M14 8L10.5 12"/>',
  params: ['glat'],
  draw(c, o, U) {
    const b = U.bbox(o);
    const cx = b.x1 + b.w / 2;
    const cy = (b.y1 + b.y2) / 2;
    const R  = Math.min(b.w, b.h) * 0.34;
    if (R < 30) return;
    const latDeg = Math.max(0, Math.min(90, o.glat ?? 45));
    const lat = latDeg * Math.PI / 180;

    /* ---- 地球 ---- */
    c.beginPath();
    c.arc(cx, cy, R, 0, Math.PI * 2);
    if (o.fill) { c.fillStyle = 'rgba(100,170,230,0.10)'; c.fill(); }
    c.stroke();

    /* ---- 地轴 + 赤道（虚线） ---- */
    c.save();
    c.setLineDash([5, 4]);
    c.lineWidth = Math.max(1, (o.size || 4) * 0.4);
    c.beginPath();
    c.moveTo(cx, cy - R * 1.15);
    c.lineTo(cx, cy + R * 1.15);
    c.stroke();
    c.beginPath();
    c.moveTo(cx - R * 1.15, cy);
    c.lineTo(cx + R * 1.15, cy);
    c.stroke();
    c.restore();

    /* ---- 物块（球面一点） ---- */
    const px = cx + R * Math.cos(lat);
    const py = cy - R * Math.sin(lat);

    /* ---- 半径虚线 ---- */
    c.save();
    c.setLineDash([3, 4]);
    c.lineWidth = Math.max(0.8, (o.size || 4) * 0.3);
    c.strokeStyle = U.alpha(o.color, 0.4);
    c.beginPath();
    c.moveTo(cx, cy);
    c.lineTo(px, py);
    c.stroke();
    c.restore();

    /* ---- 地心处的纬度弧 ---- */
    const arcR = Math.min(R * 0.32, 42);
    c.save();
    c.lineWidth = Math.max(1, (o.size || 4) * 0.45);
    c.strokeStyle = U.alpha(o.color, 0.7);
    c.beginPath();
    c.arc(cx, cy, arcR, -lat, 0, false);
    c.stroke();
    c.font = 'bold ' + Math.max(10, arcR * 0.55) + 'px system-ui, sans-serif';
    c.fillStyle = U.alpha(o.color, 0.85);
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    const labelAng = -lat / 2;
    c.fillText(latDeg + '°',
      cx + Math.cos(labelAng) * (arcR + 14),
      cy + Math.sin(labelAng) * (arcR + 14));
    c.restore();

    /* ---- 三个力矢量（视觉缩放，仅示意关系） ---- */
    const Fg_mag = R * 0.70;
    const Fc_mag = Fg_mag * 0.42 * Math.cos(lat);

    /* 万有引力：从物块指向地心 */
    const ucx = (cx - px) / R;
    const ucy = (cy - py) / R;
    const Fgx = Fg_mag * ucx;
    const Fgy = Fg_mag * ucy;

    /* 向心力：从物块水平指向地轴 */
    const Fcx = -Fc_mag;
    const Fcy = 0;

    /* 重力 = 万有引力 − 向心力（矢量差） */
    const Fwx = Fgx - Fcx;
    const Fwy = Fgy - Fcy;

    const A = { x: px + Fgx, y: py + Fgy };  /* 万有引力末端 */
    const B = { x: px + Fcx, y: py + Fcy };  /* 向心力末端   */
    const C = { x: px + Fwx, y: py + Fwy };  /* 重力末端     */

    /* ---- 平行四边形辅助虚线 ---- */
    c.save();
    c.setLineDash([4, 3]);
    c.lineWidth = Math.max(0.8, (o.size || 4) * 0.3);
    c.strokeStyle = U.alpha(o.color, 0.35);
    c.beginPath(); c.moveTo(B.x, B.y); c.lineTo(A.x, A.y); c.stroke();
    c.beginPath(); c.moveTo(C.x, C.y); c.lineTo(A.x, A.y); c.stroke();
    c.restore();

    /* ---- 箭头绘制：细杆 + 填充三角形箭头 ---- */
    const drawVec = (color, from, to) => {
      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const len = Math.hypot(dx, dy);
      if (len < 3) return;
      const ux = dx / len, uy = dy / len;

      /* 三角形箭头长度：不超过杆长的 28%，且限制在很小范围内 */
      const headLen = Math.min(len * 0.28, Math.max(5, R * 0.045));
      const headWid = headLen * 0.55;
      const lineEndX = to.x - ux * headLen * 0.92;
      const lineEndY = to.y - uy * headLen * 0.92;

      c.save();
      c.strokeStyle = color;
      c.fillStyle   = color;
      c.lineWidth = Math.max(1.2, (o.size || 4) * 0.45);
      c.lineCap = 'round';
      c.lineJoin = 'round';

      /* 杆 */
      c.beginPath();
      c.moveTo(from.x, from.y);
      c.lineTo(lineEndX, lineEndY);
      c.stroke();

      /* 填充三角形箭头 */
      c.beginPath();
      c.moveTo(to.x, to.y);
      c.lineTo(to.x - ux * headLen - uy * headWid,
               to.y - uy * headLen + ux * headWid);
      c.lineTo(to.x - ux * headLen + uy * headWid,
               to.y - uy * headLen - ux * headWid);
      c.closePath();
      c.fill();

      c.restore();
    };

    drawVec('#e53935', { x: px, y: py }, A);                       /* 万有引力 */
    if (Fc_mag > 0.5) drawVec('#1e88e5', { x: px, y: py }, B);     /* 向心力   */
    drawVec('#43a047', { x: px, y: py }, C);                       /* 重力     */

    /* ---- 物块 ---- */
    const ballR = Math.max(4, R * 0.055);
    c.beginPath();
    c.arc(px, py, ballR, 0, Math.PI * 2);
    c.fillStyle = U.alpha(o.color, 0.75);
    c.fill();
    c.stroke();

    /* ---- 标签 ---- */
    const fs = Math.max(11, R * 0.12);
    c.save();
    c.font = 'bold ' + fs + 'px system-ui, "PingFang SC", "Microsoft YaHei", sans-serif';
    c.textAlign = 'center';
    c.textBaseline = 'middle';

    const Fg_len = Math.hypot(Fgx, Fgy);
    const Fw_len = Math.hypot(Fwx, Fwy);
    const off = fs * 1.1;

    if (Fg_len > 1) {
      c.fillStyle = '#e53935';
      c.fillText('F引',
        A.x + Fgx / Fg_len * off,
        A.y + Fgy / Fg_len * off);
    }

    if (Fc_mag > 0.5) {
      c.fillStyle = '#1e88e5';
      c.textAlign = 'right';
      c.fillText('F向', B.x - fs * 0.4, B.y - fs * 0.8);
      c.textAlign = 'center';
    }

    if (Fw_len > 1) {
      c.fillStyle = '#43a047';
      c.fillText('F重',
        C.x + Fwx / Fw_len * off,
        C.y + Fwy / Fw_len * off);
    }
    c.restore();
  }
});

/* ---- 圆弧槽公用小球参数 ---- */
param('slotBallPos',  { label: '小球位置', min: 0, max: 1,  step: 0.02, def: 0.5 });
param('slotBallR',    { label: '小球半径', min: 2, max: 30, step: 0.5,  def: 18 });
param('slotBallShow', { label: '显示小球', min: 0, max: 1,  step: 1,    def: 1, unit: '0隐1显' });

/* ---- 15. 半圆弧槽 ---- */
shape({
  key: 'halfArcSlot', cat: 'mech', geom: 'box', label: '半圆弧槽', fill: true,
  icon: '<path d="M3 5h3a6 6 0 0 0 12 0h3v14H3z"/>',
  params: ['slotBallPos', 'slotBallR', 'slotBallShow'],
  draw(c, o, U) {
    const b = U.bbox(o);
    const r  = Math.min(b.w / 2, b.h);
    const cx = b.x1 + b.w / 2;

    /* ---- 槽本体 ---- */
    c.beginPath();
    c.moveTo(b.x1, b.y1);
    c.lineTo(cx - r, b.y1);
    c.arc(cx, b.y1, r, Math.PI, 0, true);
    c.lineTo(b.x2, b.y1);
    c.lineTo(b.x2, b.y2);
    c.lineTo(b.x1, b.y2);
    c.closePath();
    if (o.fill) { c.fillStyle = U.alpha(o.color, 0.15); c.fill(); }
    c.stroke();

    /* ---- 小球 ---- */
    if ((o.slotBallShow ?? 1) < 0.5) return;

    const ballR  = Math.max(2, Math.min(o.slotBallR ?? 8, r * 0.5));
    const orbitR = Math.max(0.1, r - ballR);
    const pos    = Math.max(0, Math.min(1, o.slotBallPos ?? 0.5));

    /* 圆弧中心 (cx, b.y1)，角度：0 = 右侧，π/2 = 底部，π = 左侧 */
    const alpha = Math.PI * pos;
    const bx = cx + orbitR * Math.cos(alpha);
    const by = b.y1 + orbitR * Math.sin(alpha);

    c.beginPath();
    c.arc(bx, by, ballR, 0, Math.PI * 2);
    if (o.fill) { c.fillStyle = U.alpha(o.color, 0.45); c.fill(); }
    c.stroke();
  }
});


/* ---- 16. 四分之一圆弧槽 ---- */
shape({
  key: 'quarterArcSlot', cat: 'mech', geom: 'box', label: '四分之一圆弧槽', fill: true,
  icon: '<path d="M10 4h10v16H4V10a6 6 0 0 0 6-6z"/>',
  params: ['slotBallPos', 'slotBallR', 'slotBallShow'],
  draw(c, o, U) {
    const b = U.bbox(o);
    const r = Math.min(b.w, b.h);

    /* ---- 槽本体 ---- */
    c.beginPath();
    c.moveTo(b.x1 + r, b.y1);
    c.lineTo(b.x2, b.y1);
    c.lineTo(b.x2, b.y2);
    c.lineTo(b.x1, b.y2);
    c.lineTo(b.x1, b.y1 + r);
    c.arc(b.x1, b.y1, r, Math.PI / 2, 0, true);
    c.closePath();
    if (o.fill) { c.fillStyle = U.alpha(o.color, 0.15); c.fill(); }
    c.stroke();

    /* ---- 小球 ---- */
    if ((o.slotBallShow ?? 1) < 0.5) return;

    const ballR  = Math.max(2, Math.min(o.slotBallR ?? 8, r * 0.5));
    const orbitR = Math.max(0.1, r - ballR);
    const pos    = Math.max(0, Math.min(1, o.slotBallPos ?? 0.5));

    /* 圆弧中心 (b.x1, b.y1)，角度：π/2 = 正下方（弧一端），0 = 正右方（弧另一端） */
    const alpha = (1 - pos) * (Math.PI / 2);
    const bx = b.x1 + orbitR * Math.cos(alpha);
    const by = b.y1 + orbitR * Math.sin(alpha);

    c.beginPath();
    c.arc(bx, by, ballR, 0, Math.PI * 2);
    if (o.fill) { c.fillStyle = U.alpha(o.color, 0.45); c.fill(); }
    c.stroke();
  }
});


/* ---- 17. 可调圆弧槽（增加退化兜底 + 小球） ---- */
param('arcSlotL', { label: '左圆心角', min: 0, max: 90, step: 1, def: 0,  unit: '°' });
param('arcSlotR', { label: '右圆心角', min: 0, max: 90, step: 1, def: 60, unit: '°' });

shape({
  key: 'arcSlotVar', cat: 'mech', geom: 'box', label: '可调圆弧槽', fill: true,
  icon: '<path d="M3 20A19 19 0 0 0 19.45 10.5H21.45V20Z"/>',
  params: ['arcSlotL', 'arcSlotR', 'slotBallPos', 'slotBallR', 'slotBallShow'],
  draw(c, o, U) {
    const b = U.bbox(o);
    const r = Math.min(b.w / 2, b.h);
    const cx = b.x1 + b.w / 2;
    const cy = b.y1;
    const aL = ((o.arcSlotL ?? 0)  * Math.PI) / 180;
    const aR = ((o.arcSlotR ?? 60) * Math.PI) / 180;
    const gap = Math.min(16, r * 0.5);

    const minX = cx;
    const minY = cy + r;

    /* 兜底：左右圆心角都接近 0 → 退化成一条水平线段 */
    if (aL < 0.005 && aR < 0.005) {
      c.beginPath();
      c.moveTo(b.x1, minY);
      c.lineTo(b.x2, minY);
      if (o.fill) { c.fillStyle = U.alpha(o.color, 0.15); c.fill(); }
      c.stroke();
      return;
    }

    /* ---- 槽本体 ---- */
    c.beginPath();
    if (aR > 0.005) {
      const rightAngle = Math.PI / 2 - aR;
      const xR = cx + r * Math.cos(rightAngle);
      const yR = cy + r * Math.sin(rightAngle);
      c.moveTo(minX, minY);
      c.arc(cx, cy, r, Math.PI / 2, rightAngle, true);
      c.lineTo(xR + gap, yR);
      c.lineTo(xR + gap, cy + r);
      c.lineTo(minX, minY);
    }
    if (aL > 0.005) {
      const leftAngle = Math.PI / 2 + aL;
      const xL = cx + r * Math.cos(leftAngle);
      const yL = cy + r * Math.sin(leftAngle);
      c.moveTo(minX, minY);
      c.arc(cx, cy, r, Math.PI / 2, leftAngle, false);
      c.lineTo(xL - gap, yL);
      c.lineTo(xL - gap, cy + r);
      c.lineTo(minX, minY);
    }
    c.closePath();
    if (o.fill) { c.fillStyle = U.alpha(o.color, 0.15); c.fill(); }
    c.stroke();

    /* ---- 小球 ---- */
    if ((o.slotBallShow ?? 1) < 0.5) return;

    const ballR  = Math.max(2, Math.min(o.slotBallR ?? 8, r * 0.5));
    const orbitR = Math.max(0.1, r - ballR);
    const pos    = Math.max(0, Math.min(1, o.slotBallPos ?? 0.5));

    /* 圆弧中心 (cx, cy)：
     *   角度 π/2 在正下方（两段弧共同起点）
     *   左弧覆盖 π/2 → π/2 + aL
     *   右弧覆盖 π/2 → π/2 − aR
     * 小球位置参数 pos 线性映射到这两段弧上：
     *   0 → 左端（π/2 + aL）
     *   0.5 → 正下方（π/2）
     *   1 → 右端（π/2 − aR）
     * 若某一侧弧不存在（对应角度为 0），该侧的 pos 区间自动退化到正下方。 */
    let alpha;
    if (pos <= 0.5) {
      const t = pos * 2;
      alpha = (Math.PI / 2 + aL) - t * aL;
    } else {
      const t = (pos - 0.5) * 2;
      alpha = (Math.PI / 2) - t * aR;
    }

    const bx = cx + orbitR * Math.cos(alpha);
    const by = cy + orbitR * Math.sin(alpha);

    c.beginPath();
    c.arc(bx, by, ballR, 0, Math.PI * 2);
    if (o.fill) { c.fillStyle = U.alpha(o.color, 0.45); c.fill(); }
    c.stroke();
  }
});

/* ==========================================================================
 * 16. 力学补充（弹簧振子 / 纸带 / 连接体 / 板块模型 / 两物块弹簧）
 * ========================================================================== */

/* ---- 水平弹簧振子 ---- */
shape({
  key: 'springOscillator', cat: 'mech', geom: 'box', label: '弹簧振子',
  icon: '<path d="M3 3v18"/>' +
        '<path d="M3 12h1l1-3 2 6 2-6 2 6 2-6 1 3h1"/>' +
        '<rect x="16" y="7" width="6" height="10"/>',
  params: ['coils'],
  draw(c, o, U) {
    const b = U.bbox(o);
    const { x1, y1, x2, y2, w, h } = b;

    const groundY  = y1 + h * 0.85;
    const blockH   = h * 0.35;
    const blockW   = Math.min(blockH, w * 0.18);
    const blockX   = x2 - blockW - w * 0.02;
    const blockY   = groundY - blockH;
    const springCY = blockY + blockH / 2;

    const wallW    = Math.max(5, w * 0.04);
    const wallTop  = springCY - h * 0.20;
    const wallBot  = groundY;

    c.beginPath();
    c.moveTo(x1, groundY);
    c.lineTo(x2, groundY);
    c.stroke();

    c.save();
    c.lineWidth = Math.max(0.7, (o.size || 4) * 0.45);
    for (let sx = x1 + 4; sx <= x2 - 4; sx += 12) {
      c.beginPath();
      c.moveTo(sx, groundY);
      c.lineTo(sx - 6, groundY + 8);
      c.stroke();
    }
    c.restore();

    c.save();
    c.fillStyle = 'rgba(120,120,120,0.35)';
    c.fillRect(x1, wallTop, wallW, wallBot - wallTop);
    c.strokeRect(x1, wallTop, wallW, wallBot - wallTop);
    c.restore();

    const sx1   = x1 + wallW;
    const sx2   = blockX;
    const coils = Math.max(4, Math.round(o.coils ?? 10));
    const len   = sx2 - sx1;
    const amp   = Math.min(h * 0.07, len * 0.08);
    const endFrac = 0.10;
    const s0 = sx1 + len * endFrac;
    const s1 = sx2 - len * endFrac;
    const segs = coils * 20;

    c.beginPath();
    c.moveTo(sx1, springCY);
    c.lineTo(s0, springCY);
    for (let i = 0; i <= segs; i++) {
      const t = i / segs;
      const x = s0 + (s1 - s0) * t;
      const y = springCY + Math.sin(t * coils * Math.PI * 2) * amp;
      c.lineTo(x, y);
    }
    c.lineTo(sx2, springCY);
    c.stroke();

    c.save();
    c.fillStyle = 'rgba(100,150,200,0.35)';
    c.fillRect(blockX, blockY, blockW, blockH);
    c.strokeRect(blockX, blockY, blockW, blockH);
    c.restore();

    c.save();
    c.fillStyle = o.color || '#1a1a1a';
    const fs = Math.min(blockW, blockH) * 0.55;
    c.font = 'italic bold ' + fs + 'px system-ui,sans-serif';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('m', blockX + blockW / 2, blockY + blockH / 2);
    c.restore();
  }
});

/* ---- 竖直弹簧振子 ---- */
shape({
  key: 'springOscV', cat: 'mech', geom: 'box', label: '竖直弹簧振子',
  icon: '<path d="M3 3h18"/>' +
        '<path d="M12 3v1l-3 1.5 6 3-6 3 6 3-6 3 3 1.5v1"/>' +
        '<rect x="7" y="17" width="10" height="5"/>',
  params: ['coils'],
  draw(c, o, U) {
    const b = U.bbox(o);
    const { x1, y1, x2, y2, w, h } = b;

    const cx = (x1 + x2) / 2;

    const ceilH    = Math.max(4, h * 0.03);
    const blockW   = Math.min(w * 0.45, h * 0.22);
    const blockH   = blockW * 0.75;
    const blockBot = y2;
    const blockTop = blockBot - blockH;
    const blockL   = cx - blockW / 2;
    const blockR   = cx + blockW / 2;

    const springTop = y1 + ceilH;
    const springBot = blockTop;

    c.save();
    c.fillStyle = 'rgba(120,120,120,0.35)';
    c.fillRect(x1, y1, w, ceilH);
    c.strokeRect(x1, y1, w, ceilH);
    c.restore();

    c.save();
    c.lineWidth = Math.max(0.7, (o.size || 4) * 0.45);
    for (let sx = x1 + 6; sx <= x2 - 6; sx += 14) {
      c.beginPath();
      c.moveTo(sx, y1 + ceilH);
      c.lineTo(sx + 6, y1);
      c.stroke();
    }
    c.restore();

    const len   = springBot - springTop;
    const coils = Math.max(4, Math.round(o.coils ?? 10));
    const amp   = Math.min(w * 0.12, len * 0.07);
    const endFrac = 0.10;
    const s0 = springTop + len * endFrac;
    const s1 = springBot - len * endFrac;
    const segs = coils * 20;

    c.beginPath();
    c.moveTo(cx, springTop);
    c.lineTo(cx, s0);
    for (let i = 0; i <= segs; i++) {
      const t = i / segs;
      const y = s0 + (s1 - s0) * t;
      const x = cx + Math.sin(t * coils * Math.PI * 2) * amp;
      c.lineTo(x, y);
    }
    c.lineTo(cx, springBot);
    c.stroke();

    c.save();
    c.fillStyle = 'rgba(100,150,200,0.35)';
    c.fillRect(blockL, blockTop, blockW, blockH);
    c.strokeRect(blockL, blockTop, blockW, blockH);
    c.restore();

    c.save();
    c.fillStyle = o.color || '#1a1a1a';
    const fs = Math.min(blockW, blockH) * 0.62;
    c.font = 'italic bold ' + fs + 'px system-ui,sans-serif';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('m', cx, blockTop + blockH / 2);
    c.restore();
  }
});


/* ---- 两物块 + 弹簧连接 ---- */
param('twoBlockCoils', { label: '圈数', min: 4, max: 30, step: 1, def: 10 });
param('twoBlockComp',  { label: '压缩', min: -1, max: 1,  step: 0.1, def: 0 });

shape({
  key: 'twoBlocksSpring', cat: 'mech', geom: 'box', label: '两物块弹簧',
  icon: '<rect x="2" y="8" width="5" height="8"/>' +
        '<path d="M7 12h1l1-3 2 6 2-6 2 6 1-3h1"/>' +
        '<rect x="17" y="8" width="5" height="8"/>',
  params: ['twoBlockCoils', 'twoBlockComp'],
  draw(c, o, U) {
    const b = U.bbox(o);
    const { x1, y1, x2, y2, w, h } = b;
    const cy = (y1 + y2) / 2;

    const blockH = h * 0.55;
    const blockW = Math.min(w * 0.20, blockH * 0.9);
    const blockTop = cy - blockH / 2;
    const blockBot = cy + blockH / 2;

    const comp   = Math.max(-1, Math.min(1, o.twoBlockComp ?? 0));
    const gapMax = w - 2 * blockW;
    const gap    = gapMax * (0.65 - 0.35 * comp);
    const midGap = Math.max(blockW * 0.5, gap);

    const totalW = 2 * blockW + midGap;
    const startX = (x1 + x2 - totalW) / 2;

    const leftL  = startX;
    const leftR  = leftL + blockW;
    const rightL = leftR + midGap;
    const rightR = rightL + blockW;

    c.save();
    c.fillStyle = 'rgba(100,150,200,0.35)';
    c.fillRect(leftL, blockTop, blockW, blockH);
    c.strokeRect(leftL, blockTop, blockW, blockH);
    c.restore();

    c.save();
    c.fillStyle = 'rgba(200,120,100,0.35)';
    c.fillRect(rightL, blockTop, blockW, blockH);
    c.strokeRect(rightL, blockTop, blockW, blockH);
    c.restore();

    const sx1 = leftR;
    const sx2 = rightL;
    const coils = Math.max(4, Math.round(o.twoBlockCoils ?? 10));
    const len = sx2 - sx1;
    const amp = Math.min(h * 0.10, len * 0.14);

    if (len > 4) {
      const endFrac = 0.10;
      const s0 = sx1 + len * endFrac;
      const s1 = sx2 - len * endFrac;
      const segs = coils * 20;

      c.beginPath();
      c.moveTo(sx1, cy);
      c.lineTo(s0, cy);
      for (let i = 0; i <= segs; i++) {
        const t = i / segs;
        const x = s0 + (s1 - s0) * t;
        const y = cy + Math.sin(t * coils * Math.PI * 2) * amp;
        c.lineTo(x, y);
      }
      c.lineTo(sx2, cy);
      c.stroke();
    } else {
      c.beginPath();
      c.moveTo(sx1, cy);
      c.lineTo(sx2, cy);
      c.stroke();
    }

    c.save();
    c.fillStyle = o.color || '#1a1a1a';
    const fs = Math.min(blockW, blockH) * 0.55;
    c.font = 'italic bold ' + fs + 'px system-ui,sans-serif';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('m\u2081', leftL  + blockW / 2, cy);
    c.fillText('m\u2082', rightL + blockW / 2, cy);
    c.restore();
  }
});



/* ==========================================================================
 * 6. 波动
 * ========================================================================== */

/* 波形采样：t ∈ [0,1]，返回 [-1, 1] */
function waveSample(type, t, cycles, phase) {
  const arg = 2 * Math.PI * cycles * t + phase;
  switch (type) {
    case 'sine':
      return Math.sin(arg);

    case 'square':
      return Math.sin(arg) >= 0 ? 1 : -1;

    case 'tri': {
      let p = arg / (2 * Math.PI);
      p = p - Math.floor(p);
      if (p < 0.25) return 4 * p;
      if (p < 0.75) return 2 - 4 * p;
      return 4 * p - 4;
    }

    case 'saw': {
      let p = arg / (2 * Math.PI);
      p = p - Math.floor(p);
      return 2 * p - 1;
    }

    case 'half': {
      const s = Math.sin(arg);
      return s > 0 ? s : 0;
    }

    case 'full':
      return Math.abs(Math.sin(arg));

    case 'standing':
      return Math.sin(arg) * Math.abs(Math.sin(Math.PI * t));

    case 'damped': {
      const env = Math.exp(-3 * t);
      return Math.sin(arg) * env;
    }

    case 'am': {
      const carrier = Math.sin(arg);
      const env = 0.6 + 0.4 * Math.sin(2 * Math.PI * 2 * t);
      return carrier * env;
    }

    case 'beat': {
      const f1 = cycles - 0.5;
      const f2 = cycles + 0.5;
      return 0.5 * (Math.sin(2 * Math.PI * f1 * t + phase)
                  + Math.sin(2 * Math.PI * f2 * t + phase));
    }

    case 'pulse': {
      const center = 0.5;
      const w = 0.15;
      const g = Math.exp(-Math.pow(t - center, 2) / (2 * w * w));
      const carrier = Math.cos(2 * Math.PI * cycles * (t - center) + phase);
      return g * carrier;
    }

    default:
      return Math.sin(arg);
  }
}

function waveDraw(type) {
  return function (c, o, U) {
    const b = U.bbox(o);
    const cycles   = Math.max(0.5, o.cycles ?? 2);
    const ampFrac  = Math.max(0, Math.min(1, o.amp ?? 0.5));
    const phase    = ((o.phase ?? 0) * Math.PI) / 180;
    const showAxis = (o.waveAxis ?? 1) >= 0.5;

    const padX = b.w * 0.06;
    const padY = b.h * 0.10;
    const cy   = (b.y1 + b.y2) / 2;
    const amp  = (b.h / 2 - padY) * ampFrac;

    const axX   = b.x1 + padX;
    const left  = axX;
    const right = b.x2 - padX;

    if (showAxis) {
      const axTop   = b.y1 + padY * 0.4;
      const axRight = b.x2 - padX * 0.4;

      c.beginPath();
      c.moveTo(axX, b.y2 - padY * 0.4);
      c.lineTo(axX, axTop);
      c.stroke();
      U.arrowHead(c, axX, b.y2 - padY * 0.4, axX, axTop, o.size || 4);

      c.beginPath();
      c.moveTo(axX, cy);
      c.lineTo(axRight, cy);
      c.stroke();
      U.arrowHead(c, axX, cy, axRight, cy, o.size || 4);
    }

    const N = Math.max(160, Math.round(b.w * 1.4));
    c.beginPath();
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      const x = left + (right - left) * t;
      const s = waveSample(type, t, cycles, phase);
      const y = cy - amp * s;
      if (i === 0) c.moveTo(x, y);
      else c.lineTo(x, y);
    }
    c.stroke();
  };
}

/* ===== 周期波 ===== */
shape({
  key: 'sine', cat: 'wave', geom: 'box', label: '正弦波', fill: false,
  icon: '<path d="M2 12q3-8 6 0t6 0t6 0"/>',
  params: ['cycles', 'amp', 'phase', 'waveAxis'],
  draw: waveDraw('sine')
});

shape({
  key: 'square', cat: 'wave', geom: 'box', label: '方波', fill: false,
  icon: '<path d="M3 16V8h6v8h6V8h6"/>',
  params: ['cycles', 'amp', 'phase', 'waveAxis'],
  draw: waveDraw('square')
});

shape({
  key: 'triWave', cat: 'wave', geom: 'box', label: '三角波', fill: false,
  icon: '<path d="M3 16l3-8 3 8 3-8 3 8 3-8 3 8"/>',
  params: ['cycles', 'amp', 'phase', 'waveAxis'],
  draw: waveDraw('tri')
});

shape({
  key: 'sawWave', cat: 'wave', geom: 'box', label: '锯齿波', fill: false,
  icon: '<path d="M2 16l6-8v8l6-8v8l6-8"/>',
  params: ['cycles', 'amp', 'phase', 'waveAxis'],
  draw: waveDraw('saw')
});

/* ===== 整流 ===== */
shape({
  key: 'halfRect', cat: 'wave', geom: 'box', label: '半波整流', fill: false,
  icon: '<path d="M2 16q3-8 6 0h2q3-8 6 0h2"/>',
  params: ['cycles', 'amp', 'phase', 'waveAxis'],
  draw: waveDraw('half')
});

shape({
  key: 'fullRect', cat: 'wave', geom: 'box', label: '全波整流', fill: false,
  icon: '<path d="M2 16q3-8 6 0q3-8 6 0q3-8 6 0"/>',
  params: ['cycles', 'amp', 'phase', 'waveAxis'],
  draw: waveDraw('full')
});

/* ===== 振动 ===== */
shape({
  key: 'standing', cat: 'wave', geom: 'box', label: '驻波', fill: false,
  icon: '<path d="M3 12q3-6 6 0t6 0t6 0"/>',
  params: ['cycles', 'amp', 'phase', 'waveAxis'],
  draw: waveDraw('standing')
});

shape({
  key: 'dampedWave', cat: 'wave', geom: 'box', label: '阻尼振荡', fill: false,
  icon: '<path d="M2 12q2-7 4 0q2 7 4 0q2-5 4 0q2 5 4 0q2-3 4 0"/>',
  params: ['cycles', 'amp', 'phase', 'waveAxis'],
  draw: waveDraw('damped')
});

/* ===== 调制 ===== */
shape({
  key: 'amWave', cat: 'wave', geom: 'box', label: '调幅波', fill: false,
  icon: '<path d="M2 12q2-5 4 0q2-9 5 0q2-9 5 0q2 9 5 0q2 5 4 0"/>',
  params: ['cycles', 'amp', 'phase', 'waveAxis'],
  draw: waveDraw('am')
});

shape({
  key: 'beatWave', cat: 'wave', geom: 'box', label: '拍', fill: false,
  icon: '<path d="M2 12q2-4 3 0q2 4 3 0q2-8 4 0q2 8 4 0q2-4 3 0"/>',
  params: ['cycles', 'amp', 'phase', 'waveAxis'],
  draw: waveDraw('beat')
});

/* ===== 脉冲 ===== */
shape({
  key: 'pulse', cat: 'wave', geom: 'box', label: '脉冲波', fill: false,
  icon: '<path d="M2 16q5-14 10 0h10"/>',
  params: ['cycles', 'amp', 'phase', 'waveAxis'],
  draw: waveDraw('pulse')
});


/* ==========================================================================
 * 7. 水波（含干涉、3D）
 * ========================================================================== */

function drawHyperbola(c, cx, cy, d, lambda, k, extend) {
  const a = Math.abs(k) * lambda / 2;
  if (a >= d) return;

  if (a < 1e-6) {
    c.beginPath();
    c.moveTo(cx, cy - extend);
    c.lineTo(cx, cy + extend);
    c.stroke();
    return;
  }

  const b = Math.sqrt(d * d - a * a);
  const sign = k >= 0 ? 1 : -1;
  const tMax = Math.asinh(extend / b);
  const N = 60;

  c.beginPath();
  for (let i = 0; i <= N; i++) {
    const t = -tMax + (2 * tMax) * i / N;
    const px = sign * a * Math.cosh(t);
    const py = b * Math.sinh(t);
    if (i === 0) c.moveTo(cx + px, cy + py);
    else c.lineTo(cx + px, cy + py);
  }
  c.stroke();
}

param('rippleCount', { label: '波纹数', min: 2, max: 12, step: 1, def: 6 });

shape({
  key: 'waterTop', cat: 'wave', geom: 'box', label: '水波（俯视）', fill: false,
  icon: '<circle cx="12" cy="12" r="2" fill="currentColor"/>' +
        '<circle cx="12" cy="12" r="5"/>' +
        '<circle cx="12" cy="12" r="8"/>' +
        '<circle cx="12" cy="12" r="11"/>',
  params: ['rippleCount'],
  draw(c, o, U) {
    const b = U.bbox(o);
    const cx = b.x1 + b.w / 2;
    const cy = b.y1 + b.h / 2;
    const maxR = Math.max(b.w, b.h) * 0.75;
    const count = Math.max(2, Math.round(o.rippleCount ?? 6));
    const gap = maxR / count;

    c.save();
    c.beginPath();
    c.rect(b.x1, b.y1, b.w, b.h);
    c.clip();
    c.lineWidth = Math.max(0.8, (o.size || 4) * 0.5);

    for (let i = 0; i < count; i++) {
      const r = gap * (i + 1);
      c.beginPath();
      c.arc(cx, cy, r, 0, Math.PI * 2);
      c.setLineDash(i % 2 === 0 ? [] : [5, 5]);
      c.stroke();
    }
    c.setLineDash([]);
    c.restore();

    c.beginPath();
    c.arc(cx, cy, Math.max(2, (o.size || 4) * 0.8), 0, Math.PI * 2);
    c.fillStyle = o.color;
    c.fill();
  }
});

param('srcSep',    { label: '波源间距', min: 5, max: 80, step: 1, def: 30, unit: '%' });
param('phaseInv',  { label: '相位',     min: 0, max: 1,  step: 1, def: 0, unit: '0同1反' });
param('showNodes', { label: '干涉线',   min: 0, max: 1,  step: 1, def: 1 });

shape({
  key: 'waterInterf', cat: 'wave', geom: 'box', label: '水波干涉（俯视）', fill: false,
  icon: '<circle cx="9" cy="12" r="1.5" fill="currentColor"/>' +
        '<circle cx="15" cy="12" r="1.5" fill="currentColor"/>' +
        '<circle cx="9" cy="12" r="5"/><circle cx="15" cy="12" r="5"/>' +
        '<circle cx="9" cy="12" r="9"/><circle cx="15" cy="12" r="9"/>',
  params: ['rippleCount', 'srcSep', 'phaseInv', 'showNodes'],
  draw(c, o, U) {
    const b = U.bbox(o);
    const cx = b.x1 + b.w / 2;
    const cy = b.y1 + b.h / 2;
    const count = Math.max(2, Math.round(o.rippleCount ?? 6));
    const sepFrac = Math.max(0.05, Math.min(0.8, (o.srcSep ?? 30) / 100));
    const d = Math.min(b.w, b.h) * sepFrac / 2;
    const maxR = Math.hypot(b.w, b.h) * 0.7;
    const gap = maxR / count;
    const inv = (o.phaseInv ?? 0) >= 0.5;
    const showNodes = (o.showNodes ?? 1) >= 0.5;

    const s1 = { x: cx - d, y: cy };
    const s2 = { x: cx + d, y: cy };

    c.save();
    c.beginPath();
    c.rect(b.x1, b.y1, b.w, b.h);
    c.clip();

    c.lineWidth = Math.max(0.7, (o.size || 4) * 0.4);
    for (let i = 0; i < count; i++) {
      const r = gap * (i + 1);
      c.beginPath();
      c.arc(s1.x, s1.y, r, 0, Math.PI * 2);
      c.setLineDash(i % 2 === 0 ? [] : [5, 5]);
      c.stroke();
    }

    for (let i = 0; i < count; i++) {
      const r = gap * (i + 1);
      c.beginPath();
      c.arc(s2.x, s2.y, r, 0, Math.PI * 2);
      const isCrest = (i % 2 === 0) !== inv;
      c.setLineDash(isCrest ? [] : [5, 5]);
      c.stroke();
    }

    if (showNodes) {
      c.save();
      const extend = Math.max(b.w, b.h) * 0.8;
      const maxN = Math.min(15, Math.ceil(2 * d / gap));

      for (let n = -maxN; n <= maxN; n++) {
        const kC = inv ? n + 0.5 : n;
        c.strokeStyle = U.alpha(o.color, 0.55);
        c.lineWidth = Math.max(1, (o.size || 4) * 0.55);
        c.setLineDash([]);
        drawHyperbola(c, cx, cy, d, gap, kC, extend);

        const kD = inv ? n : n + 0.5;
        c.strokeStyle = U.alpha(o.color, 0.3);
        c.lineWidth = Math.max(0.6, (o.size || 4) * 0.3);
        c.setLineDash([4, 4]);
        drawHyperbola(c, cx, cy, d, gap, kD, extend);
      }
      c.restore();
    }

    c.setLineDash([]);
    c.restore();

    [s1, s2].forEach(s => {
      c.beginPath();
      c.arc(s.x, s.y, Math.max(2.5, (o.size || 4) * 1), 0, Math.PI * 2);
      c.fillStyle = o.color;
      c.fill();
    });
  }
});

param('tilt', { label: '视角', min: 25, max: 85, step: 1, def: 60, unit: '°' });

shape({
  key: 'water3D', cat: 'wave', geom: 'box', label: '水波（3D）', fill: false,
  icon: '<ellipse cx="12" cy="13" rx="10" ry="6"/>' +
        '<ellipse cx="12" cy="13" rx="6" ry="3.5"/>' +
        '<ellipse cx="12" cy="13" rx="2" ry="1.2"/>',
  params: ['tilt', 'rippleCount'],
  draw(c, o, U) {
    const b = U.bbox(o);
    const cx = b.x1 + b.w / 2;
    const cy = b.y1 + b.h / 2;
    const tiltDeg = Math.max(25, Math.min(85, o.tilt ?? 60));
    const tilt = tiltDeg * Math.PI / 180;
    const count = Math.max(2, Math.round(o.rippleCount ?? 5));

    const scaleX = b.w / 2 * 0.92;
    const scaleY = b.h / 2 * 0.92;
    const scaleZ = Math.min(b.w, b.h) / 2 * 0.75;
    const sinT = Math.sin(tilt);
    const cosT = Math.cos(tilt);

    function project(x, y, z) {
      return {
        sx: cx + x * scaleX,
        sy: cy - y * scaleY * sinT - z * scaleZ * cosT
      };
    }

    function waveZ(x, y) {
      const r = Math.hypot(x, y);
      return Math.cos(Math.PI * count * r) * Math.exp(-r * 1.2);
    }

    const N = 72;
    const cells = [];
    for (let i = 0; i < N; i++) {
      for (let j = 0; j < N; j++) {
        const x0 = -1 + 2 * i / N;
        const x1 = -1 + 2 * (i + 1) / N;
        const y0 = -1 + 2 * j / N;
        const y1 = -1 + 2 * (j + 1) / N;
        const z00 = waveZ(x0, y0);
        const z10 = waveZ(x1, y0);
        const z11 = waveZ(x1, y1);
        const z01 = waveZ(x0, y1);
        cells.push({
          x0, x1, y0, y1, z00, z10, z11, z01,
          zAvg: (z00 + z10 + z11 + z01) / 4,
          yAvg: (y0 + y1) / 2
        });
      }
    }
    cells.sort((a, b) => b.yAvg - a.yAvg);

    c.save();
    c.lineJoin = 'round';
    for (const cell of cells) {
      const p00 = project(cell.x0, cell.y0, cell.z00);
      const p10 = project(cell.x1, cell.y0, cell.z10);
      const p11 = project(cell.x1, cell.y1, cell.z11);
      const p01 = project(cell.x0, cell.y1, cell.z01);

      c.beginPath();
      c.moveTo(p00.sx, p00.sy);
      c.lineTo(p10.sx, p10.sy);
      c.lineTo(p11.sx, p11.sy);
      c.lineTo(p01.sx, p01.sy);
      c.closePath();

      const h = Math.max(0, Math.min(1, (cell.zAvg + 1) / 2));
      const lum = 38 + 54 * h;
      const col = `hsl(210, 70%, ${lum}%)`;
      c.fillStyle = col;
      c.strokeStyle = col;
      c.lineWidth = 0.6;
      c.fill();
      c.stroke();
    }
    c.restore();
  }
});

shape({
  key: 'waterInterf3D', cat: 'wave', geom: 'box', label: '水波干涉（3D）', fill: false,
  icon: '<ellipse cx="9"  cy="13" rx="5" ry="3"/>' +
        '<ellipse cx="15" cy="13" rx="5" ry="3"/>' +
        '<ellipse cx="12" cy="13" rx="10" ry="6"/>',
  params: ['tilt', 'rippleCount', 'srcSep', 'phaseInv'],
  draw(c, o, U) {
    const b = U.bbox(o);
    const cx = b.x1 + b.w / 2;
    const cy = b.y1 + b.h / 2;
    const tiltDeg = Math.max(25, Math.min(85, o.tilt ?? 60));
    const tilt = tiltDeg * Math.PI / 180;
    const count = Math.max(2, Math.round(o.rippleCount ?? 5));
    const sepFrac = Math.max(0.05, Math.min(0.8, (o.srcSep ?? 30) / 100));
    const inv = (o.phaseInv ?? 0) >= 0.5;

    const scaleX = b.w / 2 * 0.92;
    const scaleY = b.h / 2 * 0.92;
    const scaleZ = Math.min(b.w, b.h) / 2 * 0.75;
    const sinT = Math.sin(tilt);
    const cosT = Math.cos(tilt);

    function project(x, y, z) {
      return {
        sx: cx + x * scaleX,
        sy: cy - y * scaleY * sinT - z * scaleZ * cosT
      };
    }

    const sx1 = -sepFrac / 2;
    const sx2 =  sepFrac / 2;
    const phase2 = inv ? Math.PI : 0;

    function waveZ(x, y) {
      const r1 = Math.hypot(x - sx1, y);
      const r2 = Math.hypot(x - sx2, y);
      const w1 = Math.cos(Math.PI * count * r1) * Math.exp(-r1 * 0.9);
      const w2 = Math.cos(Math.PI * count * r2 + phase2) * Math.exp(-r2 * 0.9);
      return (w1 + w2) / 2;
    }

    const N = 80;
    const cells = [];
    for (let i = 0; i < N; i++) {
      for (let j = 0; j < N; j++) {
        const x0 = -1 + 2 * i / N;
        const x1 = -1 + 2 * (i + 1) / N;
        const y0 = -1 + 2 * j / N;
        const y1 = -1 + 2 * (j + 1) / N;
        const z00 = waveZ(x0, y0);
        const z10 = waveZ(x1, y0);
        const z11 = waveZ(x1, y1);
        const z01 = waveZ(x0, y1);
        cells.push({
          x0, x1, y0, y1, z00, z10, z11, z01,
          zAvg: (z00 + z10 + z11 + z01) / 4,
          yAvg: (y0 + y1) / 2
        });
      }
    }
    cells.sort((a, b) => b.yAvg - a.yAvg);

    c.save();
    c.lineJoin = 'round';
    for (const cell of cells) {
      const p00 = project(cell.x0, cell.y0, cell.z00);
      const p10 = project(cell.x1, cell.y0, cell.z10);
      const p11 = project(cell.x1, cell.y1, cell.z11);
      const p01 = project(cell.x0, cell.y1, cell.z01);

      c.beginPath();
      c.moveTo(p00.sx, p00.sy);
      c.lineTo(p10.sx, p10.sy);
      c.lineTo(p11.sx, p11.sy);
      c.lineTo(p01.sx, p01.sy);
      c.closePath();

      const h = Math.max(0, Math.min(1, (cell.zAvg + 1) / 2));
      const lum = 38 + 54 * h;
      const col = `hsl(210, 70%, ${lum}%)`;
      c.fillStyle = col;
      c.strokeStyle = col;
      c.lineWidth = 0.6;
      c.fill();
      c.stroke();
    }
    c.restore();
  }
});


/* ==========================================================================
 * 8. 多普勒效应
 * ========================================================================== */

param('dopRatio', { label: '波速/源速', min: 0.33, max: 8, step: 0.05, def: 2 });
param('dopWaves', { label: '波前数',   min: 3,    max: 16, step: 1,   def: 8 });

shape({
  key: 'doppler', cat: 'wave', geom: 'box', label: '多普勒效应', fill: false,
  icon: '<circle cx="10" cy="12" r="3"/>' +
        '<circle cx="10" cy="12" r="6"/>' +
        '<circle cx="10" cy="12" r="9"/>' +
        '<circle cx="15" cy="12" r="1.8" fill="currentColor"/>' +
        '<path d="M12 12h5"/>',
  params: ['dopRatio', 'dopWaves'],
  draw(c, o, U) {
    const b = U.bbox(o);
    const ratio = Math.max(0.33, Math.min(8, o.dopRatio ?? 2));
    const N = Math.max(3, Math.round(o.dopWaves ?? 8));
    const span = N - 1;

    const pad = Math.min(b.w, b.h) * 0.06;
    const Sx = (b.w - 2 * pad) / (span * (ratio + Math.max(ratio, 1)));
    const Sy = (b.h - 2 * pad) / (2 * ratio * span);
    const S = Math.min(Sx, Sy);

    const startX = b.x1 + pad + ratio * span * S;
    const cy = b.y1 + b.h / 2;

    c.save();
    c.lineWidth = Math.max(0.6, (o.size || 4) * 0.45);
    c.strokeStyle = U.alpha(o.color, 0.65);

    for (let i = 0; i < N; i++) {
      const px = startX + i * S;
      const r = ratio * (N - 1 - i) * S;
      if (r < 0.4) continue;
      c.beginPath();
      c.arc(px, cy, r, 0, Math.PI * 2);
      c.stroke();
    }

    c.save();
    c.strokeStyle = U.alpha(o.color, 0.35);
    c.setLineDash([4, 3]);
    c.beginPath();
    c.moveTo(startX, cy);
    c.lineTo(startX + span * S, cy);
    c.stroke();
    c.setLineDash([]);
    c.restore();

    c.beginPath();
    c.arc(startX + span * S, cy, Math.max(3, (o.size || 4) * 1.2), 0, Math.PI * 2);
    c.fillStyle = o.color;
    c.fill();

    c.restore();
  }
});


/* ==========================================================================
 * 9. 波的衍射
 * ========================================================================== */

param('difWave', { label: '波长', min: 5,  max: 60, step: 1, def: 15, unit: 'px' });
param('difSlit', { label: '缝宽', min: 2,  max: 80, step: 1, def: 80, unit: 'px' });

shape({
  key: 'diffract', cat: 'wave', geom: 'box', label: '波的衍射', fill: false,
  icon: '<path d="M4 4v16M8 4v16"/>' +
        '<path d="M12 4v6M12 14v6"/>' +
        '<path d="M14 8a6 6 0 0 1 0 8"/>' +
        '<path d="M14 5a9 9 0 0 1 0 14"/>',
  params: ['difWave', 'difSlit'],
  draw(c, o, U) {
    const b = U.bbox(o);
    const wavelength = Math.max(4, o.difWave ?? 20);
    const slit = Math.max(2, o.difSlit ?? 12);

    const wallX  = b.x1 + b.w * 0.5;
    const cy     = b.y1 + b.h / 2;
    const slitT  = cy - slit / 2;
    const slitB  = cy + slit / 2;

    c.save();
    c.lineWidth = Math.max(0.6, (o.size || 4) * 0.42);
    c.strokeStyle = U.alpha(o.color, 0.6);

    for (let x = b.x1 + 4; x < wallX - 4; x += wavelength) {
      c.beginPath();
      c.moveTo(x, b.y1 + 4);
      c.lineTo(x, b.y2 - 4);
      c.stroke();
    }

    c.save();
    c.strokeStyle = o.color;
    c.lineWidth = Math.max(1.5, (o.size || 4) * 0.9);
    c.beginPath();
    c.moveTo(wallX, b.y1 + 4); c.lineTo(wallX, slitT);
    c.moveTo(wallX, slitB);    c.lineTo(wallX, b.y2 - 4);
    c.stroke();
    c.restore();

    const spread = Math.PI / 2 * Math.min(1, 2 * wavelength / slit);
    const maxR = Math.max(b.w, b.h);
    for (let i = 1; i * wavelength < maxR; i++) {
      c.beginPath();
      c.arc(wallX, cy, i * wavelength, -spread, spread);
      c.stroke();
    }

    c.restore();
  }
});


/* ==========================================================================
 * 10. 惠更斯原理（反射 / 折射）
 * ========================================================================== */

param('huyType',  { label: '类型',   min: 0, max: 1,   step: 1,   def: 0,   unit: '0反射1折射' });
param('huyAngle', { label: '入射角', min: 20, max: 75, step: 1,   def: 50,  unit: '°' });
param('huyN',     { label: '折射率', min: 1.1, max: 3, step: 0.1, def: 1.5 });

shape({
  key: 'huygens', cat: 'wave', geom: 'box', label: '惠更斯原理', fill: false,
  icon: '<path d="M2 16h20"/>' +
        '<path d="M4 3l5 13"/>' +
        '<circle cx="9"  cy="16" r="4"/>' +
        '<circle cx="14" cy="16" r="2"/>' +
        '<path d="M6 16l10-7"/>',
  params: ['huyType', 'huyAngle', 'huyN'],
  draw(c, o, U) {
    const b = U.bbox(o);
    const type = Math.round(o.huyType ?? 0);
    const thetaDeg = Math.max(20, Math.min(75, o.huyAngle ?? 50));
    const theta = thetaDeg * Math.PI / 180;
    const n = Math.max(1.1, o.huyN ?? 1.5);
    const sinT = Math.sin(theta);
    const cosT = Math.cos(theta);

    const yI = b.y1 + b.h * 0.55;
    const cx = b.x1 + b.w / 2;

    const spacing = b.w * 0.14;
    const P = [
      { x: cx - spacing, y: yI },
      { x: cx,           y: yI },
      { x: cx + spacing, y: yI }
    ];

    const R = spacing * sinT;
    const arrowSize = Math.max(3, (o.size || 4) * 0.7);

    c.save();
    c.lineWidth = Math.max(0.7, (o.size || 4) * 0.45);
    c.strokeStyle = U.alpha(o.color, 0.55);

    c.beginPath();
    c.moveTo(b.x1, yI);
    c.lineTo(b.x2, yI);
    c.stroke();

    c.save();
    c.strokeStyle = U.alpha(o.color, 0.5);
    if (type === 0) {
      for (let i = 0; i < 3; i++) {
        const r = (2 - i) * R;
        if (r < 0.5) continue;
        c.beginPath();
        c.arc(P[i].x, P[i].y, r, Math.PI, Math.PI * 2);
        c.stroke();
      }
    } else {
      for (let i = 0; i < 3; i++) {
        const r = (2 - i) * R / n;
        if (r < 0.5) continue;
        c.beginPath();
        c.arc(P[i].x, P[i].y, r, 0, Math.PI);
        c.stroke();
      }
    }
    c.restore();

    const tl = b.w * 0.60;
    c.save();
    c.strokeStyle = U.alpha(o.color, 0.85);
    c.lineWidth = Math.max(1, (o.size || 4) * 0.7);

    if (type === 0) {
      const dxF = -cosT, dyF = -sinT;
      c.beginPath();
      c.moveTo(P[2].x + tl * dxF, P[2].y + tl * dyF);
      c.lineTo(P[2].x - tl * 0.35 * dxF, P[2].y - tl * 0.35 * dyF);
      c.stroke();
    } else {
      const sinP = sinT / n;
      const cosP = Math.sqrt(Math.max(0, 1 - sinP * sinP));
      const dxF = -cosP, dyF = sinP;
      c.beginPath();
      c.moveTo(P[2].x + tl * dxF, P[2].y + tl * dyF);
      c.lineTo(P[2].x - tl * 0.35 * dxF, P[2].y - tl * 0.35 * dyF);
      c.stroke();
    }
    c.restore();

    const hUp = yI - b.y1;
    const maxL = hUp * 0.80 / cosT;
    const spanL = 2 * spacing * sinT;
    const L0 = Math.max(maxL * 0.15, maxL - spanL);
    const L = [L0, L0 + spacing * sinT, L0 + 2 * spacing * sinT];

    c.save();
    c.strokeStyle = o.color;
    c.lineWidth = Math.max(0.9, (o.size || 4) * 0.6);

    for (let i = 0; i < 3; i++) {
      const Qx = P[i].x - L[i] * sinT;
      const Qy = P[i].y - L[i] * cosT;
      c.beginPath();
      c.moveTo(Qx, Qy);
      c.lineTo(P[i].x, P[i].y);
      c.stroke();
      const mx = (Qx + P[i].x) / 2;
      const my = (Qy + P[i].y) / 2;
      U.arrowHead(c, Qx, Qy, mx, my, arrowSize);
    }
    c.restore();

    c.save();
    c.strokeStyle = o.color;
    c.lineWidth = Math.max(0.9, (o.size || 4) * 0.6);

    if (type === 0) {
      const maxM = hUp * 0.55 / cosT;
      const M = [
        maxM,
        Math.max(maxM * 0.20, maxM - spacing * sinT),
        Math.max(maxM * 0.20, maxM - 2 * spacing * sinT)
      ];
      for (let i = 0; i < 3; i++) {
        const Tx = P[i].x + M[i] * sinT;
        const Ty = P[i].y - M[i] * cosT;
        c.beginPath();
        c.moveTo(P[i].x, P[i].y);
        c.lineTo(Tx, Ty);
        c.stroke();
        const mx = (P[i].x + Tx) / 2;
        const my = (P[i].y + Ty) / 2;
        U.arrowHead(c, P[i].x, P[i].y, mx, my, arrowSize);
      }
    } else {
      const sinP = sinT / n;
      const cosP = Math.sqrt(Math.max(0, 1 - sinP * sinP));
      const hDn = b.y2 - yI;
      const maxN = hDn * 0.80 / cosP;
      const N = [
        maxN,
        Math.max(maxN * 0.20, maxN - spacing * sinP),
        Math.max(maxN * 0.20, maxN - 2 * spacing * sinP)
      ];
      for (let i = 0; i < 3; i++) {
        const Sx = P[i].x + N[i] * sinP;
        const Sy = P[i].y + N[i] * cosP;
        c.beginPath();
        c.moveTo(P[i].x, P[i].y);
        c.lineTo(Sx, Sy);
        c.stroke();
        const mx = (P[i].x + Sx) / 2;
        const my = (P[i].y + Sy) / 2;
        U.arrowHead(c, P[i].x, P[i].y, mx, my, arrowSize);
      }
    }
    c.restore();

    P.forEach(p => {
      c.beginPath();
      c.arc(p.x, p.y, Math.max(1.5, (o.size || 4) * 0.6), 0, Math.PI * 2);
      c.fillStyle = o.color;
      c.fill();
    });

    c.restore();
  }
});


/* ==========================================================================
 * 11. 光学（干涉 / 衍射）
 * ========================================================================== */

const HUE7 = [
  '#e53935',  // 红
  '#fb8c00',  // 橙
  '#fdd835',  // 黄
  '#43a047',  // 绿
  '#00acc1',  // 青
  '#1e88e5',  // 蓝
  '#8e24aa'   // 紫
];

function hex2rgb(hex) {
  const h = hex.replace('#', '');
  const s = h.length === 3 ? h.split('').map(x => x + x).join('') : h;
  const n = parseInt(s, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function fillField(c, b, fn) {
  const w = Math.max(1, Math.ceil(b.w));
  const h = Math.max(1, Math.ceil(b.h));
  const tmp = document.createElement('canvas');
  tmp.width = w; tmp.height = h;
  const tctx = tmp.getContext('2d');
  const img = tctx.createImageData(w, h);
  const data = img.data;
  for (let py = 0; py < h; py++) {
    for (let px = 0; px < w; px++) {
      const i = (py * w + px) * 4;
      const rgba = fn(px / w, py / h, w, h);
      data[i]     = rgba[0];
      data[i + 1] = rgba[1];
      data[i + 2] = rgba[2];
      data[i + 3] = rgba[3];
    }
  }
  tctx.putImageData(img, 0, 0);
  c.drawImage(tmp, Math.floor(b.x1), Math.floor(b.y1));
}

function strokeFrame(c, b) {
  c.save();
  c.strokeStyle = 'rgba(120,120,120,0.55)';
  c.lineWidth = 1;
  c.strokeRect(b.x1, b.y1, b.w, b.h);
  c.restore();
}

/* ---- 双缝干涉条纹 ---- */
shape({
  key: 'doubleSlit', cat: 'optics', geom: 'box', label: '双缝干涉',
  icon: '<path d="M3 4v16M8 4v16M16 4v16M21 4v16"/>' +
        '<path d="M3 8h5M8 8h8M16 8h5" stroke-opacity="0.35"/>' +
        '<path d="M3 12h5M8 12h8M16 12h5" stroke-opacity="0.7"/>' +
        '<path d="M3 16h5M8 16h8M16 16h5" stroke-opacity="0.35"/>',
  params: ['hue7', 'density'],
  draw(c, o, U) {
    const b = U.bbox(o);
    const [r, g, bl] = hex2rgb(HUE7[Math.round(o.hue7 ?? 0) % 7]);
    const N = Math.max(2, Math.round(o.density ?? 12));
    fillField(c, b, (ux) => {
      const t = ux - 0.5;
      const u = t * N * 2;
      const I = Math.cos(Math.PI * u) ** 2;
      return [r, g, bl, Math.round(I * 255)];
    });
    strokeFrame(c, b);
  }
});

/* ---- 单缝衍射条纹 ---- */
param('slitWidth', { label: '缝宽 a/λ', min: 0.5, max: 10, step: 0.1, def: 3 });
param('slitLight', { label: '光源',    min: 0,   max: 7,  step: 1,   def: 0, unit: '0白1红2橙3黄4绿5青6蓝7紫' });

shape({
  key: 'singleSlit', cat: 'optics', geom: 'box', label: '单缝衍射',
  icon: '<path d="M3 4v16M21 4v16"/><path d="M10 4v16M14 4v16"/>' +
        '<path d="M3 12h7M14 12h7" stroke-opacity="0.9"/>',
  params: ['slitWidth', 'slitLight'],
  draw(c, o, U) {
    const b = U.bbox(o);
    const aRatio = Math.max(0.5, Math.min(10, o.slitWidth ?? 3));
    const light  = Math.round(o.slitLight ?? 0);

    const WL_R = 1.30, WL_G = 1.00, WL_B = 0.80;
    const monoWL = [1.30, 1.15, 1.05, 1.00, 0.95, 0.88, 0.80];

    function sinc2(x) {
      if (Math.abs(x) < 1e-6) return 1;
      const s = Math.sin(x) / x;
      return s * s;
    }

    function intensity(u, wlr) {
      const beta = Math.PI * (aRatio / wlr) * u;
      return sinc2(beta);
    }

    if (light === 0) {
      fillField(c, b, (ux) => {
        const u = 2 * ux - 1;
        const IR = intensity(u, WL_R);
        const IG = intensity(u, WL_G);
        const IB = intensity(u, WL_B);
        return [
          Math.round(255 * IR),
          Math.round(255 * IG),
          Math.round(255 * IB),
          255
        ];
      });
    } else {
      const [r, g, bl] = hex2rgb(HUE7[(light - 1) % 7]);
      const wl = monoWL[light - 1];
      fillField(c, b, (ux) => {
        const u = 2 * ux - 1;
        const I = intensity(u, wl);
        return [
          Math.round(r * I),
          Math.round(g * I),
          Math.round(bl * I),
          255
        ];
      });
    }

    strokeFrame(c, b);
  }
});

/* ---- 牛顿环 ---- */
shape({
  key: 'newtonRing', cat: 'optics', geom: 'box', label: '牛顿环',
  icon: '<circle cx="12" cy="12" r="2"/>' +
        '<circle cx="12" cy="12" r="5"/>' +
        '<circle cx="12" cy="12" r="8"/>',
  params: ['hue7', 'density'],
  draw(c, o, U) {
    const b = U.bbox(o);
    const [r, g, bl] = hex2rgb(HUE7[Math.round(o.hue7 ?? 0) % 7]);
    const N = Math.max(2, Math.round(o.density ?? 10));
    fillField(c, b, (ux, uy, w, h) => {
      const px = ux * w - w / 2;
      const py = uy * h - h / 2;
      const rmax = Math.min(w, h) / 2;
      const r2 = (px * px + py * py) / (rmax * rmax);
      if (r2 > 1) return [255, 255, 255, 0];
      const I = Math.sin(Math.PI * N * r2) ** 2;
      return [r, g, bl, Math.round(I * 255)];
    });
    strokeFrame(c, b);
  }
});

/* ---- 泊松亮斑 ---- */
param('shadowR', { label: '阴影半径', min: 0.2, max: 0.75, step: 0.05, def: 0.5 });

shape({
  key: 'poissonSpot', cat: 'optics', geom: 'box', label: '泊松亮斑',
  icon: '<circle cx="12" cy="12" r="8" stroke-opacity="0.4"/>' +
        '<circle cx="12" cy="12" r="5" stroke-opacity="0.7"/>' +
        '<circle cx="12" cy="12" r="1.2" fill="currentColor"/>',
  params: ['hue7', 'density', 'shadowR'],
  draw(c, o, U) {
    const b = U.bbox(o);
    const [r, g, bl] = hex2rgb(HUE7[Math.round(o.hue7 ?? 0) % 7]);
    const N = Math.max(3, Math.round(o.density ?? 8));
    const shadowR = Math.max(0.2, Math.min(0.75, o.shadowR ?? 0.5));

    fillField(c, b, (ux, uy, w, h) => {
      const px = ux * w - w / 2;
      const py = uy * h - h / 2;
      const rmax = Math.min(w, h) / 2;
      const viewR = Math.sqrt(px * px + py * py) / rmax;

      if (viewR > 1) return [255, 255, 255, 0];

      const rr = viewR / shadowR;

      const x = Math.PI * N * rr;
      const osc = Math.cos(x) ** 2;

      const spot = Math.exp(-((rr / 0.06) ** 2));

      const edgeEnv = Math.exp(-Math.pow((rr - 1) * 2.5, 2));

      let I;
      if (rr < 1) {
        const darkBg = 0.02;
        const edgeRings = edgeEnv * osc * 0.55;
        const innerRings = Math.exp(-rr * 4) * osc * 0.08;
        I = darkBg + spot + edgeRings + innerRings;
      } else {
        const base = 0.9;
        const approach = 1 - Math.exp(-(rr - 1) * 2.5);
        const boundaryRing = edgeEnv * (1 - osc) * 0.55 * (1 - approach);
        I = base - boundaryRing;
      }

      const fade = viewR > 0.92 ? Math.max(0, (1 - viewR) / 0.08) : 1;

      I = Math.max(0, Math.min(1, I));
      return [r, g, bl, Math.round(I * fade * 255)];
    });
    strokeFrame(c, b);
  }
});

/* ---- 检测玻璃平整度 ---- */
param('distortX',   { label: '缺陷 X',   min: 0,   max: 1,  step: 0.02, def: 0.6 });
param('distortY',   { label: '缺陷 Y',   min: 0,   max: 1,  step: 0.02, def: 0.5 });
param('distortDir', { label: '凸起方向', min: 0,   max: 1,  step: 1,    def: 1,  unit: '0左1右' });

shape({
  key: 'glassFlatness', cat: 'optics', geom: 'box', label: '玻璃平整度',
  icon: '<path d="M3 4v16M21 4v16"/>' +
        '<path d="M6 6v12M9 6v12M12 6v10.5M15 6v13.5M18 6v12" ' +
        'stroke-opacity="0.85"/>',
  params: ['hue7', 'density', 'distort', 'distortX', 'distortY', 'distortDir'],
  draw(c, o, U) {
    const b = U.bbox(o);
    const [r, g, bl] = hex2rgb(HUE7[Math.round(o.hue7 ?? 0) % 7]);
    const N = Math.max(3, Math.round(o.density ?? 12));
    const D = (o.distort ?? 30) / 100;
    const px = o.distortX ?? 0.6;
    const py = o.distortY ?? 0.5;
    const dirSign = (o.distortDir ?? 1) >= 0.5 ? 1 : -1;

    const aspect = b.w / b.h;
    const bumpAmp = D * 2.5;
    const sigma = 0.18;

    fillField(c, b, (ux, uy) => {
      let phase = ux * N;

      if (D > 0.001) {
        const dx = (ux - px) * aspect;
        const dy = (uy - py);
        const dist = Math.sqrt(dx * dx + dy * dy);
        const bump = Math.exp(-((dist / sigma) ** 2));
        phase += dirSign * bump * bumpAmp;
      }

      const I = Math.cos(Math.PI * phase) ** 2;
      return [r, g, bl, Math.round(I * 255)];
    });

    strokeFrame(c, b);
  }
});


/* ==========================================================================
 * 12. 电磁（基础元件与场）
 * ========================================================================== */

/* ==========================================================================
 * 13. 电场线专题（电场部分）
 * ========================================================================== */

const EFH = {
  fieldAt(x, y, charges) {
    let ex = 0, ey = 0;
    for (const ch of charges) {
      const dx = x - ch.x, dy = y - ch.y;
      const r2 = dx * dx + dy * dy;
      if (r2 < 1e-4) continue;
      const r3 = r2 * Math.sqrt(r2);
      ex += ch.q * dx / r3;
      ey += ch.q * dy / r3;
    }
    return { ex, ey };
  },
  trace(x, y, charges, box, dir) {
    const pts = [{ x, y }];
    const md   = Math.min(box.w, box.h);
    const step = md / 300;
    const pad  = md * 0.03;
    let endCharge = null;
    for (let i = 0; i < 5000; i++) {
      const { ex, ey } = this.fieldAt(x, y, charges);
      const m = Math.hypot(ex, ey);
      if (m < 1e-12) break;
      x += dir * step * ex / m;
      y += dir * step * ey / m;
      pts.push({ x, y });
      let near = false;
      for (const ch of charges) {
        if (Math.hypot(x - ch.x, y - ch.y) < step * 2) {
          near = true;
          endCharge = ch;
          break;
        }
      }
      if (near) break;
      if (x < box.x1 - pad || x > box.x2 + pad ||
          y < box.y1 - pad || y > box.y2 + pad) break;
    }
    return { pts, endCharge };
  }
};

function drawChargeDot(c, x, y, q, r, strokeColor) {
  c.save();
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  c.fillStyle = q > 0 ? 'rgba(229,57,53,0.92)' : 'rgba(30,136,229,0.92)';
  c.fill();
  c.lineWidth = 1.5;
  c.strokeStyle = strokeColor || '#1a1a1a';
  c.stroke();
  c.fillStyle = '#fff';
  c.font = 'bold ' + (r * 1.4) + 'px sans-serif';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText(q > 0 ? '+' : '\u2212', x, y + r * 0.05);
  c.restore();
}

function drawFieldLineSet(c, box, charges, opts, strokeColor, size) {
  const o = Object.assign({ seedsPerCharge: 14 }, opts || {});
  const md = Math.min(box.w, box.h);
  const r0 = md * 0.055;
  const paths = [];
  const hasPos = charges.some(ch => ch.q > 0);
  const hasNeg = charges.some(ch => ch.q < 0);

  const seedMul = q => Math.max(0.5, Math.min(2.5, Math.abs(q)));

  for (const ch of charges) {
    if (hasPos && ch.q <= 0) continue;
    if (!hasPos && ch.q >= 0) continue;
    const dir = ch.q > 0 ? +1 : -1;
    const seedCount = Math.max(4, Math.round(o.seedsPerCharge * seedMul(ch.q)));
    for (let i = 0; i < seedCount; i++) {
      const ang = (i / seedCount) * Math.PI * 2;
      const sx = ch.x + r0 * Math.cos(ang);
      const sy = ch.y + r0 * Math.sin(ang);
      const res = EFH.trace(sx, sy, charges, box, dir);
      if (res.pts.length > 3) paths.push({ pts: res.pts, dir });
    }
  }

  if (hasPos && hasNeg) {
    for (const ch of charges) {
      if (ch.q >= 0) continue;
      const seedCount = Math.max(4, Math.round(o.seedsPerCharge * seedMul(ch.q)));
      for (let i = 0; i < seedCount; i++) {
        const ang = (i / seedCount) * Math.PI * 2;
        const sx = ch.x + r0 * Math.cos(ang);
        const sy = ch.y + r0 * Math.sin(ang);
        const res = EFH.trace(sx, sy, charges, box, -1);
        if (res.pts.length > 3 && !(res.endCharge && res.endCharge.q > 0)) {
          paths.push({ pts: res.pts.slice().reverse(), dir: +1 });
        }
      }
    }
  }

  c.save();
  c.lineWidth   = Math.max(1, (size || 4) * 0.4);
  c.strokeStyle = strokeColor;
  c.lineCap     = 'round';

  for (const { pts } of paths) {
    c.beginPath();
    c.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) c.lineTo(pts[i].x, pts[i].y);
    c.stroke();
  }

  const arrowLen = md * 0.022;
  const arrowWid = arrowLen * 0.5;
  c.fillStyle = strokeColor;
  for (const { pts, dir } of paths) {
    const mid = Math.max(2, Math.floor(pts.length * 0.5));
    const a = pts[mid - 1], b = pts[mid];
    let ax = b.x - a.x, ay = b.y - a.y;
    if (dir < 0) { ax = -ax; ay = -ay; }
    const m = Math.hypot(ax, ay);
    if (m < 1e-6) continue;
    ax /= m; ay /= m;
    const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
    c.beginPath();
    c.moveTo(mx + ax * arrowLen, my + ay * arrowLen);
    c.lineTo(mx - ax * arrowLen * 0.3 - ay * arrowWid,
             my - ay * arrowLen * 0.3 + ax * arrowWid);
    c.lineTo(mx - ax * arrowLen * 0.3 + ay * arrowWid,
             my - ay * arrowLen * 0.3 - ax * arrowWid);
    c.closePath();
    c.fill();
  }
  c.restore();
}

function chargeDotRadius(md, q, charges) {
  const maxAbsQ = Math.max(...charges.map(ch => Math.abs(ch.q)));
  return md * 0.055 * Math.sqrt(Math.abs(q) / maxAbsQ);
}

/* ---- 点电荷（按拖动方向区分正负） ---- */
shape({
  key: 'charge', cat: 'em', geom: 'box', label: '点电荷',
  icon: '<circle cx="12" cy="12" r="8"/><path d="M12 8v8M8 12h8"/>',
  params: ['chargeSign'],
  draw(c, o, U) {
    const b = U.bbox(o);
    const cx = b.x1 + b.w / 2, cy = b.y1 + b.h / 2;
    const r = Math.min(b.w, b.h) / 2;

    /* 根据原始起止点的水平位移判断电性：
     *   向右拖 (x2 > x1) → 正电荷（红色 +）
     *   向左拖 (x2 < x1) → 负电荷（蓝色 −）
     *   水平位移过小（近乎竖直拖动）→ 回退到 chargeSign 参数
     * 说明：x1/x2 是主脚本拖动时持续更新的原始坐标，
     *       平移、缩放不会改变二者之差的符号，所以电性稳定。 */
    const dx = (o.x2 ?? 0) - (o.x1 ?? 0);
    let neg;
    if (Math.abs(dx) > 1) {
      neg = dx < 0;
    } else {
      neg = (o.chargeSign ?? 0) >= 0.5;
    }

    c.beginPath();
    c.arc(cx, cy, Math.max(r, 1), 0, Math.PI * 2);
    c.fillStyle = neg ? 'rgba(30,136,229,0.18)' : 'rgba(229,57,53,0.18)';
    c.fill();
    c.stroke();

    c.beginPath();
    if (!neg) {
      /* 正电荷：+ 号 */
      c.moveTo(cx - r * 0.5, cy); c.lineTo(cx + r * 0.5, cy);
      c.moveTo(cx, cy - r * 0.5); c.lineTo(cx, cy + r * 0.5);
    } else {
      /* 负电荷：− 号 */
      c.moveTo(cx - r * 0.5, cy); c.lineTo(cx + r * 0.5, cy);
    }
    c.stroke();
  }
});

shape({
  key: 'efPos', cat: 'em', geom: 'box', label: '正点电荷',
  icon: '<circle cx="12" cy="12" r="2" fill="#e53935"/>' +
        '<path d="M12 12L12 3M12 12L12 21M12 12L3 12M12 12L21 12" stroke-opacity="0.7"/>' +
        '<path d="M12 12L5 5M12 12L19 5M12 12L5 19M12 12L19 19" stroke-opacity="0.5"/>',
  draw(c, o, U) {
    const b = U.bbox(o);
    const cx = b.x1 + b.w / 2, cy = b.y1 + b.h / 2;
    const chR = Math.min(b.w, b.h) * 0.035;
    drawFieldLineSet(c, b, [{ x: cx, y: cy, q: 1 }], { seedsPerCharge: 14 }, o.color, o.size);
    drawChargeDot(c, cx, cy, 1, chR, o.color);
  }
});

shape({
  key: 'efNeg', cat: 'em', geom: 'box', label: '负点电荷',
  icon: '<circle cx="12" cy="12" r="2" stroke="#1e88e5" fill="#1e88e5"/>' +
        '<path d="M12 3L12 7M12 17L12 21M3 12L7 12M17 12L21 12" stroke-opacity="0.7"/>',
  draw(c, o, U) {
    const b = U.bbox(o);
    const cx = b.x1 + b.w / 2, cy = b.y1 + b.h / 2;
    const chR = Math.min(b.w, b.h) * 0.035;
    drawFieldLineSet(c, b, [{ x: cx, y: cy, q: -1 }], { seedsPerCharge: 14 }, o.color, o.size);
    drawChargeDot(c, cx, cy, -1, chR, o.color);
  }
});

shape({
  key: 'efDipole', cat: 'em', geom: 'box', label: '等量异种电荷',
  icon: '<circle cx="5" cy="12" r="2" fill="#e53935"/>' +
        '<circle cx="19" cy="12" r="2" fill="#1e88e5"/>' +
        '<path d="M7 12L17 12" stroke-opacity="0.7"/>',
  draw(c, o, U) {
    const b = U.bbox(o);
    const md = Math.min(b.w, b.h);
    const cy = b.y1 + b.h / 2;
    const dx = b.w * 0.18;
    const charges = [
      { x: b.x1 + b.w / 2 - dx, y: cy, q:  1 },
      { x: b.x1 + b.w / 2 + dx, y: cy, q: -1 }
    ];
    drawFieldLineSet(c, b, charges, { seedsPerCharge: 16 }, o.color, o.size);
    for (const ch of charges) drawChargeDot(c, ch.x, ch.y, ch.q, md * 0.038, o.color);
  }
});

shape({
  key: 'efSameSign', cat: 'em', geom: 'box', label: '等量同种电荷',
  icon: '<circle cx="5" cy="12" r="2" fill="#e53935"/>' +
        '<circle cx="19" cy="12" r="2" fill="#e53935"/>' +
        '<path d="M7 10Q12 6 17 10M7 14Q12 18 17 14" stroke-opacity="0.6"/>',
  draw(c, o, U) {
    const b = U.bbox(o);
    const md = Math.min(b.w, b.h);
    const cy = b.y1 + b.h / 2;
    const dx = b.w * 0.18;
    const charges = [
      { x: b.x1 + b.w / 2 - dx, y: cy, q: 1 },
      { x: b.x1 + b.w / 2 + dx, y: cy, q: 1 }
    ];
    drawFieldLineSet(c, b, charges, { seedsPerCharge: 12 }, o.color, o.size);
    for (const ch of charges) drawChargeDot(c, ch.x, ch.y, ch.q, md * 0.038, o.color);
  }
});

param('chargeRatio', { label: '电荷比', min: 1, max: 3, step: 0.1, def: 2 });

shape({
  key: 'efHeteroUneven', cat: 'em', geom: 'box', label: '非等量异种电荷',
  icon: '<circle cx="5" cy="12" r="3" fill="#e53935"/>' +
        '<circle cx="19" cy="12" r="1.7" fill="#1e88e5"/>' +
        '<path d="M8 12L17 12" stroke-opacity="0.7"/>',
  params: ['chargeRatio'],
  draw(c, o, U) {
    const b = U.bbox(o);
    const md = Math.min(b.w, b.h);
    const cy = b.y1 + b.h / 2;
    const dx = b.w * 0.18;
    const ratio = Math.max(1, Math.min(3, o.chargeRatio ?? 2));
    const charges = [
      { x: b.x1 + b.w / 2 - dx, y: cy, q:  ratio },
      { x: b.x1 + b.w / 2 + dx, y: cy, q: -1 }
    ];
    drawFieldLineSet(c, b, charges, { seedsPerCharge: 14 }, o.color, o.size);
    for (const ch of charges) {
      drawChargeDot(c, ch.x, ch.y, ch.q, chargeDotRadius(md, ch.q, charges), o.color);
    }
  }
});

shape({
  key: 'efHomoUneven', cat: 'em', geom: 'box', label: '非等量同种电荷',
  icon: '<circle cx="5" cy="12" r="3" fill="#e53935"/>' +
        '<circle cx="19" cy="12" r="1.7" fill="#e53935"/>',
  params: ['chargeRatio'],
  draw(c, o, U) {
    const b = U.bbox(o);
    const md = Math.min(b.w, b.h);
    const cy = b.y1 + b.h / 2;
    const dx = b.w * 0.18;
    const ratio = Math.max(1, Math.min(3, o.chargeRatio ?? 2));
    const charges = [
      { x: b.x1 + b.w / 2 - dx, y: cy, q: ratio },
      { x: b.x1 + b.w / 2 + dx, y: cy, q: 1 }
    ];
    drawFieldLineSet(c, b, charges, { seedsPerCharge: 12 }, o.color, o.size);
    for (const ch of charges) {
      drawChargeDot(c, ch.x, ch.y, ch.q, chargeDotRadius(md, ch.q, charges), o.color);
    }
  }
});

param('uniRows', { label: '条数', min: 2, max: 20, step: 1, def: 7 });
param('uniDir',  { label: '方向', min: 0,  max: 1,  step: 1, def: 0 });

shape({
  key: 'efUniform', cat: 'em', geom: 'box', label: '匀强电场',
  icon: '<path d="M3 6h18M3 12h18M3 18h18"/>' +
        '<path d="M19 4l3 2-3 2M19 10l3 2-3 2M19 16l3 2-3 2"/>',
  params: ['uniRows', 'uniDir'],
  draw(c, o, U) {
    const b = U.bbox(o);
    const rows = Math.max(2, Math.round(o.uniRows ?? 7));
    const dir  = (o.uniDir ?? 0) < 0.5 ? 'h' : 'v';
    const ah   = Math.min(b.w, b.h) * 0.025;

    c.save();
    c.lineWidth   = Math.max(1, (o.size || 4) * 0.4);
    c.strokeStyle = o.color;
    c.fillStyle   = o.color;

    if (dir === 'h') {
      const gap = b.h / rows;
      for (let i = 0; i < rows; i++) {
        const y = b.y1 + gap * (i + 0.5);
        c.beginPath(); c.moveTo(b.x1, y); c.lineTo(b.x2, y); c.stroke();
        const ax = b.x1 + b.w * 0.75;
        c.beginPath();
        c.moveTo(ax + ah, y);
        c.lineTo(ax - ah * 0.3, y - ah * 0.6);
        c.lineTo(ax - ah * 0.3, y + ah * 0.6);
        c.closePath(); c.fill();
      }
    } else {
      const gap = b.w / rows;
      for (let i = 0; i < rows; i++) {
        const x = b.x1 + gap * (i + 0.5);
        c.beginPath(); c.moveTo(x, b.y1); c.lineTo(x, b.y2); c.stroke();
        const ay = b.y1 + b.h * 0.75;
        c.beginPath();
        c.moveTo(x, ay + ah);
        c.lineTo(x - ah * 0.6, ay - ah * 0.3);
        c.lineTo(x + ah * 0.6, ay - ah * 0.3);
        c.closePath(); c.fill();
      }
    }
    c.restore();
  }
});





/* ==========================================================================
 * 磁铁与磁感线（科学绘制：单极子模型 + 双向数值追踪）
 * ========================================================================== */

param('showMagField', { label: '磁感线', min: 0, max: 1, step: 1, def: 1 });

/* ---- 实心三角箭头 ---- */
function _magArrow(c, x, y, dx, dy, size) {
  const m = Math.hypot(dx, dy) || 1;
  const ux = dx / m, uy = dy / m;
  const px = -uy, py = ux;
  c.beginPath();
  c.moveTo(x + ux * size, y + uy * size);
  c.lineTo(x - ux * size * 0.35 + px * size * 0.55,
           y - uy * size * 0.35 + py * size * 0.55);
  c.lineTo(x - ux * size * 0.35 - px * size * 0.55,
           y - uy * size * 0.35 - py * size * 0.55);
  c.closePath();
  c.fill();
}

/* ---- 从 (sx,sy) 沿场方向追踪一条曲线 ---- */
function _magTrace(fromX, fromY, toX, toY, sx, sy, step, maxSteps, bounds) {
  const pts = [{ x: sx, y: sy }];
  let x = sx, y = sy;
  for (let i = 0; i < maxSteps; i++) {
    const d1x = x - fromX, d1y = y - fromY;
    const r1s = d1x * d1x + d1y * d1y;
    const r1  = Math.sqrt(r1s) || 1e-3;
    const d2x = x - toX, d2y = y - toY;
    const r2s = d2x * d2x + d2y * d2y;
    const r2  = Math.sqrt(r2s) || 1e-3;

    /* 电场：from 极排斥，to 极吸引 */
    let ex = d1x / (r1s * r1) - d2x / (r2s * r2);
    let ey = d1y / (r1s * r1) - d2y / (r2s * r2);
    const m = Math.hypot(ex, ey);
    if (m < 1e-12) break;
    ex /= m; ey /= m;

    x += ex * step;
    y += ey * step;
    pts.push({ x, y });

    if (Math.hypot(x - toX, y - toY) < step * 2) break;
    if (bounds && (x < bounds.x1 || x > bounds.x2 ||
                   y < bounds.y1 || y > bounds.y2)) break;
  }
  return pts;
}

/* ---- 画一条曲线，并在中点加箭头 ---- */
function _magDrawCurve(c, pts, arrowSize) {
  if (pts.length < 4) return;
  c.beginPath();
  c.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) c.lineTo(pts[i].x, pts[i].y);
  c.stroke();

  const mid = Math.floor(pts.length / 2);
  const p0  = pts[Math.max(0, mid - 2)];
  const p1  = pts[Math.min(pts.length - 1, mid + 2)];
  const dx  = p1.x - p0.x, dy = p1.y - p0.y;
  if (Math.hypot(dx, dy) < 0.5) return;
  _magArrow(c, pts[mid].x, pts[mid].y, dx, dy, arrowSize);
}

/* ---- 通用：双向播种 → 追踪 → 去重 → 绘制 ---- */
function _magDrawField(c, b, o, Nx, Ny, Sx, Sy, seedDeg, startR, bounds) {
  const col = o.color || '#e6edf7';
  const lw  = Math.max(0.7, (o.size || 4) * 0.30);
  const arrowSize = Math.max(3, (o.size || 4) * 0.9);
  const step = Math.min(b.w, b.h) / 140;
  const dupTol = startR * 3;
  const curves = [];

  /* ① 从 N 极正向播种（沿 E 方向追踪到 S 极） */
  for (const deg of seedDeg) {
    const ang = deg * Math.PI / 180;
    const sx = Nx + startR * Math.cos(ang);
    const sy = Ny + startR * Math.sin(ang);
    const pts = _magTrace(Nx, Ny, Sx, Sy, sx, sy, step, 6000, bounds);
    if (pts.length > 5) curves.push(pts);
  }

  /* ② 从 S 极反向播种（沿 -E 方向追踪到 N 极，再反转） */
  for (const deg of seedDeg) {
    const ang = deg * Math.PI / 180;
    const sx = Sx + startR * Math.cos(ang);
    const sy = Sy + startR * Math.sin(ang);
    let pts = _magTrace(Sx, Sy, Nx, Ny, sx, sy, step, 6000, bounds);
    if (pts.length < 5) continue;
    pts = pts.slice().reverse();

    /* ③ 端点去重：起、终点都接近已有曲线 → 视为同一条 */
    let dup = false;
    const s0 = pts[0], e0 = pts[pts.length - 1];
    for (const u of curves) {
      const s1 = u[0], e1 = u[u.length - 1];
      if (Math.hypot(s0.x - s1.x, s0.y - s1.y) < dupTol &&
          Math.hypot(e0.x - e1.x, e0.y - e1.y) < dupTol) {
        dup = true; break;
      }
    }
    if (!dup) curves.push(pts);
  }

  /* ④ 绘制 */
  c.save();
  c.globalAlpha = 0.55;
  c.strokeStyle = col;
  c.fillStyle   = col;
  c.lineWidth   = lw;
  c.lineCap     = 'round';
  c.lineJoin    = 'round';

  for (const pts of curves) _magDrawCurve(c, pts, arrowSize);
  c.restore();
}

/* ---- 条形磁铁磁感线 ---- */
function _magBarField(c, b, o) {
  const cy = (b.y1 + b.y2) / 2;
  const Nx = b.x1 + b.w * 0.22;
  const Sx = b.x1 + b.w * 0.78;

  /* 种子角度：-170° 到 170°，每 10° 一个（跳过正右方 180°） */
  const seedDeg = [];
  for (let a = -170; a <= 170; a += 10) seedDeg.push(a);

  _magDrawField(c, b, o, Nx, cy, Sx, cy, seedDeg,
    Math.min(b.w, b.h) * 0.06,
    {
      x1: b.x1 - b.w * 2.5,
      y1: b.y1 - b.h * 5,
      x2: b.x2 + b.w * 2.5,
      y2: b.y2 + b.h * 5
    });
}

/* ---- 蹄形磁铁磁感线 ---- */
function _magHorseshoeField(c, b, o, swap) {
  const armW  = Math.min(b.w * 0.3, b.h * 0.4);
  const leftX  = b.x1 + armW / 2;
  const rightX = b.x2 - armW / 2;

  /* 默认 N 在左臂、S 在右臂；换极后互换 */
  const Nx = swap ? rightX : leftX;
  const Sx = swap ? leftX  : rightX;
  const poleY = b.y1;

  /* 种子角度：-175° 到 5°，每 15° 一个
   * 覆盖：朝上（-90°）→ 外部大弧线
   *       朝左（±180°）→ 臂外侧
   *       朝右（0°）→ 穿过间隙的短弧线
   * 不撒朝下的角度（会进入磁铁臂内部，无效） */
  const seedDeg = [];
  for (let a = -175; a <= 5; a += 15) seedDeg.push(a);

  _magDrawField(c, b, o, Nx, poleY, Sx, poleY, seedDeg,
    armW * 0.55,
    {
      x1: b.x1 - b.w * 2,
      y1: b.y1 - b.h * 3.5,
      x2: b.x2 + b.w * 2,
      y2: b.y2 + b.h * 0.3
    });
}

/* ---- 条形磁铁 ---- */
shape({
  key: 'magnet', cat: 'em', geom: 'box', label: '条形磁铁',
  icon: '<rect x="4" y="8" width="16" height="8" rx="1"/><path d="M12 8v8"/>',
  params: ['showMagField'],
  draw(c, o, U) {
    const b = U.bbox(o);

    if ((o.showMagField ?? 1) >= 0.5) _magBarField(c, b, o);

    const halfW = b.w / 2;
    c.save();
    c.fillStyle = '#e53935';
    c.fillRect(b.x1, b.y1, halfW, b.h);
    c.fillStyle = '#1e88e5';
    c.fillRect(b.x1 + halfW, b.y1, halfW, b.h);

    c.strokeStyle = o.color;
    c.lineWidth = Math.max(1, (o.size || 4) * 0.4);
    c.strokeRect(b.x1, b.y1, b.w, b.h);
    c.beginPath();
    c.moveTo(b.x1 + halfW, b.y1);
    c.lineTo(b.x1 + halfW, b.y2);
    c.stroke();

    c.fillStyle = '#fff';
    c.font = 'bold ' + Math.max(9, Math.min(b.h * 0.5, b.w * 0.25)) + 'px sans-serif';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('N', b.x1 + halfW * 0.5, b.y1 + b.h / 2);
    c.fillText('S', b.x1 + halfW * 1.5, b.y1 + b.h / 2);
    c.restore();
  }
});

/* ---- 蹄形磁铁 ---- */
param('swapPole', { label: '换极', min: 0, max: 1, step: 1, def: 0 });

shape({
  key: 'horseshoe', cat: 'em', geom: 'box', label: '蹄形磁铁',
  icon: '<path d="M4 3v14h16V3h-4v10H8V3z"/>',
  params: ['swapPole', 'showMagField'],
  draw(c, o, U) {
    const b = U.bbox(o);
    const armW  = Math.min(b.w * 0.3,  b.h * 0.4);
    const baseH = Math.min(b.h * 0.35, b.w * 0.4);
    const cx    = (b.x1 + b.x2) / 2;

    const swap = (o.swapPole ?? 0) >= 0.5;

    if ((o.showMagField ?? 1) >= 0.5) _magHorseshoeField(c, b, o, swap);

    const leftColor  = swap ? '#1e88e5' : '#e53935';
    const rightColor = swap ? '#e53935' : '#1e88e5';

    c.fillStyle = leftColor;
    c.fillRect(b.x1, b.y1, armW, b.h - baseH);
    c.fillRect(b.x1, b.y2 - baseH, cx - b.x1, baseH);

    c.fillStyle = rightColor;
    c.fillRect(b.x2 - armW, b.y1, armW, b.h - baseH);
    c.fillRect(cx, b.y2 - baseH, b.x2 - cx, baseH);

    c.save();
    c.lineWidth   = Math.max(1, (o.size || 4) * 0.5);
    c.strokeStyle = o.color || '#1a1a1a';
    c.beginPath();
    c.moveTo(b.x1, b.y1);
    c.lineTo(b.x1 + armW, b.y1);
    c.lineTo(b.x1 + armW, b.y2 - baseH);
    c.lineTo(b.x2 - armW, b.y2 - baseH);
    c.lineTo(b.x2 - armW, b.y1);
    c.lineTo(b.x2, b.y1);
    c.lineTo(b.x2, b.y2);
    c.lineTo(b.x1, b.y2);
    c.closePath();
    c.stroke();
    c.restore();

    c.save();
    c.fillStyle = '#fff';
    const fs = Math.max(9, Math.min(b.h * 0.16, armW * 0.65));
    c.font = 'bold ' + fs + 'px sans-serif';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText(swap ? 'S' : 'N', b.x1 + armW / 2, b.y1 + fs * 0.9);
    c.fillText(swap ? 'N' : 'S', b.x2 - armW / 2, b.y1 + fs * 0.9);
    c.restore();
  }
});

/* ---- 磁场方向 ---- */
param('fieldInto', { label: '方向', min: 0, max: 1,  step: 1, def: 0 });
param('fieldRows', { label: '行数', min: 2, max: 20, step: 1, def: 6 });
param('fieldCols', { label: '列数', min: 2, max: 20, step: 1, def: 8 });

shape({
  key: 'magField', cat: 'em', geom: 'box', label: '磁场方向',
  icon: '<path d="M5 5l3 3M8 5l-3 3"/>' +
        '<path d="M16 5l3 3M19 5l-3 3"/>' +
        '<path d="M5 14l3 3M8 14l-3 3"/>' +
        '<circle cx="17.5" cy="15.5" r="1.2" fill="currentColor"/>',
  params: ['fieldInto', 'fieldRows', 'fieldCols'],
  draw(c, o, U) {
    const b = U.bbox(o);
    const into = (o.fieldInto ?? 0) < 0.5;
    const rows = Math.max(2, Math.round(o.fieldRows ?? 6));
    const cols = Math.max(2, Math.round(o.fieldCols ?? 8));

    const cellW = b.w / cols;
    const cellH = b.h / rows;
    const unit  = Math.min(cellW, cellH);
    const arm   = unit * 0.26;
    const dotR  = unit * 0.13;

    c.save();
    c.lineCap = 'round';
    c.lineWidth = Math.max(1.2, (o.size || 4) * 0.5);
    c.strokeStyle = o.color;
    c.fillStyle   = o.color;

    for (let r = 0; r < rows; r++) {
      for (let col = 0; col < cols; col++) {
        const cx = b.x1 + cellW * (col + 0.5);
        const cy = b.y1 + cellH * (r + 0.5);

        if (into) {
          c.beginPath();
          c.moveTo(cx - arm, cy - arm);
          c.lineTo(cx + arm, cy + arm);
          c.moveTo(cx + arm, cy - arm);
          c.lineTo(cx - arm, cy + arm);
          c.stroke();
        } else {
          c.beginPath();
          c.arc(cx, cy, dotR, 0, Math.PI * 2);
          c.fill();
        }
      }
    }
    c.restore();
  }
});



/* ==========================================================================
 * 15. 文字
 * ========================================================================== */
shape({
  key: 'text', cat: 'text', geom: 'text', label: '文字',
  icon: '<path d="M5 6.5v-2h14v2"/><path d="M12 4.5v15"/><path d="M9 19.5h6"/>',

  fonts: {
    system:   'system-ui,-apple-system,"PingFang SC","Microsoft YaHei",sans-serif',
    hei:      '"Microsoft YaHei","PingFang SC","Heiti SC","SimHei",sans-serif',
    song:     '"SimSun","Songti SC","STSong",serif',
    kai:      '"KaiTi","STKaiti","Kaiti SC",serif',
    fangsong: '"FangSong","STFangsong",serif',
    mono:     'ui-monospace,Menlo,Consolas,"Courier New",monospace',
    serif:    'Georgia,"Times New Roman",Times,serif',
    hand:     '"Comic Sans MS","Segoe Print","Bradley Hand",cursive'
  },

  params: ['fontFamily', 'fontSize', 'bold', 'italic', 'underline', 'textAlign'],

  textDefaults: {
    fontFamily: 'system',
    fontSize:   24,
    bold:       false,
    italic:     false,
    underline:  false,
    textAlign:  'left'
  },

  draw(c, o) {
    const fonts = this.fonts || {};
    const fam = fonts[o.fontFamily] || fonts.system ||
                'system-ui,-apple-system,"PingFang SC","Microsoft YaHei",sans-serif';
    const fs = Math.max(6, o.fontSize || 24);
    const raw = (o.text == null) ? '' : String(o.text);
    const lines = raw.split('\n');
    const lh = fs * 1.3;
    const align = o.textAlign || 'left';

    c.save();
    c.setLineDash([]);
    c.lineCap = 'round';
    c.lineJoin = 'round';
    c.font = (o.italic ? 'italic ' : '') +
             (o.bold ? '700 ' : '400 ') + fs + 'px ' + fam;
    c.textBaseline = 'top';
    c.textAlign = (align === 'center' || align === 'right') ? align : 'left';

    let maxW = 0;
    for (let i = 0; i < lines.length; i++) {
      const w = c.measureText(lines[i]).width;
      if (w > maxW) maxW = w;
    }
    const totalH = lines.length * lh;

    if (o.fill && o.fillColor) {
      const padX = fs * 0.2;
      const padY = fs * 0.1;
      const a = (o.fillAlpha != null ? o.fillAlpha : 0.6);
      c.save();
      c.globalAlpha = Math.max(0, Math.min(1, a));
      c.fillStyle = o.fillColor;
      const bx = o.x - padX, by = o.y - padY;
      const bw = maxW + padX * 2, bh = totalH + padY * 2;
      const rx = Math.min(8, fs * 0.15);
      if (c.roundRect) {
        c.beginPath();
        c.roundRect(bx, by, bw, bh, rx);
        c.fill();
      } else {
        c.fillRect(bx, by, bw, bh);
      }
      c.restore();
    }

    const col = o.color || '#e6edf7';
    c.fillStyle = col;
    c.strokeStyle = col;

    let ax = o.x;
    if (align === 'center') ax = o.x + maxW / 2;
    else if (align === 'right') ax = o.x + maxW;

    for (let i = 0; i < lines.length; i++) {
      const y = o.y + i * lh;
      c.fillText(lines[i], ax, y);
      if (o.underline && lines[i]) {
        const w = c.measureText(lines[i]).width;
        let sx = ax;
        if (align === 'center') sx = ax - w / 2;
        else if (align === 'right') sx = ax - w;
        const uy = y + fs * 1.14;
        c.lineWidth = Math.max(1, fs / 16);
        c.beginPath();
        c.moveTo(sx, uy);
        c.lineTo(sx + w, uy);
        c.stroke();
      }
    }
    c.restore();
  }
});

/* ==========================================================================
 * 16b. 高中物理大题常用语
 * ========================================================================== */

/* ---- 工厂：生成一个"快捷文字"图形 ---- */
function quickTextShape(key, label, defaultText, iconSvg, fontSize) {
  shape({
    key, cat: 'text', geom: 'text', label,
    icon: iconSvg,

    fonts: {
      system:   'system-ui,-apple-system,"PingFang SC","Microsoft YaHei",sans-serif',
      hei:      '"Microsoft YaHei","PingFang SC","Heiti SC","SimHei",sans-serif',
      song:     '"SimSun","Songti SC","STSong",serif',
      kai:      '"KaiTi","STKaiti","Kaiti SC",serif',
      fangsong: '"FangSong","STFangsong",serif',
      mono:     'ui-monospace,Menlo,Consolas,"Courier New",monospace',
      serif:    'Georgia,"Times New Roman",Times,serif',
      hand:     '"Comic Sans MS","Segoe Print","Bradley Hand",cursive'
    },

    params: ['fontFamily', 'fontSize', 'bold', 'italic', 'underline', 'textAlign'],

    textDefaults: {
      fontFamily: 'system',
      fontSize:   fontSize || 32,
      bold:       false,
      italic:     false,
      underline:  false,
      textAlign:  'left'
    },

    defaultText: defaultText,
    draw: PB.shapes['text'].draw
  });
}

/* ---- 文字型 SVG 图标 ---- */
function tIcon(txt, size) {
  size = size || 14;
  return '<text x="12" y="' + (12 + size * 0.36) + '" text-anchor="middle" ' +
         'font-size="' + size + '" font-weight="700" ' +
         'font-family="system-ui,PingFang SC,Microsoft YaHei,sans-serif" ' +
         'fill="currentColor" stroke="none">' + txt + '</text>';
}

/* ---- 答题模板 ---- */
quickTextShape('txtSolve',  '解：',   '解：',   tIcon('解', 13), 32);


/* ---- 常用定律 ---- */
quickTextShape('txt1',  '由几何',   '由几何知识得：',       tIcon('几', 15), 32);
quickTextShape('txt2',  '由匀变速',   '由匀变速直线运动规律得：',       tIcon('F', 15), 32);
quickTextShape('txt3',  '牛二',   '由牛顿第二定律得：',       tIcon('F2', 15), 32);
quickTextShape('txt4',  '牛三',   '由牛顿第三定律得：',       tIcon('F3', 15), 32);
quickTextShape('txtWork',     '动能定理',       '由动能定理得：',           tIcon('Ek', 11), 32);
quickTextShape('txtEnergy',   '能量守恒',       '由能量守恒定律得：',       tIcon('能', 17), 32);
quickTextShape('txtMech',     '机械能守恒',     '由机械能守恒定律得：',     tIcon('机', 17), 32);
quickTextShape('txtMomentum', '动量守恒',       '由动量守恒定律得：',       tIcon('mv', 17), 32);
quickTextShape('txtNewton2',  '动量定理',   '由动量定理得：',       tIcon('Ft', 15), 26);
quickTextShape('txtOhm',      '闭合电路欧姆',   '由闭合电路欧姆定律得：',   tIcon('闭', 16), 32);
quickTextShape('txtEMF',      '电磁感应',       '由法拉第电磁感应定律得：', tIcon('法', 17), 32);
/* ---- 结果段 ---- */
quickTextShape('txtCombine',  '联立',   '联立可得：',   tIcon('联', 12), 32);
quickTextShape('txtInsert',   '代入',   '代入数据得：',   tIcon('代', 12), 32);
quickTextShape('txtResult',   '故',     '故',             tIcon('故', 13), 32);
quickTextShape('txtSummary',  '综上',   '综上所述，',     tIcon('综', 12), 32);



/* ==========================================================================
 * 17. 简笔画
 * ========================================================================== */

shape({
  key: 'skPerson', cat: 'sketch', geom: 'box', label: '人',
  icon: '<circle cx="12" cy="5" r="2.5"/>' +
        '<path d="M12 8v7M8 11l4-3 4 3M12 15l-3 6M12 15l3 6"/>',
  draw(c, o, U) {
    const b = U.bbox(o);
    const cx = (b.x1 + b.x2) / 2;
    const w = b.w, h = b.h;
    const headR  = Math.min(w * 0.16, h * 0.12);
    const headCY = b.y1 + headR + h * 0.02;

    /* ---- 头 ---- */
    c.beginPath();
    c.arc(cx, headCY, headR, 0, Math.PI * 2);
    c.stroke();

    /* ---- 脖子 ---- */
    c.beginPath();
    c.moveTo(cx, headCY + headR);
    c.lineTo(cx, headCY + headR + h * 0.02);
    c.stroke();

    /* ---- 身体（梯形躯干） ---- */
    const neckY  = headCY + headR + h * 0.02;
    const hipY   = b.y1 + h * 0.58;
    const shoulderW = w * 0.24;
    const hipW      = w * 0.18;
    c.beginPath();
    c.moveTo(cx - shoulderW, neckY);
    c.lineTo(cx + shoulderW, neckY);
    c.lineTo(cx + hipW,      hipY);
    c.lineTo(cx - hipW,      hipY);
    c.closePath();
    c.stroke();

    /* ---- 手臂（带一点自然弧度） ---- */
    const armY = neckY + h * 0.06;
    const armD = h * 0.20;
    c.beginPath();
    c.moveTo(cx - shoulderW, armY);
    c.quadraticCurveTo(cx - shoulderW - w * 0.06, armY + armD * 0.55,
                       cx - shoulderW - w * 0.02, armY + armD);
    c.stroke();
    c.beginPath();
    c.moveTo(cx + shoulderW, armY);
    c.quadraticCurveTo(cx + shoulderW + w * 0.06, armY + armD * 0.55,
                       cx + shoulderW + w * 0.02, armY + armD);
    c.stroke();

    /* ---- 腿（略微外八字） ---- */
    const legSpread = w * 0.05;
    c.beginPath();
    c.moveTo(cx - hipW * 0.55, hipY);
    c.lineTo(cx - legSpread - hipW * 0.3, b.y2 - h * 0.02);
    c.stroke();
    c.beginPath();
    c.moveTo(cx + hipW * 0.55, hipY);
    c.lineTo(cx + legSpread + hipW * 0.3, b.y2 - h * 0.02);
    c.stroke();

    /* ---- 脚（小横线） ---- */
    c.beginPath();
    c.moveTo(cx - legSpread - hipW * 0.55, b.y2 - h * 0.02);
    c.lineTo(cx - legSpread + hipW * 0.05, b.y2 - h * 0.02);
    c.moveTo(cx + legSpread - hipW * 0.05, b.y2 - h * 0.02);
    c.lineTo(cx + legSpread + hipW * 0.55, b.y2 - h * 0.02);
    c.stroke();
  }
});


shape({
  key: 'skDrone', cat: 'sketch', geom: 'box', label: '无人机',
  icon: '<rect x="6" y="11" width="12" height="3" rx="1"/>' +
        '<path d="M8 11V7M16 11V7M3 7h18"/>' +
        '<circle cx="6" cy="7" r="1.5"/><circle cx="18" cy="7" r="1.5"/>' +
        '<path d="M8 14v3M16 14v3"/>',
  draw(c, o, U) {
    const b = U.bbox(o);
    const w = b.w, h = b.h;
    const cx = (b.x1 + b.x2) / 2;
    const cy = b.y1 + h * 0.55;

    const bodyW = w * 0.46;
    const bodyH = h * 0.16;
    const bodyL = cx - bodyW / 2;
    const bodyR = cx + bodyW / 2;
    const bodyT = cy - bodyH / 2;
    const bodyB = cy + bodyH / 2;

    const armLen = bodyW * 0.85;       // 到旋翼的水平距离
    const armTopY = cy - h * 0.24;     // 旋翼平面高度
    const armOuterL = cx - armLen / 2 - bodyW * 0.15;
    const armOuterR = cx + armLen / 2 + bodyW * 0.15;

    /* ---- 起落架（两个小支架） ---- */
    c.beginPath();
    c.moveTo(cx - bodyW * 0.28, bodyB);
    c.lineTo(cx - bodyW * 0.34, b.y2 - h * 0.02);
    c.lineTo(cx - bodyW * 0.42, b.y2 - h * 0.02);
    c.stroke();
    c.beginPath();
    c.moveTo(cx + bodyW * 0.28, bodyB);
    c.lineTo(cx + bodyW * 0.34, b.y2 - h * 0.02);
    c.lineTo(cx + bodyW * 0.42, b.y2 - h * 0.02);
    c.stroke();

    /* ---- 机臂（从机身斜向上延伸到旋翼） ---- */
    c.beginPath();
    c.moveTo(bodyL + bodyW * 0.15, bodyT);
    c.lineTo(armOuterL, armTopY);
    c.stroke();
    c.beginPath();
    c.moveTo(bodyR - bodyW * 0.15, bodyT);
    c.lineTo(armOuterR, armTopY);
    c.stroke();

    /* ---- 机身（圆角矩形 + 中间云台凸起） ---- */
    const rr = Math.min(bodyW, bodyH) * 0.28;
    c.beginPath();
    if (c.roundRect) c.roundRect(bodyL, bodyT, bodyW, bodyH, rr);
    else c.rect(bodyL, bodyT, bodyW, bodyH);
    c.stroke();

    /* 机身前脸（正视图能看到的小镜头） */
    c.beginPath();
    c.arc(cx + bodyW * 0.22, cy, bodyH * 0.22, 0, Math.PI * 2);
    c.stroke();
    c.beginPath();
    c.arc(cx + bodyW * 0.22, cy, bodyH * 0.08, 0, Math.PI * 2);
    c.fillStyle = o.color || '#1a1a1a';
    c.fill();

    /* ---- 左右两组旋翼（正视图：看到一条水平横杆 + 两侧小电机） ---- */
    const rotorBarLen = bodyW * 0.16;
    const rotorR = h * 0.045;

    /* 左旋翼 */
    c.beginPath();
    c.moveTo(armOuterL - rotorBarLen, armTopY);
    c.lineTo(armOuterL + rotorBarLen, armTopY);
    c.stroke();
    c.beginPath();
    c.arc(armOuterL, armTopY, rotorR, 0, Math.PI * 2);
    c.stroke();
    c.beginPath();
    c.arc(armOuterL, armTopY, rotorR * 0.25, 0, Math.PI * 2);
    c.fillStyle = o.color || '#1a1a1a';
    c.fill();

    /* 右旋翼 */
    c.beginPath();
    c.moveTo(armOuterR - rotorBarLen, armTopY);
    c.lineTo(armOuterR + rotorBarLen, armTopY);
    c.stroke();
    c.beginPath();
    c.arc(armOuterR, armTopY, rotorR, 0, Math.PI * 2);
    c.stroke();
    c.beginPath();
    c.arc(armOuterR, armTopY, rotorR * 0.25, 0, Math.PI * 2);
    c.fillStyle = o.color || '#1a1a1a';
    c.fill();
  }
});


shape({
  key: 'skRobotDog', cat: 'sketch', geom: 'box', label: '机器狗',
  icon: '<rect x="5" y="10" width="12" height="6" rx="1"/>' +
        '<path d="M17 9l3-2v6l-3-1"/>' +
        '<path d="M6 16v4M9 16v4M15 16v4M18 16v4"/>',
  draw(c, o, U) {
    const b = U.bbox(o);
    const w = b.w, h = b.h;
    const cx = (b.x1 + b.x2) / 2;

    const bodyW = w * 0.58;
    const bodyH = h * 0.30;
    const bodyL = cx - bodyW / 2 - w * 0.06;
    const bodyR = bodyL + bodyW;
    const bodyT = b.y1 + h * 0.38;
    const bodyB = bodyT + bodyH;

    /* ---- 身体（带圆角） ---- */
    const rr = Math.min(bodyW, bodyH) * 0.18;
    c.beginPath();
    if (c.roundRect) c.roundRect(bodyL, bodyT, bodyW, bodyH, rr);
    else c.rect(bodyL, bodyT, bodyW, bodyH);
    c.stroke();

    /* ---- 头部 ---- */
    const headW = w * 0.24;
    const headH = h * 0.24;
    const headL = bodyR - w * 0.01;
    const headT = bodyT - h * 0.08;

    const rr2 = Math.min(headW, headH) * 0.20;
    c.beginPath();
    if (c.roundRect) c.roundRect(headL, headT, headW, headH, rr2);
    else c.rect(headL, headT, headW, headH);
    c.stroke();

    /* 耳朵 / 天线 */
    c.beginPath();
    c.moveTo(headL + headW * 0.30, headT);
    c.lineTo(headL + headW * 0.24, headT - h * 0.10);
    c.stroke();
    c.beginPath();
    c.arc(headL + headW * 0.24, headT - h * 0.10, Math.max(1.5, h * 0.015), 0, Math.PI * 2);
    c.fillStyle = o.color || '#1a1a1a';
    c.fill();

    /* 摄像头（眼睛） */
    c.beginPath();
    c.arc(headL + headW * 0.72, headT + headH * 0.40, headH * 0.12, 0, Math.PI * 2);
    c.stroke();
    c.beginPath();
    c.arc(headL + headW * 0.72, headT + headH * 0.40, headH * 0.05, 0, Math.PI * 2);
    c.fillStyle = o.color || '#1a1a1a';
    c.fill();

    /* ---- 四条腿（膝关节可见） ---- */
    const legTopY = bodyB;
    const kneeY   = bodyB + h * 0.18;
    const footY   = b.y2 - h * 0.02;

    const legXs = [
      bodyL + bodyW * 0.18,
      bodyL + bodyW * 0.40,
      bodyL + bodyW * 0.62,
      bodyL + bodyW * 0.86
    ];

    legXs.forEach((x, i) => {
      /* 大腿 */
      c.beginPath();
      c.moveTo(x, legTopY);
      c.lineTo(x + (i < 2 ? -w * 0.02 : w * 0.02), kneeY);
      c.stroke();
      /* 小腿 */
      c.beginPath();
      c.moveTo(x + (i < 2 ? -w * 0.02 : w * 0.02), kneeY);
      c.lineTo(x, footY);
      c.stroke();
      /* 脚掌小横线 */
      c.beginPath();
      c.moveTo(x - w * 0.025, footY);
      c.lineTo(x + w * 0.025, footY);
      c.stroke();
      /* 膝关节小圆点 */
      c.beginPath();
      c.arc(x + (i < 2 ? -w * 0.02 : w * 0.02), kneeY,
            Math.max(1.5, h * 0.015), 0, Math.PI * 2);
      c.stroke();
    });

    /* ---- 尾巴 ---- */
    c.beginPath();
    c.moveTo(bodyL, bodyT + bodyH * 0.4);
    c.quadraticCurveTo(bodyL - w * 0.06, bodyT + bodyH * 0.2,
                       bodyL - w * 0.05, bodyT - h * 0.04);
    c.stroke();
  }
});

shape({
  key: 'skTrain', cat: 'sketch', geom: 'box', label: '火车',
  icon: '<rect x="3" y="9" width="10" height="8"/>' +
        '<rect x="13" y="11" width="8" height="6"/>' +
        '<circle cx="6" cy="19" r="2"/>' +
        '<circle cx="17" cy="19" r="2"/>' +
        '<path d="M5 9V6h4v3"/>',
  draw(c, o, U) {
    const b = U.bbox(o);
    const w = b.w, h = b.h;

    const bodyBot = b.y1 + h * 0.76;
    const bodyTop = b.y1 + h * 0.34;
    const wheelY  = bodyBot + h * 0.10;
    const wr      = h * 0.09;

    /* 轨道 */
    c.beginPath();
    c.moveTo(b.x1 - w * 0.02, wheelY + wr + h * 0.03);
    c.lineTo(b.x2 + w * 0.02, wheelY + wr + h * 0.03);
    c.stroke();

    /* ---- 车头 ---- */
    const lw = w * 0.55;
    const rr1 = Math.min(lw, bodyBot - bodyTop) * 0.10;
    c.beginPath();
    if (c.roundRect) c.roundRect(b.x1, bodyTop, lw, bodyBot - bodyTop, rr1);
    else c.rect(b.x1, bodyTop, lw, bodyBot - bodyTop);
    c.stroke();

    /* 烟囱 */
    c.beginPath();
    c.rect(b.x1 + w * 0.10, b.y1 + h * 0.16, w * 0.11, h * 0.20);
    c.stroke();
    c.beginPath();
    c.arc(b.x1 + w * 0.155, b.y1 + h * 0.14, w * 0.055, Math.PI, 0);
    c.stroke();
    /* 蒸汽（两个小圆圈） */
    c.beginPath();
    c.arc(b.x1 + w * 0.155, b.y1 + h * 0.06, w * 0.025, 0, Math.PI * 2);
    c.stroke();
    c.beginPath();
    c.arc(b.x1 + w * 0.20, b.y1 + h * 0.02, w * 0.020, 0, Math.PI * 2);
    c.stroke();

    /* 车头大灯 */
    c.beginPath();
    c.arc(b.x1 + w * 0.36, bodyTop + h * 0.10, h * 0.05, 0, Math.PI * 2);
    c.stroke();

    /* 驾驶室窗 */
    c.beginPath();
    c.rect(b.x1 + w * 0.42, bodyTop + h * 0.06, w * 0.09, h * 0.14);
    c.stroke();

    /* ---- 车厢 ---- */
    const cw = w * 0.40;
    const ct = bodyTop + h * 0.10;
    const cb = bodyBot;
    const rr2 = Math.min(cw, cb - ct) * 0.10;
    c.beginPath();
    if (c.roundRect) c.roundRect(b.x2 - cw, ct, cw, cb - ct, rr2);
    else c.rect(b.x2 - cw, ct, cw, cb - ct);
    c.stroke();

    /* 车厢窗（三个小方窗） */
    for (let i = 0; i < 3; i++) {
      c.beginPath();
      c.rect(b.x2 - cw + w * 0.04 + i * (cw - w * 0.08) / 3,
             ct + h * 0.05,
             (cw - w * 0.08) / 3 - w * 0.02,
             h * 0.12);
      c.stroke();
    }

    /* ---- 车轮 ---- */
    [0.14, 0.34, 0.62, 0.82].forEach(f => {
      c.beginPath();
      c.arc(b.x1 + w * f, wheelY, wr, 0, Math.PI * 2);
      c.stroke();
      c.beginPath();
      c.arc(b.x1 + w * f, wheelY, wr * 0.30, 0, Math.PI * 2);
      c.fillStyle = o.color || '#1a1a1a';
      c.fill();
    });

    /* ---- 连接钩（车头与车厢之间） ---- */
    c.beginPath();
    c.moveTo(b.x1 + lw, wheelY - h * 0.02);
    c.lineTo(b.x2 - cw, wheelY - h * 0.02);
    c.stroke();
  }
});



shape({
  key: 'skHSR', cat: 'sketch', geom: 'box', label: '高铁',
  icon: '<path d="M3 15V9q0-2 3-3l3-1h9q3 0 3 3v7z"/>' +
        '<circle cx="7" cy="17" r="2"/>' +
        '<circle cx="17" cy="17" r="2"/>',
  draw(c, o, U) {
    const b = U.bbox(o);
    const w = b.w, h = b.h;
    const bodyBot = b.y1 + h * 0.70;
    const bodyTop = b.y1 + h * 0.28;
    const wheelY  = bodyBot + h * 0.11;
    const wr      = h * 0.075;

    /* 轨道 */
    c.beginPath();
    c.moveTo(b.x1 - w * 0.02, wheelY + wr + h * 0.025);
    c.lineTo(b.x2 + w * 0.02, wheelY + wr + h * 0.025);
    c.stroke();

    /* ---- 车身（流线型：车头圆弧 + 车顶平直） ---- */
    c.beginPath();
    c.moveTo(b.x1, bodyBot);
    c.quadraticCurveTo(b.x1 - w * 0.02, bodyTop + h * 0.05,
                       b.x1 + w * 0.10, bodyTop);
    c.lineTo(b.x2 - w * 0.05, bodyTop);
    c.quadraticCurveTo(b.x2, bodyTop, b.x2, bodyTop + h * 0.06);
    c.lineTo(b.x2, bodyBot);
    c.closePath();
    c.stroke();

    /* ---- 侧窗（一条流线窗带） ---- */
    const winY = bodyTop + h * 0.10;
    const winH = h * 0.13;
    const rrW = Math.min(winH * 0.5, w * 0.01);

    for (let i = 0; i < 5; i++) {
      const wl = b.x1 + w * (0.13 + i * 0.17);
      const ww = w * 0.14;
      if (wl + ww > b.x2 - w * 0.04) break;

      c.beginPath();
      if (c.roundRect) {
        c.roundRect(wl, winY, ww, winH, rrW);
      } else {
        c.rect(wl, winY, ww, winH);
      }
      c.stroke();
    }

    /* 车头大灯 */
    c.beginPath();
    c.arc(b.x1 + w * 0.06, bodyBot - h * 0.08, h * 0.025, 0, Math.PI * 2);
    c.fillStyle = o.color || '#1a1a1a';
    c.fill();

    /* ---- 车轮 ---- */
    [0.20, 0.48, 0.76].forEach(f => {
      c.beginPath();
      c.arc(b.x1 + w * f, wheelY, wr, 0, Math.PI * 2);
      c.stroke();
      c.beginPath();
      c.arc(b.x1 + w * f, wheelY, wr * 0.32, 0, Math.PI * 2);
      c.fillStyle = o.color || '#1a1a1a';
      c.fill();
    });
  }
});



shape({
  key: 'skBike', cat: 'sketch', geom: 'box', label: '自行车',
  icon: '<circle cx="5" cy="17" r="3.5"/><circle cx="19" cy="17" r="3.5"/>' +
        '<path d="M5 17h5M5 17l3-8h8l3 8M10 17l6-8M10 17l-2-8"/>',
  draw(c, o, U) {
    const b = U.bbox(o);
    const w = b.w, h = b.h;

    /* 车轮半径、车轮中心 */
    const r  = Math.min(h * 0.24, w * 0.17);
    const cy = b.y2 - r;
    const rx = b.x1 + r;      // 后轮花鼓
    const fx = b.x2 - r;      // 前轮花鼓

    /* 五通（脚踏中心）*/
    const bx = rx + (fx - rx) * 0.42;
    const by = cy + r * 0.10;

    /* 座管束（坐垫位置）*/
    const sx = bx - r * 0.80;
    const sy = b.y1 + h * 0.38;

    /* 头管顶部（车把下方）*/
    const hx = fx - w * 0.03;
    const hy = b.y1 + h * 0.40;

    /* ---- 车轮（双圈 + 花鼓 + 辐条）---- */
    [rx, fx].forEach(cx => {
      c.beginPath(); c.arc(cx, cy, r, 0, Math.PI * 2); c.stroke();
      c.beginPath(); c.arc(cx, cy, r * 0.78, 0, Math.PI * 2); c.stroke();
      c.beginPath(); c.arc(cx, cy, r * 0.10, 0, Math.PI * 2);
      c.fillStyle = o.color || '#1a1a1a'; c.fill(); c.stroke();

      c.save();
      c.lineWidth = Math.max(0.5, (o.size || 4) * 0.28);
      for (let i = 0; i < 6; i++) {
        const a = i * Math.PI / 3;
        c.beginPath();
        c.moveTo(cx + Math.cos(a) * r * 0.10, cy + Math.sin(a) * r * 0.10);
        c.lineTo(cx + Math.cos(a) * r * 0.78, cy + Math.sin(a) * r * 0.78);
        c.stroke();
      }
      c.restore();
    });

    /* ---- 车架（菱形）---- */
    c.beginPath();
    c.moveTo(rx, cy); c.lineTo(bx, by);   // 后下叉
    c.moveTo(rx, cy); c.lineTo(sx, sy);   // 后上叉
    c.moveTo(bx, by); c.lineTo(sx, sy);   // 座管
    c.moveTo(bx, by); c.lineTo(hx, hy);   // 下管
    c.moveTo(sx, sy); c.lineTo(hx, hy);   // 上管
    c.moveTo(hx, hy); c.lineTo(fx, cy);   // 前叉
    c.stroke();

    /* ---- 坐垫 ---- */
    c.beginPath();
    c.moveTo(sx - r * 0.55, sy - r * 0.02);
    c.quadraticCurveTo(sx + r * 0.05, sy - r * 0.18,
                       sx + r * 0.32, sy - r * 0.04);
    c.stroke();
    c.beginPath();
    c.moveTo(sx, sy - r * 0.02); c.lineTo(sx, sy + r * 0.06);
    c.stroke();

    /* ---- 车把 ---- */
    c.beginPath();
    c.moveTo(hx, hy); c.lineTo(hx, hy - h * 0.07);
    c.stroke();
    c.beginPath();
    c.moveTo(hx - r * 0.34, hy - h * 0.07);
    c.lineTo(hx + r * 0.28, hy - h * 0.07);
    c.stroke();

    /* ---- 牙盘 + 曲柄 + 脚踏 ---- */
    c.beginPath(); c.arc(bx, by, r * 0.24, 0, Math.PI * 2); c.stroke();
    c.beginPath(); c.arc(bx, by, r * 0.06, 0, Math.PI * 2); c.stroke();

    c.beginPath();
    c.moveTo(bx, by); c.lineTo(bx + r * 0.28, by - r * 0.46);
    c.stroke();
    c.beginPath();
    c.moveTo(bx + r * 0.16, by - r * 0.46);
    c.lineTo(bx + r * 0.42, by - r * 0.46);
    c.stroke();

    c.beginPath();
    c.moveTo(bx, by); c.lineTo(bx - r * 0.28, by + r * 0.46);
    c.stroke();
    c.beginPath();
    c.moveTo(bx - r * 0.42, by + r * 0.46);
    c.lineTo(bx - r * 0.16, by + r * 0.46);
    c.stroke();
  }
});

shape({
  key: 'skMoto', cat: 'sketch', geom: 'box', label: '摩托车',
  icon: '<circle cx="5" cy="17" r="3.5"/><circle cx="19" cy="17" r="3.5"/>' +
        '<path d="M5 17l5-6h5l4 6M15 11l-2-4h4M10 12l1 5"/>',
  draw(c, o, U) {
    const b = U.bbox(o);
    const w = b.w, h = b.h;

    /* 车轮 */
    const rF = Math.min(h * 0.24, w * 0.17);   // 前轮半径
    const rR = rF * 0.92;                       // 后轮稍小
    const cy = b.y2 - rF;
    const fx = b.x2 - rF;
    const rx = b.x1 + rR;

    /* 转向头 */
    const stX = fx - w * 0.06;
    const stY = b.y1 + h * 0.26;

    /* 车把 */
    const hbY = b.y1 + h * 0.10;
    const hbX = stX - w * 0.02;

    /* 油箱 */
    const tkX1 = stX - w * 0.13;    // 油箱后缘
    const tkX2 = stX - w * 0.01;    // 油箱前缘
    const tkTopY = stY - h * 0.02;
    const tkBotY = stY + h * 0.12;

    /* 座椅 */
    const seX1 = b.x1 + w * 0.16;
    const seX2 = tkX1 + w * 0.01;
    const seY  = tkBotY - h * 0.01;

    /* 发动机 */
    const enX = rx + (fx - rx) * 0.50;
    const enY = cy - rF * 0.20;
    const enW = w * 0.16;
    const enH = h * 0.16;

    /* 后摇臂枢轴 */
    const pvX = enX + w * 0.02;
    const pvY = enY + enH * 0.55;

    /* ---- 车轮（双圈 + 轮毂 + 辐条）---- */
    [[rx, rR], [fx, rF]].forEach(([cx, r]) => {
      c.beginPath(); c.arc(cx, cy, r, 0, Math.PI * 2); c.stroke();
      c.beginPath(); c.arc(cx, cy, r * 0.74, 0, Math.PI * 2); c.stroke();
      c.beginPath(); c.arc(cx, cy, r * 0.18, 0, Math.PI * 2);
      c.fillStyle = o.color || '#1a1a1a'; c.fill(); c.stroke();

      c.save();
      c.lineWidth = Math.max(0.6, (o.size || 4) * 0.34);
      for (let i = 0; i < 5; i++) {
        const a = i * 2 * Math.PI / 5 - Math.PI / 2;
        c.beginPath();
        c.moveTo(cx + Math.cos(a) * r * 0.18, cy + Math.sin(a) * r * 0.18);
        c.lineTo(cx + Math.cos(a) * r * 0.74, cy + Math.sin(a) * r * 0.74);
        c.stroke();
      }
      c.restore();
    });

    /* ---- 前叉 ---- */
    c.beginPath();
    c.moveTo(stX, stY); c.lineTo(fx, cy);
    c.stroke();

    /* ---- 后摇臂 ---- */
    c.beginPath();
    c.moveTo(pvX, pvY); c.lineTo(rx, cy);
    c.stroke();

    /* ---- 主车架（座椅 → 转向头 → 枢轴）---- */
    c.beginPath();
    c.moveTo(seX2, seY); c.lineTo(stX, stY);
    c.stroke();
    c.beginPath();
    c.moveTo(seX2, seY); c.lineTo(pvX, pvY);
    c.stroke();

    /* ---- 油箱（圆润倒梯形）---- */
    c.beginPath();
    c.moveTo(tkX1, tkBotY);
    c.quadraticCurveTo(tkX1 - w * 0.012, tkTopY,
                       tkX1 + w * 0.02,  tkTopY);
    c.lineTo(tkX2 - w * 0.01, tkTopY);
    c.quadraticCurveTo(tkX2, tkTopY, tkX2, tkBotY);
    c.closePath();
    c.stroke();

    /* ---- 座椅 ---- */
    c.beginPath();
    c.moveTo(seX1, seY);
    c.quadraticCurveTo(seX1 + w * 0.02, seY - h * 0.025,
                       seX2 + w * 0.01, seY);
    c.stroke();
    c.beginPath();
    c.moveTo(seX1, seY);
    c.quadraticCurveTo(seX1 + w * 0.03, seY + h * 0.045,
                       seX2, seY + h * 0.035);
    c.stroke();

    /* ---- 车把 ---- */
    c.beginPath();
    c.moveTo(stX, stY); c.lineTo(hbX, hbY);
    c.stroke();
    c.beginPath();
    c.moveTo(hbX - w * 0.05, hbY);
    c.lineTo(hbX + w * 0.04, hbY);
    c.stroke();
    /* 后视镜小柄 */
    c.beginPath();
    c.moveTo(hbX - w * 0.02, hbY - h * 0.005);
    c.lineTo(hbX - w * 0.03, hbY - h * 0.035);
    c.stroke();

    /* ---- 发动机（圆角矩形）---- */
    const rr2 = Math.min(enW, enH) * 0.18;
    c.beginPath();
    if (c.roundRect) {
      c.roundRect(enX - enW / 2, enY - enH / 2, enW, enH, rr2);
    } else {
      c.rect(enX - enW / 2, enY - enH / 2, enW, enH);
    }
    c.stroke();

    /* ---- 排气管（从前下方绕到后轮上）---- */
    c.beginPath();
    c.moveTo(enX - enW * 0.45, enY + enH * 0.30);
    c.quadraticCurveTo((enX + rx) / 2, cy + rF * 0.55,
                       rx + rR * 0.30,   cy + rR * 0.30);
    c.stroke();
  }
});


shape({
  key: 'skJ20', cat: 'sketch', geom: 'box', label: '歼-20',
  icon: '<path d="M2 13l18-3-5 3 4 4-3-1-3 2-1-3-8 2 3-3z"/>',
  draw(c, o, U) {
    const b = U.bbox(o);
    const w = b.w, h = b.h;
    const cy = (b.y1 + b.y2) / 2;
    const noseX = b.x2;
    const tailX = b.x1;

    /* ---- 主机身 ---- */
    c.beginPath();
    c.moveTo(noseX, cy);                                        // 机头
    c.lineTo(b.x1 + w * 0.72, cy - h * 0.08);                   // 前段上沿
    c.lineTo(b.x1 + w * 0.62, cy - h * 0.12);                   // 座舱后
    c.lineTo(tailX, cy - h * 0.14);                             // 尾段上沿
    c.lineTo(tailX, cy + h * 0.14);                             // 尾段下沿
    c.lineTo(b.x1 + w * 0.62, cy + h * 0.12);
    c.lineTo(b.x1 + w * 0.72, cy + h * 0.08);
    c.closePath();
    c.stroke();

    /* ---- 座舱盖 ---- */
    c.beginPath();
    c.moveTo(b.x1 + w * 0.74, cy - h * 0.04);
    c.quadraticCurveTo(b.x1 + w * 0.68, cy - h * 0.20,
                       b.x1 + w * 0.58, cy - h * 0.12);
    c.stroke();

    /* ---- 主翼（大三角翼）---- */
    c.beginPath();
    c.moveTo(b.x1 + w * 0.60, cy - h * 0.06);
    c.lineTo(b.x1 + w * 0.18, cy - h * 0.48);
    c.lineTo(b.x1 + w * 0.30, cy - h * 0.06);
    c.closePath();
    c.stroke();

    c.beginPath();
    c.moveTo(b.x1 + w * 0.60, cy + h * 0.06);
    c.lineTo(b.x1 + w * 0.18, cy + h * 0.48);
    c.lineTo(b.x1 + w * 0.30, cy + h * 0.06);
    c.closePath();
    c.stroke();

    /* ---- 鸭翼（小前翼）---- */
    c.beginPath();
    c.moveTo(b.x1 + w * 0.78, cy - h * 0.04);
    c.lineTo(b.x1 + w * 0.66, cy - h * 0.18);
    c.lineTo(b.x1 + w * 0.72, cy - h * 0.04);
    c.closePath();
    c.stroke();

    c.beginPath();
    c.moveTo(b.x1 + w * 0.78, cy + h * 0.04);
    c.lineTo(b.x1 + w * 0.66, cy + h * 0.18);
    c.lineTo(b.x1 + w * 0.72, cy + h * 0.04);
    c.closePath();
    c.stroke();

    /* ---- 外倾双垂尾 ---- */
    c.beginPath();
    c.moveTo(b.x1 + w * 0.16, cy - h * 0.08);
    c.lineTo(b.x1 + w * 0.04, cy - h * 0.38);
    c.lineTo(b.x1 + w * 0.10, cy - h * 0.08);
    c.closePath();
    c.stroke();

    c.beginPath();
    c.moveTo(b.x1 + w * 0.16, cy + h * 0.08);
    c.lineTo(b.x1 + w * 0.04, cy + h * 0.38);
    c.lineTo(b.x1 + w * 0.10, cy + h * 0.08);
    c.closePath();
    c.stroke();

    /* ---- 发动机喷口 ---- */
    c.beginPath();
    c.ellipse(tailX + w * 0.01, cy, h * 0.05, h * 0.10, 0, 0, Math.PI * 2);
    c.stroke();
  }
});



shape({
  key: 'skCarrier', cat: 'sketch', geom: 'box', label: '航空母舰',
  icon: '<path d="M3 15h18v3H3z"/>' +
        '<path d="M6 15v-5h6v5"/>' +
        '<path d="M8 10V7h2v3"/>',
  draw(c, o, U) {
    const b = U.bbox(o);
    const w = b.w, h = b.h;

    const deckY = b.y1 + h * 0.52;
    const deckH = h * 0.20;

    /* ---- 飞行甲板（前端上翘）---- */
    c.beginPath();
    c.moveTo(b.x1 - w * 0.01, deckY + deckH);
    c.lineTo(b.x1 + w * 0.08, deckY - h * 0.02);
    c.lineTo(b.x2, deckY - h * 0.02);
    c.lineTo(b.x2, deckY + deckH);
    c.closePath();
    c.stroke();

    /* ---- 甲板中线（斜角甲板虚线） ---- */
    c.save();
    c.setLineDash([5, 4]);
    c.lineWidth = Math.max(0.5, (o.size || 4) * 0.35);
    c.beginPath();
    c.moveTo(b.x1 + w * 0.08, deckY + deckH * 0.6);
    c.lineTo(b.x2 - w * 0.04, deckY + deckH * 0.4);
    c.stroke();
    c.restore();

    /* ---- 舰岛 ---- */
    const islX = b.x1 + w * 0.66;
    const islW = w * 0.12;
    const islH = h * 0.28;
    const rr = Math.min(islW, islH) * 0.15;
    c.beginPath();
    if (c.roundRect) c.roundRect(islX, deckY - islH, islW, islH, rr);
    else c.rect(islX, deckY - islH, islW, islH);
    c.stroke();

    /* 桅杆 */
    c.beginPath();
    c.moveTo(islX + islW * 0.5, deckY - islH);
    c.lineTo(islX + islW * 0.5, deckY - islH - h * 0.14);
    c.stroke();
    /* 雷达（横杆） */
    c.beginPath();
    c.moveTo(islX + islW * 0.2, deckY - islH - h * 0.10);
    c.lineTo(islX + islW * 0.8, deckY - islH - h * 0.10);
    c.stroke();

    /* ---- 舰载机（3 架简化三角形） ---- */
    [0.22, 0.40, 0.55].forEach((f, i) => {
      const px = b.x1 + w * f;
      const py = deckY + deckH * 0.5;
      c.beginPath();
      c.moveTo(px, py);
      c.lineTo(px + w * 0.05, py);
      c.lineTo(px + w * 0.025, py - h * 0.05);
      c.closePath();
      c.stroke();
      /* 机翼 */
      c.beginPath();
      c.moveTo(px + w * 0.025, py - h * 0.02);
      c.lineTo(px - w * 0.01,  py - h * 0.02);
      c.moveTo(px + w * 0.025, py - h * 0.02);
      c.lineTo(px + w * 0.06,  py - h * 0.02);
      c.stroke();
    });

    /* ---- 舰体（船身）---- */
    c.beginPath();
    c.moveTo(b.x1, deckY + deckH);
    c.lineTo(b.x2, deckY + deckH);
    c.lineTo(b.x2 - w * 0.06, b.y2);
    c.lineTo(b.x1 + w * 0.08, b.y2);
    c.closePath();
    c.stroke();

    /* 船身吃水线 */
    c.beginPath();
    c.moveTo(b.x1 + w * 0.04, deckY + deckH + (b.y2 - deckY - deckH) * 0.55);
    c.lineTo(b.x2 - w * 0.03, deckY + deckH + (b.y2 - deckY - deckH) * 0.55);
    c.stroke();
  }
});



shape({
  key: 'skPistol', cat: 'sketch', geom: 'box', label: '手枪',
  icon: '<path d="M3 9h14l2 3h2v3h-4l-2-2h-4l-3 6H4l2-6H3z"/>',
  draw(c, o, U) {
    const b = U.bbox(o);
    const w = b.w, h = b.h;

    const slideY = b.y1 + h * 0.22;
    const slideH = h * 0.20;
    const slideR = b.x1 + w * 0.94;

    /* ---- 套筒 ---- */
    const rr = slideH * 0.12;
    c.beginPath();
    if (c.roundRect) {
      c.roundRect(b.x1, slideY, slideR - b.x1, slideH, rr);
    } else {
      c.rect(b.x1, slideY, slideR - b.x1, slideH);
    }
    c.stroke();

    /* 套筒前端的准星座 */
    c.beginPath();
    c.moveTo(b.x1 + w * 0.04, slideY);
    c.lineTo(b.x1 + w * 0.05, slideY - h * 0.04);
    c.lineTo(b.x1 + w * 0.07, slideY - h * 0.04);
    c.lineTo(b.x1 + w * 0.08, slideY);
    c.stroke();

    /* 抛壳口 */
    c.beginPath();
    c.rect(b.x1 + w * 0.28, slideY + slideH * 0.22,
           w * 0.22, slideH * 0.44);
    c.stroke();

    /* ---- 枪管前端 ---- */
    c.beginPath();
    c.rect(slideR, slideY + slideH * 0.30,
           w * 0.04, slideH * 0.40);
    c.stroke();

    /* ---- 扳机护圈 ---- */
    c.beginPath();
    c.arc(b.x1 + w * 0.32, slideY + slideH + h * 0.075,
          h * 0.085, Math.PI * 0.10, Math.PI * 0.95);
    c.stroke();

    /* 扳机 */
    c.beginPath();
    c.moveTo(b.x1 + w * 0.30, slideY + slideH + h * 0.02);
    c.quadraticCurveTo(b.x1 + w * 0.32, slideY + slideH + h * 0.09,
                       b.x1 + w * 0.29, slideY + slideH + h * 0.13);
    c.stroke();

    /* ---- 握把 ---- */
    c.beginPath();
    c.moveTo(b.x1 + w * 0.10, slideY + slideH);
    c.lineTo(b.x1 + w * 0.30, slideY + slideH);
    c.lineTo(b.x1 + w * 0.22, b.y2);
    c.lineTo(b.x1 + w * 0.02, b.y2);
    c.closePath();
    c.stroke();

    /* 握把纹路（斜线） */
    c.save();
    c.lineWidth = Math.max(0.5, (o.size || 4) * 0.28);
    for (let i = 1; i <= 4; i++) {
      const t = i / 5;
      const x1 = b.x1 + w * 0.10 + (b.x1 + w * 0.22 - (b.x1 + w * 0.10)) * t;
      const x2 = b.x1 + w * 0.30 + (b.x1 + w * 0.02 - (b.x1 + w * 0.30)) * t;
      const y = slideY + slideH + (b.y2 - slideY - slideH) * t;
      c.beginPath();
      c.moveTo(x1 + w * 0.02, y);
      c.lineTo(x2 + w * 0.03, y);
      c.stroke();
    }
    c.restore();
  }
});



/* ---- 11. 苹果 ---- */
shape({
  key: 'skApple', cat: 'sketch', geom: 'box', label: '苹果',
  icon: '<path d="M12 6c-3-2-7 0-7 5s3 9 5 9 2-1 2-1 0 1 2 1 5-4 5-9-4-7-7-5z"/>' +
        '<path d="M12 6V3M12 3q2-1 4 0"/>',
  draw(c, o, U) {
    const b = U.bbox(o);
    const cx = (b.x1 + b.x2) / 2;
    const w = b.w, h = b.h;

    /* 果实（两个圆弧构成心形苹果轮廓） */
    const topY = b.y1 + h * 0.22;
    const botY = b.y2 - h * 0.05;
    const halfW = w * 0.40;

    c.beginPath();
    c.moveTo(cx, topY);
    c.bezierCurveTo(cx - halfW * 1.2, topY - h * 0.10,
                    cx - halfW * 1.1, botY,
                    cx, botY);
    c.bezierCurveTo(cx + halfW * 1.1, botY,
                    cx + halfW * 1.2, topY - h * 0.10,
                    cx, topY);
    c.closePath();
    c.stroke();

    /* 果柄 */
    c.beginPath();
    c.moveTo(cx, topY);
    c.lineTo(cx + w * 0.02, b.y1 + h * 0.05);
    c.stroke();

    /* 叶子 */
    const leafX = cx + w * 0.02;
    const leafY = b.y1 + h * 0.07;
    c.beginPath();
    c.moveTo(leafX, leafY);
    c.quadraticCurveTo(leafX + w * 0.14, leafY - h * 0.05,
                       leafX + w * 0.20, leafY + h * 0.02);
    c.quadraticCurveTo(leafX + w * 0.10, leafY + h * 0.06, leafX, leafY);
    c.closePath();
    c.stroke();
  }
});

/* ---- 12. 羽毛球 ---- */
shape({
  key: 'skShuttlecock', cat: 'sketch', geom: 'box', label: '羽毛球',
  icon: '<path d="M9 10l3 11 3-11z"/>' +
        '<path d="M9 10l-2-6h10l-2 6z"/>' +
        '<path d="M10 4l1.5 6M14 4l-1.5 6"/>',
  draw(c, o, U) {
    const b = U.bbox(o);
    const cx = (b.x1 + b.x2) / 2;
    const w = b.w, h = b.h;

    /* 球头（半圆，位于下方） */
    const headR = w * 0.14;
    const headCY = b.y2 - headR;
    c.beginPath();
    c.arc(cx, headCY, headR, 0, Math.PI * 2);
    c.stroke();

    /* 羽毛裙（梯形，向上张开） */
    const skirtTop = b.y1 + h * 0.05;
    const skirtBot = headCY - headR * 0.9;
    const topHalf   = w * 0.34;
    const botHalf   = w * 0.12;

    c.beginPath();
    c.moveTo(cx - botHalf, skirtBot);
    c.lineTo(cx - topHalf, skirtTop);
    c.lineTo(cx + topHalf, skirtTop);
    c.lineTo(cx + botHalf, skirtBot);
    c.closePath();
    c.stroke();

    /* 羽毛骨架线 */
    c.save();
    c.lineWidth = Math.max(0.5, (o.size || 4) * 0.3);
    for (let i = 1; i <= 3; i++) {
      const t = i / 4;
      const topX = cx - topHalf + (topHalf * 2) * t;
      const botX = cx - botHalf + (botHalf * 2) * t;
      c.beginPath();
      c.moveTo(botX, skirtBot);
      c.lineTo(topX, skirtTop);
      c.stroke();
    }
    c.restore();
  }
});

/* ---- 13. 篮球 ---- */
shape({
  key: 'skBasketball', cat: 'sketch', geom: 'box', label: '篮球',
  icon: '<circle cx="12" cy="12" r="9"/>' +
        '<path d="M3 12h18M12 3v18"/>' +
        '<path d="M5 5q7 7 14 0M5 19q7-7 14 0"/>',
  draw(c, o, U) {
    const b = U.bbox(o);
    const cx = (b.x1 + b.x2) / 2;
    const cy = (b.y1 + b.y2) / 2;
    const r = Math.min(b.w, b.h) / 2;

    /* 球体 */
    c.beginPath();
    c.arc(cx, cy, Math.max(r, 1), 0, Math.PI * 2);
    c.stroke();

    /* 中间竖线 */
    c.beginPath();
    c.moveTo(cx, cy - r); c.lineTo(cx, cy + r);
    /* 中间横线 */
    c.moveTo(cx - r, cy); c.lineTo(cx + r, cy);
    c.stroke();

    /* 两条弧线（左右侧） */
    c.beginPath();
    c.moveTo(cx, cy - r);
    c.bezierCurveTo(cx - r * 0.9, cy - r * 0.6,
                    cx - r * 0.9, cy + r * 0.6,
                    cx, cy + r);
    c.stroke();
    c.beginPath();
    c.moveTo(cx, cy - r);
    c.bezierCurveTo(cx + r * 0.9, cy - r * 0.6,
                    cx + r * 0.9, cy + r * 0.6,
                    cx, cy + r);
    c.stroke();
  }
});

/* ---- 14. 足球 ---- */
shape({
  key: 'skFootball', cat: 'sketch', geom: 'box', label: '足球',
  icon: '<circle cx="12" cy="12" r="9"/>' +
        '<path d="M12 7l3 2-1 4h-4l-1-4z"/>' +
        '<path d="M12 7V4M6 9L4 7M18 9l2-2M8 14l-3 2M16 14l3 2M12 17v3"/>',
  draw(c, o, U) {
    const b = U.bbox(o);
    const cx = (b.x1 + b.x2) / 2;
    const cy = (b.y1 + b.y2) / 2;
    const r = Math.min(b.w, b.h) / 2;

    c.beginPath();
    c.arc(cx, cy, Math.max(r, 1), 0, Math.PI * 2);
    c.stroke();

    /* 中央五边形 */
    const pentR = r * 0.30;
    const pts = [];
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + i * 2 * Math.PI / 5;
      pts.push({ x: cx + pentR * Math.cos(a), y: cy + pentR * Math.sin(a) });
    }
    c.beginPath();
    pts.forEach((p, i) => i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y));
    c.closePath();
    c.stroke();

    /* 从五边形各顶点向球边发线 */
    c.save();
    c.lineWidth = Math.max(0.5, (o.size || 4) * 0.35);
    pts.forEach(p => {
      const dx = p.x - cx, dy = p.y - cy;
      const m = Math.hypot(dx, dy);
      const ex = cx + dx / m * r;
      const ey = cy + dy / m * r;
      c.beginPath();
      c.moveTo(p.x, p.y);
      c.lineTo(ex, ey);
      c.stroke();
    });
    c.restore();
  }
});

/* ---- 15. 乒乓球（球拍 + 球） ---- */
shape({
  key: 'skPingpong', cat: 'sketch', geom: 'box', label: '乒乓球',
  icon: '<ellipse cx="10" cy="10" rx="6" ry="7"/>' +
        '<path d="M13 15l4 6"/>' +
        '<circle cx="19" cy="8" r="3"/>',
  draw(c, o, U) {
    const b = U.bbox(o);
    const w = b.w, h = b.h;

    /* 球拍面（椭圆） */
    const padCX = b.x1 + w * 0.42;
    const padCY = b.y1 + h * 0.42;
    const padRX = w * 0.28;
    const padRY = h * 0.34;
    c.beginPath();
    c.ellipse(padCX, padCY, padRX, padRY, 0, 0, Math.PI * 2);
    c.stroke();

    /* 拍面内框 */
    c.save();
    c.lineWidth = Math.max(0.5, (o.size || 4) * 0.3);
    c.beginPath();
    c.ellipse(padCX, padCY, padRX * 0.85, padRY * 0.85, 0, 0, Math.PI * 2);
    c.stroke();
    c.restore();

    /* 拍柄 */
    const handleX1 = padCX + padRX * 0.55;
    const handleY1 = padCY + padRY * 0.85;
    const handleX2 = padCX + padRX * 1.6;
    const handleY2 = padCY + padRY * 1.7;
    c.save();
    c.lineWidth = Math.max(3, (o.size || 4) * 1.4);
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(handleX1, handleY1);
    c.lineTo(handleX2, handleY2);
    c.stroke();
    c.restore();

    /* 乒乓球（右上角小圆） */
    const ballR = Math.min(w, h) * 0.09;
    c.beginPath();
    c.arc(b.x1 + w * 0.82, b.y1 + h * 0.26, ballR, 0, Math.PI * 2);
    c.stroke();
  }
});




shape({
  key: 'rainbow', cat: 'sketch', geom: 'box', label: '彩虹',
  icon: '<path d="M3 18a9 9 0 0 1 18 0"/>' +
        '<path d="M5 18a7 7 0 0 1 14 0" stroke-opacity="0.75"/>' +
        '<path d="M7 18a5 5 0 0 1 10 0" stroke-opacity="0.5"/>',
  draw(c, o, U) {
    const b = U.bbox(o);
    const cx = (b.x1 + b.x2) / 2;
    const baseY = b.y2 - h_rel(b) * 0.08;
    const Rmax = Math.min(b.w / 2, b.h * 0.92) * 0.92;
    const colors = ['#e53935','#fb8c00','#fdd835','#43a047','#00acc1','#1e88e5','#8e24aa'];
    const arcW = Rmax * 0.075;

    function h_rel(x) { return b.h; }

    c.save();
    c.lineWidth = arcW;
    c.lineCap = 'butt';
    for (let i = 0; i < 7; i++) {
      c.strokeStyle = colors[i];
      const r = Rmax - arcW * (i + 0.5);
      c.beginPath();
      c.arc(cx, baseY, r, Math.PI, Math.PI * 2);
      c.stroke();
    }
    c.restore();

    /* 左侧云朵 */
    const cloudY = baseY;
    const cloudR = Rmax * 0.16;
    const cloudX = cx - Rmax - cloudR * 0.55;
    c.beginPath();
    c.arc(cloudX,          cloudY - cloudR * 0.20, cloudR * 0.65, 0, Math.PI * 2);
    c.arc(cloudX + cloudR * 0.75, cloudY - cloudR * 0.55, cloudR * 0.85, 0, Math.PI * 2);
    c.arc(cloudX + cloudR * 1.60, cloudY - cloudR * 0.20, cloudR * 0.65, 0, Math.PI * 2);
    c.stroke();

    /* 右侧云朵 */
    const cloudX2 = cx + Rmax + cloudR * 0.55;
    c.beginPath();
    c.arc(cloudX2,          cloudY - cloudR * 0.20, cloudR * 0.65, 0, Math.PI * 2);
    c.arc(cloudX2 - cloudR * 0.75, cloudY - cloudR * 0.55, cloudR * 0.85, 0, Math.PI * 2);
    c.arc(cloudX2 - cloudR * 1.60, cloudY - cloudR * 0.20, cloudR * 0.65, 0, Math.PI * 2);
    c.stroke();
  }
});


shape({
  key: 'heart', cat: 'sketch', geom: 'box', label: '心形',
  icon: '<path d="M12 21C5 16 2 12 2 8.5A4.5 4.5 0 0 1 12 6a4.5 4.5 0 0 1 10 2.5C22 12 19 16 12 21z"/>',
  draw(c, o, U) {
    const b = U.bbox(o);
    const cx = (b.x1 + b.x2) / 2;
    const w = b.w, h = b.h;
    const topLobeY = b.y1 + h * 0.22;
    const botY = b.y2 - h * 0.02;
    const halfW = w * 0.46;

    c.beginPath();
    c.moveTo(cx, b.y1 + h * 0.40);
    c.bezierCurveTo(cx - halfW * 0.30, b.y1 + h * 0.06,
                    cx - halfW,        b.y1 + h * 0.20,
                    cx - halfW,        topLobeY + h * 0.20);
    c.bezierCurveTo(cx - halfW,        botY - h * 0.20,
                    cx - halfW * 0.35, botY - h * 0.06,
                    cx,                botY);
    c.bezierCurveTo(cx + halfW * 0.35, botY - h * 0.06,
                    cx + halfW,        botY - h * 0.20,
                    cx + halfW,        topLobeY + h * 0.20);
    c.bezierCurveTo(cx + halfW,        b.y1 + h * 0.20,
                    cx + halfW * 0.30, b.y1 + h * 0.06,
                    cx,                b.y1 + h * 0.40);
    c.closePath();
    c.stroke();

    /* 右上角高光 */
    c.save();
    c.lineWidth = Math.max(0.6, (o.size || 4) * 0.35);
    c.beginPath();
    c.moveTo(cx + halfW * 0.30, b.y1 + h * 0.20);
    c.quadraticCurveTo(cx + halfW * 0.45, b.y1 + h * 0.26,
                       cx + halfW * 0.40, b.y1 + h * 0.38);
    c.stroke();
    c.restore();
  }
});


shape({
  key: 'star5', cat: 'sketch', geom: 'box', label: '五角星',
  icon: '<path d="M12 2l2.9 6.5L22 9.3l-5 4.8 1.3 7L12 17.7 5.7 21l1.3-7-5-4.8 7.1-.8z"/>',
  draw(c, o, U) {
    const b = U.bbox(o);
    const cx = (b.x1 + b.x2) / 2;
    const cy = (b.y1 + b.y2) / 2;
    const Rx = b.w / 2;
    const Ry = b.h / 2;

    /* 正五角星：外顶点半径 R，内凹点半径 r = R·sin(18°)/sin(54°) ≈ 0.382R */
    const rRatio = 0.382;
    const pts = [];
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + i * Math.PI / 5;
      const rr = (i % 2 === 0) ? 1 : rRatio;
      pts.push({ x: cx + Rx * rr * Math.cos(a),
                 y: cy + Ry * rr * Math.sin(a) });
    }
    c.beginPath();
    pts.forEach((p, i) => i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y));
    c.closePath();
    c.stroke();
  }
});



shape({
  key: 'spaceStation', cat: 'sketch', geom: 'box', label: '空间站',
  icon: '<rect x="9" y="4" width="6" height="16" rx="1"/>' +
        '<rect x="2" y="10" width="6" height="4" rx="0.5"/>' +
        '<rect x="16" y="10" width="6" height="4" rx="0.5"/>' +
        '<path d="M8 12h1M15 12h1"/>',
  draw(c, o, U) {
    const b = U.bbox(o);
    const w = b.w, h = b.h;
    const cx = (b.x1 + b.x2) / 2;
    const cy = (b.y1 + b.y2) / 2;

    /* ---- 核心舱 ---- */
    const coreW = w * 0.14;
    const coreH = h * 0.62;
    const rr = Math.min(coreW, coreH) * 0.22;
    c.beginPath();
    if (c.roundRect) c.roundRect(cx - coreW / 2, cy - coreH / 2, coreW, coreH, rr);
    else c.rect(cx - coreW / 2, cy - coreH / 2, coreW, coreH);
    c.stroke();

    /* 核心舱横向分隔 */
    c.save();
    c.lineWidth = Math.max(0.5, (o.size || 4) * 0.3);
    [0.25, 0.50, 0.75].forEach(f => {
      const y = cy - coreH / 2 + coreH * f;
      c.beginPath();
      c.moveTo(cx - coreW / 2, y);
      c.lineTo(cx + coreW / 2, y);
      c.stroke();
    });
    c.restore();

    /* ---- 太阳能板 ---- */
    const panelW = w * 0.32;
    const panelH = h * 0.16;

    [-1, 1].forEach(dir => {
      const px = dir < 0
        ? cx - coreW / 2 - panelW - w * 0.015
        : cx + coreW / 2 + w * 0.015;

      const rrP = Math.min(panelW, panelH) * 0.08;
      c.beginPath();
      if (c.roundRect) c.roundRect(px, cy - panelH / 2, panelW, panelH, rrP);
      else c.rect(px, cy - panelH / 2, panelW, panelH);
      c.stroke();

      /* 格纹 */
      c.save();
      c.lineWidth = Math.max(0.4, (o.size || 4) * 0.25);
      const cols = 5, rows = 2;
      for (let i = 1; i < cols; i++) {
        const gx = px + panelW * i / cols;
        c.beginPath();
        c.moveTo(gx, cy - panelH / 2);
        c.lineTo(gx, cy + panelH / 2);
        c.stroke();
      }
      for (let j = 1; j < rows; j++) {
        const gy = cy - panelH / 2 + panelH * j / rows;
        c.beginPath();
        c.moveTo(px, gy);
        c.lineTo(px + panelW, gy);
        c.stroke();
      }
      c.restore();

      /* 连接杆 */
      c.beginPath();
      const x1 = dir < 0 ? cx - coreW / 2 : cx + coreW / 2;
      const x2 = dir < 0 ? px + panelW : px;
      c.moveTo(x1, cy);
      c.lineTo(x2, cy);
      c.stroke();
    });

    /* ---- 上下对接口 ---- */
    c.beginPath();
    c.arc(cx, cy - coreH / 2 - h * 0.02, coreW * 0.42, Math.PI, 0, false);
    c.stroke();
    c.beginPath();
    c.arc(cx, cy + coreH / 2 + h * 0.02, coreW * 0.42, 0, Math.PI, false);
    c.stroke();
  }
});


/* ==========================================================================
 * 18. 动画图形：圆环-小球 / 半圆槽小球 / 弹簧连接体
 * ========================================================================== */
/* ---- 半圆槽小球（对应 anim_sliding_slot_ball） ---- */
param('ssbTheta0', { label: '初始摆角', min: 1,    max: 90, step: 1,    def: 50,  unit: '°' });
param('ssbK',      { label: '质量比 k', min: 0.05, max: 10, step: 0.05, def: 3 });
param('ssbBallR',  { label: '球半径',   min: 2,    max: 20, step: 0.5,  def: 5 });
param('ssbPeriod', { label: '周期',     min: 0.2,  max: 6,  step: 0.1,  def: 1.5, unit: 's' });
/* ---- 光滑圆环-小球 ---- */
shape({
  key: 'anim_ring_ball',
  cat: 'anim',
  geom: 'rect',
  label: '光滑圆环-小球',
  icon: '<line x1="2" y1="6" x2="22" y2="6"/>' +
        '<circle cx="9" cy="6" r="2"/>' +
        '<line x1="9" y1="6" x2="15" y2="16"/>' +
        '<circle cx="15" cy="16" r="2" fill="currentColor"/>',
  animatable: true,
  params: ['ringTheta0', 'ringK', 'ringLen', 'ringPeriod'],

  draw(c, o, U2) {
    const AN = (window.PhysBoard && window.PhysBoard.animState) || { t: 0 };
    const b  = U2.bbox(o);

    const theta0 = ((o.ringTheta0 != null ? o.ringTheta0 : 60) * Math.PI) / 180;
    const k      = Math.max(0.05, o.ringK || 2);
    const Lratio = Math.max(0.2, Math.min(1.0, o.ringLen || 0.7));
    const T0     = Math.max(0.2, o.ringPeriod || 1.5);
    const omega0 = 2 * Math.PI / T0;

    if (!o._ringState ||
        o._ringTheta0Cache !== theta0 ||
        o._ringKCache      !== k) {
      o._ringState = { theta: theta0, omega: 0, lastT: AN.t, trail: [] };
      o._ringTheta0Cache = theta0;
      o._ringKCache      = k;
    }
    const S = o._ringState;

    let dTau = (AN.t - S.lastT) * omega0;
    if (!isFinite(dTau) || dTau < 0 || dTau > 0.5) {
      S.theta = theta0; S.omega = 0; dTau = 0;
      S.trail = [];
    }
    S.lastT = AN.t;

    if (dTau > 1e-7) {
      const nSub = Math.max(1, Math.ceil(dTau / 0.02));
      const h    = dTau / nSub;
      const kp1  = k + 1;
      const accel = (th, om) => {
        const s = Math.sin(th);
        return -s * (Math.cos(th) * om * om + kp1) / (k + s * s);
      };
      for (let i = 0; i < nSub; i++) {
        const th = S.theta, om = S.omega;
        const k1t = om,             k1o = accel(th, om);
        const k2t = om + h * 0.5 * k1o, k2o = accel(th + h * 0.5 * k1t, om + h * 0.5 * k1o);
        const k3t = om + h * 0.5 * k2o, k3o = accel(th + h * 0.5 * k2t, om + h * 0.5 * k2o);
        const k4t = om + h * k3o,       k4o = accel(th + h * k3t, om + h * k3o);
        S.theta += h / 6 * (k1t + 2 * k2t + 2 * k3t + k4t);
        S.omega += h / 6 * (k1o + 2 * k2o + 2 * k3o + k4o);
      }
    }

    const theta = S.theta;
    const sinT  = Math.sin(theta);
    const cosT  = Math.cos(theta);

    const rodY  = b.y1 + 10;
    const cx    = (b.x1 + b.x2) / 2;
    const Lpix  = Math.min(b.h - 20, b.w * 0.6) * Lratio;

    const xRing = cx - Lpix * sinT / (k + 1);
    const xBall = cx + Lpix * sinT * k / (k + 1);
    const yBall = rodY + Lpix * cosT;

    c.beginPath();
    c.moveTo(b.x1, rodY);
    c.lineTo(b.x2, rodY);
    c.stroke();

    c.save();
    c.setLineDash([3, 3]);
    c.lineWidth = Math.max(1, (o.size || 4) * 0.4);
    c.strokeStyle = U2.alpha(o.color || '#1a1a1a', 0.3);
    c.beginPath();
    c.moveTo(xRing, rodY);
    c.lineTo(xRing, rodY + Lpix);
    c.stroke();
    c.restore();

    c.save();
    c.lineWidth = Math.max(1.2, (o.size || 4) * 0.55);
    c.beginPath();
    c.moveTo(xRing, rodY);
    c.lineTo(xBall, yBall);
    c.stroke();
    c.restore();

    if (!S.trail) S.trail = [];
    if (AN.playing) {
      const lastP = S.trail.length ? S.trail[S.trail.length - 1] : null;
      if (!lastP || Math.hypot(xBall - lastP.x, yBall - lastP.y) > 2) {
        S.trail.push({ x: xBall, y: yBall });
        if (S.trail.length > 1200) S.trail.shift();
      }
    }
    if (S.trail.length > 1) {
      c.save();
      c.setLineDash([5, 4]);
      c.strokeStyle = 'rgba(229,57,53,0.55)';
      c.lineWidth = 1.6;
      c.beginPath();
      c.moveTo(S.trail[0].x, S.trail[0].y);
      for (let i = 1; i < S.trail.length; i++) {
        c.lineTo(S.trail[i].x, S.trail[i].y);
      }
      c.stroke();
      c.restore();
    }

    const ringRad = Math.max(4, Math.min(8, Lpix * 0.06));
    c.save();
    c.lineWidth = Math.max(2, (o.size || 4) * 0.6);
    c.beginPath();
    c.arc(xRing, rodY, ringRad, 0, Math.PI * 2);
    c.fillStyle = '#fff';
    c.fill();
    c.stroke();
    c.restore();

    const ballR = Math.max(5, Math.min(Lpix * 0.08, b.w * 0.06));
    c.beginPath();
    c.arc(xBall, yBall, ballR, 0, Math.PI * 2);
    c.fillStyle = U2.alpha(o.color || '#1a1a1a', 0.6);
    c.fill();
    c.stroke();
    c.save();
    c.beginPath();
    c.arc(xBall - ballR * 0.3, yBall - ballR * 0.3, ballR * 0.28, 0, Math.PI * 2);
    c.fillStyle = 'rgba(255,255,255,0.7)';
    c.fill();
    c.restore();

    if (Math.abs(theta) > 0.05) {
      const arcR = Math.min(Lpix * 0.28, 34);
      c.save();
      c.strokeStyle = U2.alpha(o.color || '#1a1a1a', 0.4);
      c.lineWidth = 1.4;
      c.beginPath();
      c.arc(xRing, rodY, arcR, Math.PI / 2, Math.PI / 2 - theta, theta > 0);
      c.stroke();
      c.restore();
    }

    c.save();
    c.fillStyle = 'rgba(229,57,53,0.8)';
    c.beginPath();
    c.arc(cx, rodY + 4, 3, 0, Math.PI * 2);
    c.fill();
    c.restore();
  }
});

/* ---- 半圆凹槽 + 小球 ---- */
shape({
  key: 'anim_sliding_slot_ball',
  cat: 'anim',
  geom: 'box',
  label: '半圆槽小球',
  icon: '<path d="M3 5h3a6 6 0 0 0 12 0h3v14H3z"/><circle cx="12" cy="9" r="2" fill="currentColor"/>',
  animatable: true,
  params: ['ssbTheta0', 'ssbK', 'ssbBallR', 'ssbPeriod'],

  draw(c, o, U2) {
    const AN = (window.PhysBoard && window.PhysBoard.animState) || { t: 0 };
    const b  = U2.bbox(o);

    const theta0 = ((o.ssbTheta0 != null ? o.ssbTheta0 : 50) * Math.PI) / 180;
    const k      = Math.max(0.05, o.ssbK || 3);
    const ballR0 = Math.max(2, o.ssbBallR || 5);
    const T0     = Math.max(0.2, o.ssbPeriod || 1.5);
    const omega0 = (2 * Math.PI) / T0;

    if (!window.__ssbStates) window.__ssbStates = new WeakMap();
    let S = window.__ssbStates.get(o);
    if (!S || S.theta0 !== theta0 || S.k !== k) {
      S = { theta: theta0, omega: 0, lastT: AN.t, theta0, k, trail: [] };
      window.__ssbStates.set(o, S);
    }

    let dTau = (AN.t - S.lastT) * omega0;
    if (!isFinite(dTau) || dTau < 0 || dTau > 0.5) {
      S.theta = theta0; S.omega = 0; dTau = 0;
      S.trail = [];
    }
    S.lastT = AN.t;

    if (dTau > 1e-7) {
      const nSub = Math.max(1, Math.ceil(dTau / 0.02));
      const h    = dTau / nSub;
      const accel = (th, om) => {
        const s = Math.sin(th);
        return -s * (Math.cos(th) * om * om + k) / (k + s * s);
      };
      for (let i = 0; i < nSub; i++) {
        const th = S.theta, om = S.omega;
        const k1t = om,             k1o = accel(th, om);
        const k2t = om + h*0.5*k1o, k2o = accel(th + h*0.5*k1t, om + h*0.5*k1o);
        const k3t = om + h*0.5*k2o, k3o = accel(th + h*0.5*k2t, om + h*0.5*k2o);
        const k4t = om + h*k3o,     k4o = accel(th + h*k3t, om + h*k3o);
        S.theta += h/6 * (k1t + 2*k2t + 2*k3t + k4t);
        S.omega += h/6 * (k1o + 2*k2o + 2*k3o + k4o);
      }
    }

    const theta = S.theta;
    const sinT  = Math.sin(theta);
    const cosT  = Math.cos(theta);

    const bw  = b.w, bh = b.h;
    const r   = Math.min(bw / 2, bh * 0.9);
    const rEff = Math.max(r - ballR0, r * 0.3);
    const topY = b.y1;
    const botY = b.y2;
    const cx   = (b.x1 + b.x2) / 2;

    const X0 = cx - rEff * Math.sin(theta0) / (k + 1);

    const X_slot = X0 - rEff * (sinT - Math.sin(theta0)) / (k + 1);
    const X_ball = X_slot + rEff * sinT;
    const Y_ball = topY + rEff * cosT;

    const slotLeft  = X_slot - bw / 2;
    const slotRight = X_slot + bw / 2;

    c.beginPath();
    c.moveTo(slotLeft, topY);
    c.lineTo(X_slot - r, topY);
    c.arc(X_slot, topY, r, Math.PI, 0, true);
    c.lineTo(slotRight, topY);
    c.lineTo(slotRight, botY);
    c.lineTo(slotLeft, botY);
    c.closePath();
    if (o.fill) {
      c.fillStyle = U2.alpha(o.color || '#1a1a1a', 0.15);
      c.fill();
    }
    c.stroke();

    c.save();
    c.setLineDash([3, 3]);
    c.lineWidth   = Math.max(1, (o.size || 4) * 0.4);
    c.strokeStyle = U2.alpha(o.color || '#1a1a1a', 0.35);

    c.beginPath();
    c.moveTo(X_slot, topY);
    c.lineTo(X_slot, topY + r);
    c.stroke();

    c.beginPath();
    c.moveTo(X_slot, topY);
    c.lineTo(X_ball, Y_ball);
    c.stroke();
    c.restore();

    c.beginPath();
    c.arc(X_ball, Y_ball, ballR0, 0, Math.PI * 2);
    c.fillStyle = U2.alpha(o.color || '#1a1a1a', 0.65);
    c.fill();
    c.stroke();

    c.save();
    c.beginPath();
    c.arc(X_ball - ballR0 * 0.3, Y_ball - ballR0 * 0.3, ballR0 * 0.28, 0, Math.PI * 2);
    c.fillStyle = 'rgba(255,255,255,0.7)';
    c.fill();
    c.restore();

    if (!S.trail) S.trail = [];
    if (AN.playing) {
      const lastP = S.trail.length ? S.trail[S.trail.length - 1] : null;
      if (!lastP || Math.hypot(X_ball - lastP.x, Y_ball - lastP.y) > 2) {
        S.trail.push({ x: X_ball, y: Y_ball });
        if (S.trail.length > 1500) S.trail.shift();
      }
    }
    if (S.trail.length > 1) {
      c.save();
      c.setLineDash([5, 4]);
      c.strokeStyle = 'rgba(229,57,53,0.55)';
      c.lineWidth = 1.6;
      c.beginPath();
      c.moveTo(S.trail[0].x, S.trail[0].y);
      for (let i = 1; i < S.trail.length; i++) {
        c.lineTo(S.trail[i].x, S.trail[i].y);
      }
      c.stroke();
      c.restore();
    }

    c.save();
    c.fillStyle = 'rgba(229,57,53,0.8)';
    c.beginPath();
    c.arc(cx, topY + 3, 2.5, 0, Math.PI * 2);
    c.fill();
    c.restore();
  }
});

/* ---- 弹簧连接体（实验室参考系） ---- */
param('sprV0',     { label: '初速度v₀', min: 0.1, max: 1.5, step: 0.05, def: 0.4, unit: '×宽/s' });
param('sprPeriod', { label: '周期T',     min: 0.4, max: 2.5, step: 0.1,  def: 1.2, unit: 's' });
param('sprKR',     { label: '质量比B/A', min: 0.3, max: 4,   step: 0.1,  def: 1 });
param('sprGap',    { label: '弹簧原长',  min: 0.10, max: 0.35, step: 0.01, def: 0.18, unit: '×宽' });
param('sprSize',   { label: '物块大小',  min: 10,  max: 40,  step: 1,    def: 22 });

shape({
  key: 'anim_spring_cart',
  cat: 'anim',
  geom: 'box',
  label: '弹簧连接体',
  icon: '<rect x="2" y="9" width="4" height="6" fill="currentColor"/>' +
        '<rect x="18" y="9" width="4" height="6" fill="currentColor"/>' +
        '<path d="M6 12 L8 9 L10.5 15 L13 9 L15.5 15 L18 12" ' +
        'fill="none" stroke="currentColor" stroke-width="1.2"/>',
  animatable: true,
  params: ['sprV0', 'sprPeriod', 'sprKR', 'sprGap', 'sprSize'],

  draw(c, o, U2) {
    const AN = (window.PhysBoard && window.PhysBoard.animState) || { t: 0 };
    const b  = U2.bbox(o);

    const v0   = Math.max(0.05, o.sprV0     ?? 0.4);
    const T    = Math.max(0.2,  o.sprPeriod ?? 1.2);
    const k    = Math.max(0.1,  o.sprKR     ?? 1);
    const gapR = Math.max(0.05, Math.min(0.5, o.sprGap ?? 0.18));
    const blkH = Math.max(8, Math.min(b.h * 0.5, o.sprSize ?? 22));

    if (!window.__sprCartStates) window.__sprCartStates = new WeakMap();
    let S = window.__sprCartStates.get(o);
    const sig = v0 + '|' + T + '|' + k + '|' + gapR + '|' + b.w + '|' + blkH;
    if (!S || S.sig !== sig) {
      S = { tLocal: 0, lastT: AN.t, sig };
      window.__sprCartStates.set(o, S);
    }
    let dT = AN.t - S.lastT;
    if (!isFinite(dT) || dT < 0 || dT > 0.5) {
      S.tLocal = 0;
      dT = 0;
    }
    S.tLocal += dT;
    S.lastT = AN.t;

    const MA = 1, MB = k, M = MA + MB;
    const w  = b.w;
    const groundY = b.y2 - 2;
    const blkW = Math.max(10, blkH * 0.75);
    const L0   = gapR * w;
    const D0   = L0 + blkW;
    const v0_px  = v0 * w;
    const vcm_px = v0_px / M;
    const omega  = 2 * Math.PI / T;
    const A_rel  = v0_px / omega;

    const xA0  = b.x1 + 0.15 * w;
    const xcm0 = xA0 + (MB / M) * D0;

    const t = S.tLocal;
    const r_rel = -A_rel * Math.sin(omega * t);
    const xcm   = xcm0 + vcm_px * t;
    const xA    = xcm - (MB / M) * (D0 + r_rel);
    const xB    = xcm + (MA / M) * (D0 + r_rel);

    const lineW = Math.max(1, (o.size || 4) * 0.55);

    c.save();
    c.lineWidth = lineW;
    c.beginPath();
    c.moveTo(b.x1, groundY);
    c.lineTo(b.x2, groundY);
    c.stroke();
    c.strokeStyle = U2.alpha(o.color || '#1a1a1a', 0.32);
    c.lineWidth = Math.max(0.8, (o.size || 4) * 0.4);
    for (let x = b.x1 + 8; x < b.x2 - 4; x += 12) {
      c.beginPath();
      c.moveTo(x, groundY + 1);
      c.lineTo(x + 4, groundY + 5);
      c.stroke();
    }
    c.restore();

    const springY = groundY - blkH / 2;
    const spX1 = xA + blkW / 2;
    const spX2 = xB - blkW / 2;
    const spLen = spX2 - spX1;

    c.save();
    c.lineWidth = Math.max(1, (o.size || 4) * 0.55);
    if (spLen < 6) {
      c.beginPath();
      c.moveTo(spX1, springY);
      c.lineTo(spX2, springY);
      c.stroke();
    } else {
      const coils = Math.max(4, Math.min(12, Math.round(spLen / 11)));
      const amp   = Math.min(9, spLen / (coils * 2.5));
      const total = coils * 2;
      c.beginPath();
      c.moveTo(spX1, springY);
      for (let i = 1; i < total; i++) {
        const x = spX1 + spLen * (i / total);
        const dy = (i % 2 === 0 ? -amp : amp);
        c.lineTo(x, springY + dy);
      }
      c.lineTo(spX2, springY);
      c.stroke();
    }
    c.restore();

    const drawBlock = (cx, label) => {
      const bx = cx - blkW / 2;
      const by = groundY - blkH;
      c.save();
      c.beginPath();
      c.rect(bx, by, blkW, blkH);
      c.fillStyle = U2.alpha(o.color || '#1a1a1a', 0.20);
      c.fill();
      c.lineWidth = Math.max(1.2, (o.size || 4) * 0.7);
      c.stroke();
      if (blkW >= 12 && blkH >= 12) {
        c.fillStyle = U2.alpha(o.color || '#1a1a1a', 0.92);
        c.font = 'bold ' + Math.min(blkW, blkH) * 0.6 + 'px system-ui, sans-serif';
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.fillText(label, cx, by + blkH / 2);
      }
      c.restore();
    };
    drawBlock(xA, 'A');
    drawBlock(xB, 'B');

    c.save();
    c.setLineDash([2, 4]);
    c.strokeStyle = 'rgba(229,57,53,0.5)';
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(xcm, b.y1 + 4);
    c.lineTo(xcm, groundY);
    c.stroke();
    c.setLineDash([]);
    c.fillStyle = 'rgba(229,57,53,0.85)';
    c.beginPath();
    c.moveTo(xcm, b.y1 + 10);
    c.lineTo(xcm - 5, b.y1 + 3);
    c.lineTo(xcm + 5, b.y1 + 3);
    c.closePath();
    c.fill();
    c.restore();

    const vA_px = vcm_px + (MB / M) * A_rel * omega * Math.cos(omega * t);
    const vB_px = vcm_px - (MA / M) * A_rel * omega * Math.cos(omega * t);
    const drawArrow = (px, py, v) => {
      const len = v * 0.25;
      if (Math.abs(len) < 6) return;
      const dir = Math.sign(len);
      c.save();
      c.strokeStyle = '#43a047';
      c.fillStyle = '#43a047';
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(px, py);
      c.lineTo(px + len, py);
      c.stroke();
      c.beginPath();
      c.moveTo(px + len, py);
      c.lineTo(px + len - 6 * dir, py - 4);
      c.lineTo(px + len - 6 * dir, py + 4);
      c.closePath();
      c.fill();
      c.restore();
    };
    drawArrow(xA, groundY - blkH - 8, vA_px);
    drawArrow(xB, groundY - blkH - 8, vB_px);
  }
});


/* ==========================================================================
 * 19. 类抛体运动
 * ========================================================================== */
(function () {
  var PB2 = window.PhysBoard;
  if (!PB2 || !PB2.shapes) return;

  var shape2 = function (d) {
    if (!d || !d.key) return;
    if (typeof PB2.register === 'function') PB2.register(d);
    else PB2.shapes[d.key] = d;
  };
  var cat2 = function (id, label) {
    if (!id) return;
    if (typeof PB2.category === 'function') PB2.category(id, label || id);
    else if (!PB2.categories.some(function (c) { return c.id === id; })) {
      PB2.categories.push({ id: id, label: label || id });
    }
  };

  if (!PB2.paramDefs) PB2.paramDefs = {};
  PB2.paramDefs.animPeriod = PB2.paramDefs.animPeriod ||
    { label: "周期",       min: 0.5,  max: 10,  step: 0.1, def: 2.5, unit: "s" };
  PB2.paramDefs.animV0 = PB2.paramDefs.animV0 ||
    { label: "初速度",     min: 1,    max: 100, step: 1,   def: 40 };
  PB2.paramDefs.animTheta0 = PB2.paramDefs.animTheta0 ||
    { label: "速度方向",   min: -180, max: 180, step: 1,   def: 60,  unit: "°" };
  PB2.paramDefs.animAccel = PB2.paramDefs.animAccel ||
    { label: "加速度",     min: 0,    max: 100, step: 1,   def: 20 };
  PB2.paramDefs.animThetaA = PB2.paramDefs.animThetaA ||
    { label: "加速度方向", min: -180, max: 180, step: 1,   def: -90, unit: "°" };

  shape2({
    key: "anim_projectile2",
    cat: "anim",
    geom: "rect",
    label: "类抛体运动",
    icon: '<path d="M3 19 Q 12 4 21 15"/><circle cx="3" cy="19" r="1.6" fill="currentColor"/>',
    animatable: true,
    params: ["animPeriod", "animV0", "animTheta0", "animAccel", "animThetaA"],

    draw: function (c, o, U) {
      var AN = (window.PhysBoard && window.PhysBoard.animState) || { t: 0 };
      var b = U.bbox(o);
      var pad = 18;
      var innerW = b.w - pad * 2;
      var innerH = b.h - pad * 2;
      if (innerW < 12 || innerH < 12) return;

      var v0   = (o.animV0     != null ? o.animV0     : 40);
      var th0  = (o.animTheta0 != null ? o.animTheta0 : 60)  * Math.PI / 180;
      var aMag = (o.animAccel  != null ? o.animAccel  : 20);
      var thA  = (o.animThetaA != null ? o.animThetaA : -90) * Math.PI / 180;

      var vx0 = v0 * Math.cos(th0);
      var vy0 = v0 * Math.sin(th0);
      var ax  = aMag * Math.cos(thA);
      var ay  = aMag * Math.sin(thA);

      var startX = b.x1 + pad;
      var startY = b.y2 - pad;

      var N = 140;
      var pts = [];
      var maxPosX = 0, maxPosY = 0;
      for (var i = 0; i <= N; i++) {
        var s = i / N;
        var x = vx0 * s + 0.5 * ax * s * s;
        var y = vy0 * s + 0.5 * ay * s * s;
        pts.push({ x: x, y: y });
        if (x > maxPosX) maxPosX = x;
        if (y > maxPosY) maxPosY = y;
      }

      var scaleX = maxPosX > 1e-6 ? innerW / maxPosX : Infinity;
      var scaleY = maxPosY > 1e-6 ? innerH / maxPosY : Infinity;
      var scale  = Math.min(scaleX, scaleY);
      if (!isFinite(scale) || scale <= 0) scale = 1;

      var toSX = function (px) { return startX + px * scale; };
      var toSY = function (py) { return startY - py * scale; };

      var baseColor = o.color || "#1a1a1a";
      var baseSize  = o.size  || 4;

      c.save();
      c.setLineDash([5, 4]);
      c.globalAlpha = 0.30;
      c.strokeStyle = baseColor;
      c.lineWidth = Math.max(1, baseSize * 0.7);
      c.beginPath();
      for (var k = 0; k <= N; k++) {
        var sx = toSX(pts[k].x), sy = toSY(pts[k].y);
        if (k === 0) c.moveTo(sx, sy); else c.lineTo(sx, sy);
      }
      c.stroke();
      c.restore();

      var T = Math.max(0.2, o.animPeriod || 2.5);
      var prog = ((AN.t || 0) % T) / T;
      if (prog < 0) prog += 1;
      var curIdx = Math.max(0, Math.min(N, Math.round(prog * N)));

      c.save();
      c.strokeStyle = baseColor;
      c.lineWidth = Math.max(1.4, baseSize * 0.8);
      c.beginPath();
      for (var m = 0; m <= curIdx; m++) {
        var mx = toSX(pts[m].x), my = toSY(pts[m].y);
        if (m === 0) c.moveTo(mx, my); else c.lineTo(mx, my);
      }
      c.stroke();
      c.restore();

      var ballR = Math.max(4, Math.min(innerW, innerH) * 0.045);

      c.save();
      c.globalAlpha = 0.40;
      c.fillStyle = baseColor;
      c.beginPath();
      c.arc(startX, startY, ballR * 0.55, 0, Math.PI * 2);
      c.fill();
      c.restore();

      var cur = pts[curIdx];
      var bx = toSX(cur.x), by = toSY(cur.y);
      c.save();
      c.globalAlpha = 0.72;
      c.fillStyle = baseColor;
      c.beginPath();
      c.arc(bx, by, ballR, 0, Math.PI * 2);
      c.fill();
      c.restore();
      c.beginPath();
      c.arc(bx, by, ballR, 0, Math.PI * 2);
      c.strokeStyle = baseColor;
      c.lineWidth = Math.max(1, baseSize * 0.6);
      c.stroke();

      var vxNow = vx0 + ax * prog;
      var vyNow = vy0 + ay * prog;
      var vMag = Math.sqrt(vxNow * vxNow + vyNow * vyNow);
      if (vMag > 1e-6) {
        var vLen = Math.min(innerW, innerH) * 0.22;
        var vex = bx + (vxNow / vMag) * vLen;
        var vey = by - (vyNow / vMag) * vLen;
        c.save();
        c.strokeStyle = "#43a047";
        c.lineWidth = Math.max(1.5, ballR * 0.42);
        c.beginPath();
        c.moveTo(bx, by);
        c.lineTo(vex, vey);
        c.stroke();
        U.arrowHead(c, bx, by, vex, vey, c.lineWidth);
        c.restore();
      }

      if (aMag > 1e-6) {
        var aLen = Math.min(innerW, innerH) * 0.18;
        var aex = bx + (ax / aMag) * aLen;
        var aey = by - (ay / aMag) * aLen;
        c.save();
        c.strokeStyle = "#f57c00";
        c.lineWidth = Math.max(1.4, ballR * 0.38);
        c.beginPath();
        c.moveTo(bx, by);
        c.lineTo(aex, aey);
        c.stroke();
        U.arrowHead(c, bx, by, aex, aey, c.lineWidth);
        c.restore();
      }
    }
  });
})();


/* ==========================================================================
 * 20. 一维碰撞
 * ========================================================================== */
(function () {
  var PB2 = window.PhysBoard;
  if (!PB2 || !PB2.shapes) return;

  if (!PB2.paramDefs) PB2.paramDefs = {};
  if (!PB2.paramDefs.animM1)
    PB2.paramDefs.animM1 = { label:'m₁', min:0.1, max:10, step:0.1, def:1, unit:'kg' };
  if (!PB2.paramDefs.animM2)
    PB2.paramDefs.animM2 = { label:'m₂', min:0.1, max:10, step:0.1, def:1, unit:'kg' };
  if (!PB2.paramDefs.animV1)
    PB2.paramDefs.animV1 = { label:'v₁', min:-10, max:10, step:0.1, def:3, unit:'m/s' };
  if (!PB2.paramDefs.animV2)
    PB2.paramDefs.animV2 = { label:'v₂', min:-10, max:10, step:0.1, def:-2, unit:'m/s' };
  if (!PB2.paramDefs.animRestitution)
    PB2.paramDefs.animRestitution = { label:'恢复系数', min:0, max:1, step:0.05, def:1 };

  if (!PB2.categories.some(function (c) { return c.id === 'anim'; })) {
    PB2.categories.push({ id: 'anim', label: '动画' });
  }

  function withAlpha(color, a) {
    var h = String(color || '#1a1a1a').replace('#', '');
    if (h.length === 3) h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
    var n = parseInt(h, 16);
    if (isNaN(n)) return 'rgba(0,0,0,' + a + ')';
    return 'rgba(' + ((n>>16)&255) + ',' + ((n>>8)&255) + ',' + (n&255) + ',' + a + ')';
  }

  function drawVelArrow(c, x, y, v, color) {
    if (Math.abs(v) < 0.05) return;
    var len = Math.min(50, Math.abs(v) * 8);
    var dir = v > 0 ? 1 : -1;
    var ex = x + dir * len;
    c.save();
    c.strokeStyle = withAlpha(color, 0.55);
    c.fillStyle = withAlpha(color, 0.55);
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(x, y);
    c.lineTo(ex - dir * 6, y);
    c.stroke();
    c.beginPath();
    c.moveTo(ex, y);
    c.lineTo(ex - dir * 6, y - 4);
    c.lineTo(ex - dir * 6, y + 4);
    c.closePath();
    c.fill();
    c.restore();
  }

  var def = {
    key: 'anim_collision1d',
    cat: 'anim',
    geom: 'rect',
    label: '一维碰撞',
    fill: false,
    icon: '<circle cx="7" cy="12" r="4"/><circle cx="17" cy="12" r="3"/>',
    animatable: true,
    params: ['animM1', 'animM2', 'animV1', 'animV2', 'animRestitution'],

    draw: function (c, o, U) {
      var AN = (window.PhysBoard && window.PhysBoard.animState) || { t: 0 };
      var b = U.bbox(o);
      if (b.w < 60 || b.h < 40) return;

      var m1 = (o.animM1 != null ? o.animM1 : 1);
      var m2 = (o.animM2 != null ? o.animM2 : 1);
      var v1 = (o.animV1 != null ? o.animV1 : 3);
      var v2 = (o.animV2 != null ? o.animV2 : -2);
      var e  = (o.animRestitution != null ? o.animRestitution : 1);

      var W = 10;
      var scale = b.w / W;

      var r1 = 0.30 * Math.cbrt(m1);
      var r2 = 0.30 * Math.cbrt(m2);

      var x10 = r1;
      var x20 = W - r2;

      var tC = Infinity;
      if (v1 > v2 + 1e-9) {
        var gap = (x20 - x10) - (r1 + r2);
        if (gap > 1e-9) tC = gap / (v1 - v2);
      }

      var sM = m1 + m2;
      var v1p = ((m1 - e * m2) * v1 + (1 + e) * m2 * v2) / sM;
      var v2p = ((1 + e) * m1 * v1 + (m2 - e * m1) * v2) / sM;

      var T = isFinite(tC) ? (tC * 2 + 0.6) : 5;
      var t = AN.t % T;

      var x1, x2, V1, V2;
      if (t < tC) {
        x1 = x10 + v1 * t;
        x2 = x20 + v2 * t;
        V1 = v1; V2 = v2;
      } else {
        var xc1 = x10 + v1 * tC;
        var xc2 = x20 + v2 * tC;
        x1 = xc1 + v1p * (t - tC);
        x2 = xc2 + v2p * (t - tC);
        V1 = v1p; V2 = v2p;
      }

      var py   = (b.y1 + b.y2) / 2;
      var px1  = b.x1 + x1 * scale;
      var px2  = b.x1 + x2 * scale;
      var rpx1 = r1 * scale;
      var rpx2 = r2 * scale;

      var alpha1 = 0.9 / (1 + 0.2 * m1);
      var alpha2 = 0.9 / (1 + 0.2 * m2);

      var color = o.color || '#1a1a1a';

      c.save();
      c.beginPath();
      var floorY = py + Math.max(rpx1, rpx2) + 4;
      c.moveTo(b.x1, floorY);
      c.lineTo(b.x2, floorY);
      c.strokeStyle = withAlpha(color, 0.25);
      c.setLineDash([5, 4]);
      c.lineWidth = 1.5;
      c.stroke();
      c.restore();

      c.save();
      c.beginPath();
      c.arc(px1, py, rpx1, 0, Math.PI * 2);
      c.fillStyle = withAlpha(color, alpha1);
      c.fill();
      c.strokeStyle = color;
      c.lineWidth = Math.max(1.4, (o.size || 4) * 0.55);
      c.stroke();
      c.restore();

      c.save();
      c.beginPath();
      c.arc(px2, py, rpx2, 0, Math.PI * 2);
      c.fillStyle = withAlpha(color, alpha2);
      c.fill();
      c.strokeStyle = color;
      c.lineWidth = Math.max(1.4, (o.size || 4) * 0.55);
      c.stroke();
      c.restore();

      c.save();
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillStyle = color;
      var fs1 = Math.max(10, Math.min(rpx1 * 0.95, 22));
      c.font = '600 ' + fs1 + 'px system-ui,"PingFang SC","Microsoft YaHei",sans-serif';
      c.fillText('m₁', px1, py);
      c.restore();

      c.save();
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillStyle = color;
      var fs2 = Math.max(10, Math.min(rpx2 * 0.95, 22));
      c.font = '600 ' + fs2 + 'px system-ui,"PingFang SC","Microsoft YaHei",sans-serif';
      c.fillText('m₂', px2, py);
      c.restore();

      drawVelArrow(c, px1, py - rpx1 - 14, V1, color);
      drawVelArrow(c, px2, py - rpx2 - 14, V2, color);
    }
  };

  if (typeof PB2.register === 'function') PB2.register(def);
  else PB2.shapes[def.key] = def;
})();








/* ==========================================================================
 * 21. 近代物理
 * ========================================================================== */
(function () {
  var PB2 = window.PhysBoard;
  if (!PB2) return;

  var shape2 = function (d) {
    if (!d || !d.key) return;
    if (typeof PB2.register === 'function') PB2.register(d);
    else PB2.shapes[d.key] = d;
  };
  var cat2 = function (id, label) {
    if (typeof PB2.category === 'function') PB2.category(id, label);
    else if (!PB2.categories.some(function (c) { return c.id === id; })) {
      PB2.categories.push({ id: id, label: label });
    }
  };

  cat2('modern', '近代物理');

  function withAlpha(color, a) {
    var h = String(color || '#1a1a1a').replace('#', '');
    if (h.length === 3) h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
    var n = parseInt(h, 16);
    if (isNaN(n)) return 'rgba(0,0,0,' + a + ')';
    return 'rgba(' + ((n>>16)&255) + ',' + ((n>>8)&255) + ',' + (n&255) + ',' + a + ')';
  }
  var FONT = 'system-ui,"PingFang SC","Microsoft YaHei",sans-serif';

  shape2({
    key: 'atom_structure', cat: 'modern', geom: 'rect', label: '原子结构',
    fill: true,
    icon: '<circle cx="12" cy="12" r="2" fill="currentColor"/><ellipse cx="12" cy="12" rx="9" ry="4" fill="none" stroke="currentColor"/><ellipse cx="12" cy="12" rx="4" ry="9" fill="none" stroke="currentColor"/>',
    draw: function (c, o, U) {
      var b = U.bbox(o);
      var cx = (b.x1 + b.x2) / 2, cy = (b.y1 + b.y2) / 2;
      var R = Math.min(b.w, b.h) * 0.42;

      var angles = [0, 60, 120];
      for (var i = 0; i < angles.length; i++) {
        c.save();
        c.translate(cx, cy);
        c.rotate(angles[i] * Math.PI / 180);
        c.beginPath();
        c.ellipse(0, 0, R, R * 0.38, 0, 0, Math.PI * 2);
        c.stroke();
        c.restore();
      }

      var eTs = [0.4, 1.9, 3.6];
      for (var i = 0; i < angles.length; i++) {
        var a = angles[i] * Math.PI / 180;
        var t = eTs[i];
        var ex = R * Math.cos(t);
        var ey = R * 0.38 * Math.sin(t);
        var px = cx + ex * Math.cos(a) - ey * Math.sin(a);
        var py = cy + ex * Math.sin(a) + ey * Math.cos(a);
        c.beginPath();
        c.arc(px, py, Math.max(2.5, R * 0.06), 0, Math.PI * 2);
        c.fillStyle = withAlpha(o.color, 0.7);
        c.fill();
        c.stroke();
      }

      c.beginPath();
      c.arc(cx, cy, R * 0.15, 0, Math.PI * 2);
      c.fillStyle = withAlpha(o.color, 0.5);
      c.fill();
      c.stroke();

      c.beginPath();
      c.arc(cx - R * 0.05, cy - R * 0.04, R * 0.05, 0, Math.PI * 2);
      c.stroke();
      c.beginPath();
      c.arc(cx + R * 0.05, cy + R * 0.04, R * 0.05, 0, Math.PI * 2);
      c.stroke();
    }
  });

  param('nInit',     { label: '初始能级', min: 1, max: 5, step: 1, def: 3 });
  param('nFinal',    { label: '最终能级', min: 1, max: 5, step: 1, def: 1 });
  param('arrowHue',  { label: '箭头色',   min: 0, max: 6, step: 1, def: 0 });

  shape2({
    key: 'hydrogen_levels', cat: 'modern', geom: 'rect', label: '氢原子能级',
    fill: false,
    icon: '<line x1="3" y1="20" x2="21" y2="20" stroke="currentColor"/>' +
          '<line x1="3" y1="14" x2="21" y2="14" stroke="currentColor"/>' +
          '<line x1="3" y1="9"  x2="21" y2="9"  stroke="currentColor"/>' +
          '<line x1="3" y1="5"  x2="21" y2="5"  stroke="currentColor"/>',
    params: ['nInit', 'nFinal', 'arrowHue'],
    draw: function (c, o, U) {
      var b = U.bbox(o);
      var x1 = b.x1 + 12, x2 = b.x2 - 12;
      var yTop = b.y1 + 14, yBot = b.y2 - 14;
      var h = yBot - yTop;

      var levels = [
        { n: 1, frac: 0,      E: -13.60, text: 'n=1    -13.6 eV' },
        { n: 2, frac: 0.75,   E: -3.40,  text: 'n=2    -3.40 eV'  },
        { n: 3, frac: 0.889,  E: -1.51,  text: 'n=3    -1.51 eV'  },
        { n: 4, frac: 0.9375, E: -0.85,  text: 'n=4    -0.85 eV'  },
        { n: 5, frac: 1.0,    E: 0,      text: 'n=∞    0'         }
      ];

      var fs = Math.max(9, Math.min(12, h * 0.08));
      c.font = fs + 'px ' + FONT;
      c.textBaseline = 'bottom';
      c.textAlign = 'left';

      for (var i = 0; i < levels.length; i++) {
        var L = levels[i];
        L.y = yBot - L.frac * h;
        c.beginPath();
        c.moveTo(x1, L.y);
        c.lineTo(x2, L.y);
        c.stroke();
        c.fillStyle = o.color;
        c.fillText(L.text, x1 + 2, L.y - 2);
      }

      var nI = Math.max(1, Math.min(5, Math.round(o.nInit  ?? 3)));
      var nF = Math.max(1, Math.min(5, Math.round(o.nFinal ?? 1)));
      if (nI === nF) return;

      var from = levels[nI - 1];
      var to   = levels[nF - 1];

      var arrowColor = (typeof HUE7 !== 'undefined')
        ? HUE7[Math.round(o.arrowHue ?? 0) % 7]
        : '#e53935';

      var arrowX = x1 + (x2 - x1) * 0.72;
      var ah = 7;

      c.save();
      c.setLineDash([6, 4]);
      c.lineWidth = Math.max(1, (o.size || 4) * 0.45);
      c.strokeStyle = arrowColor;
      c.beginPath();
      c.moveTo(arrowX, from.y);
      c.lineTo(arrowX, to.y);
      c.stroke();
      c.restore();

      var uy = to.y > from.y ? 1 : -1;
      c.beginPath();
      c.moveTo(arrowX, to.y);
      c.lineTo(arrowX - 4, to.y - uy * ah);
      c.lineTo(arrowX + 4, to.y - uy * ah);
      c.closePath();
      c.fillStyle = arrowColor;
      c.fill();

      var dE = Math.abs(from.E - to.E);
      var absorb = to.E > from.E;
      var label = 'ΔE = ' + dE.toFixed(2) + ' eV  (' + (absorb ? '吸收' : '发射') + ')';

      var midY = (from.y + to.y) / 2;
      c.textAlign = 'left';
      c.textBaseline = 'middle';
      c.fillStyle = arrowColor;
      c.fillText(label, arrowX + 10, midY);
    }
  });

})();


/* ==========================================================================
 * 22. 圆锥摆
 * ========================================================================== */
(function () {
  var PB2 = window.PhysBoard;
  if (!PB2) return;

  var shape2 = function (d) {
    if (!d || !d.key) return;
    if (typeof PB2.register === 'function') PB2.register(d);
    else PB2.shapes[d.key] = d;
  };
  var cat2 = function (id, label) {
    if (typeof PB2.category === 'function') PB2.category(id, label);
    else if (!PB2.categories.some(function (c) { return c.id === id; })) {
      PB2.categories.push({ id: id, label: label });
    }
  };

  function withAlpha(color, a) {
    var h = String(color || '#1a1a1a').replace('#', '');
    if (h.length === 3) h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
    var n = parseInt(h, 16);
    if (isNaN(n)) return 'rgba(0,0,0,' + a + ')';
    return 'rgba(' + ((n>>16)&255) + ',' + ((n>>8)&255) + ',' + (n&255) + ',' + a + ')';
  }

  if (!PB2.paramDefs) PB2.paramDefs = {};
  if (!PB2.paramDefs.animGravity)
    PB2.paramDefs.animGravity = { label:'重力加速度', min:1, max:30, step:0.5, def:10, unit:'m/s²' };
  if (!PB2.paramDefs.conicalL)
    PB2.paramDefs.conicalL = { label:'摆长', min:0.2, max:2, step:0.05, def:1, unit:'m' };
  if (!PB2.paramDefs.conicalTheta)
    PB2.paramDefs.conicalTheta = { label:'摆角', min:5, max:80, step:1, def:30, unit:'°' };

  shape2({
    key: 'anim_conical_pendulum',
    cat: 'anim',
    geom: 'rect',
    label: '圆锥摆',
    fill: false,
    icon: '<line x1="12" y1="3" x2="6" y2="18"/><line x1="12" y1="3" x2="18" y2="18"/><ellipse cx="12" cy="18" rx="6" ry="2" fill="none" stroke="currentColor"/><circle cx="18" cy="18" r="1.6" fill="currentColor"/>',
    animatable: true,
    params: ['conicalL', 'conicalTheta', 'animGravity'],

    draw: function (c, o, U) {
      var AN = (window.PhysBoard && window.PhysBoard.animState) || { t: 0 };
      var b = U.bbox(o);
      if (b.w < 40 || b.h < 40) return;

      var L  = (o.conicalL != null ? o.conicalL : 1);
      var th = (o.conicalTheta != null ? o.conicalTheta : 30) * Math.PI / 180;
      var g  = (o.animGravity != null ? o.animGravity : 10);

      var sinT = Math.sin(th), cosT = Math.cos(th);
      if (cosT < 0.05) cosT = 0.05;

      var padTop = 12, padBot = 24, padX = 14;
      var maxH = b.h - padTop - padBot;
      var maxR = Math.min(b.w / 2 - padX, b.w * 0.46);

      var LpxByH = maxH / cosT;
      var LpxByR = sinT > 1e-6 ? maxR / sinT : Infinity;
      var Lpx = Math.min(LpxByH, LpxByR);
      if (Lpx < 30) return;

      var pivotX = (b.x1 + b.x2) / 2;
      var pivotY = b.y1 + padTop;

      var radiusPx = Lpx * sinT;
      var heightPx = Lpx * cosT;
      var ballPlaneY = pivotY + heightPx;

      var KY = 0.32;
      var ellipseRY = radiusPx * KY;

      var omega = Math.sqrt(g / (L * cosT));
      var T = 2 * Math.PI / omega;

      var phi = 2 * Math.PI * (AN.t / T);

      c.save();
      c.setLineDash([4, 4]);
      c.strokeStyle = withAlpha(o.color, 0.30);
      c.lineWidth = Math.max(1, (o.size || 4) * 0.35);
      c.beginPath();
      c.moveTo(pivotX, pivotY);
      c.lineTo(pivotX, ballPlaneY);
      c.stroke();
      c.restore();

      c.save();
      c.setLineDash([5, 4]);
      c.strokeStyle = withAlpha(o.color, 0.40);
      c.lineWidth = Math.max(1, (o.size || 4) * 0.35);
      c.beginPath();
      c.ellipse(pivotX, ballPlaneY, radiusPx, ellipseRY, 0, Math.PI, 2 * Math.PI, false);
      c.stroke();
      c.restore();

      var arcR = Math.min(34, Lpx * 0.28);
      c.save();
      c.strokeStyle = withAlpha(o.color, 0.55);
      c.lineWidth = Math.max(1, (o.size || 4) * 0.35);
      c.beginPath();
      c.arc(pivotX, pivotY, arcR, Math.PI / 2, Math.PI / 2 - th, true);
      c.stroke();
      c.restore();

      c.save();
      c.fillStyle = o.color;
      c.font = Math.max(11, Math.min(14, Lpx * 0.08)) +
               'px system-ui,"PingFang SC","Microsoft YaHei",sans-serif';
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      var midAng = Math.PI / 2 - th / 2;
      c.fillText('θ',
        pivotX + Math.cos(midAng) * (arcR + 12),
        pivotY + Math.sin(midAng) * (arcR + 12));
      c.restore();

      c.save();
      c.beginPath();
      c.arc(pivotX, pivotY, Math.max(3, Lpx * 0.025), 0, Math.PI * 2);
      c.fillStyle = o.color;
      c.fill();
      c.restore();

      var bx = pivotX + radiusPx * Math.cos(phi);
      var by = ballPlaneY + ellipseRY * Math.sin(phi);
      var ballR = Math.max(5, Lpx * 0.055);

      var inFront = Math.sin(phi) >= 0;

      var drawStringAndBall = function () {
        c.save();
        c.beginPath();
        c.moveTo(pivotX, pivotY);
        c.lineTo(bx, by);
        c.strokeStyle = o.color;
        c.lineWidth = Math.max(1.2, (o.size || 4) * 0.5);
        c.stroke();
        c.restore();
        c.save();
        c.beginPath();
        c.arc(bx, by, ballR, 0, Math.PI * 2);
        c.fillStyle = withAlpha(o.color, 0.60);
        c.fill();
        c.strokeStyle = o.color;
        c.lineWidth = Math.max(1.4, (o.size || 4) * 0.55);
        c.stroke();
        c.restore();
      };

      if (!inFront) drawStringAndBall();

      c.save();
      c.strokeStyle = withAlpha(o.color, 0.75);
      c.lineWidth = Math.max(1, (o.size || 4) * 0.35);
      c.beginPath();
      c.ellipse(pivotX, ballPlaneY, radiusPx, ellipseRY, 0, 0, Math.PI, false);
      c.stroke();
      c.restore();

      if (inFront) drawStringAndBall();

      c.save();
      c.fillStyle = o.color;
      c.font = Math.max(10, Math.min(12, Lpx * 0.07)) +
               'px ui-monospace,Menlo,Consolas,monospace';
      c.textAlign = 'left';
      c.textBaseline = 'alphabetic';
      c.fillText(
        'ω = ' + omega.toFixed(2) + ' rad/s   T = ' + T.toFixed(2) + ' s',
        b.x1 + 6, b.y2 - 6
      );
      c.restore();
    }
  });
})();


/* ==========================================================================
 * 23. 弹簧振子动画（竖直 / 水平）
 * ========================================================================== */
param('vsPeriod', { label: '周期',     min: 0.3, max: 4,  step: 0.1, def: 1.2, unit: 's' });
param('vsAmp',    { label: '振幅',     min: 5,   max: 100, step: 1,  def: 40 });
param('vsCoils',  { label: '弹簧圈数', min: 3,   max: 20,  step: 1,  def: 8 });
param('vsBlock',  { label: '物块大小', min: 12,  max: 60,  step: 1,  def: 28 });

param('hsPeriod', { label: '周期',     min: 0.3, max: 4,  step: 0.1, def: 1.2, unit: 's' });
param('hsAmp',    { label: '振幅',     min: 5,   max: 100, step: 1,  def: 40 });
param('hsCoils',  { label: '弹簧圈数', min: 3,   max: 20,  step: 1,  def: 8 });
param('hsBlock',  { label: '物块大小', min: 12,  max: 60,  step: 1,  def: 28 });

/* ---- 竖直弹簧振子动画 ---- */
shape({
  key: 'anim_spring_vertical',
  cat: 'anim',
  geom: 'box',
  label: '竖直弹簧振子',
  icon: '<line x1="4" y1="3" x2="20" y2="3"/>' +
        '<path d="M12 3 L9 6 L15 9 L9 12 L15 15 L12 17" ' +
        'fill="none" stroke="currentColor" stroke-width="1.2"/>' +
        '<rect x="7" y="17" width="10" height="5" fill="currentColor"/>',
  animatable: true,
  params: ['vsPeriod', 'vsAmp', 'vsCoils', 'vsBlock'],

  draw(c, o, U2) {
    const AN = (window.PhysBoard && window.PhysBoard.animState) || { t: 0 };
    const b  = U2.bbox(o);

    const T      = Math.max(0.2, o.vsPeriod || 1.2);
    const omega  = (2 * Math.PI) / T;
    const blockH = Math.max(8, Math.min(b.h * 0.35, o.vsBlock || 28));
    const blockW = blockH * 1.1;
    const coils  = Math.max(3, Math.min(20, Math.round(o.vsCoils || 8)));

    const cx       = (b.x1 + b.x2) / 2;
    const topY     = b.y1 + 8;
    const beamHalf = Math.min(b.w * 0.35, 60);

    const eqBlockTop = b.y1 + b.h / 2 - blockH / 2;

    const maxAmp = Math.max(5, b.h / 2 - blockH / 2 - 28);
    const amp    = Math.max(3, Math.min(o.vsAmp || 40, maxAmp));

    const yOff   = amp * Math.cos(omega * AN.t);
    const blockY = eqBlockTop + yOff;

    c.beginPath();
    c.moveTo(cx - beamHalf, topY);
    c.lineTo(cx + beamHalf, topY);
    c.stroke();

    c.save();
    c.lineWidth = Math.max(1, (o.size || 4) * 0.4);
    for (let x = cx - beamHalf + 3; x < cx + beamHalf - 2; x += 8) {
      c.beginPath();
      c.moveTo(x, topY);
      c.lineTo(x - 4, topY - 5);
      c.stroke();
    }
    c.restore();

    const springTopY = topY + 1;
    const springBotY = Math.max(springTopY + 4, blockY);
    const springAmp  = Math.min(12, blockW * 0.55);
    const total = coils * 2;
    c.beginPath();
    c.moveTo(cx, springTopY);
    if (springBotY - springTopY < 12) {
      c.lineTo(cx, springBotY);
    } else {
      for (let i = 1; i < total; i++) {
        const yy = springTopY + (springBotY - springTopY) * i / total;
        const xx = cx + (i % 2 === 0 ? -springAmp : springAmp);
        c.lineTo(xx, yy);
      }
      c.lineTo(cx, springBotY);
    }
    c.stroke();

    c.save();
    c.setLineDash([3, 4]);
    c.strokeStyle = U2.alpha(o.color || '#1a1a1a', 0.3);
    c.lineWidth = 1;
    const eqY = eqBlockTop + blockH / 2;
    c.beginPath();
    c.moveTo(b.x1 + 6, eqY);
    c.lineTo(b.x2 - 6, eqY);
    c.stroke();
    c.restore();

    c.beginPath();
    c.rect(cx - blockW / 2, blockY, blockW, blockH);
    c.fillStyle = U2.alpha(o.color || '#1a1a1a', 0.22);
    c.fill();
    c.stroke();

    const v = -amp * omega * Math.sin(omega * AN.t);
    if (Math.abs(v) > 3) {
      const dir = Math.sign(v);
      const vlen = Math.min(50, Math.abs(v) * 0.15);
      const arrowX = cx + blockW / 2 + 8;
      const startY = blockY + blockH / 2;

      c.save();
      c.strokeStyle = '#43a047';
      c.fillStyle   = '#43a047';
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(arrowX, startY);
      c.lineTo(arrowX, startY + vlen * dir);
      c.stroke();
      c.beginPath();
      c.moveTo(arrowX, startY + vlen * dir);
      c.lineTo(arrowX - 4, startY + vlen * dir - 6 * dir);
      c.lineTo(arrowX + 4, startY + vlen * dir - 6 * dir);
      c.closePath();
      c.fill();
      c.restore();
    }
  }
});

/* ---- 水平弹簧振子动画 ---- */
shape({
  key: 'anim_spring_horizontal',
  cat: 'anim',
  geom: 'box',
  label: '水平弹簧振子',
  icon: '<line x1="3" y1="4" x2="3" y2="20"/>' +
        '<path d="M3 12 L6 9 L9 15 L12 9 L15 15 L18 12" ' +
        'fill="none" stroke="currentColor" stroke-width="1.2"/>' +
        '<rect x="18" y="8" width="4" height="8" fill="currentColor"/>',
  animatable: true,
  params: ['hsPeriod', 'hsAmp', 'hsCoils', 'hsBlock'],

  draw(c, o, U2) {
    const AN = (window.PhysBoard && window.PhysBoard.animState) || { t: 0 };
    const b  = U2.bbox(o);

    const T      = Math.max(0.2, o.hsPeriod || 1.2);
    const omega  = (2 * Math.PI) / T;
    const blockH = Math.max(8, Math.min(b.h * 0.45, o.hsBlock || 28));
    const blockW = blockH;
    const coils  = Math.max(3, Math.min(20, Math.round(o.hsCoils || 8)));

    const groundY = b.y2 - 4;
    const wallX   = b.x1 + 6;
    const wallTop = b.y1 + 8;
    const cy      = groundY - blockH / 2 - 2;

    const eqCenterX = b.x1 + b.w / 2;

    const maxAmp = Math.max(5, b.w / 2 - blockW / 2 - 28);
    const amp    = Math.max(3, Math.min(o.hsAmp || 40, maxAmp));

    const xOff = amp * Math.cos(omega * AN.t);
    const blockCenterX = eqCenterX + xOff;

    c.beginPath();
    c.moveTo(b.x1, groundY);
    c.lineTo(b.x2, groundY);
    c.stroke();

    c.save();
    c.strokeStyle = U2.alpha(o.color || '#1a1a1a', 0.35);
    c.lineWidth = Math.max(0.8, (o.size || 4) * 0.4);
    for (let x = b.x1 + 8; x < b.x2 - 4; x += 12) {
      c.beginPath();
      c.moveTo(x, groundY + 1);
      c.lineTo(x + 4, groundY + 5);
      c.stroke();
    }
    c.restore();

    c.beginPath();
    c.moveTo(wallX, wallTop);
    c.lineTo(wallX, groundY);
    c.stroke();

    c.save();
    c.lineWidth = Math.max(1, (o.size || 4) * 0.5);
    for (let y = wallTop + 3; y < groundY - 2; y += 8) {
      c.beginPath();
      c.moveTo(wallX, y);
      c.lineTo(wallX - 5, y + 4);
      c.stroke();
    }
    c.restore();

    c.save();
    c.setLineDash([3, 4]);
    c.strokeStyle = U2.alpha(o.color || '#1a1a1a', 0.3);
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(eqCenterX, b.y1 + 6);
    c.lineTo(eqCenterX, groundY - 2);
    c.stroke();
    c.restore();

    const springLeftX  = wallX + 2;
    const springRightX = blockCenterX - blockW / 2;
    const springAmp    = Math.min(12, blockH * 0.55);
    const springLen    = springRightX - springLeftX;
    const total = coils * 2;

    c.beginPath();
    c.moveTo(springLeftX, cy);
    if (springLen < 12) {
      c.lineTo(Math.max(springLeftX, springRightX), cy);
    } else {
      for (let i = 1; i < total; i++) {
        const xx = springLeftX + springLen * i / total;
        const yy = cy + (i % 2 === 0 ? -springAmp : springAmp);
        c.lineTo(xx, yy);
      }
      c.lineTo(springRightX, cy);
    }
    c.stroke();

    c.beginPath();
    c.rect(blockCenterX - blockW / 2, cy - blockH / 2, blockW, blockH);
    c.fillStyle = U2.alpha(o.color || '#1a1a1a', 0.22);
    c.fill();
    c.stroke();

    if (blockW >= 14 && blockH >= 14) {
      c.save();
      c.fillStyle = U2.alpha(o.color || '#1a1a1a', 0.9);
      c.font = 'bold ' + Math.min(blockW, blockH) * 0.55 + 'px system-ui, sans-serif';
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillText('m', blockCenterX, cy);
      c.restore();
    }

    const v = -amp * omega * Math.sin(omega * AN.t);
    if (Math.abs(v) > 3) {
      const dir = Math.sign(v);
      const vlen = Math.min(50, Math.abs(v) * 0.15);
      const arrowY = cy - blockH / 2 - 10;
      const startX = blockCenterX;

      c.save();
      c.strokeStyle = '#43a047';
      c.fillStyle   = '#43a047';
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(startX, arrowY);
      c.lineTo(startX + vlen * dir, arrowY);
      c.stroke();
      c.beginPath();
      c.moveTo(startX + vlen * dir, arrowY);
      c.lineTo(startX + vlen * dir - 6 * dir, arrowY - 4);
      c.lineTo(startX + vlen * dir - 6 * dir, arrowY + 4);
      c.closePath();
      c.fill();
      c.restore();
    }
  }
});


/* ==========================================================================
 * 24. 带电粒子在正交电磁场中的运动（旋轮线）
 * ========================================================================== */
param('cyc_v0',  { label: '初速度v₀',    min: 0.1, max: 1.5, step: 0.05, def: 0.5,  unit: '×宽/s' });
param('cyc_ang', { label: '初速方向',    min: -180, max: 180, step: 5,  def: 0,    unit: '°' });
param('cyc_vd',  { label: '漂移速度',    min: 0,   max: 1.5, step: 0.05, def: 0.2,  unit: '×宽/s' });
param('cyc_T',   { label: '回旋周期',    min: 0.5, max: 5,   step: 0.1,  def: 3,    unit: 's' });
param('cyc_B',   { label: '磁场0外1里',  min: 0,   max: 1,   step: 1,    def: 0 });
param('cyc_sV',  { label: '显示速度',    min: 0,   max: 1,   step: 1,    def: 1 });
param('cyc_sFL', { label: '显示F洛伦兹', min: 0,   max: 1,   step: 1,    def: 1 });
param('cyc_sFE', { label: '显示F电场',   min: 0,   max: 1,   step: 1,    def: 0 });

function __cycArrow(c, x1, y1, x2, y2, color) {
  const dx = x2 - x1, dy = y2 - y1;
  const L = Math.hypot(dx, dy);
  if (L < 4) return;
  const ux = dx / L, uy = dy / L;
  const hL = Math.min(11, L * 0.42);
  const hW = hL * 0.55;
  c.save();
  c.strokeStyle = color;
  c.fillStyle   = color;
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(x1, y1);
  c.lineTo(x2 - ux * hL * 0.6, y2 - uy * hL * 0.6);
  c.stroke();
  c.beginPath();
  c.moveTo(x2, y2);
  c.lineTo(x2 - ux * hL - uy * hW, y2 - uy * hL + ux * hW);
  c.lineTo(x2 - ux * hL + uy * hW, y2 - uy * hL - ux * hW);
  c.closePath();
  c.fill();
  c.restore();
}

shape({
  key: 'anim_cycloid',
  cat: 'anim',
  geom: 'box',
  label: '旋轮线运动',
  icon: '<path d="M2 16 Q 6 4 10 16 Q 14 4 18 16" fill="none" ' +
        'stroke="currentColor" stroke-width="1.4"/>',
  animatable: true,
  params: ['cyc_v0', 'cyc_ang', 'cyc_vd', 'cyc_T', 'cyc_B', 'cyc_sV', 'cyc_sFL', 'cyc_sFE'],

  draw(c, o, U2) {
    const AN = (window.PhysBoard && window.PhysBoard.animState) || { t: 0 };
    const b  = U2.bbox(o);

    const W        = b.w;
    const v0_unit  = Math.max(0.02, o.cyc_v0  ?? 0.5);
    const ang0     = ((o.cyc_ang ?? 0) * Math.PI) / 180;
    const vd_unit  = Math.max(0,    o.cyc_vd  ?? 0.2);
    const T        = Math.max(0.3,  o.cyc_T   ?? 3);
    const Bdir     = Math.round(o.cyc_B || 0);
    const Bsign    = Bdir === 0 ? 1 : -1;
    const showV    = (o.cyc_sV  ?? 1) > 0.5;
    const showFL   = (o.cyc_sFL ?? 1) > 0.5;
    const showFE   = (o.cyc_sFE ?? 0) > 0.5;

    const v0     = v0_unit * W;
    const vd_mag = vd_unit * W;
    const omega  = Bsign * 2 * Math.PI / T;
    const vd_eff = vd_mag * Bsign;

    const ux0 = v0 * Math.cos(ang0) - vd_eff;
    const uy0 = v0 * Math.sin(ang0);

    let xFrac = 0.5;
    if (vd_eff >  0.02 * W) xFrac = 0.22;
    else if (vd_eff < -0.02 * W) xFrac = 0.78;
    const originX = b.x1 + b.w * xFrac;
    const originY = b.y1 + b.h * 0.5;

    const toCanvas = (xp, yp) => ({ x: originX + xp, y: originY - yp });

    const posAt = (tt) => {
      if (Math.abs(omega) < 1e-4) {
        return { x: (vd_eff + ux0) * tt, y: uy0 * tt };
      }
      const w = omega * tt;
      const s = Math.sin(w), co = Math.cos(w);
      return {
        x: vd_eff * tt + (1 / omega) * (ux0 * s - uy0 * (co - 1)),
        y:              (1 / omega) * (ux0 * (co - 1) + uy0 * s)
      };
    };
    const velAt = (tt) => {
      const w = omega * tt;
      const s = Math.sin(w), co = Math.cos(w);
      return {
        x: vd_eff + ux0 * co + uy0 * s,
        y:         -ux0 * s  + uy0 * co
      };
    };

    c.save();
    c.beginPath();
    c.rect(b.x1, b.y1, b.w, b.h);
    c.clip();

    c.save();
    c.setLineDash([3, 5]);
    c.strokeStyle = U2.alpha(o.color || '#1a1a1a', 0.22);
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(b.x1, originY);
    c.lineTo(b.x2, originY);
    c.stroke();
    c.restore();

    const tNow = AN.t;
    const tWin = Math.min(tNow, T * 2);

    if (tWin > 0.01) {
      const t0 = tNow - tWin;
      const N  = Math.max(30, Math.min(200, Math.round(tWin / T * 100)));
      c.save();
      c.strokeStyle = U2.alpha(o.color || '#1a1a1a', 0.55);
      c.lineWidth = Math.max(1.2, (o.size || 4) * 0.5);
      c.beginPath();
      for (let i = 0; i <= N; i++) {
        const tt = t0 + tWin * i / N;
        const pp = posAt(tt);
        const cv = toCanvas(pp.x, pp.y);
        i === 0 ? c.moveTo(cv.x, cv.y) : c.lineTo(cv.x, cv.y);
      }
      c.stroke();
      c.restore();
    }

    c.save();
    c.strokeStyle = U2.alpha(o.color || '#1a1a1a', 0.35);
    c.lineWidth = 1;
    c.beginPath();
    c.arc(originX, originY, 3, 0, Math.PI * 2);
    c.stroke();
    c.restore();

    const posP = posAt(tNow);
    const velP = velAt(tNow);
    const posC = toCanvas(posP.x, posP.y);
    const vMag = Math.hypot(velP.x, velP.y);

    const arrowScale = 55 / Math.max(v0, 1e-3);
    const arrowCap   = 90;

    if (showFE && Math.abs(vd_eff) > 0.5) {
      const base = Math.min(arrowCap, Math.abs(vd_eff) * arrowScale);
      if (base > 4) {
        __cycArrow(c, posC.x, posC.y, posC.x, posC.y - base, '#1e88e5');
      }
    }

    if (showFL && vMag > 0.5) {
      const fx =  omega * velP.y;
      const fy = -omega * velP.x;
      const fm = Math.hypot(fx, fy);
      if (fm > 1e-6) {
        const base = Math.min(arrowCap, vMag * arrowScale);
        const ux = fx / fm, uy = fy / fm;
        __cycArrow(c, posC.x, posC.y,
                   posC.x + ux * base, posC.y - uy * base, '#e53935');
      }
    }

    if (showV && vMag > 0.5) {
      const vLen = Math.min(arrowCap, vMag * arrowScale);
      const ux = velP.x / vMag, uy = velP.y / vMag;
      __cycArrow(c, posC.x, posC.y,
                 posC.x + ux * vLen, posC.y - uy * vLen, '#43a047');
    }

    const pR = Math.max(5, Math.min(9, W * 0.014));
    c.save();
    c.beginPath();
    c.arc(posC.x, posC.y, pR, 0, Math.PI * 2);
    c.fillStyle = U2.alpha(o.color || '#1a1a1a', 0.75);
    c.fill();
    c.lineWidth = Math.max(1.2, (o.size || 4) * 0.6);
    c.strokeStyle = U2.alpha(o.color || '#1a1a1a', 0.95);
    c.stroke();
    c.beginPath();
    c.arc(posC.x - pR * 0.3, posC.y - pR * 0.3, pR * 0.3, 0, Math.PI * 2);
    c.fillStyle = 'rgba(255,255,255,0.75)';
    c.fill();
    c.restore();

    const indX = b.x2 - 22;
    const indY = b.y1 + 22;
    const indR = 10;
    c.save();
    c.strokeStyle = U2.alpha(o.color || '#1a1a1a', 0.6);
    c.lineWidth = 1.5;
    c.beginPath();
    c.arc(indX, indY, indR, 0, Math.PI * 2);
    c.stroke();
    if (Bsign > 0) {
      c.beginPath();
      c.arc(indX, indY, 3, 0, Math.PI * 2);
      c.fillStyle = U2.alpha(o.color || '#1a1a1a', 0.75);
      c.fill();
    } else {
      const d = indR * 0.7;
      c.beginPath();
      c.moveTo(indX - d, indY - d); c.lineTo(indX + d, indY + d);
      c.moveTo(indX + d, indY - d); c.lineTo(indX - d, indY + d);
      c.stroke();
    }
    c.restore();

    c.save();
    c.font = '11px system-ui, sans-serif';
    c.fillStyle = U2.alpha(o.color || '#1a1a1a', 0.55);
    c.textAlign = 'right';
    c.textBaseline = 'top';
    c.fillText(Bsign > 0 ? 'B ⊙' : 'B ⊗', b.x2 - 6, b.y1 + 4);
    c.restore();

    c.restore();
  }
});


/* ==========================================================================
 * 25. 单摆（大角度周期修正）
 * ========================================================================== */
param('pd_a0', { label: '释放角度', min: 0,   max: 90,  step: 1,    def: 60,  unit: '°' });
param('pd_L',  { label: '摆长',     min: 0.2, max: 1.2, step: 0.05, def: 0.7, unit: 'm' });
param('pd_g',  { label: '重力g',    min: 1,   max: 20,  step: 0.1,  def: 9.8, unit: 'm/s²' });
param('pd_r',  { label: '球半径',   min: 2,   max: 15,  step: 0.5,  def: 6,   unit: 'px' });

function __pd_EllipticK(k) {
  if (k < 1e-8) return Math.PI / 2;
  let a = 1, b = Math.sqrt(1 - k * k);
  for (let i = 0; i < 20; i++) {
    const aN = (a + b) / 2;
    const bN = Math.sqrt(a * b);
    if (Math.abs(aN - bN) < 1e-12) { a = aN; break; }
    a = aN; b = bN;
  }
  return Math.PI / (2 * a);
}
function __pd_PeriodFactor(theta0) {
  const k = Math.sin(theta0 / 2);
  return (2 / Math.PI) * __pd_EllipticK(k);
}

shape({
  key: 'anim_simple_pendulum',
  cat: 'anim',
  geom: 'box',
  label: '单摆(修正)',
  icon: '<circle cx="12" cy="3.5" r="1.3" fill="currentColor"/>' +
        '<line x1="12" y1="3.5" x2="17.5" y2="17"/>' +
        '<circle cx="17.5" cy="17" r="2.3" fill="currentColor"/>',
  animatable: true,
  params: ['pd_a0', 'pd_L', 'pd_g', 'pd_r'],

  draw(c, o, U2) {
    const AN = (window.PhysBoard && window.PhysBoard.animState) || { t: 0 };
    const b  = U2.bbox(o);

    const L     = Math.max(0.1, o.pd_L ?? 0.7);
    const g     = Math.max(0.5, o.pd_g ?? 9.8);
    const rBall = Math.max(2,   o.pd_r ?? 6);
    const a0    = ((o.pd_a0 ?? 60) * Math.PI) / 180;

    const T0     = 2 * Math.PI * Math.sqrt(L / g);
    const kFac   = __pd_PeriodFactor(a0);
    const T_phys = T0 * kFac;

    if (!window.__pdStates) window.__pdStates = new WeakMap();
    let S = window.__pdStates.get(o);
    const sig = L + '|' + g + '|' + a0;
    if (!S || S.sig !== sig || AN.t < S.lastT) {
      S = { theta: a0, omega: 0, lastT: AN.t, sig };
      window.__pdStates.set(o, S);
    }

    let dt = AN.t - S.lastT;
    if (!isFinite(dt) || dt < 0 || dt > 0.5) dt = 0;

    if (dt > 1e-6) {
      const hMax = 0.001;
      const nSub = Math.min(80, Math.max(1, Math.ceil(dt / hMax)));
      const h    = dt / nSub;
      const acc  = th => -(g / L) * Math.sin(th);
      for (let i = 0; i < nSub; i++) {
        const th = S.theta, om = S.omega;
        const k1t = om,             k1o = acc(th);
        const k2t = om + h*0.5*k1o, k2o = acc(th + h*0.5*k1t);
        const k3t = om + h*0.5*k2o, k3o = acc(th + h*0.5*k2t);
        const k4t = om + h*k3o,     k4o = acc(th + h*k3t);
        S.theta += h/6 * (k1t + 2*k2t + 2*k3t + k4t);
        S.omega += h/6 * (k1o + 2*k2o + 2*k3o + k4o);
      }
    }
    S.lastT = AN.t;
    const theta = S.theta;

    const Lmax  = 1.2;
    const ratio = Math.sqrt(Math.max(0, Math.min(1, L / Lmax)));
    const maxV  = Math.min(b.h - 40, b.w * 0.45) - rBall;
    const Lpx   = Math.max(20, maxV * ratio);

    const pivotX = (b.x1 + b.x2) / 2;
    const pivotY = b.y1 + 24;

    const ballX = pivotX + Lpx * Math.sin(theta);
    const ballY = pivotY + Lpx * Math.cos(theta);

    c.save();
    c.lineWidth = Math.max(1, (o.size || 4) * 0.5);
    const beamHalf = Math.min(b.w * 0.25, Lpx * 0.5 + 12);
    c.beginPath();
    c.moveTo(pivotX - beamHalf, pivotY);
    c.lineTo(pivotX + beamHalf, pivotY);
    c.stroke();
    c.beginPath();
    c.moveTo(pivotX, pivotY);
    c.lineTo(pivotX, b.y1);
    c.stroke();
    for (let x = pivotX - beamHalf + 3; x < pivotX + beamHalf - 2; x += 9) {
      c.beginPath();
      c.moveTo(x, pivotY);
      c.lineTo(x - 4, pivotY + 5);
      c.stroke();
    }
    c.restore();

    c.save();
    c.setLineDash([3, 5]);
    c.strokeStyle = U2.alpha(o.color || '#1a1a1a', 0.3);
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(pivotX, pivotY);
    c.lineTo(pivotX, pivotY + Lpx + 5);
    c.stroke();
    c.restore();

    if (a0 > 0.02) {
      c.save();
      c.setLineDash([2, 5]);
      c.strokeStyle = U2.alpha(o.color || '#1a1a1a', 0.2);
      c.lineWidth = 1;
      const xL = pivotX + Lpx * Math.sin(a0);
      const yL = pivotY + Lpx * Math.cos(a0);
      const xR = pivotX + Lpx * Math.sin(-a0);
      const yR = pivotY + Lpx * Math.cos(-a0);
      c.beginPath();
      c.moveTo(pivotX, pivotY); c.lineTo(xL, yL);
      c.moveTo(pivotX, pivotY); c.lineTo(xR, yR);
      c.stroke();
      c.restore();
    }

    if (Math.abs(theta) > 0.04) {
      const arcR = Math.min(Lpx * 0.35, 45);
      c.save();
      c.strokeStyle = U2.alpha(o.color || '#1a1a1a', 0.5);
      c.lineWidth = 1.4;
      c.beginPath();
      c.arc(pivotX, pivotY, arcR, Math.PI / 2, Math.PI / 2 - theta, theta > 0);
      c.stroke();
      c.restore();
    }

    c.save();
    c.lineWidth = Math.max(1.2, (o.size || 4) * 0.55);
    c.beginPath();
    c.moveTo(pivotX, pivotY);
    c.lineTo(ballX, ballY);
    c.stroke();
    c.restore();

    c.save();
    c.beginPath();
    c.arc(pivotX, pivotY, 3.5, 0, Math.PI * 2);
    c.fillStyle = U2.alpha(o.color || '#1a1a1a', 0.6);
    c.fill();
    c.restore();

    c.beginPath();
    c.arc(ballX, ballY, rBall, 0, Math.PI * 2);
    c.fillStyle = U2.alpha(o.color || '#1a1a1a', 0.7);
    c.fill();
    c.stroke();
    c.save();
    c.beginPath();
    c.arc(ballX - rBall * 0.3, ballY - rBall * 0.3, rBall * 0.3, 0, Math.PI * 2);
    c.fillStyle = 'rgba(255,255,255,0.7)';
    c.fill();
    c.restore();

    if (Math.abs(theta) > 0.04) {
      c.save();
      c.font = 'bold 12px system-ui, sans-serif';
      c.fillStyle = U2.alpha(o.color || '#1a1a1a', 0.75);
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      const deg = (theta * 180 / Math.PI).toFixed(0);
      const labelR = Math.min(Lpx * 0.35, 45) + 16;
      const labelAng = Math.PI / 2 - theta / 2;
      const lx = pivotX + labelR * Math.cos(labelAng);
      const ly = pivotY + labelR * Math.sin(labelAng);
      c.fillText(deg + '°', lx, ly);
      c.restore();
    }

    const panelW = 118;
    const panelH = 54;
    const panelX = b.x2 - panelW - 6;
    const panelY = b.y2 - panelH - 6;

    c.save();
    c.fillStyle = 'rgba(255, 255, 255, 0.85)';
    c.strokeStyle = U2.alpha(o.color || '#1a1a1a', 0.18);
    c.lineWidth = 1;
    const rr = 6;
    c.beginPath();
    c.moveTo(panelX + rr, panelY);
    c.lineTo(panelX + panelW - rr, panelY);
    c.quadraticCurveTo(panelX + panelW, panelY, panelX + panelW, panelY + rr);
    c.lineTo(panelX + panelW, panelY + panelH - rr);
    c.quadraticCurveTo(panelX + panelW, panelY + panelH,
                       panelX + panelW - rr, panelY + panelH);
    c.lineTo(panelX + rr, panelY + panelH);
    c.quadraticCurveTo(panelX, panelY + panelH, panelX, panelY + panelH - rr);
    c.lineTo(panelX, panelY + rr);
    c.quadraticCurveTo(panelX, panelY, panelX + rr, panelY);
    c.closePath();
    c.fill();
    c.stroke();

    c.font = '10px system-ui, sans-serif';
    c.textAlign = 'left';
    c.textBaseline = 'middle';
    const colGray = U2.alpha(o.color || '#1a1a1a', 0.55);
    const colBlue = '#1e88e5';
    const colRed  = '#e53935';

    const lineX1 = panelX + 7;
    const lineY1 = panelY + 13;
    const lineY2 = panelY + 27;
    const lineY3 = panelY + 41;
    const valX   = panelX + panelW - 7;

    c.fillStyle = colGray;
    c.fillText('T₀ 理论', lineX1, lineY1);
    c.fillStyle = colBlue;
    c.textAlign = 'right';
    c.fillText(T0.toFixed(3) + ' s', valX, lineY1);

    c.fillStyle = colGray;
    c.textAlign = 'left';
    c.fillText('T 修正', lineX1, lineY2);
    c.fillStyle = colRed;
    c.textAlign = 'right';
    c.fillText(T_phys.toFixed(3) + ' s', valX, lineY2);

    c.fillStyle = colGray;
    c.textAlign = 'left';
    c.fillText('T/T₀', lineX1, lineY3);
    c.fillStyle = (kFac > 1.03) ? colRed : colGray;
    c.textAlign = 'right';
    c.fillText('×' + kFac.toFixed(4), valX, lineY3);

    c.restore();

    if (kFac > 1.03) {
      c.save();
      c.font = '10px system-ui, sans-serif';
      c.fillStyle = 'rgba(229,57,53,0.8)';
      c.textAlign = 'left';
      c.textBaseline = 'top';
      c.fillText('大角度修正', b.x1 + 6, b.y1 + 4);
      c.fillStyle = 'rgba(229,57,53,0.55)';
      c.font = '9px ui-monospace, monospace';
      c.fillText('T = T₀·(2/π)·K(k)', b.x1 + 6, b.y1 + 17);
      c.restore();
    }
  }
});


/* ==========================================================================
 * 26. 圆弧轨道 + 小球（四种特殊初速度）
 * ========================================================================== */
param('sb5R', { label: '轨道半径', min: 60,  max: 200, step: 5,    def: 120, unit: 'px' });
param('sb5r', { label: '球半径',   min: 3,   max: 15,  step: 0.5,  def: 8,   unit: 'px' });
param('sb5special', { label: '特殊值0-4', min: 0, max: 4, step: 1, def: 0 });
param('sb5k', { label: '相对速度k', min: 0.5, max: 3,  step: 0.05, def: 1.5 });
param('sb5g', { label: '重力g',    min: 1,   max: 20,  step: 0.1,  def: 9.8, unit: 'm/s²' });

var __sb5_SpecialList = [
  null,
  { name: '刚好到圆心等高处',   formula: 'v₀ = √(2gR)',       alpha: 2 },
  { name: '脱轨后抛到最低点',   formula: 'v₀ = √(7gR/2)',     alpha: 3.5 },
  { name: '脱轨后抛出后过圆心', formula: 'v₀ = √((2+√3)gR)', alpha: 2 + Math.sqrt(3) },
  { name: '刚好到最高点',       formula: 'v₀ = √(5gR)',       alpha: 5 }
];

function __sb5_step(S, h, P) {
  const { g_px, R_eff, cx, cy, groundY, r_ball, b, v0_px, v0_2 } = P;
  const groundCenterY = groundY - r_ball;

  if (S.phase === 'approach') {
    S.x += S.vx * h;
    if (S.x >= cx) {
      S.x = cx; S.y = groundCenterY;
      S.phase = 'onTrack'; S.theta = 0;
      S.omega = v0_px / R_eff;
    }
    return;
  }

  if (S.phase === 'onTrack') {
    const acc = th => -(g_px / R_eff) * Math.sin(th);
    const k1t = S.omega, k1o = acc(S.theta);
    const k2t = S.omega + h * 0.5 * k1o, k2o = acc(S.theta + h * 0.5 * k1t);
    const k3t = S.omega + h * 0.5 * k2o, k3o = acc(S.theta + h * 0.5 * k2t);
    const k4t = S.omega + h * k3o,       k4o = acc(S.theta + h * k3t);
    S.theta += h / 6 * (k1t + 2 * k2t + 2 * k3t + k4t);
    S.omega += h / 6 * (k1o + 2 * k2o + 2 * k3o + k4o);

    if (S.theta <= 0 && S.omega < 0) {
      S.theta = 0; S.x = cx; S.y = groundCenterY;
      S.vx = -v0_px; S.vy = 0;
      S.phase = 'onGround';
      return;
    }

    if (S.theta >= Math.PI) {
      const vT2 = v0_2 - 4 * g_px * R_eff;
      S.theta = Math.PI; S.x = cx; S.y = cy - R_eff;
      if (vT2 > 0) {
        S.vx = -Math.sqrt(vT2); S.vy = 0;
        S.phase = 'projectile';
      } else {
        S.vx = 0; S.vy = 0;
        S.phase = 'onGround';
      }
      return;
    }

    const cosT = Math.cos(S.theta), sinT = Math.sin(S.theta);
    const v2 = v0_2 - 2 * g_px * R_eff * (1 - cosT);
    const N  = v2 / R_eff + g_px * cosT;
    if (N < 0 && sinT > 0.01) {
      let cosD = 2 / 3 - v0_2 / (3 * g_px * R_eff);
      cosD = Math.max(-1, Math.min(1, cosD));
      const thetaD = Math.acos(cosD);
      S.theta = thetaD;
      S.x = cx + R_eff * Math.sin(thetaD);
      S.y = cy + R_eff * Math.cos(thetaD);
      const vD2 = Math.max(0, v0_2 - 2 * g_px * R_eff * (1 - Math.cos(thetaD)));
      const vD  = Math.sqrt(vD2);
      S.vx =  vD * Math.cos(thetaD);
      S.vy = -vD * Math.sin(thetaD);
      S.phase = 'projectile';
    }
    return;
  }

  if (S.phase === 'projectile') {
    S.x += S.vx * h;
    S.y += S.vy * h;
    S.vy += g_px * h;
    if (S.y >= groundCenterY) {
      S.y = groundCenterY; S.vy = 0;
      S.phase = 'onGround';
    }
    return;
  }

  if (S.phase === 'onGround') {
    S.x += S.vx * h;
    if (S.x < b.x1 - 150 || S.x > b.x2 + 150) {
      S.phase = 'approach';
      S.x = Math.max(b.x1 + 12, cx - R_eff * 2 - 50);
      S.y = groundCenterY; S.vx = v0_px; S.vy = 0;
      S.theta = 0; S.omega = 0;
      S.trail = [];
    }
  }
}

shape({
  key: 'anim_slot_ball5',
  cat: 'anim',
  geom: 'box',
  label: '圆弧轨道(特殊速度)',
  icon: '<path d="M3 18 Q 12 4 21 18" fill="none" stroke="currentColor" stroke-width="1.4"/>' +
        '<circle cx="8" cy="16" r="1.8" fill="currentColor"/>',
  animatable: true,
  params: ['sb5R', 'sb5r', 'sb5special', 'sb5k', 'sb5g'],

  draw(c, o, U2) {
    const AN = (window.PhysBoard && window.PhysBoard.animState) || { t: 0 };
    const b  = U2.bbox(o);

    const R_user = o.sb5R ?? 120;
    const r_user = o.sb5r ?? 8;
    const k_free = o.sb5k ?? 1.5;
    const g_m    = o.sb5g ?? 9.8;
    const sIdx   = Math.round(o.sb5special ?? 0);
    const special = __sb5_SpecialList[sIdx] || null;

    const maxR = Math.min(b.w * 0.40, b.h * 0.72);
    const R    = Math.min(maxR, (R_user / 200) * maxR);
    const r_ball = Math.min(R * 0.20, (r_user / 15) * maxR * 0.06);
    const R_eff  = Math.max(1, R - r_ball);

    const alpha = special ? special.alpha : k_free * k_free;

    const g_px = g_m * 16;
    const v0_2  = alpha * g_px * R_eff;
    const v0_px = Math.sqrt(v0_2);
    const v_ref = Math.sqrt(g_px * R_eff);

    const cx = (b.x1 + b.x2) / 2;
    const groundY = b.y2 - 3;
    const cy = groundY - R;
    const groundCenterY = groundY - r_ball;

    if (!window.__sb5States) window.__sb5States = new WeakMap();
    let S = window.__sb5States.get(o);
    const sig = R + '|' + r_ball + '|' + alpha + '|' + g_px + '|' + b.x1 + '|' + b.x2 + '|' + groundY;

    const startX = Math.max(b.x1 + 12, cx - R_eff * 2 - 50);
    const resetState = () => {
      S = {
        sig, phase: 'approach', theta: 0, omega: 0,
        x: startX, y: groundCenterY, vx: v0_px, vy: 0,
        lastT: AN.t, trail: [],
      };
      window.__sb5States.set(o, S);
    };
    if (!S || S.sig !== sig) resetState();

    let dt = AN.t - S.lastT;
    if (!isFinite(dt) || dt < 0 || dt > 0.5) { resetState(); dt = 0; }
    S.lastT = AN.t;

    if (dt > 0) {
      const maxStep = 0.002;
      const nSub = Math.min(200, Math.max(1, Math.ceil(dt / maxStep)));
      const h = dt / nSub;
      const P = { g_px, R_eff, cx, cy, groundY, r_ball, b, v0_px, v0_2 };
      for (let i = 0; i < nSub; i++) __sb5_step(S, h, P);
    }

    let ballX, ballY;
    if (S.phase === 'onTrack') {
      ballX = cx + R_eff * Math.sin(S.theta);
      ballY = cy + R_eff * Math.cos(S.theta);
    } else {
      ballX = S.x; ballY = S.y;
    }

    if (S.phase === 'onTrack' || S.phase === 'projectile') {
      if (!S.trail) S.trail = [];
      const last = S.trail.length ? S.trail[S.trail.length - 1] : null;
      if (!last || Math.hypot(ballX - last.x, ballY - last.y) > 2.5) {
        S.trail.push({ x: ballX, y: ballY });
        if (S.trail.length > 1000) S.trail.shift();
      }
    }

    const lineW = Math.max(1, (o.size || 4) * 0.55);

    c.save();
    c.lineWidth = lineW;
    c.beginPath(); c.moveTo(b.x1, groundY); c.lineTo(b.x2, groundY); c.stroke();
    c.strokeStyle = U2.alpha(o.color || '#1a1a1a', 0.32);
    c.lineWidth = Math.max(0.8, (o.size || 4) * 0.4);
    for (let x = b.x1 + 8; x < b.x2 - 4; x += 12) {
      c.beginPath();
      c.moveTo(x, groundY + 1); c.lineTo(x + 4, groundY + 5); c.stroke();
    }
    c.restore();

    c.save();
    c.lineWidth = lineW * 1.6;
    c.strokeStyle = U2.alpha(o.color || '#1a1a1a', 0.85);
    c.beginPath();
    c.arc(cx, cy, R, Math.PI / 2, -Math.PI / 2, true);
    c.stroke();
    c.restore();

    c.save();
    c.setLineDash([3, 5]);
    c.strokeStyle = U2.alpha(o.color || '#1a1a1a', 0.25);
    c.lineWidth = 1;
    c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx, groundY); c.stroke();
    c.restore();

    if (S.trail && S.trail.length > 1) {
      c.save();
      c.setLineDash([5, 4]);
      c.strokeStyle = 'rgba(229,57,53,0.55)';
      c.lineWidth = 1.6;
      c.beginPath();
      c.moveTo(S.trail[0].x, S.trail[0].y);
      for (let i = 1; i < S.trail.length; i++) c.lineTo(S.trail[i].x, S.trail[i].y);
      c.stroke();
      c.restore();
    }

    c.beginPath();
    c.arc(ballX, ballY, r_ball, 0, Math.PI * 2);
    c.fillStyle = U2.alpha(o.color || '#1a1a1a', 0.72);
    c.fill();
    c.lineWidth = Math.max(1.2, (o.size || 4) * 0.6);
    c.stroke();
    c.save();
    c.beginPath();
    c.arc(ballX - r_ball * 0.3, ballY - r_ball * 0.3, r_ball * 0.3, 0, Math.PI * 2);
    c.fillStyle = 'rgba(255,255,255,0.7)'; c.fill();
    c.restore();

    let vspeed = 0, vdx = 0, vdy = 0;
    if (S.phase === 'onTrack') {
      vspeed = Math.sqrt(Math.max(0, v0_2 - 2 * g_px * R_eff * (1 - Math.cos(S.theta))));
      const sgn = Math.sign(S.omega) || 1;
      vdx =  sgn * Math.cos(S.theta);
      vdy = -sgn * Math.sin(S.theta);
    } else {
      vspeed = Math.hypot(S.vx, S.vy);
      if (vspeed > 1e-6) { vdx = S.vx / vspeed; vdy = S.vy / vspeed; }
    }
    if (vspeed > 5) {
      const arrLen = Math.min(70, vspeed * 0.22);
      const ex = ballX + vdx * arrLen, ey = ballY + vdy * arrLen;
      c.save();
      c.strokeStyle = '#43a047'; c.fillStyle = '#43a047';
      c.lineWidth = 2;
      c.beginPath(); c.moveTo(ballX, ballY); c.lineTo(ex, ey); c.stroke();
      const hL = Math.min(12, arrLen * 0.35), hW = hL * 0.6;
      c.beginPath();
      c.moveTo(ex, ey);
      c.lineTo(ex - vdx * hL - vdy * hW, ey - vdy * hL + vdx * hW);
      c.lineTo(ex - vdx * hL + vdy * hW, ey - vdy * hL - vdx * hW);
      c.closePath(); c.fill();
      c.restore();
    }

    let sitLabel, sitColor, angleLabel, angleColor;
    if (alpha >= 5) {
      sitLabel = '顶部平抛'; sitColor = '#e53935';
      angleLabel = '脱离角 360°(2π)'; angleColor = '#e53935';
    } else if (alpha < 2) {
      sitLabel = '返回'; sitColor = '#7a8598';
      const cosMax = Math.max(-1, Math.min(1, 1 - alpha / 2));
      const maxDeg = Math.acos(cosMax) * 180 / Math.PI;
      angleLabel = '最大角 ' + maxDeg.toFixed(1) + '°'; angleColor = '#7a8598';
    } else {
      sitLabel = '脱离'; sitColor = '#f57c00';
      const cosD = Math.max(-1, Math.min(1, 2 / 3 - alpha / 3));
      const detachDeg = Math.acos(cosD) * 180 / Math.PI;
      angleLabel = '脱离角 ' + detachDeg.toFixed(1) + '°'; angleColor = '#f57c00';
    }

    c.save();
    c.font = 'bold 11px system-ui, sans-serif';
    c.textAlign = 'left'; c.textBaseline = 'bottom';
    c.fillStyle = sitColor;
    c.fillText(sitLabel + '  α = ' + alpha.toFixed(2), b.x1 + 8, b.y2 - 22);
    c.fillStyle = angleColor;
    c.fillText(angleLabel, b.x1 + 8, b.y2 - 6);
    c.restore();

    const vNorm = vspeed / v_ref;
    const panelW = 130, panelH = 26;
    const panelX = b.x2 - panelW - 6, panelY = b.y2 - panelH - 6;

    c.save();
    c.fillStyle = 'rgba(255,255,255,0.85)';
    c.strokeStyle = U2.alpha(o.color || '#1a1a1a', 0.18);
    c.lineWidth = 1;
    const rr = 5;
    c.beginPath();
    c.moveTo(panelX + rr, panelY);
    c.lineTo(panelX + panelW - rr, panelY);
    c.quadraticCurveTo(panelX + panelW, panelY, panelX + panelW, panelY + rr);
    c.lineTo(panelX + panelW, panelY + panelH - rr);
    c.quadraticCurveTo(panelX + panelW, panelY + panelH, panelX + panelW - rr, panelY + panelH);
    c.lineTo(panelX + rr, panelY + panelH);
    c.quadraticCurveTo(panelX, panelY + panelH, panelX, panelY + panelH - rr);
    c.lineTo(panelX, panelY + rr);
    c.quadraticCurveTo(panelX, panelY, panelX + rr, panelY);
    c.closePath();
    c.fill(); c.stroke();

    c.font = '11px system-ui, sans-serif';
    c.textAlign = 'left'; c.textBaseline = 'middle';
    c.fillStyle = U2.alpha(o.color || '#1a1a1a', 0.6);
    c.fillText('当前 |v| =', panelX + 7, panelY + panelH / 2);

    c.font = 'bold 11.5px ui-monospace, Menlo, monospace';
    c.fillStyle = '#43a047';
    c.textAlign = 'right';
    c.fillText(vNorm.toFixed(3) + '·√(gR)', panelX + panelW - 7, panelY + panelH / 2);
    c.restore();

    if (special) {
      const sW = 168, sH = 40;
      const sX = b.x1 + 6, sY = b.y1 + 6;

      c.save();
      c.fillStyle = 'rgba(227,240,255,0.92)';
      c.strokeStyle = '#b8dcfb';
      c.lineWidth = 1;
      const rr2 = 6;
      c.beginPath();
      c.moveTo(sX + rr2, sY);
      c.lineTo(sX + sW - rr2, sY);
      c.quadraticCurveTo(sX + sW, sY, sX + sW, sY + rr2);
      c.lineTo(sX + sW, sY + sH - rr2);
      c.quadraticCurveTo(sX + sW, sY + sH, sX + sW - rr2, sY + sH);
      c.lineTo(sX + rr2, sY + sH);
      c.quadraticCurveTo(sX, sY + sH, sX, sY + sH - rr2);
      c.lineTo(sX, sY + rr2);
      c.quadraticCurveTo(sX, sY, sX + rr2, sY);
      c.closePath();
      c.fill(); c.stroke();

      c.font = 'bold 10.5px system-ui, sans-serif';
      c.fillStyle = '#1e88e5';
      c.textAlign = 'left'; c.textBaseline = 'middle';
      c.fillText(special.name, sX + 8, sY + 12);

      c.font = 'bold 12px ui-monospace, Menlo, monospace';
      c.fillStyle = '#0d47a1';
      c.fillText(special.formula, sX + 8, sY + 28);
      c.restore();
    }
  }
});


/* ==========================================================================
 * 27. 开普勒第二定律
 * ========================================================================== */
(function () {
  var PB2 = window.PhysBoard;
  if (!PB2) return;

  var shape2 = function (d) {
    if (!d || !d.key) return;
    if (typeof PB2.register === 'function') PB2.register(d);
    else PB2.shapes[d.key] = d;
  };

  function withAlpha(color, a) {
    var h = String(color || '#1a1a1a').replace('#', '');
    if (h.length === 3) h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
    var n = parseInt(h, 16);
    if (isNaN(n)) return 'rgba(0,0,0,' + a + ')';
    return 'rgba(' + ((n>>16)&255) + ',' + ((n>>8)&255) + ',' + (n&255) + ',' + a + ')';
  }

  if (!PB2.paramDefs) PB2.paramDefs = {};
  if (!PB2.paramDefs.kepE)
    PB2.paramDefs.kepE = { label: '偏心率', min: 0, max: 0.75, step: 0.01, def: 0.55 };
  if (!PB2.paramDefs.kepSeg)
    PB2.paramDefs.kepSeg = { label: '分段数', min: 6, max: 24, step: 2, def: 12 };
  if (!PB2.paramDefs.kepPeriod)
    PB2.paramDefs.kepPeriod = { label: '周期', min: 1, max: 10, step: 0.5, def: 4, unit: 's' };

  shape2({
    key: 'anim_kepler2',
    cat: 'anim',
    geom: 'rect',
    label: '开普勒第二定律',
    icon: '<ellipse cx="12" cy="12" rx="9" ry="6" fill="none" stroke="currentColor"/>' +
          '<circle cx="18.5" cy="12" r="1.5" fill="currentColor"/>',
    animatable: true,
    params: ['kepE', 'kepSeg', 'kepPeriod'],

    draw: function (c, o, U) {
      var AN = (window.PhysBoard && window.PhysBoard.animState) || { t: 0 };
      var b = U.bbox(o);
      if (b.w < 80 || b.h < 80) return;

      var e = Math.max(0, Math.min(0.75, o.kepE != null ? o.kepE : 0.55));
      var N = Math.max(6, Math.round(o.kepSeg || 12));
      var T = Math.max(0.5, o.kepPeriod || 4);

      var tLocal = AN.t % T;
      if (!isFinite(tLocal) || tLocal < 0) tLocal = 0;

      var a = 1;
      var bSemi = Math.sqrt(1 - e * e);
      var cOff = e;

      var margin = 26;
      var availW = b.w - 2 * margin;
      var availH = b.h - 2 * margin - 26;
      var scale = Math.min(availW / (2 * a), availH / (2 * bSemi));
      if (scale < 25) return;

      var cx = b.x1 + b.w / 2;
      var cy = b.y1 + (b.h - 26) / 2 + 6;
      var sunX = cx + cOff * scale;
      var sunY = cy;

      function solveE(M) {
        M = ((M % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
        var E = M + e * Math.sin(M);
        for (var i = 0; i < 12; i++) {
          var f = E - e * Math.sin(E) - M;
          var fp = 1 - e * Math.cos(E);
          var dE = f / fp;
          E -= dE;
          if (Math.abs(dE) < 1e-10) break;
        }
        return E;
      }
      function posAt(t) {
        var M = 2 * Math.PI * (t / T);
        var E = solveE(M);
        return {
          x: cx + a * Math.cos(E) * scale,
          y: cy - bSemi * Math.sin(E) * scale
        };
      }

      function fillSector(t1, t2, fillColor) {
        if (t2 - t1 < 1e-5) return;
        c.beginPath();
        c.moveTo(sunX, sunY);
        var steps = Math.max(4, Math.round(28 * (t2 - t1) / (T / N)));
        for (var i = 0; i <= steps; i++) {
          var t = t1 + (t2 - t1) * i / steps;
          var p = posAt(t);
          c.lineTo(p.x, p.y);
        }
        c.closePath();
        c.fillStyle = fillColor;
        c.fill();
      }

      function strokeEllipse() {
        c.beginPath();
        var steps = 120;
        for (var i = 0; i <= steps; i++) {
          var E = i / steps * 2 * Math.PI;
          var px = cx + a * Math.cos(E) * scale;
          var py = cy - bSemi * Math.sin(E) * scale;
          if (i === 0) c.moveTo(px, py);
          else c.lineTo(px, py);
        }
        c.closePath();
        c.stroke();
      }

      var dt = T / N;
      var kDone = Math.floor(tLocal / dt);
      if (kDone > N) kDone = N;

      var colA = 'rgba(30, 136, 229, 0.32)';
      var colB = 'rgba(245, 124, 0, 0.32)';

      for (var k = 0; k < kDone; k++) {
        var t1 = k * dt;
        var t2 = (k + 1) * dt;
        fillSector(t1, t2, (k % 2 === 0) ? colA : colB);
      }

      if (kDone < N) {
        var t1c = kDone * dt;
        var t2c = tLocal;
        if (t2c > t1c + 1e-5) {
          fillSector(t1c, t2c, (kDone % 2 === 0) ? colA : colB);
        }
      }

      c.save();
      c.strokeStyle = withAlpha(o.color, 0.75);
      c.lineWidth = Math.max(1.4, (o.size || 4) * 0.55);
      strokeEllipse();
      c.restore();

      c.save();
      c.setLineDash([3, 4]);
      c.strokeStyle = withAlpha(o.color, 0.22);
      c.lineWidth = 1;
      for (var k = Math.max(1, kDone + 1); k <= N; k++) {
        var p = posAt(k * dt);
        c.beginPath();
        c.moveTo(sunX, sunY);
        c.lineTo(p.x, p.y);
        c.stroke();
      }
      c.restore();

      c.save();
      c.strokeStyle = withAlpha(o.color, 0.35);
      c.lineWidth = 1;
      for (var k = 1; k <= kDone; k++) {
        var p = posAt(k * dt);
        c.beginPath();
        c.moveTo(sunX, sunY);
        c.lineTo(p.x, p.y);
        c.stroke();
      }
      c.restore();

      var curP = posAt(tLocal);
      c.save();
      c.strokeStyle = 'rgba(229, 57, 53, 0.9)';
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(sunX, sunY);
      c.lineTo(curP.x, curP.y);
      c.stroke();
      c.restore();

      var sunR = Math.max(5, scale * 0.075);
      c.save();
      var grd = c.createRadialGradient(sunX, sunY, sunR * 0.5,
                                        sunX, sunY, sunR * 3.5);
      grd.addColorStop(0, 'rgba(255, 179, 0, 0.55)');
      grd.addColorStop(1, 'rgba(255, 179, 0, 0)');
      c.fillStyle = grd;
      c.beginPath();
      c.arc(sunX, sunY, sunR * 3.5, 0, Math.PI * 2);
      c.fill();
      c.beginPath();
      c.arc(sunX, sunY, sunR, 0, Math.PI * 2);
      c.fillStyle = '#ffb300';
      c.fill();
      c.strokeStyle = '#e65100';
      c.lineWidth = 1.2;
      c.stroke();
      c.restore();

      var planetR = Math.max(4, scale * 0.055);
      c.save();
      c.beginPath();
      c.arc(curP.x, curP.y, planetR, 0, Math.PI * 2);
      c.fillStyle = withAlpha(o.color || '#1a1a1a', 0.85);
      c.fill();
      c.strokeStyle = withAlpha(o.color || '#1a1a1a', 0.95);
      c.lineWidth = 1.4;
      c.stroke();
      c.restore();

      c.save();
      c.font = 'bold 11px system-ui, "PingFang SC", "Microsoft YaHei", sans-serif';
      c.fillStyle = withAlpha(o.color, 0.80);
      c.textAlign = 'left';
      c.textBaseline = 'top';
      c.fillText('开普勒第二定律：相等时间扫过相等面积', b.x1 + 8, b.y1 + 6);
      c.font = '10px system-ui, "PingFang SC", "Microsoft YaHei", sans-serif';
      c.fillStyle = withAlpha(o.color, 0.50);
      c.fillText('把周期 T 等分为 ' + N + ' 段，每段内扫过的面积相等',
                 b.x1 + 8, b.y1 + 22);
      c.restore();

      c.save();
      c.font = '11px ui-monospace, Menlo, Consolas, monospace';
      c.fillStyle = withAlpha(o.color, 0.60);
      c.textAlign = 'center';
      c.textBaseline = 'bottom';
      var progress = tLocal / T;
      c.fillText(
        'e = ' + e.toFixed(2) + '   N = ' + N + '   ' +
        '进度 ' + (progress * 100).toFixed(0) + '%',
        b.x1 + b.w / 2, b.y2 - 6
      );
      c.restore();
    }
  });
})();


/* ==========================================================================
 * 28. 四类卫星（含可调卫星）
 * ========================================================================== */
param('satAlt',   { label: '可调轨道半径', min: 1.2, max: 8, step: 0.1, def: 3.5, unit: 'Rₑ' });
param('satSpeed', { label: '动画倍速',     min: 0.25, max: 5, step: 0.25, def: 1, unit: '×' });

shape({
  key: 'anim_satellites',
  cat: 'anim',
  geom: 'box',
  label: '四类卫星',
  icon: '<circle cx="12" cy="12" r="3.5" fill="currentColor"/>' +
        '<circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" ' +
        'stroke-width="0.9" stroke-dasharray="2 2"/>' +
        '<circle cx="12" cy="4" r="1.4" fill="currentColor"/>' +
        '<circle cx="20" cy="12" r="1.4" fill="currentColor"/>',
  animatable: true,
  params: ['satAlt', 'satSpeed'],

  draw(c, o, U2) {
    const AN = (window.PhysBoard && window.PhysBoard.animState) || { t: 0 };
    const b  = U2.bbox(o);
    if (b.w < 100 || b.h < 100) return;

    const speed = Math.max(0.1, o.satSpeed ?? 1);

    const cx = (b.x1 + b.x2) / 2;
    const cy = (b.y1 + b.y2) / 2;
    const margin = Math.max(18, Math.min(b.w, b.h) * 0.05);
    const maxR = Math.min(b.w, b.h) / 2 - margin;

    const Rg_factor = 6.617;
    const Rearth = maxR / Rg_factor;

    const rGround = 1.00;
    const rLEO    = 1.05;
    const rGEO    = Rg_factor;
    const rUser   = Math.max(1.2, Math.min(8, o.satAlt ?? 3.5));

    const T_EARTH = 60;
    const omegaE  = 2 * Math.PI / T_EARTH;
    const omegaAt = r => omegaE * Math.pow(rGEO / r, 1.5);

    const omegaGround = omegaE;
    const omegaLEO    = omegaAt(rLEO);
    const omegaGEO    = omegaAt(rGEO);
    const omegaUser   = omegaAt(rUser);

    const tScaled = AN.t * speed;

    const thetaGround = omegaGround * tScaled;
    const thetaLEO    = omegaLEO    * tScaled;
    const thetaGEO    = omegaGEO    * tScaled;
    const thetaUser   = omegaUser   * tScaled;

    const posAt = (r, th) => ({
      x: cx + r * Math.cos(th),
      y: cy - r * Math.sin(th)
    });

    const pGround = posAt(Rearth * rGround, thetaGround);
    const pLEO    = posAt(Rearth * rLEO,    thetaLEO);
    const pGEO    = posAt(Rearth * rGEO,    thetaGEO);
    const pUser   = posAt(Rearth * rUser,   thetaUser);

    if (!window.__satStates) window.__satStates = new WeakMap();
    let S = window.__satStates.get(o);
    const sig = Rearth.toFixed(2) + '|' + rUser.toFixed(2);
    if (!S || S.sig !== sig) {
      S = { sig, lastT: AN.t,
            trails: { ground: [], leo: [], geo: [], user: [] } };
      window.__satStates.set(o, S);
    }
    if (AN.t < S.lastT - 0.1) {
      S.trails = { ground: [], leo: [], geo: [], user: [] };
    }
    S.lastT = AN.t;

    const MAX_TRAIL = Math.max(20, Math.round(72 / speed));
    if (AN.playing) {
      const push = (key, p) => {
        const arr = S.trails[key];
        arr.push({ x: p.x, y: p.y });
        if (arr.length > MAX_TRAIL) arr.shift();
      };
      push('ground', pGround);
      push('leo',    pLEO);
      push('geo',    pGEO);
      push('user',   pUser);
    }

    const drawOrbit = (r, color) => {
      c.save();
      c.setLineDash([4, 5]);
      c.strokeStyle = color;
      c.lineWidth = 1;
      c.beginPath();
      c.arc(cx, cy, Rearth * r, 0, Math.PI * 2);
      c.stroke();
      c.restore();
    };
    drawOrbit(rLEO,  'rgba(0, 229, 255, 0.26)');
    drawOrbit(rUser, 'rgba(224, 64, 251, 0.30)');
    drawOrbit(rGEO,  'rgba(255, 152, 0, 0.30)');

    const drawTrail = (key, rgbaPrefix) => {
      const arr = S.trails[key];
      if (arr.length < 2) return;
      c.save();
      c.lineCap  = 'round';
      c.lineJoin = 'round';
      c.lineWidth = 2.2;
      const n = arr.length;
      for (let i = 1; i < n; i++) {
        const a = i / n;
        const alpha = Math.max(0, (a - 0.15) / 0.85);
        c.strokeStyle = rgbaPrefix + (alpha * 0.85).toFixed(3) + ')';
        c.beginPath();
        c.moveTo(arr[i - 1].x, arr[i - 1].y);
        c.lineTo(arr[i].x,     arr[i].y);
        c.stroke();
      }
      c.restore();
    };
    drawTrail('user',   'rgba(224, 64, 251, ');
    drawTrail('geo',    'rgba(255, 152, 0, ');
    drawTrail('leo',    'rgba(0, 229, 255, ');
    drawTrail('ground', 'rgba(255, 213, 79, ');

    const earthGrad = c.createRadialGradient(
      cx - Rearth * 0.3, cy - Rearth * 0.3, Rearth * 0.1,
      cx, cy, Rearth
    );
    earthGrad.addColorStop(0,   '#4fc3f7');
    earthGrad.addColorStop(0.55, '#1e88e5');
    earthGrad.addColorStop(1,   '#0d47a1');

    c.save();
    c.beginPath();
    c.arc(cx, cy, Rearth, 0, Math.PI * 2);
    c.fillStyle = earthGrad;
    c.fill();
    c.strokeStyle = 'rgba(13, 71, 161, 0.9)';
    c.lineWidth = 1.2;
    c.stroke();
    c.restore();

    c.save();
    c.beginPath();
    c.arc(cx, cy, Rearth, 0, Math.PI * 2);
    c.clip();
    const earthRot = omegaE * tScaled;
    c.strokeStyle = 'rgba(255, 255, 255, 0.20)';
    c.lineWidth = 1;
    for (let i = 0; i < 6; i++) {
      const ang = earthRot + i * Math.PI / 3;
      c.beginPath();
      c.moveTo(cx, cy);
      c.lineTo(cx + Math.cos(ang) * Rearth,
               cy - Math.sin(ang) * Rearth);
      c.stroke();
    }
    c.fillStyle = 'rgba(76, 175, 80, 0.32)';
    for (let i = 0; i < 5; i++) {
      const ang = earthRot + i * (2 * Math.PI / 5) + 0.4;
      const rr  = Rearth * (0.30 + 0.28 * ((i * 7) % 5) / 5);
      c.beginPath();
      c.arc(cx + Math.cos(ang) * rr,
            cy - Math.sin(ang) * rr,
            Rearth * 0.13, 0, Math.PI * 2);
      c.fill();
    }
    c.restore();

    c.save();
    c.fillStyle = 'rgba(255, 255, 255, 0.55)';
    c.beginPath();
    c.arc(cx, cy, 1.6, 0, Math.PI * 2);
    c.fill();
    c.restore();

    const drawSat = (p, r, color) => {
      c.save();
      const grd = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 3);
      grd.addColorStop(0, color.replace('rgb(', 'rgba(').replace(')', ', 0.55)'));
      grd.addColorStop(1, color.replace('rgb(', 'rgba(').replace(')', ', 0)'));
      c.fillStyle = grd;
      c.beginPath();
      c.arc(p.x, p.y, r * 3, 0, Math.PI * 2);
      c.fill();
      c.restore();

      c.save();
      c.beginPath();
      c.arc(p.x, p.y, r, 0, Math.PI * 2);
      c.fillStyle = color;
      c.fill();
      c.strokeStyle = '#ffffff';
      c.lineWidth = 1.2;
      c.stroke();
      c.restore();
    };
    drawSat(pGround, Math.max(3.5, Rearth * 0.08), 'rgb(255, 213, 79)');
    drawSat(pLEO,    Math.max(4.0, Rearth * 0.09), 'rgb(0, 229, 255)');
    drawSat(pGEO,    Math.max(4.5, Rearth * 0.10), 'rgb(255, 152, 0)');
    drawSat(pUser,   Math.max(5.0, Rearth * 0.11), 'rgb(224, 64, 251)');

    const T_user_anim = 60 * Math.pow(rUser / rGEO, 1.5);
    const T_user_min  = T_user_anim * 24;
    let periodStr;
    if (T_user_min < 120) {
      periodStr = 'T ≈ ' + T_user_min.toFixed(0) + ' min';
    } else {
      periodStr = 'T ≈ ' + (T_user_min / 60).toFixed(1) + ' h';
    }

    const legendItems = [
      { color: 'rgb(255, 213, 79)', text: '赤道未发射（随地球自转）' },
      { color: 'rgb(0, 229, 255)',  text: '近地卫星  T ≈ 90 min' },
      { color: 'rgb(224, 64, 251)', text: '可调卫星  r = ' + rUser.toFixed(2) +
                                          ' Rₑ  ' + periodStr },
      { color: 'rgb(255, 152, 0)',  text: '同步卫星  T = 24 h' }
    ];

    c.save();
    c.font = '11px system-ui, "PingFang SC", "Microsoft YaHei", sans-serif';
    c.textAlign = 'left';
    c.textBaseline = 'middle';

    const legendPadX = 8;
    const legendPadY = 6;
    const lineH = 16;
    let maxTextW = 0;
    for (const it of legendItems) {
      const w = c.measureText(it.text).width;
      if (w > maxTextW) maxTextW = w;
    }
    const legendW = legendPadX * 2 + 12 + maxTextW + 4;
    const legendH = legendPadY * 2 + lineH * legendItems.length;
    const legendX = b.x1 + 8;
    const legendY = b.y1 + 8;

    const rr = 6;
    c.beginPath();
    c.moveTo(legendX + rr, legendY);
    c.lineTo(legendX + legendW - rr, legendY);
    c.quadraticCurveTo(legendX + legendW, legendY,
                       legendX + legendW, legendY + rr);
    c.lineTo(legendX + legendW, legendY + legendH - rr);
    c.quadraticCurveTo(legendX + legendW, legendY + legendH,
                       legendX + legendW - rr, legendY + legendH);
    c.lineTo(legendX + rr, legendY + legendH);
    c.quadraticCurveTo(legendX, legendY + legendH,
                       legendX, legendY + legendH - rr);
    c.lineTo(legendX, legendY + rr);
    c.quadraticCurveTo(legendX, legendY,
                       legendX + rr, legendY);
    c.closePath();
    c.fillStyle = 'rgba(255, 255, 255, 0.82)';
    c.fill();
    c.strokeStyle = 'rgba(0, 0, 0, 0.06)';
    c.lineWidth = 1;
    c.stroke();

    let ly = legendY + legendPadY + lineH / 2;
    for (const it of legendItems) {
      c.beginPath();
      c.arc(legendX + legendPadX + 5, ly, 4, 0, Math.PI * 2);
      c.fillStyle = it.color;
      c.fill();
      c.strokeStyle = '#fff';
      c.lineWidth = 1;
      c.stroke();

      c.fillStyle = 'rgba(0, 0, 0, 0.72)';
      c.fillText(it.text, legendX + legendPadX + 15, ly);
      ly += lineH;
    }
    c.restore();
  }
});


/* ==========================================================================
 * 29. 合力与分力（可拖拽）
 * ========================================================================== */
(function () {
  var PB2 = window.PhysBoard;
  if (!PB2) return;

  var shape2 = function (d) {
    if (!d || !d.key) return;
    if (typeof PB2.register === 'function') PB2.register(d);
    else PB2.shapes[d.key] = d;
  };

  function withAlpha(color, a) {
    var h = String(color || '#1a1a1a').replace('#', '');
    if (h.length === 3) h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
    var n = parseInt(h, 16);
    if (isNaN(n)) return 'rgba(0,0,0,' + a + ')';
    return 'rgba(' + ((n>>16)&255) + ',' + ((n>>8)&255) + ',' + (n&255) + ',' + a + ')';
  }

  function drawArrow(c, x1, y1, x2, y2, color, width, headSize) {
    var dx = x2 - x1, dy = y2 - y1;
    var len = Math.hypot(dx, dy);
    if (len < 1) return;
    var ux = dx / len, uy = dy / len;
    var hL = Math.min(headSize, len * 0.55);
    var hW = hL * 0.55;
    c.save();
    c.strokeStyle = color;
    c.fillStyle = color;
    c.lineCap = 'round';
    c.lineJoin = 'round';
    c.lineWidth = width;
    c.beginPath();
    c.moveTo(x1, y1);
    c.lineTo(x2 - ux * hL * 0.85, y2 - uy * hL * 0.85);
    c.stroke();
    c.beginPath();
    c.moveTo(x2, y2);
    c.lineTo(x2 - ux * hL - uy * hW, y2 - uy * hL + ux * hW);
    c.lineTo(x2 - ux * hL + uy * hW, y2 - uy * hL - ux * hW);
    c.closePath();
    c.fill();
    c.restore();
  }

  if (!PB2.paramDefs) PB2.paramDefs = {};
  if (!PB2.paramDefs.fcF1)
    PB2.paramDefs.fcF1 = { label: 'F₁ 大小', min: 0.2, max: 2, step: 0.05, def: 1 };
  if (!PB2.paramDefs.fcA1)
    PB2.paramDefs.fcA1 = { label: 'F₁ 角度', min: -180, max: 180, step: 1, def: 45, unit: '°' };
  if (!PB2.paramDefs.fcF2)
    PB2.paramDefs.fcF2 = { label: 'F₂ 大小', min: 0.2, max: 2, step: 0.05, def: 1 };
  if (!PB2.paramDefs.fcA2)
    PB2.paramDefs.fcA2 = { label: 'F₂ 角度', min: -180, max: 180, step: 1, def: -30, unit: '°' };
  if (!PB2.paramDefs.fcM1)
    PB2.paramDefs.fcM1 = { label: 'F₁ 拖拽模式', min: 0, max: 2, step: 1, def: 0 };
  if (!PB2.paramDefs.fcM2)
    PB2.paramDefs.fcM2 = { label: 'F₂ 拖拽模式', min: 0, max: 2, step: 1, def: 0 };

  var fcInstances = [];

  function registerInstance(o) {
    var i = fcInstances.indexOf(o);
    if (i < 0) {
      fcInstances.push(o);
      if (fcInstances.length > 30) fcInstances.shift();
    } else if (i !== fcInstances.length - 1) {
      fcInstances.splice(i, 1);
      fcInstances.push(o);
    }
  }

  var dragging = null;

  function getStageCoords(e) {
    var stage = document.getElementById('stage');
    if (!stage) {
      return { x: e.clientX, y: e.clientY };
    }
    var r = stage.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  /* 拖拽时优先使用轻量重绘接口；无则退回 resize 事件（兼容旧版 HTML） */
  function triggerRedraw() {
    if (typeof window.__pbRedraw === 'function') {
      window.__pbRedraw();
    } else {
      window.dispatchEvent(new Event('resize'));
    }
  }

  function onPointerDown(e) {
    if (e.button !== 0) return;
    if (!fcInstances.length) return;
    var p = getStageCoords(e);

    for (var i = fcInstances.length - 1; i >= 0; i--) {
      var o = fcInstances[i];
      if (!o._fcHandles) continue;
      var h = o._fcHandles;
      var r = 24;
      if (Math.hypot(p.x - h.P1.x, p.y - h.P1.y) < r) {
        dragging = { obj: o, which: 1 };
        e.stopPropagation(); e.preventDefault(); return;
      }
      if (Math.hypot(p.x - h.P2.x, p.y - h.P2.y) < r) {
        dragging = { obj: o, which: 2 };
        e.stopPropagation(); e.preventDefault(); return;
      }
    }
  }

  function onPointerMove(e) {
    if (!dragging) return;
    var p = getStageCoords(e);

    var o = dragging.obj;
    var h = o._fcHandles;
    if (!h) { dragging = null; return; }
    var scale = o._fcScale || 100;

    var dx = p.x - h.O.x;
    var dy = h.O.y - p.y;

    var mode = dragging.which === 1 ? (o.fcM1 || 0) : (o.fcM2 || 0);
    var fkey = dragging.which === 1 ? 'fcF1' : 'fcF2';
    var akey = dragging.which === 1 ? 'fcA1' : 'fcA2';
    var curAngle = (o[akey] || 0) * Math.PI / 180;

    var newF, newA;

    if (mode === 1) {
      newF = o[fkey];
      newA = Math.atan2(dy, dx);
    } else if (mode === 2) {
      var cosA = Math.cos(curAngle), sinA = Math.sin(curAngle);
      var proj = dx * cosA + dy * sinA;
      newF = Math.max(0.2, Math.min(2, proj / scale));
      newA = curAngle;
    } else {
      newF = Math.hypot(dx, dy) / scale;
      newF = Math.max(0.2, Math.min(2, newF));
      newA = Math.atan2(dy, dx);
    }

    o[fkey] = Math.round(newF * 100) / 100;
    o[akey] = Math.round(newA * 180 / Math.PI);

    triggerRedraw();

    e.stopPropagation(); e.preventDefault();
  }

  function onPointerUp(e) {
    if (!dragging) return;
    dragging = null;
    e.stopPropagation(); e.preventDefault();
  }

  window.addEventListener('pointerdown', onPointerDown, true);
  window.addEventListener('pointermove', onPointerMove, true);
  window.addEventListener('pointerup',   onPointerUp,   true);

  shape2({
    key: 'anim_force_compose',
    cat: 'anim',
    geom: 'box',
    label: '合力与分力',
    icon: '<path d="M3 19 L11 5 M11 5 L21 13" stroke="currentColor" stroke-width="1.6" ' +
          'fill="none" stroke-linecap="round"/>' +
          '<path d="M3 19 L21 13" stroke="currentColor" stroke-width="1.6" ' +
          'fill="none" stroke-dasharray="2 2"/>',
    animatable: true,
    params: ['fcF1', 'fcA1', 'fcF2', 'fcA2', 'fcM1', 'fcM2'],

    draw: function (c, o, U) {
      var b = U.bbox(o);
      if (b.w < 60 || b.h < 60) return;

      if (o.fcF1 == null) o.fcF1 = 1;
      if (o.fcA1 == null) o.fcA1 = 45;
      if (o.fcF2 == null) o.fcF2 = 1;
      if (o.fcA2 == null) o.fcA2 = -30;
      if (o.fcM1 == null) o.fcM1 = 0;
      if (o.fcM2 == null) o.fcM2 = 0;

      var scale = Math.min(b.w, b.h) * 0.32;
      o._fcScale = scale;

      var O = {
        x: b.x1 + b.w * 0.28,
        y: b.y1 + b.h * 0.72
      };

      var a1 = o.fcA1 * Math.PI / 180;
      var a2 = o.fcA2 * Math.PI / 180;

      var P1 = {
        x: O.x + o.fcF1 * scale * Math.cos(a1),
        y: O.y - o.fcF1 * scale * Math.sin(a1)
      };
      var P2 = {
        x: O.x + o.fcF2 * scale * Math.cos(a2),
        y: O.y - o.fcF2 * scale * Math.sin(a2)
      };
      var PR = {
        x: P1.x + P2.x - O.x,
        y: P1.y + P2.y - O.y
      };

      o._fcHandles = { O: O, P1: P1, P2: P2, PR: PR };
      registerInstance(o);

      var colF1 = '#1e88e5';
      var colF2 = '#e53935';
      var colR  = '#43a047';

      c.save();
      c.setLineDash([5, 4]);
      c.strokeStyle = withAlpha(o.color || '#1a1a1a', 0.35);
      c.lineWidth = 1.2;
      c.beginPath();
      c.moveTo(P1.x, P1.y); c.lineTo(PR.x, PR.y);
      c.moveTo(P2.x, P2.y); c.lineTo(PR.x, PR.y);
      c.stroke();
      c.restore();

      drawArrow(c, O.x, O.y, P1.x, P1.y, colF1, 3, 12);
      drawArrow(c, O.x, O.y, P2.x, P2.y, colF2, 3, 12);
      drawArrow(c, O.x, O.y, PR.x, PR.y, colR, 3.5, 14);

      c.save();
      c.beginPath();
      c.arc(O.x, O.y, 4, 0, Math.PI * 2);
      c.fillStyle = withAlpha(o.color || '#1a1a1a', 0.85);
      c.fill();
      c.restore();

      function drawHandle(p, color) {
        c.save();
        c.beginPath();
        c.arc(p.x, p.y, 9, 0, Math.PI * 2);
        c.fillStyle = 'rgba(255, 255, 255, 0.9)';
        c.fill();
        c.strokeStyle = color;
        c.lineWidth = 2;
        c.stroke();
        c.beginPath();
        c.arc(p.x, p.y, 3.2, 0, Math.PI * 2);
        c.fillStyle = color;
        c.fill();
        c.restore();
      }
      drawHandle(P1, colF1);
      drawHandle(P2, colF2);

      c.save();
      c.textAlign = 'left';
      c.textBaseline = 'middle';

      c.font = 'bold 12px system-ui, sans-serif';
      c.fillStyle = colF1;
      c.fillText('F₁ = ' + o.fcF1.toFixed(2), P1.x + 14, P1.y - 8);
      c.font = '10px system-ui, sans-serif';
      c.fillStyle = 'rgba(0,0,0,0.5)';
      c.fillText('θ₁ = ' + Math.round(o.fcA1) + '°', P1.x + 14, P1.y + 6);

      c.font = 'bold 12px system-ui, sans-serif';
      c.fillStyle = colF2;
      c.fillText('F₂ = ' + o.fcF2.toFixed(2), P2.x + 14, P2.y - 8);
      c.font = '10px system-ui, sans-serif';
      c.fillStyle = 'rgba(0,0,0,0.5)';
      c.fillText('θ₂ = ' + Math.round(o.fcA2) + '°', P2.x + 14, P2.y + 6);

      var Fx = o.fcF1 * Math.cos(a1) + o.fcF2 * Math.cos(a2);
      var Fy = o.fcF1 * Math.sin(a1) + o.fcF2 * Math.sin(a2);
      var Fmag = Math.hypot(Fx, Fy);
      var Fang = Math.atan2(Fy, Fx) * 180 / Math.PI;
      c.font = 'bold 12.5px system-ui, sans-serif';
      c.fillStyle = colR;
      c.fillText('F = ' + Fmag.toFixed(2), PR.x + 14, PR.y - 8);
      c.font = '10px system-ui, sans-serif';
      c.fillStyle = 'rgba(0,0,0,0.5)';
      c.fillText('θ = ' + Fang.toFixed(1) + '°', PR.x + 14, PR.y + 6);
      c.restore();

      var modeName = function (m) {
        if (m === 1) return '固定大小';
        if (m === 2) return '固定方向';
        return '自由';
      };

      c.save();
      c.font = '11px system-ui, "PingFang SC", "Microsoft YaHei", sans-serif';
      c.textAlign = 'right';
      c.textBaseline = 'top';

      var lx = b.x2 - 8;
      var ly = b.y1 + 8;
      c.fillStyle = 'rgba(0,0,0,0.55)';
      c.fillText('拖拽模式', lx, ly);
      c.fillStyle = colF1;
      c.fillText('F₁：' + modeName(o.fcM1), lx, ly + 16);
      c.fillStyle = colF2;
      c.fillText('F₂：' + modeName(o.fcM2), lx, ly + 32);
      c.restore();

      c.save();
      c.font = '10px system-ui, "PingFang SC", "Microsoft YaHei", sans-serif';
      c.fillStyle = 'rgba(0,0,0,0.38)';
      c.textAlign = 'left';
      c.textBaseline = 'bottom';
      c.fillText('拖动箭头端点改变分力 → 观察合力随之改变',
                 b.x1 + 8, b.y2 - 6);
      c.restore();
    }
  });
})();


/* ==========================================================================
 * 30. 斜面弹簧振子
 * ========================================================================== */
(function () {
  var PB2 = window.PhysBoard;
  if (!PB2) return;

  var shape2 = function (d) {
    if (!d || !d.key) return;
    if (typeof PB2.register === 'function') PB2.register(d);
    else PB2.shapes[d.key] = d;
  };

  function withAlpha(color, a) {
    var h = String(color || '#1a1a1a').replace('#', '');
    if (h.length === 3) h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
    var n = parseInt(h, 16);
    if (isNaN(n)) return 'rgba(0,0,0,' + a + ')';
    return 'rgba(' + ((n>>16)&255) + ',' + ((n>>8)&255) + ',' + (n&255) + ',' + a + ')';
  }

  if (!PB2.paramDefs) PB2.paramDefs = {};
  if (!PB2.paramDefs.spAngle)
    PB2.paramDefs.spAngle  = { label: '倾角',     min: 0,   max: 90, step: 1,    def: 30,  unit: '°' };
  if (!PB2.paramDefs.spPeriod)
    PB2.paramDefs.spPeriod = { label: '周期',     min: 0.3, max: 3,  step: 0.1,  def: 1.2, unit: 's' };
  if (!PB2.paramDefs.spAmp)
    PB2.paramDefs.spAmp    = { label: '振幅',     min: 0.05, max: 0.4, step: 0.01, def: 0.15 };
  if (!PB2.paramDefs.spBoard)
    PB2.paramDefs.spBoard  = { label: '挡板0底1顶', min: 0, max: 1, step: 1,     def: 0 };
  if (!PB2.paramDefs.spBlock)
    PB2.paramDefs.spBlock  = { label: '物块大小', min: 10,  max: 40, step: 1,    def: 22 };

  shape2({
    key: 'anim_slope_spring',
    cat: 'anim',
    geom: 'box',
    label: '斜面弹簧振子',
    icon:
      '<path d="M4 20 L20 20 L20 8 Z" fill="none" stroke="currentColor" ' +
      'stroke-width="1.2" stroke-linejoin="round"/>' +
      '<path d="M4 20 L1 16" fill="none" stroke="currentColor" ' +
      'stroke-width="2" stroke-linecap="round"/>' +
      '<path d="M2.5 18 L4.28 17.79 L4.74 15.57 L6.96 16.03 L7.42 13.81 L9.2 13.6" ' +
      'fill="none" stroke="currentColor" stroke-width="0.9" ' +
      'stroke-linecap="round" stroke-linejoin="round"/>' +
      '<rect x="-2" y="-2" width="4" height="4" fill="currentColor" ' +
      'transform="translate(10.8,12.4) rotate(-36.87)"/>',
    animatable: true,
    params: ['spAngle', 'spPeriod', 'spAmp', 'spBoard', 'spBlock'],

    draw: function (c, o, U) {
      var AN = (window.PhysBoard && window.PhysBoard.animState) || { t: 0 };
      var b  = U.bbox(o);
      if (b.w < 80 || b.h < 80) return;

      var angleDeg = Math.max(0, Math.min(90, o.spAngle != null ? o.spAngle : 30));
      var angleShow = Math.max(0.01, Math.min(89.99, angleDeg)) * Math.PI / 180;
      var T          = Math.max(0.2, o.spPeriod != null ? o.spPeriod : 1.2);
      var ampR       = Math.max(0.03, Math.min(0.4, o.spAmp != null ? o.spAmp : 0.15));
      var boardAtTop = (o.spBoard || 0) > 0.5;
      var blockSize  = Math.max(10, Math.min(40, o.spBlock != null ? o.spBlock : 22));

      var cosA = Math.cos(angleShow);
      var sinA = Math.sin(angleShow);

      var padX  = Math.min(24, b.w * 0.06);
      var padY  = Math.min(20, b.h * 0.05);
      var infoH = 32;

      var maxW = b.w - 2 * padX;
      var maxH = b.h - 2 * padY - infoH;

      var cosSafe = Math.max(0.001, Math.abs(Math.cos(angleShow)));
      var sinSafe = Math.max(0.001, Math.abs(Math.sin(angleShow)));
      var L_byW = maxW / cosSafe;
      var L_byH = maxH / sinSafe;
      var L = Math.min(L_byW, L_byH);

      var Ax = b.x1 + padX;
      var Ay = b.y2 - padY - infoH;
      var Bx = Ax + L * Math.cos(angleShow);
      var By = Ay;
      var Cx = Bx;
      var Cy = By - L * Math.sin(angleShow);

      var ux =  Math.cos(angleShow);
      var uy = -Math.sin(angleShow);
      var nx = -Math.sin(angleShow);
      var ny = -Math.cos(angleShow);

      var posAtS = function (s) {
        return { x: Ax + s * ux, y: Ay + s * uy };
      };

      var sBoard = boardAtTop ? L : 0;
      var pBoard = posAtS(sBoard);

      var sEq = L / 2;
      var maxAmpPx = Math.max(15, L / 2 - blockSize * 1.4 - 18);
      var A_px = Math.min(ampR * L, maxAmpPx);

      var omega = 2 * Math.PI / T;
      var phase = omega * AN.t;
      var sign  = boardAtTop ? -1 : 1;
      var sBlock = sEq + sign * A_px * Math.cos(phase);
      var pBlock = posAtS(sBlock);

      var bw = blockSize * 1.15;
      var bh = blockSize;
      var boardLen   = Math.max(blockSize * 1.15, 20);
      var boardThick = Math.max(3.5, (o.size || 4) * 0.9);

      var bcx = pBlock.x + nx * (blockSize / 2);
      var bcy = pBlock.y + ny * (blockSize / 2);

      var pBoardCenter = {
        x: pBoard.x + nx * (boardLen / 2),
        y: pBoard.y + ny * (boardLen / 2)
      };

      var pBlockEdge;
      if (boardAtTop) {
        pBlockEdge = {
          x: bcx + (bw / 2) * ux,
          y: bcy + (bw / 2) * uy
        };
      } else {
        pBlockEdge = {
          x: bcx - (bw / 2) * ux,
          y: bcy - (bw / 2) * uy
        };
      }

      var pEq = posAtS(sEq);
      var eqOut = {
        x: pEq.x + nx * (blockSize * 1.6),
        y: pEq.y + ny * (blockSize * 1.6)
      };

      var strokeCol = (o.hasBorder === false) ? 'rgba(0,0,0,0)' : (o.color || '#1a1a1a');
      var fa        = (o.fillAlpha != null ? o.fillAlpha : 0.6);
      var hasFill   = (o.fill !== false && !!o.fillColor);

      var slopeFill = hasFill
                      ? withAlpha(o.fillColor, Math.max(0.04, fa * 0.30))
                      : 'rgba(0,0,0,0)';

      var blockFill   = hasFill
                        ? withAlpha(o.fillColor, Math.min(1, fa * 0.85 + 0.15))
                        : (strokeCol === 'rgba(0,0,0,0)' ? '#1a1a1a' : strokeCol);
      var blockStroke = strokeCol;

      c.save();
      c.lineWidth = Math.max(1.2, (o.size || 4) * 0.6);
      c.strokeStyle = strokeCol;
      c.fillStyle   = slopeFill;
      c.beginPath();
      c.moveTo(Ax, Ay);
      c.lineTo(Bx, By);
      c.lineTo(Cx, Cy);
      c.closePath();
      if (hasFill) c.fill();
      c.stroke();
      c.restore();

      if (Bx - Ax > 20) {
        c.save();
        c.strokeStyle = withAlpha(o.color || '#1a1a1a', 0.32);
        c.lineWidth = Math.max(0.8, (o.size || 4) * 0.4);
        for (var gx = Ax - 4; gx < Bx + 10; gx += 12) {
          c.beginPath();
          c.moveTo(gx, Ay + 1);
          c.lineTo(gx + 4, Ay + 5);
          c.stroke();
        }
        c.restore();
      }

      if (angleDeg > 1) {
        var arcR = Math.min(42, L * 0.22);
        c.save();
        c.strokeStyle = withAlpha(o.color || '#1a1a1a', 0.55);
        c.lineWidth = 1.2;
        c.beginPath();
        c.arc(Ax, Ay, arcR, -angleShow, 0, false);
        c.stroke();

        c.fillStyle = withAlpha(o.color || '#1a1a1a', 0.75);
        c.font = 'bold 12px system-ui, sans-serif';
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        var labelAng = -angleShow / 2;
        c.fillText('θ=' + Math.round(angleDeg) + '°',
                   Ax + Math.cos(labelAng) * (arcR + 22),
                   Ay + Math.sin(labelAng) * (arcR + 22));
        c.restore();
      }

      c.save();
      c.setLineDash([4, 4]);
      c.strokeStyle = withAlpha(o.color || '#1a1a1a', 0.35);
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(pEq.x, pEq.y);
      c.lineTo(eqOut.x, eqOut.y);
      c.stroke();
      c.restore();

      c.save();
      c.strokeStyle = withAlpha(o.color || '#1a1a1a', 0.55);
      c.lineWidth = 1.4;
      var eqMark = blockSize * 0.35;
      c.beginPath();
      c.moveTo(eqOut.x - eqMark, eqOut.y);
      c.lineTo(eqOut.x + eqMark, eqOut.y);
      c.moveTo(eqOut.x, eqOut.y - eqMark);
      c.lineTo(eqOut.x, eqOut.y + eqMark);
      c.stroke();
      c.restore();

      var pA1 = posAtS(sEq - A_px);
      var pA2 = posAtS(sEq + A_px);
      c.save();
      c.setLineDash([2, 4]);
      c.strokeStyle = withAlpha(o.color || '#1a1a1a', 0.2);
      c.lineWidth = 0.9;
      c.beginPath();
      c.moveTo(pA1.x, pA1.y);
      c.lineTo(pA1.x + nx * (blockSize * 1.3), pA1.y + ny * (blockSize * 1.3));
      c.moveTo(pA2.x, pA2.y);
      c.lineTo(pA2.x + nx * (blockSize * 1.3), pA2.y + ny * (blockSize * 1.3));
      c.stroke();
      c.restore();

      var springStart = pBoardCenter;
      var springEnd   = pBlockEdge;
      var sdx = springEnd.x - springStart.x;
      var sdy = springEnd.y - springStart.y;
      var sLen = Math.hypot(sdx, sdy);

      if (sLen > 10) {
        var coils = 10;
        var total = coils * 2;
        var coilAmp = blockSize * 0.45;

        var sudx = sdx / sLen;
        var sudy = sdy / sLen;
        var spdx = -sudy;
        var spdy =  sudx;

        c.save();
        c.lineWidth = Math.max(1.2, (o.size || 4) * 0.55);
        c.strokeStyle = withAlpha(o.color || '#1a1a1a', 0.9);
        c.lineCap  = 'round';
        c.lineJoin = 'round';
        c.beginPath();
        c.moveTo(springStart.x, springStart.y);
        for (var i = 1; i < total; i++) {
          var tt = i / total;
          var sx = springStart.x + sdx * tt;
          var sy = springStart.y + sdy * tt;
          var sg = (i % 2 === 0) ? -1 : 1;
          c.lineTo(sx + spdx * coilAmp * sg, sy + spdy * coilAmp * sg);
        }
        c.lineTo(springEnd.x, springEnd.y);
        c.stroke();
        c.restore();
      }

      c.save();
      c.strokeStyle = withAlpha(o.color || '#1a1a1a', 0.95);
      c.lineWidth = boardThick;
      c.lineCap = 'round';
      c.beginPath();
      c.moveTo(pBoard.x + nx * 2, pBoard.y + ny * 2);
      c.lineTo(pBoard.x + nx * boardLen, pBoard.y + ny * boardLen);
      c.stroke();

      var outerX = pBoard.x + nx * boardLen;
      var outerY = pBoard.y + ny * boardLen;
      c.lineWidth = Math.max(1.4, boardThick * 0.45);
      c.strokeStyle = withAlpha(o.color || '#1a1a1a', 0.55);
      c.beginPath();
      c.moveTo(outerX + ux * boardThick * 2.2, outerY + uy * boardThick * 2.2);
      c.lineTo(outerX - ux * boardThick * 2.2, outerY - uy * boardThick * 2.2);
      c.stroke();
      c.restore();

      c.save();
      c.translate(bcx, bcy);
      c.rotate(-angleShow);

      c.fillStyle   = blockFill;
      c.strokeStyle = blockStroke;
      c.lineWidth = Math.max(1.4, (o.size || 4) * 0.7);

      c.beginPath();
      c.rect(-bw / 2, -bh / 2, bw, bh);
      c.fill();
      c.stroke();

      if (blockSize >= 16) {
        c.fillStyle = hasFill
                      ? withAlpha(o.color || '#1a1a1a', 0.9)
                      : '#ffffff';
        c.font = 'bold ' + Math.min(bw, bh) * 0.55 + 'px system-ui, sans-serif';
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.fillText('m', 0, 0);
      }
      c.restore();

      var v = -sign * A_px * omega * Math.sin(phase);
      if (Math.abs(v) > 4) {
        var vdir = Math.sign(v);
        var vlen = Math.min(52, Math.abs(v) * 0.18);

        var arrowStart = {
          x: bcx + nx * (blockSize * 0.62),
          y: bcy + ny * (blockSize * 0.62)
        };
        var arrowEnd = {
          x: arrowStart.x + ux * vlen * vdir,
          y: arrowStart.y + uy * vlen * vdir
        };

        c.save();
        c.strokeStyle = '#43a047';
        c.fillStyle   = '#43a047';
        c.lineWidth = 2.2;
        c.lineCap = 'round';
        c.beginPath();
        c.moveTo(arrowStart.x, arrowStart.y);
        c.lineTo(arrowEnd.x, arrowEnd.y);
        c.stroke();

        var adx = arrowEnd.x - arrowStart.x;
        var ady = arrowEnd.y - arrowStart.y;
        var alen = Math.hypot(adx, ady);
        if (alen > 1) {
          var aux = adx / alen;
          var auy = ady / alen;
          var ahL = 9;
          c.beginPath();
          c.moveTo(arrowEnd.x, arrowEnd.y);
          c.lineTo(arrowEnd.x - aux * ahL - auy * ahL * 0.5,
                   arrowEnd.y - auy * ahL + aux * ahL * 0.5);
          c.lineTo(arrowEnd.x - aux * ahL + auy * ahL * 0.5,
                   arrowEnd.y - auy * ahL - aux * ahL * 0.5);
          c.closePath();
          c.fill();
        }
        c.restore();
      }

      c.save();
      c.font = '11px ui-monospace, Menlo, Consolas, monospace';
      c.fillStyle = withAlpha(o.color || '#1a1a1a', 0.55);
      c.textAlign = 'left';
      c.textBaseline = 'bottom';
      c.fillText(
        'θ=' + Math.round(angleDeg) + '°  ' +
        'T=' + T.toFixed(1) + 's  ' +
        'A=' + (A_px / L).toFixed(2) + 'L  ' +
        '挡板=' + (boardAtTop ? '顶端' : '底端'),
        b.x1 + 8, b.y2 - 6
      );
      c.restore();
    }
  });
})();


/* ==========================================================================
 * 31. 平抛运动分解
 * ========================================================================== */
(function () {
  var PB2 = window.PhysBoard;
  if (!PB2) return;

  var shape2 = function (d) {
    if (!d || !d.key) return;
    if (typeof PB2.register === 'function') PB2.register(d);
    else PB2.shapes[d.key] = d;
  };

  function withAlpha(color, a) {
    var h = String(color || '#1a1a1a').replace('#', '');
    if (h.length === 3) h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
    var n = parseInt(h, 16);
    if (isNaN(n)) return 'rgba(0,0,0,' + a + ')';
    return 'rgba(' + ((n>>16)&255) + ',' + ((n>>8)&255) + ',' + (n&255) + ',' + a + ')';
  }

  if (!PB2.paramDefs) PB2.paramDefs = {};
  if (!PB2.paramDefs.projV0)
    PB2.paramDefs.projV0 = { label: '初速度 v₀', min: 0.5, max: 2.5, step: 0.1, def: 1.5 };
  if (!PB2.paramDefs.projT)
    PB2.paramDefs.projT = { label: '下落时间', min: 0.8, max: 3, step: 0.1, def: 1.6, unit: 's' };
  if (!PB2.paramDefs.projFlash)
    PB2.paramDefs.projFlash = { label: '频闪次数', min: 4, max: 20, step: 1, def: 10 };

  shape2({
    key: 'anim_projectile_decomp',
    cat: 'anim',
    geom: 'box',
    label: '平抛运动分解',
    icon: '<path d="M2 4 Q 12 20 22 20" fill="none" stroke="currentColor" stroke-width="1.4"/>' +
          '<circle cx="2" cy="4" r="1.2" fill="currentColor"/>' +
          '<circle cx="22" cy="20" r="1.2" fill="currentColor"/>' +
          '<circle cx="22" cy="4" r="1.2" fill="currentColor"/>',
    animatable: true,
    params: ['projV0', 'projT', 'projFlash'],

    draw: function (c, o, U2) {
      var AN = (window.PhysBoard && window.PhysBoard.animState) || { t: 0 };
      var b = U2.bbox(o);
      if (b.w < 100 || b.h < 100) return;

      var v0 = Math.max(0.5, Math.min(2.5, o.projV0 != null ? o.projV0 : 1.5));
      var T  = Math.max(0.5, Math.min(4, o.projT != null ? o.projT : 1.6));
      var N  = Math.max(4, Math.min(20, Math.round(o.projFlash != null ? o.projFlash : 10)));

      if (!window.__projStates) window.__projStates = new WeakMap();
      var S = window.__projStates.get(o);
      var sig = v0 + '|' + T + '|' + b.w.toFixed(0) + '|' + b.h.toFixed(0);
      if (!S || S.sig !== sig) {
        S = { sig: sig, t0: AN.t };
        window.__projStates.set(o, S);
      }
      var t = (AN.t - S.t0) % T;
      if (!isFinite(t) || t < 0) t = 0;

      var padL = 55, padR = 55, padT = 55, padB = 55;
      var W_avail = b.w - padL - padR;
      var H_avail = b.h - padT - padB;
      if (W_avail < 60 || H_avail < 60) return;

      var v0max = 2.5;
      var scale = Math.min(W_avail / v0max, H_avail);

      var W_traj = v0 * scale;
      var H_traj = scale;

      var x0 = b.x1 + padL;
      var y0 = b.y1 + padT;
      var xEnd = x0 + W_traj;
      var yEnd = y0 + H_traj;

      var v0_px = W_traj / T;
      var g_px  = 2 * H_traj / (T * T);

      var xMain = x0 + v0_px * t;
      var yMain = y0 + 0.5 * g_px * t * t;

      var xShadow = xMain;
      var yShadow = yEnd;
      var xVert   = xEnd;
      var yVert   = yMain;

      var colMain  = '#e53935';
      var colHoriz = '#1e88e5';
      var colVert  = '#43a047';

      c.save();
      c.setLineDash([5, 4]);
      c.strokeStyle = withAlpha(o.color || '#1a1a1a', 0.45);
      c.lineWidth = 1.3;
      c.beginPath();
      c.moveTo(x0 - 14, yEnd);
      c.lineTo(xEnd + 14, yEnd);
      c.moveTo(xEnd, y0 - 14);
      c.lineTo(xEnd, yEnd + 14);
      c.stroke();
      c.restore();

      c.save();
      c.setLineDash([5, 4]);
      c.strokeStyle = withAlpha(colMain, 0.22);
      c.lineWidth = 1.6;
      c.beginPath();
      var Nfull = 60;
      for (var i = 0; i <= Nfull; i++) {
        var tf = T * i / Nfull;
        var xf = x0 + v0_px * tf;
        var yf = y0 + 0.5 * g_px * tf * tf;
        if (i === 0) c.moveTo(xf, yf);
        else c.lineTo(xf, yf);
      }
      c.stroke();
      c.restore();

      c.save();
      c.strokeStyle = colMain;
      c.lineWidth = 2.4;
      c.lineCap = 'round';
      c.lineJoin = 'round';
      c.beginPath();
      var Ns = Math.max(12, Math.round(90 * t / T));
      for (var j = 0; j <= Ns; j++) {
        var ts = t * j / Ns;
        var xs = x0 + v0_px * ts;
        var ys = y0 + 0.5 * g_px * ts * ts;
        if (j === 0) c.moveTo(xs, ys);
        else c.lineTo(xs, ys);
      }
      c.stroke();
      c.restore();

      c.save();
      c.strokeStyle = withAlpha(colHoriz, 0.75);
      c.lineWidth = 3;
      c.lineCap = 'round';
      c.beginPath();
      c.moveTo(x0, yEnd);
      c.lineTo(xMain, yEnd);
      c.stroke();
      c.restore();

      c.save();
      c.strokeStyle = withAlpha(colVert, 0.75);
      c.lineWidth = 3;
      c.lineCap = 'round';
      c.beginPath();
      c.moveTo(xEnd, y0);
      c.lineTo(xEnd, yMain);
      c.stroke();
      c.restore();

      c.save();
      c.setLineDash([4, 4]);
      c.lineWidth = 1.2;
      c.strokeStyle = withAlpha(colHoriz, 0.55);
      c.beginPath();
      c.moveTo(xMain, yMain);
      c.lineTo(xMain, yEnd);
      c.stroke();
      c.strokeStyle = withAlpha(colVert, 0.55);
      c.beginPath();
      c.moveTo(xMain, yMain);
      c.lineTo(xEnd, yMain);
      c.stroke();
      c.restore();

      var dtFlash = T / N;
      var flashDone = Math.floor(t / dtFlash + 1e-6);
      if (flashDone > N) flashDone = N;

      var flashR = Math.max(3.2, Math.min(5.5, scale * 0.012));

      for (var fk = 1; fk <= flashDone; fk++) {
        var tk = fk * dtFlash;
        var fx = x0 + v0_px * tk;
        var fy = y0 + 0.5 * g_px * tk * tk;

        c.save();
        c.beginPath();
        c.arc(fx, fy, flashR, 0, Math.PI * 2);
        c.fillStyle = colMain;
        c.fill();
        c.strokeStyle = '#fff';
        c.lineWidth = 1.2;
        c.stroke();
        c.restore();

        c.save();
        c.beginPath();
        c.arc(fx, yEnd, flashR, 0, Math.PI * 2);
        c.fillStyle = colHoriz;
        c.fill();
        c.strokeStyle = '#fff';
        c.lineWidth = 1.2;
        c.stroke();
        c.restore();

        c.save();
        c.beginPath();
        c.arc(xEnd, fy, flashR, 0, Math.PI * 2);
        c.fillStyle = colVert;
        c.fill();
        c.strokeStyle = '#fff';
        c.lineWidth = 1.2;
        c.stroke();
        c.restore();
      }

      c.save();
      c.beginPath();
      c.arc(x0, y0, 3.5, 0, Math.PI * 2);
      c.fillStyle = withAlpha(o.color || '#1a1a1a', 0.75);
      c.fill();
      c.restore();

      var ballR = 6.5;
      var drawBall = function (px, py, color) {
        c.save();
        var grd = c.createRadialGradient(px, py, 0, px, py, ballR * 2.8);
        grd.addColorStop(0, withAlpha(color, 0.45));
        grd.addColorStop(1, withAlpha(color, 0));
        c.fillStyle = grd;
        c.beginPath();
        c.arc(px, py, ballR * 2.8, 0, Math.PI * 2);
        c.fill();

        c.beginPath();
        c.arc(px, py, ballR, 0, Math.PI * 2);
        c.fillStyle = color;
        c.fill();
        c.strokeStyle = '#ffffff';
        c.lineWidth = 1.5;
        c.stroke();

        c.beginPath();
        c.arc(px - ballR * 0.32, py - ballR * 0.32, ballR * 0.32, 0, Math.PI * 2);
        c.fillStyle = 'rgba(255,255,255,0.75)';
        c.fill();
        c.restore();
      };

      drawBall(xMain,   yMain,   colMain);
      drawBall(xShadow, yShadow, colHoriz);
      drawBall(xVert,   yVert,   colVert);

      var vx = v0_px;
      var vy = g_px * t;
      var vScale = 0.16;

      c.save();
      c.strokeStyle = withAlpha(colMain, 0.75);
      c.fillStyle   = withAlpha(colMain, 0.75);
      c.lineWidth = 2;
      c.lineCap = 'round';

      var axEnd = xMain + vx * vScale;
      var ayEnd = yMain + vy * vScale;
      c.beginPath();
      c.moveTo(xMain, yMain);
      c.lineTo(axEnd, ayEnd);
      c.stroke();

      var adx = axEnd - xMain;
      var ady = ayEnd - yMain;
      var alen = Math.hypot(adx, ady);
      if (alen > 2) {
        var aux = adx / alen, auy = ady / alen;
        var ahl = 8;
        c.beginPath();
        c.moveTo(axEnd, ayEnd);
        c.lineTo(axEnd - aux * ahl - auy * ahl * 0.5,
                 ayEnd - auy * ahl + aux * ahl * 0.5);
        c.lineTo(axEnd - aux * ahl + auy * ahl * 0.5,
                 ayEnd - auy * ahl - aux * ahl * 0.5);
        c.closePath();
        c.fill();
      }
      c.restore();

      c.save();
      c.font = 'bold 12px system-ui, "PingFang SC", "Microsoft YaHei", sans-serif';
      c.fillStyle = withAlpha(o.color || '#1a1a1a', 0.85);
      c.textAlign = 'left';
      c.textBaseline = 'top';
      c.fillText('平抛运动分解', b.x1 + 10, b.y1 + 8);
      c.restore();

      c.save();
      c.font = '10.5px system-ui, "PingFang SC", "Microsoft YaHei", sans-serif';
      c.textAlign = 'right';
      c.textBaseline = 'middle';

      var legendX = b.x2 - 10;
      var legendY = b.y1 + 14;
      var legendLineH = 16;

      var items = [
        { color: colMain,  text: '合运动（平抛）' },
        { color: colHoriz, text: '水平：匀速直线' },
        { color: colVert,  text: '竖直：自由落体' }
      ];

      for (var k = 0; k < items.length; k++) {
        var itemY = legendY + k * legendLineH;
        var textW = c.measureText(items[k].text).width;
        c.beginPath();
        c.arc(legendX - textW - 12, itemY, 4, 0, Math.PI * 2);
        c.fillStyle = items[k].color;
        c.fill();
        c.strokeStyle = '#fff';
        c.lineWidth = 1;
        c.stroke();
        c.fillStyle = 'rgba(0, 0, 0, 0.7)';
        c.fillText(items[k].text, legendX, itemY);
      }
      c.restore();

      c.save();
      c.font = '11px ui-monospace, Menlo, Consolas, monospace';
      c.fillStyle = withAlpha(o.color || '#1a1a1a', 0.55);
      c.textAlign = 'right';
      c.textBaseline = 'bottom';
      c.fillText(
        'v₀ = ' + v0.toFixed(1) +
        '   频闪 = ' + N + '次/周期' +
        '   t = ' + t.toFixed(2) + ' / ' + T.toFixed(1) + ' s',
        b.x2 - 8, b.y2 - 6
      );
      c.restore();
    }
  });
})();

/* ==========================================================================
 * 33. 磁场中带电粒子扇形轨迹
 *     平板 MN 上方匀强磁场 B 垂直纸面向里，正电荷 +q 以速率 v
 *     从 O 孔沿纸面内各个方向射入，R = mv/(qB)
 *     可能经过的区域 = 左上大扇形(半径 2R) ∪ 右上小半圆(半径 R)
 * ========================================================================== */
param('mfN',     { label: '粒子数',   min: 4, max: 24, step: 1,    def: 12 });
param('mfR',     { label: '半径比例', min: 0.25, max: 1, step: 0.05, def: 0.85 });
param('mfSpeed', { label: '速度倍率', min: 0.3, max: 3, step: 0.1,  def: 1 });
param('mfArea',  { label: '阴影区域', min: 0, max: 1, step: 1,      def: 1 });

shape({
  key: 'anim_mag_fan',
  cat: 'anim',
  geom: 'box',
  label: '磁场粒子扇形',
  icon: '<path d="M2 19h20"/>' +
        '<circle cx="14" cy="19" r="1.2" fill="currentColor"/>' +
        '<path d="M14 19A8 8 0 0 0 6 11" fill="none"/>' +
        '<path d="M14 19A6 6 0 0 0 14 7" fill="none"/>' +
        '<path d="M14 19A4 4 0 0 1 18 15" fill="none"/>',
  animatable: true,
  params: ['mfN', 'mfR', 'mfSpeed', 'mfArea'],

  draw(c, o, U2) {
    const AN = (window.PhysBoard && window.PhysBoard.animState) || { t: 0 };
    const b  = U2.bbox(o);
    if (b.w < 80 || b.h < 60) return;

    const N        = Math.max(4, Math.min(24, Math.round(o.mfN ?? 12)));
    const ratio    = Math.max(0.25, Math.min(1, o.mfR ?? 0.85));
    const speed    = Math.max(0.2, o.mfSpeed ?? 1);
    const showArea = (o.mfArea ?? 1) >= 0.5;

    /* ---------- 布局：区域 3R × 2R，O 在底边距左侧 2R 处 ---------- */
    const padX = 10, padY = 10, labelH = 26;
    const availW = b.w - 2 * padX;
    const availH = b.h - 2 * padY - labelH;
    if (availW < 50 || availH < 50) return;

    const R = Math.min(availW / 3, availH / 2) * ratio;
    if (R < 15) return;

    const freeW = Math.max(0, availW - 3 * R);
    const freeH = Math.max(0, availH - 2 * R);
    const Ox = b.x1 + padX + 2 * R + freeW / 2;   // O 点画布 x
    const Oy = b.y1 + padY + 2 * R + freeH / 2;   // O 点画布 y

    const colBase = o.color || '#1a1a1a';
    const lw = Math.max(1, 2.2 - N * 0.05);

    /* ---------- 时序：所有粒子同时出发，角速度相同 ---------- */
    const omega = Math.PI * speed;                // speed=1 时整圈 2s
    const tExitList = [];
    let tMax = 0;
    for (let i = 0; i < N; i++) {
      const theta = Math.PI * (i + 0.5) / N;      // 速度方向角
      const dPhi  = 2 * Math.PI - 2 * theta;      // 磁场内转过的角
      const tExit = dPhi / omega;
      tExitList.push(tExit);
      if (tExit > tMax) tMax = tExit;
    }
    const pause   = 1.2 / Math.max(0.5, speed);
    const T_cycle = tMax + pause;
    let t = AN.t % T_cycle;
    if (t < 0) t += T_cycle;

    const allDone  = t >= tMax;
    const doneProg = allDone
      ? Math.min(1, (t - tMax) / Math.min(0.4, pause * 0.5))
      : 0;

    /* ---------- 1. 磁场背景 ⊗ ---------- */
    c.save();
    c.strokeStyle = 'rgba(120, 160, 220, 0.20)';
    c.lineWidth = 1;
    const sp = Math.max(26, R * 0.42);
    for (let yy = Oy - sp * 0.7; yy > b.y1 + 4; yy -= sp) {
      for (let xx = b.x1 + 10; xx < b.x2 - 8; xx += sp) {
        const d = 2.8;
        c.beginPath();
        c.moveTo(xx - d, yy - d); c.lineTo(xx + d, yy + d);
        c.moveTo(xx + d, yy - d); c.lineTo(xx - d, yy + d);
        c.stroke();
      }
    }
    c.restore();

    /* ---------- 2. 理论阴影区域 ---------- */
    if (showArea) {
      const alpha = allDone ? (0.06 + 0.18 * doneProg) : 0.06;
      c.save();
      c.beginPath();
      const Ns = 48;
      const cxS = Ox, cyS = Oy - R;               // 小圆圆心
      for (let i = 0; i <= Ns; i++) {             // 小圆右半：O → (0,2R)
        const phi = -Math.PI / 2 + Math.PI * i / Ns;
        const x = cxS + R * Math.cos(phi);
        const y = cyS - R * Math.sin(phi);
        i === 0 ? c.moveTo(x, y) : c.lineTo(x, y);
      }
      for (let i = 1; i <= Ns; i++) {             // 大圆左四分之一：→ (-2R,0)
        const phi = Math.PI / 2 + (Math.PI / 2) * i / Ns;
        const x = Ox + 2 * R * Math.cos(phi);
        const y = Oy - 2 * R * Math.sin(phi);
        c.lineTo(x, y);
      }
      c.lineTo(Ox, Oy);                           // 沿 MN 回到 O
      c.closePath();
      c.fillStyle = 'rgba(70, 130, 200, ' + alpha.toFixed(3) + ')';
      c.fill();
      c.restore();
    }

    /* ---------- 3. 粒子与轨迹 ---------- */
    for (let i = 0; i < N; i++) {
      const theta   = Math.PI * (i + 0.5) / N;
      const tExit   = tExitList[i];
      const tLocal  = Math.min(t, tExit);
      const dPhiCur = omega * tLocal;

      /* 圆心（画布）：C = O + R·(-sinθ, cosθ)（物理 → 画布 y 翻转） */
      const Cxc  = Ox - Math.sin(theta) * R;
      const Cyc  = Oy - Math.cos(theta) * R;
      const phi0 = theta - Math.PI / 2;           // O 相对圆心的角度

      const hue = 20 + (i / N) * 320;

      if (dPhiCur > 1e-4) {
        const nSeg = Math.max(8, Math.ceil(dPhiCur / (Math.PI / 36)));
        c.beginPath();
        for (let k = 0; k <= nSeg; k++) {
          const phi = phi0 + dPhiCur * k / nSeg;
          const px = Cxc + R * Math.cos(phi);
          const py = Cyc - R * Math.sin(phi);
          k === 0 ? c.moveTo(px, py) : c.lineTo(px, py);
        }
        c.strokeStyle = 'hsla(' + hue + ', 72%, 50%, 0.58)';
        c.lineWidth = lw;
        c.lineCap = 'round';
        c.stroke();
      }

      if (t < tExit + 0.12 || !allDone) {
        const phiCur = phi0 + dPhiCur;
        const px = Cxc + R * Math.cos(phiCur);
        const py = Cyc - R * Math.sin(phiCur);
        c.beginPath();
        c.arc(px, py, 3.4, 0, Math.PI * 2);
        c.fillStyle = 'hsla(' + hue + ', 85%, 52%, 0.95)';
        c.fill();
        c.strokeStyle = '#fff';
        c.lineWidth = 1.2;
        c.stroke();
      }
    }

    /* ---------- 4. 平板 MN ---------- */
    c.save();
    c.strokeStyle = colBase;
    c.lineWidth = Math.max(2, (o.size || 4) * 0.7);
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(b.x1 + 6, Oy);
    c.lineTo(b.x2 - 6, Oy);
    c.stroke();
    c.restore();

    /* ---------- 5. M、N、O ---------- */
    c.save();
    c.font = 'bold 13px system-ui, "PingFang SC", "Microsoft YaHei", sans-serif';
    c.fillStyle = colBase;
    c.textBaseline = 'bottom';
    c.textAlign = 'left';
    c.fillText('M', b.x1 + 6, Oy - 6);
    c.textAlign = 'right';
    c.fillText('N', b.x2 - 6, Oy - 6);
    c.restore();

    c.save();
    c.beginPath();
    c.arc(Ox, Oy, 4.2, 0, Math.PI * 2);
    c.fillStyle = colBase;
    c.fill();
    c.strokeStyle = '#fff';
    c.lineWidth = 1.6;
    c.stroke();
    c.restore();

    c.save();
    c.font = 'bold 13px system-ui, "PingFang SC", "Microsoft YaHei", sans-serif';
    c.fillStyle = colBase;
    c.textAlign = 'left';
    c.textBaseline = 'top';
    c.fillText('O', Ox + 7, Oy + 6);
    c.restore();

    /* ---------- 6. 底部提示 ---------- */
    c.save();
    c.font = '11px system-ui, "PingFang SC", "Microsoft YaHei", sans-serif';
    c.fillStyle = U2.alpha(colBase, 0.55);
    c.textAlign = 'center';
    c.textBaseline = 'bottom';
    c.fillText(
      'B 垂直纸面向里 · ' + N + ' 个正电荷粒子从 O 沿各方向射入',
      (b.x1 + b.x2) / 2,
      b.y2 - 3
    );
    c.restore();
  }
});

/* ==========================================================================
 * 34. 磁发散模型
 *     圆形磁场区域半径 R（= 轨迹半径），粒子从最低点 O 沿 180° 各方向射入
 *     轨迹圆心 A = (R sinθ, -R cosθ)，出射点 B = (R sinθ, R(1-cosθ))
 *     出射后沿 +x 方向匀速直线运动
 * ========================================================================== */
param('mfN',     { label: '粒子数',   min: 3,  max: 24, step: 1,   def: 10 });
param('mfSpeed', { label: '速度倍率', min: 0.2, max: 3, step: 0.1, def: 1 });
param('mfTrack', { label: '显示轨迹', min: 0,  max: 1,  step: 1,   def: 1 });

shape({
  key: 'anim_magDivergence',
  cat: 'anim',
  geom: 'box',
  label: '磁发散模型',
  icon: '<circle cx="8" cy="11" r="6" fill="none"/>' +
        '<circle cx="8" cy="17" r="1.4" fill="currentColor"/>' +
        '<path d="M8 17 L21 17 M8 17 L21 13 M8 17 L21 21"/>',
  animatable: true,
  params: ['mfN', 'mfSpeed', 'mfTrack'],

  draw(c, o, U) {
    const AN = (window.PhysBoard && window.PhysBoard.animState) || { t: 0 };
    const b = U.bbox(o);
    if (b.w < 80 || b.h < 60) return;

    const N = Math.max(3, Math.min(24, Math.round(o.mfN ?? 10)));
    const speedMul = Math.max(0.2, Math.min(3, o.mfSpeed ?? 1));
    const showTrack = (o.mfTrack ?? 1) >= 0.5;
    const omega = 1.5 * speedMul;

    /* ---- 画布布局 ---- */
    const pad = 12;
    const textH = 26;
    const Ox = b.x1 + b.w * 0.35;              /* O 点画布 x（区域最低点） */
    const Oy = b.y2 - pad - textH;             /* O 点画布 y */
    const Rc = Math.min(
      (Oy - b.y1 - pad) / 2,                   /* 垂直方向 */
      Ox - b.x1 - pad,                         /* 左边界 */
      b.x2 - pad - Ox,                         /* 右边界 */
      b.w * 0.28,
      b.h * 0.45
    );
    if (Rc < 15) return;

    /* ---- 循环时间：0 < t < 2π/ω ---- */
    const T_loop = 2 * Math.PI / omega;
    let t = AN.t % T_loop;
    if (t < 0) t += T_loop;

    c.save();
    c.beginPath();
    c.rect(b.x1, b.y1, b.w, b.h);
    c.clip();

    /* ---- 1. 磁场区域（圆形） ---- */
    c.save();
    c.beginPath();
    c.arc(Ox, Oy - Rc, Rc, 0, Math.PI * 2);
    c.fillStyle = 'rgba(70, 130, 200, 0.05)';
    c.fill();
    c.strokeStyle = 'rgba(60, 100, 160, 0.55)';
    c.lineWidth = 1.6;
    c.stroke();
    c.restore();

    /* ---- 2. ⊗ 磁场符号背景 ---- */
    c.save();
    c.strokeStyle = 'rgba(80, 130, 200, 0.22)';
    c.lineWidth = 1;
    const sp = Math.max(22, Rc * 0.32);
    const cyCir = Oy - Rc;
    for (let dy = -Rc + sp * 0.4; dy < Rc; dy += sp) {
      for (let dx = -Rc + sp * 0.4; dx < Rc; dx += sp) {
        if (dx * dx + dy * dy > (Rc - 8) * (Rc - 8)) continue;
        const px = Ox + dx, py = cyCir + dy;
        const d = 2.8;
        c.beginPath();
        c.moveTo(px - d, py - d); c.lineTo(px + d, py + d);
        c.moveTo(px + d, py - d); c.lineTo(px - d, py + d);
        c.stroke();
      }
    }
    c.restore();

    /* ---- 3. 每个粒子的动画 ---- */
    for (let i = 0; i < N; i++) {
      const theta = Math.PI * (i + 0.5) / N;   /* 发射方向角（从 x 轴正方向算） */
      const t1 = theta / omega;                /* 离开磁场的时间 */
      const phi0 = Math.PI / 2 + theta;        /* 圆心角（物理坐标） */

      /* 出射点 B 的画布坐标 */
      const Bx_c = Ox + Rc * Math.sin(theta);
      const By_c = Oy - Rc * (1 - Math.cos(theta));

      const hue = (i * 360 / N) % 360;
      const color = 'hsl(' + hue + ', 75%, 50%)';

      /* 当前位置 */
      let px, py;
      if (t <= t1) {
        const phi = phi0 - omega * t;
        px = Ox + Rc * (Math.sin(theta) + Math.cos(phi));
        py = Oy + Rc * (Math.cos(theta) - Math.sin(phi));
      } else {
        px = Bx_c + omega * Rc * (t - t1);
        py = By_c;
      }

      /* 轨迹 */
      if (showTrack && t > 0.005) {
        c.save();
        c.strokeStyle = color;
        c.lineWidth = Math.max(1.2, 2 - N * 0.04);
        c.globalAlpha = 0.55;
        c.lineCap = 'round';
        c.lineJoin = 'round';

        if (t <= t1) {
          /* 仅圆弧 */
          const nSeg = Math.max(8, Math.ceil(omega * t / (Math.PI / 40)));
          c.beginPath();
          for (let k = 0; k <= nSeg; k++) {
            const tK = t * k / nSeg;
            const phiK = phi0 - omega * tK;
            const xK = Ox + Rc * (Math.sin(theta) + Math.cos(phiK));
            const yK = Oy + Rc * (Math.cos(theta) - Math.sin(phiK));
            k === 0 ? c.moveTo(xK, yK) : c.lineTo(xK, yK);
          }
          c.stroke();
        } else {
          /* 圆弧 + 直线 */
          const nSeg = Math.max(8, Math.ceil(omega * t1 / (Math.PI / 40)));
          c.beginPath();
          for (let k = 0; k <= nSeg; k++) {
            const tK = t1 * k / nSeg;
            const phiK = phi0 - omega * tK;
            const xK = Ox + Rc * (Math.sin(theta) + Math.cos(phiK));
            const yK = Oy + Rc * (Math.cos(theta) - Math.sin(phiK));
            k === 0 ? c.moveTo(xK, yK) : c.lineTo(xK, yK);
          }
          c.lineTo(px, py);
          c.stroke();
        }
        c.restore();
      }

      /* 粒子圆点 */
      c.save();
      c.beginPath();
      c.arc(px, py, 3.5, 0, Math.PI * 2);
      c.fillStyle = color;
      c.fill();
      c.strokeStyle = '#fff';
      c.lineWidth = 1.2;
      c.stroke();
      c.restore();
    }

    /* ---- 4. 原点 O ---- */
    c.save();
    c.beginPath();
    c.arc(Ox, Oy, 4, 0, Math.PI * 2);
    c.fillStyle = '#1a1a1a';
    c.fill();
    c.strokeStyle = '#fff';
    c.lineWidth = 1.4;
    c.stroke();
    c.restore();

    c.save();
    c.font = 'bold 12px system-ui, "PingFang SC", "Microsoft YaHei", sans-serif';
    c.fillStyle = '#1a1a1a';
    c.textAlign = 'left';
    c.textBaseline = 'top';
    c.fillText('O', Ox + 7, Oy + 5);
    c.restore();

    /* ---- 5. 底部提示 ---- */
    c.save();
    c.font = '11px system-ui, "PingFang SC", "Microsoft YaHei", sans-serif';
    c.fillStyle = 'rgba(30, 30, 30, 0.55)';
    c.textAlign = 'center';
    c.textBaseline = 'bottom';
    c.fillText(
      'R轨迹 = R区域  ·  ' + N + ' 粒子等分 180°  ·  出射后平行于 +x',
      (b.x1 + b.x2) / 2,
      b.y2 - 4
    );
    c.restore();

    c.restore();
  }
});

/* ==========================================================================
 * 35. 磁聚焦模型（磁发散的时间反演）
 *     平行粒子从右侧沿 -x 方向射入圆形磁场，轨迹半径 = 区域半径 R
 *     粒子经磁场偏转后，先后汇聚到区域最低点 O
 * ========================================================================== */
param('mfcN',     { label: '粒子数',   min: 3,  max: 24, step: 1,   def: 10 });
param('mfcSpeed', { label: '速度倍率', min: 0.2, max: 3, step: 0.1, def: 1 });
param('mfcTrack', { label: '显示轨迹', min: 0,  max: 1,  step: 1,   def: 1 });

shape({
  key: 'anim_magFocus',
  cat: 'anim',
  geom: 'box',
  label: '磁聚焦模型',
  icon: '<circle cx="12" cy="12" r="7" fill="none" stroke-dasharray="2 2"/>' +
        '<path d="M21 6 L12 12 M21 12 L12 12 M21 18 L12 12"/>' +
        '<circle cx="12" cy="12" r="1.6" fill="currentColor"/>',
  animatable: true,
  params: ['mfcN', 'mfcSpeed', 'mfcTrack'],

  draw(c, o, U) {
    const AN = (window.PhysBoard && window.PhysBoard.animState) || { t: 0 };
    const b = U.bbox(o);
    if (b.w < 100 || b.h < 70) return;

    const N = Math.max(3, Math.min(24, Math.round(o.mfcN ?? 10)));
    const speedMul = Math.max(0.2, Math.min(3, o.mfcSpeed ?? 1));
    const showTrack = (o.mfcTrack ?? 1) >= 0.5;
    const omega = 1.4 * speedMul;
    const x_start = 2.2;
    const pause = 0.9 / speedMul;

    /* ---- 画布布局（物理 R=1，区域范围 [-1, x_start] × [0, 2]） ---- */
    const scale = Math.min(b.w * 0.86 / (x_start + 1.1), (b.h - 45) / 2.1);
    if (scale < 15) return;
    const Ox = (b.x1 + b.x2) / 2 - (x_start - 1) * scale / 2;
    const Oy = b.y2 - 32;

    /* ---- 时间 ---- */
    const T_max_phys = (x_start + Math.PI) / omega;
    const T_cycle = T_max_phys + pause;
    let t = AN.t % T_cycle;
    if (t < 0) t += T_cycle;

    c.save();
    c.beginPath();
    c.rect(b.x1, b.y1, b.w, b.h);
    c.clip();

    /* ---- 1. 圆形磁场区域 ---- */
    c.save();
    const grd = c.createRadialGradient(Ox, Oy - scale, 0, Ox, Oy - scale, scale);
    grd.addColorStop(0, 'rgba(70, 130, 200, 0.10)');
    grd.addColorStop(1, 'rgba(70, 130, 200, 0.02)');
    c.beginPath();
    c.arc(Ox, Oy - scale, scale, 0, Math.PI * 2);
    c.fillStyle = grd;
    c.fill();
    c.strokeStyle = 'rgba(60, 100, 160, 0.55)';
    c.lineWidth = 1.6;
    c.stroke();
    c.restore();

    /* ---- 2. ⊗ 磁场符号背景 ---- */
    c.save();
    c.strokeStyle = 'rgba(80, 130, 200, 0.18)';
    c.lineWidth = 1;
    const sp = Math.max(22, scale * 0.32);
    const cyCir = Oy - scale;
    for (let dy = -scale + sp * 0.4; dy < scale; dy += sp) {
      for (let dx = -scale + sp * 0.4; dx < scale; dx += sp) {
        if (dx * dx + dy * dy > (scale - 10) * (scale - 10)) continue;
        const px = Ox + dx, py = cyCir + dy;
        const d = 2.8;
        c.beginPath();
        c.moveTo(px - d, py - d); c.lineTo(px + d, py + d);
        c.moveTo(px + d, py - d); c.lineTo(px - d, py + d);
        c.stroke();
      }
    }
    c.restore();

    /* ---- 3. 入射起始线（虚线） ---- */
    c.save();
    c.setLineDash([4, 4]);
    c.strokeStyle = 'rgba(150, 150, 150, 0.4)';
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(Ox + x_start * scale, b.y1 + 4);
    c.lineTo(Ox + x_start * scale, Oy - 2 * scale - 4);
    c.stroke();
    c.restore();

    /* ---- 4. 粒子动画 ---- */
    let arrivedCount = 0;

    for (let i = 0; i < N; i++) {
      const theta = Math.PI * (i + 0.5) / N;
      const sinT = Math.sin(theta);
      const cosT = Math.cos(theta);

      const t_leave  = (x_start - sinT) / omega;
      const t_arrive = t_leave + theta / omega;

      const hue = Math.round(360 * i / N);
      const color = 'hsl(' + hue + ', 75%, 52%)';

      const arrived = t >= t_arrive;
      if (arrived) arrivedCount++;

      /* ---- 轨迹（累积绘制） ---- */
      if (showTrack && t > 0.005) {
        c.save();
        c.strokeStyle = color;
        c.lineWidth = Math.max(1.1, 2 - N * 0.04);
        c.globalAlpha = 0.55;
        c.lineCap = 'round';
        c.lineJoin = 'round';

        const t_end = Math.min(t, t_arrive);

        if (t_end > 0) {
          /* 直线段 */
          const tLine = Math.min(t_end, t_leave);
          const xEnd = x_start - omega * tLine;
          const yLine = 1 - cosT;
          c.beginPath();
          c.moveTo(Ox + x_start * scale, Oy - yLine * scale);
          c.lineTo(Ox + xEnd * scale, Oy - yLine * scale);

          /* 圆弧段 */
          if (t_end > t_leave) {
            const sEnd = t_end - t_leave;
            const nSeg = Math.max(8, Math.ceil(omega * sEnd / (Math.PI / 40)));
            for (let k = 1; k <= nSeg; k++) {
              const s = sEnd * k / nSeg;
              const x_phys = sinT - Math.sin(omega * s);
              const y_phys = -cosT + Math.cos(omega * s);
              c.lineTo(Ox + x_phys * scale, Oy - y_phys * scale);
            }
          }
          c.stroke();
        }
        c.restore();
      }

      /* ---- 粒子（未到达前可见） ---- */
      if (!arrived) {
        let px, py;
        if (t < t_leave) {
          const x_phys = x_start - omega * t;
          const y_phys = 1 - cosT;
          px = Ox + x_phys * scale;
          py = Oy - y_phys * scale;
        } else {
          const s = t - t_leave;
          const x_phys = sinT - Math.sin(omega * s);
          const y_phys = -cosT + Math.cos(omega * s);
          px = Ox + x_phys * scale;
          py = Oy - y_phys * scale;
        }

        c.save();
        c.beginPath();
        c.arc(px, py, 3.5, 0, Math.PI * 2);
        c.fillStyle = color;
        c.fill();
        c.strokeStyle = '#fff';
        c.lineWidth = 1.2;
        c.stroke();
        c.restore();
      }
    }

    /* ---- 5. 焦点 O（带辉光，到达的粒子越多越亮） ---- */
    const glowAlpha = 0.2 + 0.65 * (arrivedCount / N);
    c.save();
    const glow = c.createRadialGradient(Ox, Oy, 0, Ox, Oy, 22);
    glow.addColorStop(0, 'rgba(255, 180, 50, ' + glowAlpha.toFixed(3) + ')');
    glow.addColorStop(1, 'rgba(255, 180, 50, 0)');
    c.fillStyle = glow;
    c.beginPath();
    c.arc(Ox, Oy, 22, 0, Math.PI * 2);
    c.fill();
    c.restore();

    c.save();
    c.beginPath();
    c.arc(Ox, Oy, 4.5, 0, Math.PI * 2);
    c.fillStyle = '#ff9500';
    c.fill();
    c.strokeStyle = '#fff';
    c.lineWidth = 1.6;
    c.stroke();
    c.restore();

    c.save();
    c.font = 'bold 12px system-ui, "PingFang SC", "Microsoft YaHei", sans-serif';
    c.fillStyle = '#1a1a1a';
    c.textAlign = 'left';
    c.textBaseline = 'top';
    c.fillText('O', Ox + 8, Oy + 5);
    c.restore();

    /* ---- 6. 底部提示 ---- */
    c.save();
    c.font = '11px system-ui, "PingFang SC", "Microsoft YaHei", sans-serif';
    c.fillStyle = 'rgba(30, 30, 30, 0.55)';
    c.textAlign = 'center';
    c.textBaseline = 'bottom';
    c.fillText(
      'R轨迹 = R区域  ·  ' + N + ' 个平行粒子向左射入  ·  先后汇聚到 O 点',
      (b.x1 + b.x2) / 2,
      b.y2 - 4
    );
    c.restore();

    c.restore();
  }
});


/* ==========================================================================
 * 36. 矩形磁场 · 半径渐增圆弧族（动态追踪 + 相切高亮）
 *     粒子从源点沿初速方向切出圆弧，R 从 0 匀速增大
 *     每帧记录当前圆弧半径形成累积轨迹，动态 R 与相切 R 重合时才点亮该相切轨迹
 * ========================================================================== */
param('rfanW',     { label: '矩形宽',   min: 100, max: 600, step: 10,   def: 320 });
param('rfanH',     { label: '矩形高',   min: 80,  max: 400, step: 10,   def: 220 });
param('rfanSrc',   { label: '源位置',   min: 0,   max: 2,   step: 1,    def: 1,  unit: '0边1内2角' });
param('rfanSX',    { label: '源 X',     min: 0,   max: 1,   step: 0.01, def: 0.5 });
param('rfanSY',    { label: '源 Y',     min: 0,   max: 1,   step: 0.01, def: 0.5 });
param('rfanAng',   { label: '出射角',   min: 0,   max: 360, step: 1,    def: 90, unit: '°' });
param('rfanRot',   { label: '旋向',     min: 0,   max: 1,   step: 1,    def: 0,  unit: '0逆1顺' });
param('rfanSpeed', { label: '动画速度', min: 0.3, max: 3,   step: 0.1,  def: 1 });
param('rfanHigh',  { label: '相切高亮', min: 0,   max: 1,   step: 1,    def: 1,  unit: '0关1开' });

shape({
  key: 'anim_rectMagFan',
  cat: 'anim',
  geom: 'box',
  label: '矩形磁场伸缩圆',
  icon: '<rect x="3" y="5" width="18" height="14" fill="none" stroke="currentColor"/>' +
        '<path d="M12 14a3 3 0 0 1 3-3M12 14a5 5 0 0 1 5-5M12 14a8 8 0 0 1 8-8" fill="none" stroke="currentColor"/>',
  animatable: true,
  params: ['rfanW', 'rfanH', 'rfanSrc', 'rfanSX', 'rfanSY',
           'rfanAng', 'rfanRot', 'rfanSpeed', 'rfanHigh'],

  draw(c, o, U) {
    const AN = (window.PhysBoard && window.PhysBoard.animState) || { t: 0 };
    const b = U.bbox(o);
    if (b.w < 80 || b.h < 60) return;

    /* ---- 参数 ---- */
    const W0 = o.rfanW ?? 320;
    const H0 = o.rfanH ?? 220;
    const srcType = Math.round(o.rfanSrc ?? 1);
    const nx = Math.max(0, Math.min(1, o.rfanSX ?? 0.5));
    const ny = Math.max(0, Math.min(1, o.rfanSY ?? 0.5));
    const theta = (o.rfanAng ?? 90) * Math.PI / 180;
    const s = (o.rfanRot ?? 0) < 0.5 ? 1 : -1;
    const speedMul = Math.max(0.3, Math.min(3, o.rfanSpeed ?? 1));
    const showTangent = (o.rfanHigh ?? 1) >= 0.5;

    /* ---- 源位置（物理坐标） ---- */
    let sx, sy;
    if (srcType === 0) {
      const dL = nx, dR = 1 - nx, dB = ny, dT = 1 - ny;
      const m = Math.min(dL, dR, dB, dT);
      if (m === dL)      { sx = 0;      sy = ny * H0; }
      else if (m === dR) { sx = W0;     sy = ny * H0; }
      else if (m === dB) { sx = nx * W0; sy = 0;      }
      else               { sx = nx * W0; sy = H0;     }
    } else if (srcType === 2) {
      sx = nx < 0.5 ? 0 : W0;
      sy = ny < 0.5 ? 0 : H0;
    } else {
      sx = nx * W0;
      sy = ny * H0;
    }

    /* ---- 布局 ---- */
    const fitW = Math.max(60, b.w - 30);
    const fitH = Math.max(60, b.h - 42);
    const k = Math.min(1, fitW / W0, fitH / H0);
    const W = W0 * k;
    const H = H0 * k;
    const rectL = b.x1 + (b.w - W) / 2;
    const rectT = b.y1 + (b.h - H) / 2 - 6;
    const scale = W / W0;
    const toCanvas = (x, y) => ({ x: rectL + x * scale, y: rectT + (H0 - y) * scale });

    /* ---- 几何基元 ---- */
    const nHat = { x: -Math.sin(theta), y: Math.cos(theta) };
    const phi0 = theta - s * Math.PI / 2;
    const centerAt = R => ({ x: sx + s * R * nHat.x, y: sy + s * R * nHat.y });
    const pointAt = (R, psi) => {
      const C = centerAt(R);
      return {
        x: C.x + R * Math.cos(phi0 + s * psi),
        y: C.y + R * Math.sin(phi0 + s * psi),
      };
    };
    const inside = p => p.x >= -1e-6 && p.x <= W0 + 1e-6 && p.y >= -1e-6 && p.y <= H0 + 1e-6;

    const findExit = R => {
      if (R < 0.5) return 2 * Math.PI;
      const N = 30;
      for (let i = 1; i <= N; i++) {
        const psi = 2 * Math.PI * i / N;
        if (!inside(pointAt(R, psi))) {
          let lo = 2 * Math.PI * (i - 1) / N, hi = psi;
          for (let j = 0; j < 12; j++) {
            const mid = (lo + hi) / 2;
            if (inside(pointAt(R, mid))) lo = mid;
            else hi = mid;
          }
          return hi;
        }
      }
      return 2 * Math.PI;
    };

    /* ---- 动画进度 ---- */
    const diag = Math.sqrt(W0 * W0 + H0 * H0);
    const Rmax = diag * 1.2;
    const T = 4 / speedMul;
    let tt = AN.t % T;
    if (tt < 0) tt += T;
    const Rcur = (tt / T) * Rmax;

    /* ---- 状态缓存（追踪 & 相切激活） ---- */
    const sig = W0 + '|' + H0 + '|' + srcType + '|' +
                sx.toFixed(2) + '|' + sy.toFixed(2) + '|' +
                (theta * 180 / Math.PI).toFixed(1) + '|' + s;
    if (!o._rfanState || o._rfanState.sig !== sig) {
      o._rfanState = { sig, lastR: -1, traces: [], tangents: null, activeTangents: [] };
    }
    const S = o._rfanState;

    /* ---- 相切轨迹（懒计算，仅算一次） ---- */
    if (showTangent && S.tangents === null) {
      const list = [];
      const seen = new Set();
      const pushSpec = (R, P) => {
        if (!isFinite(R) || R <= 1 || R > Rmax * 1.5) return;
        const C = centerAt(R);
        const alpha = Math.atan2(P.y - C.y, P.x - C.x);
        let psi = s * (alpha - phi0);
        psi = ((psi % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
        if (psi < 0.05 || psi > 2 * Math.PI - 0.05) return;
        const key = R.toFixed(2);
        if (seen.has(key)) return;
        seen.add(key);
        list.push({ R, point: P });
      };
      const d1 = 1 + s * Math.sin(theta);
      if (Math.abs(d1) > 1e-6) {
        const R = sx / d1;
        if (R > 1) {
          const C = centerAt(R);
          if (C.y >= -1e-6 && C.y <= H0 + 1e-6) pushSpec(R, { x: 0, y: C.y });
        }
      }
      const d2 = 1 - s * Math.sin(theta);
      if (Math.abs(d2) > 1e-6) {
        const R = (W0 - sx) / d2;
        if (R > 1) {
          const C = centerAt(R);
          if (C.y >= -1e-6 && C.y <= H0 + 1e-6) pushSpec(R, { x: W0, y: C.y });
        }
      }
      const d3 = 1 - s * Math.cos(theta);
      if (Math.abs(d3) > 1e-6) {
        const R = sy / d3;
        if (R > 1) {
          const C = centerAt(R);
          if (C.x >= -1e-6 && C.x <= W0 + 1e-6) pushSpec(R, { x: C.x, y: 0 });
        }
      }
      const d4 = 1 + s * Math.cos(theta);
      if (Math.abs(d4) > 1e-6) {
        const R = (H0 - sy) / d4;
        if (R > 1) {
          const C = centerAt(R);
          if (C.x >= -1e-6 && C.x <= W0 + 1e-6) pushSpec(R, { x: C.x, y: H0 });
        }
      }
      S.tangents = list;
    }

    /* ---- 循环重置 ---- */
    if (Rcur < S.lastR - 1e-6) {
      S.traces = [];
      S.activeTangents = [];
      S.lastR = -1;
    }

    /* ---- 追踪动态轨迹（每帧记录 Rcur） ---- */
    const stepThreshold = Rmax / 400;
    if (Rcur - S.lastR > stepThreshold && Rcur > 2) {
      S.traces.push(Rcur);
      S.lastR = Rcur;
    }

    /* ---- 相切激活（动态 R 到达相切 R 附近时点亮，激活后保留） ---- */
    const tol = Rmax * 0.015;
    if (showTangent && S.tangents) {
      for (let i = 0; i < S.tangents.length; i++) {
        if (S.activeTangents.indexOf(i) >= 0) continue;
        if (Math.abs(Rcur - S.tangents[i].R) < tol) {
          S.activeTangents.push(i);
        }
      }
    }

    /* ================== 开始绘制 ================== */
    c.save();
    c.beginPath();
    c.rect(b.x1, b.y1, b.w, b.h);
    c.clip();

    /* ① 矩形背景 + 边框 */
    c.save();
    c.fillStyle = 'rgba(70, 130, 200, 0.04)';
    c.fillRect(rectL, rectT, W, H);
    c.strokeStyle = o.color || '#1a1a1a';
    c.lineWidth = Math.max(1.5, (o.size || 4) * 0.7);
    c.strokeRect(rectL, rectT, W, H);
    c.restore();

    /* ② ⊗ 磁场符号 */
    c.save();
    c.strokeStyle = 'rgba(80, 130, 200, 0.14)';
    c.lineWidth = 1;
    const sp = 28;
    for (let yy = rectT + sp * 0.5; yy < rectT + H; yy += sp) {
      for (let xx = rectL + sp * 0.5; xx < rectL + W; xx += sp) {
        const d = 3;
        c.beginPath();
        c.moveTo(xx - d, yy - d); c.lineTo(xx + d, yy + d);
        c.moveTo(xx + d, yy - d); c.lineTo(xx - d, yy + d);
        c.stroke();
      }
    }
    c.restore();

    /* ③ 历史痕迹（动态追踪累积的圆弧族） */
    if (S.traces.length > 0) {
      c.save();
      c.strokeStyle = 'rgba(229, 57, 53, 0.14)';
      c.lineWidth = 1;
      c.lineCap = 'round';
      for (const Rk of S.traces) {
        const psiExit = findExit(Rk);
        const Nseg = Math.max(10, Math.ceil(psiExit / (2 * Math.PI) * 80));
        c.beginPath();
        for (let j = 0; j <= Nseg; j++) {
          const psi = psiExit * j / Nseg;
          const p = pointAt(Rk, psi);
          const cp = toCanvas(p.x, p.y);
          if (j === 0) c.moveTo(cp.x, cp.y);
          else c.lineTo(cp.x, cp.y);
        }
        c.stroke();
      }
      c.restore();
    }

    /* ④ 已激活的相切轨迹（沿运动方向：第一次越界后不再绘制） */
    if (showTangent && S.activeTangents.length > 0) {
      const tol = Math.max(1e-6, (W0 + H0) * 1e-4);
      const insideStrict = p =>
        p.x >= -tol && p.x <= W0 + tol &&
        p.y >= -tol && p.y <= H0 + tol;

      for (const idx of S.activeTangents) {
        const tg = S.tangents[idx];
        const R = tg.R;
        const color = '#00c853';

        /* 沿 ψ 增大方向（粒子运动方向）扫描第一次真正越界位置 */
        let psiStop = 2 * Math.PI;
        const Nscan = 720;
        for (let j = 1; j <= Nscan; j++) {
          const psi = 2 * Math.PI * j / Nscan;
          if (!insideStrict(pointAt(R, psi))) {
            let lo = 2 * Math.PI * (j - 1) / Nscan;
            let hi = psi;
            for (let k = 0; k < 20; k++) {
              const mid = (lo + hi) / 2;
              if (insideStrict(pointAt(R, mid))) lo = mid;
              else hi = mid;
            }
            psiStop = hi;
            break;
          }
        }

        /* 只绘制 ψ ∈ [0, psiStop] 这一段，越界之后完全不画 */
        if (psiStop > 1e-3) {
          const Nseg = Math.max(20, Math.ceil(psiStop / (2 * Math.PI) * 300));
          c.save();
          c.strokeStyle = color;
          c.lineWidth = 2;
          c.lineCap = 'round';
          c.lineJoin = 'round';
          c.beginPath();
          for (let j = 0; j <= Nseg; j++) {
            const psi = psiStop * j / Nseg;
            const p = pointAt(R, psi);
            const cp = toCanvas(p.x, p.y);
            if (j === 0) c.moveTo(cp.x, cp.y);
            else c.lineTo(cp.x, cp.y);
          }
          c.stroke();
          c.restore();
        }

        /* 切点标记保留（表示这条轨迹与边界相切） */
        const cpt = toCanvas(tg.point.x, tg.point.y);
        c.save();
        c.beginPath();
        c.arc(cpt.x, cpt.y, 5, 0, Math.PI * 2);
        c.fillStyle = color;
        c.fill();
        c.strokeStyle = '#fff';
        c.lineWidth = 1.8;
        c.stroke();
        c.restore();
      }
    }
    /* ⑤ 当前动态圆弧 */
    if (Rcur > 1) {
      const psiExit = findExit(Rcur);
      const Nseg = Math.max(20, Math.ceil(psiExit / (2 * Math.PI) * 240));
      c.save();
      c.strokeStyle = '#e53935';
      c.lineWidth = 2.6;
      c.lineCap = 'round';
      c.lineJoin = 'round';
      c.beginPath();
      for (let j = 0; j <= Nseg; j++) {
        const psi = psiExit * j / Nseg;
        const p = pointAt(Rcur, psi);
        const cp = toCanvas(p.x, p.y);
        if (j === 0) c.moveTo(cp.x, cp.y);
        else c.lineTo(cp.x, cp.y);
      }
      c.stroke();
      c.restore();

      if (psiExit < 2 * Math.PI - 1e-3) {
        const pEnd = pointAt(Rcur, psiExit);
        const cpEnd = toCanvas(pEnd.x, pEnd.y);
        c.save();
        c.beginPath();
        c.arc(cpEnd.x, cpEnd.y, 4.5, 0, Math.PI * 2);
        c.fillStyle = '#e53935';
        c.fill();
        c.strokeStyle = '#fff';
        c.lineWidth = 1.6;
        c.stroke();
        c.restore();
      }
    }

    /* ⑥ 源点 + 黑色出射箭头（加长） */
    const cpSrc = toCanvas(sx, sy);
    const aLen = 50;
    const ex = cpSrc.x + Math.cos(theta) * aLen;
    const ey = cpSrc.y - Math.sin(theta) * aLen;

    c.save();
    c.strokeStyle = '#e53935';
    c.fillStyle = '#e53935';
    c.lineWidth = 2.2;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(cpSrc.x, cpSrc.y);
    c.lineTo(ex, ey);
    c.stroke();

    const aH = 11;
    const cosT = Math.cos(theta), sinT = Math.sin(theta);
    c.beginPath();
    c.moveTo(ex, ey);
    c.lineTo(ex - cosT * aH + sinT * aH * 0.5, ey + sinT * aH + cosT * aH * 0.5);
    c.lineTo(ex - cosT * aH - sinT * aH * 0.5, ey + sinT * aH - cosT * aH * 0.5);
    c.closePath();
    c.fill();
    c.restore();

    c.save();
    c.beginPath();
    c.arc(cpSrc.x, cpSrc.y, 5.5, 0, Math.PI * 2);
    c.fillStyle = '#e53935';
    c.fill();
    c.strokeStyle = '#fff';
    c.lineWidth = 1.6;
    c.stroke();
    c.restore();

    /* ⑦ 底部信息 */
    c.save();
    c.font = '11px system-ui, "PingFang SC", "Microsoft YaHei", sans-serif';
    c.fillStyle = 'rgba(30, 30, 30, 0.55)';
    c.textAlign = 'center';
    c.textBaseline = 'bottom';
    c.fillText(
      W0 + '×' + H0 + '   θ=' + Math.round(o.rfanAng ?? 90) + '°   ' +
      (s > 0 ? '逆时针' : '顺时针') + '   R/Rmax=' + (Rcur / Rmax).toFixed(2),
      b.x1 + b.w / 2, b.y2 - 3
    );
    c.restore();

    c.restore();
  }
});

/* ==========================================================================
 * 37. 矩形磁场 · 固定半径方向扫描（含相切 / 最长 / 最短 特殊轨迹）
 *     R 固定可调（最小 0），θ 从 0 扫到 2π
 *     每条圆弧从源点切出沿运动方向追踪，第一次出界即停
 *     扫描到相切 / 最长 / 最短方向时点亮该特殊轨迹（激活后保留）
 * ========================================================================== */
param('rfan2W',     { label: '矩形宽',   min: 100, max: 600, step: 10,   def: 320 });
param('rfan2H',     { label: '矩形高',   min: 80,  max: 400, step: 10,   def: 220 });
param('rfan2SX',    { label: '源 X',     min: 0,   max: 1,   step: 0.01, def: 0.5 });
param('rfan2SY',    { label: '源 Y',     min: 0,   max: 1,   step: 0.01, def: 0.5 });
param('rfan2R',     { label: '半径 R',   min: 0,   max: 300, step: 5,    def: 110 });
param('rfan2Rot',   { label: '旋向',     min: 0,   max: 1,   step: 1,    def: 0,  unit: '0逆1顺' });
param('rfan2Speed', { label: '扫描速度', min: 0.2, max: 3,   step: 0.1,  def: 1 });
param('rfan2High',  { label: '特殊轨迹高亮', min: 0, max: 1, step: 1,    def: 1,  unit: '0关1开' });

shape({
  key: 'anim_rectMagTheta',
  cat: 'anim',
  geom: 'box',
  label: '矩形磁场旋转圆',
  icon: '<rect x="3" y="5" width="18" height="14" fill="none" stroke="currentColor"/>' +
        '<path d="M12 19a3 3 0 0 1 3-3M12 19a6 6 0 0 1 6-6M12 19a9 9 0 0 1 9-9" fill="none" stroke="currentColor"/>' +
        '<circle cx="12" cy="19" r="1" fill="currentColor"/>',
  animatable: true,
  params: ['rfan2W', 'rfan2H', 'rfan2SX', 'rfan2SY', 'rfan2R',
           'rfan2Rot', 'rfan2Speed', 'rfan2High'],

  draw(c, o, U) {
    const AN = (window.PhysBoard && window.PhysBoard.animState) || { t: 0 };
    const b = U.bbox(o);
    if (b.w < 80 || b.h < 60) return;

    /* ---- 参数 ---- */
    const W0 = o.rfan2W ?? 320;
    const H0 = o.rfan2H ?? 220;
    const nx = Math.max(0, Math.min(1, o.rfan2SX ?? 0.5));
    const ny = Math.max(0, Math.min(1, o.rfan2SY ?? 0.5));
    const R  = Math.max(0, o.rfan2R ?? 110);
    const s  = (o.rfan2Rot ?? 0) < 0.5 ? 1 : -1;
    const speedMul   = Math.max(0.2, Math.min(3, o.rfan2Speed ?? 1));
    const showSpecial = (o.rfan2High ?? 1) >= 0.5;

    /* ---- 源位置（物理坐标，中心为默认） ---- */
    const sx = nx * W0;
    const sy = ny * H0;

    /* ---- 布局 ---- */
    const fitW = Math.max(60, b.w - 30);
    const fitH = Math.max(60, b.h - 42);
    const k = Math.min(1, fitW / W0, fitH / H0);
    const W = W0 * k;
    const H = H0 * k;
    const rectL = b.x1 + (b.w - W) / 2;
    const rectT = b.y1 + (b.h - H) / 2 - 6;
    const scale = W / W0;
    const toCanvas = (x, y) => ({ x: rectL + x * scale, y: rectT + (H0 - y) * scale });

    /* ---- 几何工具 ---- */
    const inside = p =>
      p.x >= -1e-6 && p.x <= W0 + 1e-6 && p.y >= -1e-6 && p.y <= H0 + 1e-6;

    const arcParams = theta => {
      const sinT = Math.sin(theta), cosT = Math.cos(theta);
      return {
        sinT, cosT,
        Cx: sx - s * R * sinT,
        Cy: sy + s * R * cosT,
        phi0: theta - s * Math.PI / 2,
      };
    };
    const pointAt = (theta, psi) => {
      const { Cx, Cy, phi0 } = arcParams(theta);
      return {
        x: Cx + R * Math.cos(phi0 + s * psi),
        y: Cy + R * Math.sin(phi0 + s * psi),
      };
    };
    const findExit = theta => {
      if (R < 1) return 0;
      const Nscan = 60;
      for (let i = 1; i <= Nscan; i++) {
        const psi = 2 * Math.PI * i / Nscan;
        if (!inside(pointAt(theta, psi))) {
          let lo = 2 * Math.PI * (i - 1) / Nscan, hi = psi;
          for (let j = 0; j < 14; j++) {
            const mid = (lo + hi) / 2;
            if (inside(pointAt(theta, mid))) lo = mid;
            else hi = mid;
          }
          return hi;
        }
      }
      return 2 * Math.PI;
    };

    /* ---- 扫描参数 ---- */
    const T = 5 / speedMul;
    let tt = AN.t % T;
    if (tt < 0) tt += T;
    const thetaCur = 2 * Math.PI * tt / T;

    /* ---- 状态缓存（含 sig，参数变化时全部重算） ---- */
    const sig = [W0, H0, sx.toFixed(2), sy.toFixed(2), R.toFixed(1), s].join('|');
    if (!o._rfan2State || o._rfan2State.sig !== sig) {
      o._rfan2State = {
        sig,
        tangents: null,
        longest: null,
        shortest: null,
        activeTangents: [],
        activeLongest: false,
        activeShortest: false,
        lastTheta: -1,
      };
    }
    const S = o._rfan2State;

    /* ---- 特殊点计算（懒加载） ---- */
    const computeAll = () => {
      /* 1) 相切解析解 */
      const tangents = [];
      const seen = new Set();
      const sR = s * R;
      const pushTan = (theta, px, py) => {
        theta = ((theta % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
        const key = theta.toFixed(4);
        if (seen.has(key)) return;
        const { Cx, Cy, phi0 } = arcParams(theta);
        const alpha = Math.atan2(py - Cy, px - Cx);
        let psiTan = s * (alpha - phi0);
        psiTan = ((psiTan % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
        if (psiTan < 0.05 || psiTan > 2 * Math.PI - 0.05) return;
        const psiStop = findExit(theta);
        if (psiTan > psiStop + 0.05) return;
        seen.add(key);
        tangents.push({ theta, point: { x: px, y: py }, psiStop });
      };

      if (R > 1 && Math.abs(sR) > 1e-6) {
        for (const cxT of [R, -R]) {
          const sc0 = (sx - cxT) / sR;
          if (Math.abs(sc0) <= 1 + 1e-9) {
            const sc = Math.max(-1, Math.min(1, sc0));
            const base = Math.asin(sc);
            for (const th of [base, Math.PI - base]) {
              const Cy = sy + sR * Math.cos(th);
              if (Cy >= -1e-6 && Cy <= H0 + 1e-6)
                pushTan(th, 0, Math.max(0, Math.min(H0, Cy)));
            }
          }
        }
        for (const cxT of [W0 + R, W0 - R]) {
          const sc0 = (sx - cxT) / sR;
          if (Math.abs(sc0) <= 1 + 1e-9) {
            const sc = Math.max(-1, Math.min(1, sc0));
            const base = Math.asin(sc);
            for (const th of [base, Math.PI - base]) {
              const Cy = sy + sR * Math.cos(th);
              if (Cy >= -1e-6 && Cy <= H0 + 1e-6)
                pushTan(th, W0, Math.max(0, Math.min(H0, Cy)));
            }
          }
        }
        for (const cyT of [R, -R]) {
          const cc0 = (cyT - sy) / sR;
          if (Math.abs(cc0) <= 1 + 1e-9) {
            const cc = Math.max(-1, Math.min(1, cc0));
            const base = Math.acos(cc);
            for (const th of [base, -base]) {
              const Cx = sx - sR * Math.sin(th);
              if (Cx >= -1e-6 && Cx <= W0 + 1e-6)
                pushTan(th, Math.max(0, Math.min(W0, Cx)), 0);
            }
          }
        }
        for (const cyT of [H0 + R, H0 - R]) {
          const cc0 = (cyT - sy) / sR;
          if (Math.abs(cc0) <= 1 + 1e-9) {
            const cc = Math.max(-1, Math.min(1, cc0));
            const base = Math.acos(cc);
            for (const th of [base, -base]) {
              const Cx = sx - sR * Math.sin(th);
              if (Cx >= -1e-6 && Cx <= W0 + 1e-6)
                pushTan(th, Math.max(0, Math.min(W0, Cx)), H0);
            }
          }
        }
      }

      /* 2) 数值扫描找最长 / 最短弧长方向 */
      let longest = null, shortest = null;
      if (R > 1) {
        const Nsamp = 360;
        let maxPsi = -1, minPsi = Infinity, maxTh = 0, minTh = 0;
        for (let i = 0; i < Nsamp; i++) {
          const th = 2 * Math.PI * i / Nsamp;
          const ps = findExit(th);
          if (ps > maxPsi + 1e-6) { maxPsi = ps; maxTh = th; }
          if (ps < minPsi - 1e-6) { minPsi = ps; minTh = th; }
        }
        /* 极值差异过小则忽略，避免"看起来一样" */
        if (maxPsi > 0 && minPsi < Infinity && (maxPsi - minPsi) > 0.1) {
          longest  = { theta: maxTh, psiStop: maxPsi };
          shortest = { theta: minTh, psiStop: minPsi };
        }
      }

      return { tangents, longest, shortest };
    };

    if (S.tangents === null) {
      const all = computeAll();
      S.tangents = all.tangents;
      S.longest  = all.longest;
      S.shortest = all.shortest;
    }

    /* ---- 循环回绕时清空激活状态 ---- */
    if (thetaCur < S.lastTheta - 0.01) {
      S.activeTangents = [];
      S.activeLongest = false;
      S.activeShortest = false;
    }
    S.lastTheta = thetaCur;

    /* ---- 激活判定 ---- */
    if (showSpecial) {
      const tol = 0.06;
      for (let i = 0; i < S.tangents.length; i++) {
        if (S.activeTangents.indexOf(i) >= 0) continue;
        let d = Math.abs(thetaCur - S.tangents[i].theta);
        d = Math.min(d, 2 * Math.PI - d);
        if (d < tol) S.activeTangents.push(i);
      }
      if (S.longest && !S.activeLongest) {
        let d = Math.abs(thetaCur - S.longest.theta);
        d = Math.min(d, 2 * Math.PI - d);
        if (d < tol) S.activeLongest = true;
      }
      if (S.shortest && !S.activeShortest) {
        let d = Math.abs(thetaCur - S.shortest.theta);
        d = Math.min(d, 2 * Math.PI - d);
        if (d < tol) S.activeShortest = true;
      }
    }

    /* ================== 开始绘制 ================== */
    c.save();
    c.beginPath();
    c.rect(b.x1, b.y1, b.w, b.h);
    c.clip();

    /* ① 矩形背景 + 边框 */
    c.save();
    c.fillStyle = 'rgba(70, 130, 200, 0.04)';
    c.fillRect(rectL, rectT, W, H);
    c.strokeStyle = o.color || '#1a1a1a';
    c.lineWidth = Math.max(1.5, (o.size || 4) * 0.7);
    c.strokeRect(rectL, rectT, W, H);
    c.restore();

    /* ② ⊗ 磁场符号 */
    c.save();
    c.strokeStyle = 'rgba(80, 130, 200, 0.14)';
    c.lineWidth = 1;
    const sp = 28;
    for (let yy = rectT + sp * 0.5; yy < rectT + H; yy += sp) {
      for (let xx = rectL + sp * 0.5; xx < rectL + W; xx += sp) {
        const d = 3;
        c.beginPath();
        c.moveTo(xx - d, yy - d); c.lineTo(xx + d, yy + d);
        c.moveTo(xx + d, yy - d); c.lineTo(xx - d, yy + d);
        c.stroke();
      }
    }
    c.restore();

    /* 画弧段的通用函数 */
    const drawArcSeg = (theta, psiStop, color, lw) => {
      if (R < 1 || psiStop <= 0) return;
      const { Cx, Cy, phi0 } = arcParams(theta);
      const Nseg = Math.max(10, Math.min(220, Math.ceil(R * psiStop / 6)));
      c.beginPath();
      for (let j = 0; j <= Nseg; j++) {
        const psi = psiStop * j / Nseg;
        const px = Cx + R * Math.cos(phi0 + s * psi);
        const py = Cy + R * Math.sin(phi0 + s * psi);
        const cp = toCanvas(px, py);
        if (j === 0) c.moveTo(cp.x, cp.y);
        else c.lineTo(cp.x, cp.y);
      }
      c.strokeStyle = color;
      c.lineWidth = lw;
      c.lineCap = 'round';
      c.lineJoin = 'round';
      c.stroke();
    };

    /* ③ 特殊轨迹（先画 最长 / 最短，再画 相切） */
    if (showSpecial) {
      /* 最长（蓝色） */
      if (S.activeLongest && S.longest) {
        c.save();
        drawArcSeg(S.longest.theta, S.longest.psiStop, '#1e88e5', 2.2);
        const pEnd = pointAt(S.longest.theta, S.longest.psiStop);
        const cpEnd = toCanvas(pEnd.x, pEnd.y);
        c.beginPath();
        c.arc(cpEnd.x, cpEnd.y, 5, 0, Math.PI * 2);
        c.fillStyle = '#1e88e5';
        c.fill();
        c.strokeStyle = '#fff';
        c.lineWidth = 1.8;
        c.stroke();
        c.restore();
      }

      /* 最短（橙色） */
      if (S.activeShortest && S.shortest) {
        c.save();
        drawArcSeg(S.shortest.theta, S.shortest.psiStop, '#ff6f00', 2.2);
        const pEnd = pointAt(S.shortest.theta, S.shortest.psiStop);
        const cpEnd = toCanvas(pEnd.x, pEnd.y);
        c.beginPath();
        c.arc(cpEnd.x, cpEnd.y, 5, 0, Math.PI * 2);
        c.fillStyle = '#ff6f00';
        c.fill();
        c.strokeStyle = '#fff';
        c.lineWidth = 1.8;
        c.stroke();
        c.restore();
      }

      /* 相切（绿色） */
      for (const idx of S.activeTangents) {
        const tg = S.tangents[idx];
        c.save();
        drawArcSeg(tg.theta, tg.psiStop, '#00c853', 2);
        const cpt = toCanvas(tg.point.x, tg.point.y);
        c.beginPath();
        c.arc(cpt.x, cpt.y, 5, 0, Math.PI * 2);
        c.fillStyle = '#00c853';
        c.fill();
        c.strokeStyle = '#fff';
        c.lineWidth = 1.8;
        c.stroke();
        c.restore();
      }
    }

    /* ④ 当前动态圆弧（红色） */
    if (R >= 1) {
      const psiCur = findExit(thetaCur);
      c.save();
      drawArcSeg(thetaCur, psiCur, '#e53935', 2.6);
      c.restore();

      if (psiCur < 2 * Math.PI - 1e-3) {
        const pEnd = pointAt(thetaCur, psiCur);
        const cpEnd = toCanvas(pEnd.x, pEnd.y);
        c.save();
        c.beginPath();
        c.arc(cpEnd.x, cpEnd.y, 4.5, 0, Math.PI * 2);
        c.fillStyle = '#e53935';
        c.fill();
        c.strokeStyle = '#fff';
        c.lineWidth = 1.6;
        c.stroke();
        c.restore();
      }
    }

    /* ⑤ 源点 + 红色出射箭头 */
    const cpSrc = toCanvas(sx, sy);
    const aLen = 50;
    const ex = cpSrc.x + Math.cos(thetaCur) * aLen;
    const ey = cpSrc.y - Math.sin(thetaCur) * aLen;

    c.save();
    c.strokeStyle = '#e53935';
    c.fillStyle = '#e53935';
    c.lineWidth = 2.2;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(cpSrc.x, cpSrc.y);
    c.lineTo(ex, ey);
    c.stroke();
    const aH = 11;
    const cosT = Math.cos(thetaCur), sinT = Math.sin(thetaCur);
    c.beginPath();
    c.moveTo(ex, ey);
    c.lineTo(ex - cosT * aH + sinT * aH * 0.5, ey + sinT * aH + cosT * aH * 0.5);
    c.lineTo(ex - cosT * aH - sinT * aH * 0.5, ey + sinT * aH - cosT * aH * 0.5);
    c.closePath();
    c.fill();
    c.restore();

    c.save();
    c.beginPath();
    c.arc(cpSrc.x, cpSrc.y, 5.5, 0, Math.PI * 2);
    c.fillStyle = '#e53935';
    c.fill();
    c.strokeStyle = '#fff';
    c.lineWidth = 1.6;
    c.stroke();
    c.restore();

    /* ⑥ 底部信息 */
    c.save();
    c.font = '11px system-ui, "PingFang SC", "Microsoft YaHei", sans-serif';
    c.textBaseline = 'bottom';
    c.textAlign = 'center';
    c.fillStyle = 'rgba(30, 30, 30, 0.55)';
    c.fillText(
      W0 + '×' + H0 + '   R=' + R.toFixed(0) + '   ' +
      'θ=' + Math.round(thetaCur * 180 / Math.PI) + '°   ' +
      (s > 0 ? '逆时针' : '顺时针'),
      b.x1 + b.w / 2, b.y2 - 3
    );
    c.restore();

    c.restore();
  }
});



/* ==========================================================================
 * 38. 水平屏 + 粒子源 + 全方向圆周运动
 *    （轨迹完整可见、加粗，特殊方向独占高亮）
 * ========================================================================== */
param('rscrL',     { label: '屏长度 L', min: 60,  max: 600, step: 10,   def: 600 });
param('rscrSrcX',  { label: '源 X 位置', min: -1, max: 1,   step: 0.05, def: 0 });
param('rscrK',     { label: 'R / d',    min: 0.5, max: 5,   step: 0.1,  def: 2 });
param('rscrRot',   { label: '旋向',     min: 0,   max: 1,   step: 1,    def: 0,  unit: '0逆1顺' });
param('rscrSpeed', { label: '动画速度', min: 0.2, max: 3,   step: 0.1,  def: 1 });
param('rscrHigh',  { label: '特殊轨迹高亮', min: 0, max: 1, step: 1,    def: 1,  unit: '0关1开' });

shape({
  key: 'anim_rectSource',
  cat: 'anim',
  geom: 'box',
  label: '水平屏粒子源',
  icon: '<path d="M2 21h20"/>' +                                   /* 水平屏 */
        '<path d="M12 8 A9 9 0 0 0 4 21"/>' +                      /* 向左大弧 */
        '<path d="M12 8 A9 9 0 0 1 20 21"/>' +                     /* 向右大弧 */
        '<path d="M12 8 A7 7 0 0 0 9 21"/>' +                      /* 向左小弧 */
        '<path d="M12 8 A7 7 0 0 1 15 21"/>' +                     /* 向右小弧 */
        '<circle cx="12" cy="8" r="1.5" fill="currentColor"/>',     /* 源点 S */
  animatable: true,
  params: ['rscrL', 'rscrSrcX', 'rscrK', 'rscrRot', 'rscrSpeed', 'rscrHigh'],

  draw(c, o, U) {
    const AN = (window.PhysBoard && window.PhysBoard.animState) || { t: 0 };
    const b = U.bbox(o);
    if (b.w < 100 || b.h < 80) return;

    /* ---- 参数 ---- */
    const L        = Math.max(60, o.rscrL ?? 280);
    const srcFrac  = Math.max(-1, Math.min(1, o.rscrSrcX ?? 0));
    const k        = Math.max(0.5, Math.min(5, o.rscrK ?? 2));
    const s        = (o.rscrRot ?? 0) < 0.5 ? -1 : 1;
    const speedMul = Math.max(0.2, Math.min(3, o.rscrSpeed ?? 1));
    const showSpecial = (o.rscrHigh ?? 1) >= 0.5;

    /* ---- 布局：保证 4R×4R 轨迹包围盒完整落在画布内 ---- */
    const pad = 20, textH = 26;
    const screenCX = (b.x1 + b.x2) / 2;
    const L_draw   = Math.min(L, b.w - 2 * pad);
    const screenL  = screenCX - L_draw / 2;
    const screenR  = screenCX + L_draw / 2;
    const srcX     = screenCX + srcFrac * L_draw * 0.5;

    /* 轨迹的垂直/水平包围盒都是 4R = 4k·d */
    const dVert = (b.h - 2 * pad - textH) / (4 * k);
    const halfW = Math.max(1, Math.min(srcX - b.x1 - pad, b.x2 - pad - srcX));
    const dHorz = halfW / (2 * k);

    let d = Math.min(dVert, dHorz);
    d = Math.max(4, d);

    const R = k * d;
    /* 上方恰好容纳 (1+2k)d（源点到轨迹最高点），下方留出 (2k-1)d */
    const screenY = b.y1 + pad + (1 + 2 * k) * d;
    const srcY    = screenY - d;

    /* ---- 预计算所有方向的轨迹 ---- */
    const N_theta = 72;
    const omega   = 1.5 * speedMul;
    const tFull   = 2 * Math.PI / omega;

    const omega_emit = omega * 0.7;
    const tSweep     = 2 * Math.PI / omega_emit;

    const traces = [];
    let maxTHit = 0;

    for (let i = 0; i < N_theta; i++) {
      const psi   = 2 * Math.PI * i / N_theta;
      const theta = -psi;
      const sinT = Math.sin(theta), cosT = Math.cos(theta);
      const Cx = srcX - s * R * sinT;
      const Cy = srcY + s * R * cosT;
      const phi0 = theta - s * Math.PI / 2;

      let hit = null;
      const dy = screenY - Cy;
      if (Math.abs(dy) <= R + 1e-6) {
        const dx = Math.sqrt(Math.max(0, R * R - dy * dy));
        const cands = [];
        for (const xk of [Cx - dx, Cx + dx]) {
          if (xk < screenL - 1e-6 || xk > screenR + 1e-6) continue;
          const alpha = Math.atan2(dy, xk - Cx);
          let dphi;
          if (s === 1) {
            dphi = ((alpha - phi0) % (2*Math.PI) + 2*Math.PI) % (2*Math.PI);
          } else {
            dphi = ((phi0 - alpha) % (2*Math.PI) + 2*Math.PI) % (2*Math.PI);
          }
          if (dphi < 1e-6) dphi = 2 * Math.PI;
          cands.push({ x: xk, t: dphi / omega });
        }
        if (cands.length > 0) {
          cands.sort((a, b) => a.t - b.t);
          hit = cands[0];
          const vy = s === 1 ? (hit.x - Cx) : (Cx - hit.x);
          hit.fromAbove = vy > 0;
          if (hit.t > maxTHit) maxTHit = hit.t;
        }
      }

      traces.push({
        theta, Cx, Cy, phi0, hit,
        tEmit: i * tSweep / N_theta,
      });
    }

    /* ---- 特殊轨迹挑选 ---- */
    const aboveHits = traces.filter(tr => tr.hit && tr.hit.fromAbove);
    const belowHits = traces.filter(tr => tr.hit && !tr.hit.fromAbove);
    const allHits   = traces.filter(tr => tr.hit);

    const getExtreme = (arr, cmp) => {
      if (arr.length === 0) return null;
      let best = arr[0];
      for (const tr of arr) if (cmp(tr, best)) best = tr;
      return best;
    };
    const leftAbove  = getExtreme(aboveHits, (a,b) => a.hit.x < b.hit.x);
    const rightAbove = getExtreme(aboveHits, (a,b) => a.hit.x > b.hit.x);
    const leftBelow  = getExtreme(belowHits, (a,b) => a.hit.x < b.hit.x);
    const rightBelow = getExtreme(belowHits, (a,b) => a.hit.x > b.hit.x);
    const fastest    = getExtreme(allHits,   (a,b) => a.hit.t < b.hit.t);
    const slowest    = getExtreme(allHits,   (a,b) => a.hit.t > b.hit.t);

const specials = [];
if (showSpecial) {
  if (leftAbove)  specials.push({ tr: leftAbove,  color: '#2979ff' }); // 亮蓝
  if (rightAbove) specials.push({ tr: rightAbove, color: '#ff9100' }); // 橙
  if (leftBelow)  specials.push({ tr: leftBelow,  color: '#00c853' }); // 绿
  if (rightBelow) specials.push({ tr: rightBelow, color: '#6200ea' }); // 紫
  if (fastest)    specials.push({ tr: fastest,    color: '#00e5ff' }); // 青
  if (slowest)    specials.push({ tr: slowest,    color: '#ffd600' }); // 黄
}

    const specialMap = new Map();
    const uniqueSpecials = [];
    for (const sp of specials) {
      const key = sp.tr.theta.toFixed(4);
      if (specialMap.has(key)) continue;
      specialMap.set(key, sp.color);
      uniqueSpecials.push(sp);
    }

    /* ---- 时间 ---- */
    const tEndAll = tSweep + 0.4 / speedMul;
    const tLoop   = tEndAll + 1.2 / speedMul;
    let t = AN.t % tLoop;
    if (t < 0) t += tLoop;

    /* ---- 裁剪 ---- */
    c.save();
    c.beginPath();
    c.rect(b.x1, b.y1, b.w, b.h);
    c.clip();

    /* 屏幕 */
    c.save();
    c.strokeStyle = '#555';
    c.lineWidth = 3.5;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(screenL, screenY);
    c.lineTo(screenR, screenY);
    c.stroke();
    c.strokeStyle = '#333';
    c.lineWidth = 1.5;
    for (const ex of [screenL, screenR]) {
      c.beginPath();
      c.moveTo(ex, screenY - 7);
      c.lineTo(ex, screenY + 7);
      c.stroke();
    }
    c.restore();

    /* ---- 普通轨迹（一次性完整显示，命中/未命中都加粗） ---- */
    c.save();
    c.lineCap = 'round';
    c.lineJoin = 'round';
    for (const tr of traces) {
      const { Cx, Cy, phi0, hit, tEmit, theta } = tr;
      if (t < tEmit) continue;
      const key = theta.toFixed(4);
      if (specialMap.has(key)) continue;

      const dphiTotal = hit ? hit.t * omega : 2 * Math.PI;
      const phiEnd    = phi0 + s * dphiTotal;

      const alpha = hit ? 0.55 : 0.32;
      const lw    = hit ? 2.6  : 2.4;

      const Nseg = Math.max(16, Math.ceil(Math.abs(phiEnd - phi0) / 0.08));
      c.beginPath();
      for (let j = 0; j <= Nseg; j++) {
        const phi = phi0 + (phiEnd - phi0) * j / Nseg;
        const px = Cx + R * Math.cos(phi);
        const py = Cy + R * Math.sin(phi);
        if (j === 0) c.moveTo(px, py);
        else c.lineTo(px, py);
      }
      c.strokeStyle = 'rgba(229, 57, 53, ' + alpha + ')';
      c.lineWidth = lw;
      c.stroke();
    }
    c.restore();

    /* ---- 特殊轨迹（独占显示 + 光晕） ---- */
    for (const sp of uniqueSpecials) {
      const { Cx, Cy, phi0, hit, tEmit } = sp.tr;
      if (t < tEmit) continue;

      const dphiTotal = hit ? hit.t * omega : 2 * Math.PI;
      const phiEnd    = phi0 + s * dphiTotal;
      const Nseg = Math.max(20, Math.ceil(Math.abs(phiEnd - phi0) / 0.06));

      const path = () => {
        c.beginPath();
        for (let j = 0; j <= Nseg; j++) {
          const phi = phi0 + (phiEnd - phi0) * j / Nseg;
          const px = Cx + R * Math.cos(phi);
          const py = Cy + R * Math.sin(phi);
          if (j === 0) c.moveTo(px, py);
          else c.lineTo(px, py);
        }
      };

      c.save();
      c.lineCap = 'round';
      c.lineJoin = 'round';

      path();
      c.strokeStyle = sp.color;
      c.lineWidth = 8;
      c.globalAlpha = sp.color === '#ffd600' ? 0.45 : 0.25;
      c.stroke();

      path();
      c.strokeStyle = sp.color;
      c.lineWidth = 3.4;
      c.globalAlpha = 1;
      c.stroke();

      if (hit) {
        c.beginPath();
        c.arc(hit.x, screenY, 5.5, 0, Math.PI * 2);
        c.fillStyle = sp.color;
        c.fill();
        c.strokeStyle = '#fff';
        c.lineWidth = 2;
        c.stroke();
      }
      c.restore();
    }

    /* 源点 */
    c.save();
    c.beginPath();
    c.arc(srcX, srcY, 6, 0, Math.PI * 2);
    c.fillStyle = '#1a1a1a';
    c.fill();
    c.strokeStyle = '#fff';
    c.lineWidth = 2;
    c.stroke();
    c.font = 'bold 11px system-ui, "PingFang SC", sans-serif';
    c.fillStyle = '#1a1a1a';
    c.textAlign = 'left';
    c.textBaseline = 'bottom';
    c.fillText('S', srcX + 9, srcY - 3);
    c.restore();

    /* 底部信息 */
    c.save();
    c.font = '11px system-ui, "PingFang SC", sans-serif';
    c.fillStyle = 'rgba(30, 30, 30, 0.65)';
    c.textAlign = 'center';
    c.textBaseline = 'bottom';
    c.fillText(
      'L=' + L_draw + '   R/d=' + k.toFixed(1) +
      '   R=' + R.toFixed(0) + '   ' +
      (s < 0 ? '逆时针' : '顺时针'),
      (b.x1 + b.x2) / 2, b.y2 - 3
    );
    c.restore();

    c.restore();
  }
});



/* ==========================================================================
 * 32. 立体图（斜二测投影 · 遮挡的棱用虚线）
 * ========================================================================== */
(function () {
  var PB3 = window.PhysBoard;
  if (!PB3 || !PB3.shapes) return;

  var shape3 = function (d) {
    if (!d || !d.key) return;
    if (typeof PB3.register === 'function') PB3.register(d);
    else PB3.shapes[d.key] = d;
  };

  /* ---- 分类 ---- */
  PB3.categories = PB3.categories || [];
  var hasSolid = false;
  for (var ci = 0; ci < PB3.categories.length; ci++) {
    if (PB3.categories[ci].id === 'solid') { hasSolid = true; break; }
  }
  if (!hasSolid) {
    if (typeof PB3.category === 'function') PB3.category('solid', '立体图');
    else PB3.categories.push({ id: 'solid', label: '立体图' });
  }

  /* ---- 参数 ---- */
  var pd = PB3.paramDefs = PB3.paramDefs || {};
  if (!pd.sdFlat)  pd.sdFlat  = { label: '椭圆扁平',   min: 0.12, max: 0.50, step: 0.02, def: 0.28 };
  if (!pd.sdDepth) pd.sdDepth = { label: '深度比例',   min: 0.10, max: 0.60, step: 0.02, def: 0.33 };
  if (!pd.sdCube)  pd.sdCube  = { label: '正方体吸附', type: 'toggle', def: true };
  if (!pd.sdTaper) pd.sdTaper = { label: '顶面半径比', min: 0.15, max: 0.90, step: 0.05, def: 0.50 };

  /* ---- 小工具 ---- */
  function clamp(v, lo, hi, dflt) {
    var n = (v == null || isNaN(v)) ? dflt : Number(v);
    return Math.max(lo, Math.min(hi, n));
  }
  function withA(color, a) {
    var h = String(color == null ? '#1a1a1a' : color).replace('#', '');
    if (h.length === 3) h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
    var n = parseInt(h, 16);
    if (isNaN(n)) return 'rgba(0,0,0,' + a + ')';
    return 'rgba(' + ((n>>16)&255) + ',' + ((n>>8)&255) + ',' + (n&255) + ',' + a + ')';
  }
  function lineTo2(c, p, q) {
    c.beginPath();
    c.moveTo(p.x, p.y);
    c.lineTo(q.x, q.y);
    c.stroke();
  }
  function pathPoly(c, pts) {
    c.beginPath();
    for (var i = 0; i < pts.length; i++) {
      if (i === 0) c.moveTo(pts[i].x, pts[i].y);
      else c.lineTo(pts[i].x, pts[i].y);
    }
    c.closePath();
  }
  function fillPoly(c, pts, color, a) {
    pathPoly(c, pts);
    c.fillStyle = withA(color, a);
    c.fill();
  }
  function dashOn(c, lw) {
    c.setLineDash([Math.max(3, lw * 2.1), Math.max(3, lw * 1.7)]);
  }
  function dashOff(c) { c.setLineDash([]); }

  function beginSolid(c, o) {
    var lw = Math.max(1, o.size || 4);
    c.save();
    c.lineWidth = lw;
    c.lineCap = 'round';
    c.lineJoin = 'round';
    c.setLineDash([]);
    c.strokeStyle = (o.hasBorder === false) ? 'rgba(0,0,0,0)' : (o.color || '#1a1a1a');
    return lw;
  }
  function endSolid(c) { c.restore(); }

  /* 立体长方体：8 个顶点 */
  function boxParts(b, ratio) {
    var m = Math.min(b.w, b.h);
    var d = Math.min(m * ratio, b.w * 0.55, b.h * 0.55);
    var bw = Math.max(2, b.w - d), bh = Math.max(2, b.h - d);
    var X = b.x1, Y = b.y2;
    return {
      d: d, bw: bw, bh: bh,
      FL : { x: X,          y: Y          },
      FR : { x: X + bw,     y: Y          },
      BR : { x: X + bw + d, y: Y - d      },
      BL : { x: X + d,      y: Y - d      },
      FTL: { x: X,          y: Y - bh     },
      FTR: { x: X + bw,     y: Y - bh     },
      BTR: { x: X + bw + d, y: Y - bh - d },
      BTL: { x: X + d,      y: Y - bh - d }
    };
  }

  /* ====================== 1. 圆柱体 ====================== */
  shape3({
    key: 'solidCylinder', cat: 'solid', geom: 'box', label: '圆柱体', fill: true,
    icon: '<ellipse cx="12" cy="5.5" rx="7.5" ry="2.6"/>' +
          '<path d="M4.5 5.5v13M19.5 5.5v13"/>' +
          '<path d="M4.5 18.5a7.5 2.6 0 0 0 15 0"/>' +
          '<path d="M4.5 18.5a7.5 2.6 0 0 1 15 0" stroke-dasharray="2 2"/>',
    params: ['sdFlat'],
    draw: function (c, o, U) {
      var b = U.bbox(o);
      var lw = beginSolid(c, o);
      var col = c.strokeStyle;
      var fa = clamp(o.fillAlpha, 0, 1, 0.6);
      var flat = clamp(o.sdFlat, 0.12, 0.50, 0.28);

      var rx = Math.max(3, b.w / 2);
      var ry = Math.max(2, Math.min(rx * flat, b.h * 0.30));
      var cx = b.x1 + b.w / 2;
      var yT = b.y1 + ry;
      var yB = b.y2 - ry;
      if (yB - yT < 2) { endSolid(c); return; }

      if (o.fill && o.fillColor) {
        c.save();
        c.fillStyle = withA(o.fillColor, fa * 0.72);
        c.beginPath();
        c.moveTo(cx - rx, yT);
        c.lineTo(cx - rx, yB);
        c.ellipse(cx, yB, rx, ry, 0, Math.PI, 0, true);
        c.lineTo(cx + rx, yT);
        c.closePath();
        c.fill();
        c.beginPath();
        c.ellipse(cx, yT, rx, ry, 0, 0, Math.PI * 2);
        c.fill();
        c.restore();
      }

      if (col !== 'rgba(0,0,0,0)') {
        dashOn(c, lw);
        c.beginPath();
        c.ellipse(cx, yB, rx, ry, 0, 0, Math.PI, true);
        c.stroke();
        dashOff(c);

        c.beginPath();
        c.ellipse(cx, yB, rx, ry, 0, Math.PI, 0, true);
        c.stroke();

        lineTo2(c, { x: cx - rx, y: yT }, { x: cx - rx, y: yB });
        lineTo2(c, { x: cx + rx, y: yT }, { x: cx + rx, y: yB });

        c.beginPath();
        c.ellipse(cx, yT, rx, ry, 0, 0, Math.PI * 2);
        c.stroke();
      }
      endSolid(c);
    }
  });

  /* ====================== 2. 长方体（正方体自动吸附） ====================== */
  shape3({
    key: 'solidBox', cat: 'solid', geom: 'box', label: '长方体', fill: true,
    icon: '<path d="M3 8h11v11H3z"/>' +
          '<path d="M3 8l5-4h11l-5 4"/>' +
          '<path d="M14 8l5-4v11l-5 4"/>' +
          '<path d="M3 19l5-4" stroke-dasharray="2 2"/>',
    params: ['sdDepth', 'sdCube'],
    draw: function (c, o, U) {
      /* 正方体吸附：包围盒接近正方形时自动修正 */
      if (o.sdCube) {
        var w0 = Math.abs(o.x2 - o.x1);
        var h0 = Math.abs(o.y2 - o.y1);
        var mn = Math.min(w0, h0);
        if (mn > 2 && Math.abs(w0 - h0) < mn * 0.22) {
          var side = (w0 + h0) / 2;
          o.x2 = o.x1 + (o.x2 >= o.x1 ? side : -side);
          o.y2 = o.y1 + (o.y2 >= o.y1 ? side : -side);
        }
      }

      var b = U.bbox(o);
      var lw = beginSolid(c, o);
      var col = c.strokeStyle;
      var fa = clamp(o.fillAlpha, 0, 1, 0.6);
      var ratio = clamp(o.sdDepth, 0.10, 0.60, 0.33);
      var P = boxParts(b, ratio);

      if (o.fill && o.fillColor) {
        fillPoly(c, [P.FL, P.FR, P.FTR, P.FTL], o.fillColor, fa);
        fillPoly(c, [P.FTL, P.FTR, P.BTR, P.BTL], o.fillColor, fa * 0.76);
        fillPoly(c, [P.FR, P.BR, P.BTR, P.FTR], o.fillColor, fa * 0.52);
      }

      if (col !== 'rgba(0,0,0,0)') {
        dashOn(c, lw);
        lineTo2(c, P.BL, P.BR);
        lineTo2(c, P.BL, P.BTL);
        lineTo2(c, P.BL, P.FL);
        dashOff(c);

        pathPoly(c, [P.FL, P.FR, P.FTR, P.FTL]); c.stroke();
        pathPoly(c, [P.FTL, P.FTR, P.BTR, P.BTL]); c.stroke();
        lineTo2(c, P.FR, P.BR);
        lineTo2(c, P.BR, P.BTR);
        lineTo2(c, P.FTR, P.BTR);
      }
      endSolid(c);
    }
  });

  /* ====================== 3. 球体 ====================== */
  shape3({
    key: 'solidSphere', cat: 'solid', geom: 'box', label: '球体', fill: true,
    icon: '<circle cx="12" cy="12" r="8.5"/>' +
          '<ellipse cx="12" cy="12" rx="8.5" ry="3.2"/>' +
          '<path d="M3.5 12a8.5 3.2 0 0 0 17 0" stroke-dasharray="2 2"/>',
    params: ['sdFlat'],
    draw: function (c, o, U) {
      var b = U.bbox(o);
      var lw = beginSolid(c, o);
      var col = c.strokeStyle;
      var fa = clamp(o.fillAlpha, 0, 1, 0.6);
      var flat = clamp(o.sdFlat, 0.12, 0.50, 0.28);

      var R = Math.max(4, Math.min(b.w, b.h) / 2);
      var cx = (b.x1 + b.x2) / 2;
      var cy = (b.y1 + b.y2) / 2;
      var ry = Math.max(2, R * flat);

      if (o.fill && o.fillColor) {
        c.beginPath();
        c.arc(cx, cy, R, 0, Math.PI * 2);
        c.fillStyle = withA(o.fillColor, fa * 0.72);
        c.fill();
      }

      if (col !== 'rgba(0,0,0,0)') {
        dashOn(c, lw);
        c.beginPath();
        c.ellipse(cx, cy, R, ry, 0, 0, Math.PI, true);
        c.stroke();
        dashOff(c);

        c.beginPath();
        c.ellipse(cx, cy, R, ry, 0, Math.PI, 0, true);
        c.stroke();

        c.beginPath();
        c.arc(cx, cy, R, 0, Math.PI * 2);
        c.stroke();
      }
      endSolid(c);
    }
  });

  /* ====================== 4. 圆锥 ====================== */
  shape3({
    key: 'solidCone', cat: 'solid', geom: 'box', label: '圆锥', fill: true,
    icon: '<path d="M12 3.5L4 18.5h16z"/>' +
          '<path d="M4 18.5a8 2.6 0 0 0 16 0"/>' +
          '<path d="M4 18.5a8 2.6 0 0 1 16 0" stroke-dasharray="2 2"/>',
    params: ['sdFlat'],
    draw: function (c, o, U) {
      var b = U.bbox(o);
      var lw = beginSolid(c, o);
      var col = c.strokeStyle;
      var fa = clamp(o.fillAlpha, 0, 1, 0.6);
      var flat = clamp(o.sdFlat, 0.12, 0.50, 0.28);

      var rx = Math.max(3, b.w / 2);
      var ry = Math.max(2, Math.min(rx * flat, b.h * 0.32));
      var cx = b.x1 + b.w / 2;
      var yB = b.y2 - ry;
      var ay = b.y1;
      if (yB - ay < 3) { endSolid(c); return; }

      if (o.fill && o.fillColor) {
        c.beginPath();
        c.moveTo(cx, ay);
        c.lineTo(cx - rx, yB);
        c.ellipse(cx, yB, rx, ry, 0, Math.PI, 0, true);
        c.closePath();
        c.fillStyle = withA(o.fillColor, fa * 0.70);
        c.fill();
      }

      if (col !== 'rgba(0,0,0,0)') {
        dashOn(c, lw);
        c.beginPath();
        c.ellipse(cx, yB, rx, ry, 0, 0, Math.PI, true);
        c.stroke();
        dashOff(c);

        c.beginPath();
        c.ellipse(cx, yB, rx, ry, 0, Math.PI, 0, true);
        c.stroke();

        lineTo2(c, { x: cx, y: ay }, { x: cx - rx, y: yB });
        lineTo2(c, { x: cx, y: ay }, { x: cx + rx, y: yB });
      }
      endSolid(c);
    }
  });

  /* ====================== 5. 三棱柱 ====================== */
  shape3({
    key: 'solidPrism3', cat: 'solid', geom: 'box', label: '三棱柱', fill: true,
    icon: '<path d="M12 3L3 8l9 5 9-5z"/>' +
          '<path d="M3 8v9l9 5 9-5V8"/>' +
          '<path d="M12 13v9"/>',
    draw: function (c, o, U) {
      var b = U.bbox(o);
      var lw = beginSolid(c, o);
      var col = c.strokeStyle;
      var fa = clamp(o.fillAlpha, 0, 1, 0.6);

      var cx = b.x1 + b.w / 2;
      var a = Math.max(5, b.w / 2);
      var th = a * 0.52;
      var H = b.h - th;
      if (H < 5) { endSolid(c); return; }
      var yB = b.y2;

      var A1 = { x: cx,     y: yB      };
      var A2 = { x: cx - a, y: yB - th };
      var A3 = { x: cx + a, y: yB - th };
      var B1 = { x: A1.x, y: A1.y - H };
      var B2 = { x: A2.x, y: A2.y - H };
      var B3 = { x: A3.x, y: A3.y - H };

      if (o.fill && o.fillColor) {
        fillPoly(c, [A1, A2, B2, B1], o.fillColor, fa * 0.85);
        fillPoly(c, [A1, A3, B3, B1], o.fillColor, fa * 0.58);
        fillPoly(c, [B1, B2, B3],      o.fillColor, fa);
      }

      if (col !== 'rgba(0,0,0,0)') {
        dashOn(c, lw);
        lineTo2(c, A2, A3);
        dashOff(c);

        pathPoly(c, [B1, B2, B3]); c.stroke();
        lineTo2(c, A1, A2);
        lineTo2(c, A1, A3);
        lineTo2(c, A1, B1);
        lineTo2(c, A2, B2);
        lineTo2(c, A3, B3);
      }
      endSolid(c);
    }
  });

    /* ====================== 6. 半圆柱 ====================== */
  shape3({
    key: 'solidHalfCyl', cat: 'solid', geom: 'box', label: '半圆柱', fill: true,
    icon: '<path d="M3 17a9 9 0 0 1 18 0z"/>' +
          '<path d="M7 13a9 9 0 0 1 10 0"/>' +
          '<path d="M3 17l4-4M21 17l-4-4"/>',
    params: ['sdDepth'],
    draw: function (c, o, U) {
      var b = U.bbox(o);
      var lw = beginSolid(c, o);
      var col = c.strokeStyle;
      var fa = clamp(o.fillAlpha, 0, 1, 0.6);
      var ratio = clamp(o.sdDepth, 0.10, 0.60, 0.30);

      var m = Math.min(b.w, b.h);
      var d = m * ratio;
      var r = Math.min((b.w - d) / 2, b.h - d);
      if (r < 4) { endSolid(c); return; }

      var cx = b.x1 + r;
      var yB = b.y2;

      var A1 = { x: cx - r,      y: yB     };  // 前面半圆 · 左端
      var A2 = { x: cx + r,      y: yB     };  // 前面半圆 · 右端
      var B1 = { x: A1.x + d,    y: yB - d };  // 后面半圆 · 左端
      var B2 = { x: A2.x + d,    y: yB - d };  // 后面半圆 · 右端
      var cF = { x: cx,          y: yB     };  // 前面半圆 · 圆心
      var cB = { x: cx + d,      y: yB - d };  // 后面半圆 · 圆心

      /* 两条半圆弧的公切线切点：
       *   平移方向 (d, -d) 与半径方向垂直 → 切点角度 = 5π/4（左上方）
       *   这是半圆弧上唯一的公切点（45° 那个切点在半圆之外） */
      var TS = Math.PI * 1.25;
      var cts = Math.cos(TS), sts = Math.sin(TS);
      var P1 = { x: cF.x + r * cts, y: cF.y + r * sts };
      var P2 = { x: cB.x + r * cts, y: cB.y + r * sts };

      if (o.fill && o.fillColor) {
        c.save();
        c.fillStyle = withA(o.fillColor, fa * 0.72);
        c.beginPath();
        c.moveTo(A1.x, A1.y);
        c.ellipse(cF.x, cF.y, r, r, 0, Math.PI, Math.PI * 2, false);
        c.lineTo(B2.x, B2.y);
        c.ellipse(cB.x, cB.y, r, r, 0, 0, Math.PI, true);
        c.closePath();
        c.fill();
        c.restore();
      }

      if (col !== 'rgba(0,0,0,0)') {
        /* ---- 被遮挡部分：虚线 ---- */
        dashOn(c, lw);
        /* 后面底边 */
        lineTo2(c, B1, B2);
        /* 后面半圆弧 · 左半段（B1 → P2，被前面实体挡住） */
        c.beginPath();
        c.ellipse(cB.x, cB.y, r, r, 0, Math.PI, TS, false);
        c.stroke();
        dashOff(c);

        /* ---- 可见部分：实线 ---- */
        /* 后面半圆弧 · 右半段（P2 → B2，露在外面） */
        c.beginPath();
        c.ellipse(cB.x, cB.y, r, r, 0, TS, Math.PI * 2, false);
        c.stroke();

        /* 前面半圆弧（完整可见） */
        c.beginPath();
        c.ellipse(cF.x, cF.y, r, r, 0, Math.PI, Math.PI * 2, false);
        c.stroke();

        /* 前面底边 */
        lineTo2(c, A1, A2);

        /* 左右两条棱 */
        /* 左棱 A1-B1：与后弧一起被遮挡 → 虚线 */
        dashOn(c, lw);
        lineTo2(c, A1, B1);
        dashOff(c);

        /* 右棱 A2-B2：可见 → 实线 */
        lineTo2(c, A2, B2);

        /* 前后半圆弧的公切线 */
        lineTo2(c, P1, P2);
      }
      endSolid(c);
    }
  });


  /* ====================== 7. 斜面体（直角三棱柱） ====================== */
  shape3({
    key: 'solidWedge', cat: 'solid', geom: 'box', label: '斜面体', fill: true,
    icon: '<path d="M3 20V8l16 12z"/>' +
          '<path d="M7 16V4l16 12"/>' +
          '<path d="M3 8l4-4M19 20l4-4"/>',
    params: ['sdDepth'],
    draw: function (c, o, U) {
      var b = U.bbox(o);
      var lw = beginSolid(c, o);
      var col = c.strokeStyle;
      var fa = clamp(o.fillAlpha, 0, 1, 0.6);
      var ratio = clamp(o.sdDepth, 0.10, 0.60, 0.33);

      var m = Math.min(b.w, b.h);
      var d = Math.min(m * ratio, b.w * 0.45, b.h * 0.45);
      var bw = b.w - d, bh = b.h - d;
      var X = b.x1, Y = b.y2;

      var A  = { x: X,         y: Y        };
      var B  = { x: X + bw,    y: Y        };
      var C  = { x: X,         y: Y - bh   };
      var A2 = { x: A.x + d,   y: A.y - d  };
      var B2 = { x: B.x + d,   y: B.y - d  };
      var C2 = { x: C.x + d,   y: C.y - d  };

      if (o.fill && o.fillColor) {
        fillPoly(c, [A, C, C2, A2], o.fillColor, fa * 0.85);
        fillPoly(c, [B, C, C2, B2], o.fillColor, fa * 0.62);
        fillPoly(c, [A, B, C],      o.fillColor, fa);
      }

      if (col !== 'rgba(0,0,0,0)') {
        dashOn(c, lw);
        lineTo2(c, A2, B2);
        dashOff(c);

        pathPoly(c, [A, B, C]); c.stroke();
        lineTo2(c, A, A2);
        lineTo2(c, C, C2);
        lineTo2(c, A2, C2);
        lineTo2(c, B, B2);
        lineTo2(c, B2, C2);
      }
      endSolid(c);
    }
  });

  /* ====================== 8. 平行板电容器 ====================== */
  shape3({
    key: 'solidCapacitor', cat: 'solid', geom: 'box', label: '平行板电容器', fill: true,
    icon: '<path d="M3 8h13l5-4H8z"/>' +
          '<path d="M3 17h13l5-4H8z"/>' +
          '<path d="M3 8v9M16 8v9M21 4v9"/>',
    params: ['sdDepth'],
    draw: function (c, o, U) {
      var b = U.bbox(o);
      var lw = beginSolid(c, o);
      var col = c.strokeStyle;
      var fa = clamp(o.fillAlpha, 0, 1, 0.6);
      var ratio = clamp(o.sdDepth, 0.10, 0.60, 0.30);

      var m = Math.min(b.w, b.h);
      var d = Math.min(m * ratio, b.h * 0.70, b.w * 0.50);
      var L = b.w - d;
      var gap = b.h - d;
      if (L < 6 || gap < 2) { endSolid(c); return; }

      var X = b.x1;
      var Yt = b.y1 + d;
      var Yb = Yt + gap;

      var U1 = { x: X,           y: Yt     };
      var U2 = { x: X + L,       y: Yt     };
      var U3 = { x: X + L + d,   y: Yt - d };
      var U4 = { x: X + d,       y: Yt - d };
      var D1 = { x: X,           y: Yb     };
      var D2 = { x: X + L,       y: Yb     };
      var D3 = { x: X + L + d,   y: Yb - d };
      var D4 = { x: X + d,       y: Yb - d };

      if (o.fill && o.fillColor) {
        fillPoly(c, [D1, D2, D3, D4], o.fillColor, fa * 0.45);
        fillPoly(c, [U1, U2, U3, U4], o.fillColor, fa);
      }

      if (col !== 'rgba(0,0,0,0)') {
        var partial = gap < d;
        dashOn(c, lw);
        lineTo2(c, D4, D3);
        if (partial) {
          lineTo2(c, D4, { x: D1.x + gap, y: Yt });
          lineTo2(c, D3, { x: D2.x + gap, y: Yt });
        }
        dashOff(c);

        lineTo2(c, D1, D2);
        lineTo2(c, D1, partial ? { x: D1.x + gap, y: Yt } : D4);
        lineTo2(c, D2, partial ? { x: D2.x + gap, y: Yt } : D3);

        pathPoly(c, [U1, U2, U3, U4]); c.stroke();
      }
      endSolid(c);
    }
  });

  /* ====================== 9. 圆台 ====================== */
  shape3({
    key: 'solidFrustum', cat: 'solid', geom: 'box', label: '圆台', fill: true,
    icon: '<ellipse cx="12" cy="5" rx="5" ry="2"/>' +
          '<ellipse cx="12" cy="19" rx="9" ry="3"/>' +
          '<path d="M7 5l-4 14M17 5l4 14"/>',
    params: ['sdFlat', 'sdTaper'],
    draw: function (c, o, U) {
      var b = U.bbox(o);
      var lw = beginSolid(c, o);
      var col = c.strokeStyle;
      var fa = clamp(o.fillAlpha, 0, 1, 0.6);
      var flat  = clamp(o.sdFlat,  0.12, 0.50, 0.28);
      var taper = clamp(o.sdTaper, 0.15, 0.90, 0.50);

      var rx1 = Math.max(3, b.w / 2);
      var ry1 = Math.max(2, Math.min(rx1 * flat, b.h * 0.26));
      var cx  = b.x1 + b.w / 2;
      var yB  = b.y2 - ry1;
      var rx2 = rx1 * taper;
      var ry2 = Math.max(1.5, ry1 * taper);
      var yT  = b.y1 + ry2;
      if (yB - yT < 3) { endSolid(c); return; }

      if (o.fill && o.fillColor) {
        c.save();
        c.fillStyle = withA(o.fillColor, fa * 0.72);
        c.beginPath();
        c.moveTo(cx - rx1, yB);
        c.lineTo(cx - rx2, yT);
        c.ellipse(cx, yT, rx2, ry2, 0, Math.PI, 0, true);
        c.lineTo(cx + rx1, yB);
        c.ellipse(cx, yB, rx1, ry1, 0, 0, Math.PI, true);
        c.closePath();
        c.fill();
        c.beginPath();
        c.ellipse(cx, yT, rx2, ry2, 0, 0, Math.PI * 2);
        c.fill();
        c.restore();
      }

      if (col !== 'rgba(0,0,0,0)') {
        dashOn(c, lw);
        c.beginPath();
        c.ellipse(cx, yB, rx1, ry1, 0, 0, Math.PI, true);
        c.stroke();
        dashOff(c);

        c.beginPath();
        c.ellipse(cx, yB, rx1, ry1, 0, Math.PI, 0, true);
        c.stroke();

        lineTo2(c, { x: cx - rx1, y: yB }, { x: cx - rx2, y: yT });
        lineTo2(c, { x: cx + rx1, y: yB }, { x: cx + rx2, y: yT });

        c.beginPath();
        c.ellipse(cx, yT, rx2, ry2, 0, 0, Math.PI * 2);
        c.stroke();
      }
      endSolid(c);
    }
  });

})();





/* ============================================================================
 * shapes-self.js · 函数绘图器 funcPlotter  (v5)
 * 支持：显式函数 / 隐式方程 / 参数方程 / 分段 / 微积分 / ODE 系统
 *      + 点 / 向量（GeoGebra 风格）+ 变量赋值 a = 1
 * 交互：滑杆拖动 / 滚轮缩放 / 空白拖动平移 / 右键编辑 / 自动播放
 * v5 变更：
 *   - a = 1 形式的变量赋值作为滑杆初值
 *   - A = (a, b) 识别为点，u = (A, B) 识别为向量（自动区分）
 *   - 按空行分块编译，多个 ODE 系统互不干扰
 *   - 滑杆播放模式：振荡 / 循环增加 / 循环减小 / 单次增加 / 单次减小
 *   - 坐标轴 / 网格 / 极坐标网格显示开关
 *   - 等比例坐标、X/Y 轴刻度固定间隔（1、π/4、π/2、π 等）
 *   - 坐标轴标题 X/Y
 *   - 网格与坐标轴颜色随背景明暗自动适配
 * ============================================================================ */
(function () {
'use strict';



/* ============================================================
 * 一、数学表达式解析器
 * ============================================================ */
const MATH_FUNCS = {
  sin: Math.sin, cos: Math.cos, tan: Math.tan,
  asin: Math.asin, acos: Math.acos, atan: Math.atan,
  atan2: Math.atan2, sinh: Math.sinh, cosh: Math.cosh, tanh: Math.tanh,
  exp: Math.exp, ln: Math.log, log: Math.log10, log10: Math.log10,
  log2: Math.log2, lg: Math.log10,
  sqrt: Math.sqrt, abs: Math.abs, sign: Math.sign,
  floor: Math.floor, ceil: Math.ceil, round: Math.round,
  min: Math.min, max: Math.max, pow: Math.pow,
  sec: x => 1/Math.cos(x), csc: x => 1/Math.sin(x), cot: x => Math.cos(x)/Math.sin(x),
};
const CONSTS = { pi: Math.PI, 'π': Math.PI, e: Math.E, tau: Math.PI*2 };
const TOK_CMP = ['<', '>', '<=', '>=', '==', '!='];
/* ---- 支持希腊字母的标识符（用于所有名字匹配）----
 * 字母：ASCII + 希腊小写 α-ω (U+03B1–U+03C9) + 大写 Α-Ω (U+0391–U+03A9)
 * 后续字符：以上字母 + 数字 + 下划线
 * 大写 Ω、Φ、Θ 和小写 ω、φ、θ 都在范围内。 */
const ID_LETTER = 'a-zA-Z_\\u03b1-\\u03c9\\u0391-\\u03a9';
const IDN = '[' + ID_LETTER + '][a-zA-Z_0-9\\u03b1-\\u03c9\\u0391-\\u03a9]*';
const PRIME_CHARS = "['\\u2019\\u2032]";   // ' ’ ′ 三种 prime 都支持
const RE_ID_NAME  = new RegExp('^' + IDN + '$');
const RE_ODE_DEF  = new RegExp('^(' + IDN + ')' + PRIME_CHARS + '\\s*=\\s*(.+)$');
const RE_NSOLVE   = new RegExp('^(' + IDN + ')\\s*=\\s*NSolveODE\\s*\\((.+)\\)$');
const RE_FUNC_EQ  = new RegExp('^(' + IDN + ')\\s*\\(\\s*(' + IDN + ')\\s*\\)$');


function tokenize(src) {
  const tokens = [];
  let i = 0;
  const s = String(src || '');
  while (i < s.length) {
    const c = s[i];
    if (/\s/.test(c)) { i++; continue; }
    if (/[0-9]/.test(c) || (c === '.' && /[0-9]/.test(s[i+1] || ''))) {
      let j = i, hasDot = false;
      while (j < s.length) {
        if (/[0-9]/.test(s[j])) { j++; continue; }
        if (s[j] === '.' && !hasDot) { hasDot = true; j++; continue; }
        break;
      }
      tokens.push({ type: 'num', value: parseFloat(s.slice(i, j)) });
      i = j; continue;
    }
    if (/[a-zA-Z_\u03b1-\u03c9\u0391-\u03a9]/.test(c)) {
      let j = i;
      while (j < s.length && /[a-zA-Z_0-9\u03b1-\u03c9\u0391-\u03a9]/.test(s[j])) j++;
      tokens.push({ type: 'id', value: s.slice(i, j) });
      i = j; continue;
    }
    if (c === '<' || c === '>' || c === '=' || c === '!') {
      let j = i + 1;
      if (s[j] === '=') j++;
      const op = s.slice(i, j);
      if (TOK_CMP.includes(op)) { tokens.push({ type: 'op', value: op }); i = j; continue; }
    }
    if (c === 'π') { tokens.push({ type: 'id', value: 'π' }); i++; continue; }
    if (c === '×') { tokens.push({ type: 'op', value: '*' }); i++; continue; }
    if (c === '÷') { tokens.push({ type: 'op', value: '/' }); i++; continue; }
    if (c === '−') { tokens.push({ type: 'op', value: '-' }); i++; continue; }
    if ('+-*/^(),{}[]'.includes(c)) { tokens.push({ type: 'op', value: c }); i++; continue; }
    i++;
  }
  return tokens;
}

function parseExpr(tokens) {
  let pos = 0;
  const peek = () => tokens[pos];
  const next = () => tokens[pos++];
  const accept = v => {
    const t = peek();
    if (t && t.type === 'op' && t.value === v) { pos++; return true; }
    return false;
  };

  function parseCmp() {
    const first = parseAdd();
    const ops = [];
    while (peek() && peek().type === 'op' && TOK_CMP.includes(peek().value)) {
      const op = next().value;
      ops.push({ op, operand: parseAdd() });
    }
    if (ops.length === 0) return first;
    if (ops.length === 1) return { type: 'binop', op: ops[0].op, left: first, right: ops[0].operand };
    const conds = [];
    let prev = first;
    for (const { op, operand } of ops) {
      conds.push({ type: 'binop', op, left: prev, right: operand });
      prev = operand;
    }
    return { type: 'and', args: conds };
  }
  function parseAdd() {
    let left = parseMul();
    while (peek() && peek().type === 'op' && (peek().value === '+' || peek().value === '-')) {
      const op = next().value;
      left = { type: 'binop', op, left, right: parseMul() };
    }
    return left;
  }
  function startsPrimary(t) {
    if (!t) return false;
    if (t.type === 'num' || t.type === 'id') return true;
    if (t.type === 'op' && t.value === '(') return true;
    return false;
  }
  function parseMul() {
    let left = parseUnary();
    while (peek()) {
      const t = peek();
      if (t.type === 'op' && (t.value === '*' || t.value === '/')) {
        next();
        left = { type: 'binop', op: t.value, left, right: parseUnary() };
      } else if (startsPrimary(t)) {
        left = { type: 'binop', op: '*', left, right: parseUnary() };
      } else break;
    }
    return left;
  }
  function parsePow() {
    const left = parseAtom();
    if (peek() && peek().type === 'op' && peek().value === '^') {
      next();
      return { type: 'binop', op: '^', left, right: parseUnary() };
    }
    return left;
  }
  function parseUnary() {
    const t = peek();
    if (t && t.type === 'op' && (t.value === '-' || t.value === '+')) {
      next();
      return { type: 'unary', op: t.value, operand: parseUnary() };
    }
    return parsePow();
  }
  function parseAtom() {
    const t = peek();
    if (!t) throw new Error('表达式不完整');
    if (t.type === 'num') { next(); return { type: 'num', value: t.value }; }
    if (t.type === 'id') {
      next();
      if (peek() && peek().type === 'op' && peek().value === '(') {
        next();
        const args = [];
        if (!(peek() && peek().type === 'op' && peek().value === ')')) {
          args.push(parseCmp());
          while (peek() && peek().type === 'op' && peek().value === ',') {
            next();
            args.push(parseCmp());
          }
        }
        if (!accept(')')) throw new Error('缺少 )');
        return { type: 'call', name: t.value, args };
      }
      return { type: 'var', name: t.value };
    }
    if (t.type === 'op' && t.value === '(') {
      next();
      const e = parseCmp();
      if (!accept(')')) throw new Error('缺少 )');
      return e;
    }
    throw new Error('意外的符号: ' + t.value);
  }
  return parseCmp();
}

function evalAst(ast, env) {
  if (!ast) return 0;
  switch (ast.type) {
    case 'num': return ast.value;
    case 'var': {
      const name = ast.name;
      if (env && Object.prototype.hasOwnProperty.call(env, name)) return env[name];
      if (name in CONSTS) return CONSTS[name];
      return 0;
    }
    case 'unary': {
      const v = evalAst(ast.operand, env);
      return ast.op === '-' ? -v : v;
    }
    case 'binop': {
      const l = evalAst(ast.left, env);
      const r = evalAst(ast.right, env);
      switch (ast.op) {
        case '+': return l + r;
        case '-': return l - r;
        case '*': return l * r;
        case '/': return l / r;
        case '^': return Math.pow(l, r);
        case '<': return l < r ? 1 : 0;
        case '>': return l > r ? 1 : 0;
        case '<=': return l <= r ? 1 : 0;
        case '>=': return l >= r ? 1 : 0;
        case '==': return Math.abs(l - r) < 1e-9 ? 1 : 0;
        case '!=': return Math.abs(l - r) >= 1e-9 ? 1 : 0;
      }
      return 0;
    }
    case 'and': {
      for (const a of ast.args) if (!evalAst(a, env)) return 0;
      return 1;
    }
    case 'call': {
      const name = ast.name;
      if (name === 'If') {
        const n = ast.args.length;
        for (let i = 0; i + 1 < n; i += 2) {
          if (evalAst(ast.args[i], env)) return evalAst(ast.args[i+1], env);
        }
        if (n % 2 === 1) return evalAst(ast.args[n-1], env);
        return 0;
      }
      if (name === 'Integral' && ast.args.length >= 2 && ast.args[1].type === 'var') {
        const varName = ast.args[1].name;
        const upper = (env && typeof env.__arg__ === 'number')
          ? env.__arg__
          : (env && typeof env[varName] === 'number' ? env[varName] : 0);
        const n = 100, h = upper / n;
        let sum = 0;
        for (let k = 0; k < n; k++) {
          const xa = k * h, xb = (k+1) * h, xm = (xa + xb) / 2;
          const e1 = Object.assign({}, env); e1[varName] = xa;
          const e2 = Object.assign({}, env); e2[varName] = xm;
          const e3 = Object.assign({}, env); e3[varName] = xb;
          sum += (evalAst(ast.args[0], e1) + 4*evalAst(ast.args[0], e2) + evalAst(ast.args[0], e3)) * h / 6;
        }
        return sum;
      }
      if (name === 'Derivative' && ast.args.length >= 2 && ast.args[1].type === 'var') {
        const varName = ast.args[1].name;
        const at = (env && typeof env.__arg__ === 'number')
          ? env.__arg__
          : (env && typeof env[varName] === 'number' ? env[varName] : 0);
        const h = 1e-5;
        const e1 = Object.assign({}, env); e1[varName] = at + h;
        const e2 = Object.assign({}, env); e2[varName] = at - h;
        return (evalAst(ast.args[0], e1) - evalAst(ast.args[0], e2)) / (2*h);
      }
      if (env && env._ode && env._ode[name]) {
        const tArg = ast.args[0] ? evalAst(ast.args[0], env) : 0;
        return env._ode[name](tArg);
      }
      const fn = MATH_FUNCS[name];
      if (fn) {
        const args = ast.args.map(a => evalAst(a, env));
        try { return fn.apply(null, args); } catch (e) { return 0; }
      }
      return 0;
    }
  }
  return 0;
}

function collectVars(ast, out) {
  if (!ast) return;
  switch (ast.type) {
    case 'var': if (!(ast.name in CONSTS)) out.add(ast.name); break;
    case 'unary': collectVars(ast.operand, out); break;
    case 'binop': collectVars(ast.left, out); collectVars(ast.right, out); break;
    case 'and': ast.args.forEach(a => collectVars(a, out)); break;
    case 'call':
      if (!['If','Integral','Derivative'].includes(ast.name)) {
        ast.args.forEach(a => collectVars(a, out));
      } else {
        ast.args.forEach((a, i) => {
          if (i === 1 && a.type === 'var') return;
          collectVars(a, out);
        });
      }
      break;
  }
}

/* ============================================================
 * 二、语句编译
 * ============================================================ */
function splitTopLevel(s, sep) {
  const parts = [];
  let depth = 0, start = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if ('([{'.includes(c)) depth++;
    else if (')]}'.includes(c)) depth--;
    else if (c === sep && depth === 0) { parts.push(s.slice(start, i)); start = i + 1; }
  }
  parts.push(s.slice(start));
  return parts;
}
function findTopLevelEq(line) {
  let depth = 0;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if ('([{'.includes(c)) depth++;
    else if (')]}'.includes(c)) depth--;
    else if (c === '=' && depth === 0) {
      const prev = line[i-1] || '', next = line[i+1] || '';
      if ('<>!'.includes(prev)) continue;
      if (next === '=') continue;
      return i;
    }
  }
  return -1;
}
function stripPrime(name) {
  return String(name || '').trim().replace(/['\u2019\u2032\s]+$/g, '');
}


/* 用给定常量环境对 ODE 做 RK4 求解 */
function solveODEFromDef(def, constEnv) {
  const { varList, t0, initVals, tEnd, steps, rhsAsts } = def;
  const dt = (tEnd - t0) / Math.max(1, steps);
  const points = [{ t: t0, y: initVals.slice() }];
  let y = initVals.slice(), t = t0;

  const evalDeriv = (tt, yy) => {
    const env = Object.assign({}, constEnv);
    for (let j = 0; j < varList.length; j++) env[varList[j]] = yy[j];
    env.t = tt;
    return rhsAsts.map(ast => evalAst(ast, env));
  };

  for (let i = 0; i < steps; i++) {
    const k1 = evalDeriv(t, y);
    const k2 = evalDeriv(t + dt/2, y.map((v, j) => v + k1[j]*dt/2));
    const k3 = evalDeriv(t + dt/2, y.map((v, j) => v + k2[j]*dt/2));
    const k4 = evalDeriv(t + dt, y.map((v, j) => v + k3[j]*dt));
    y = y.map((v, j) => v + (k1[j] + 2*k2[j] + 2*k3[j] + k4[j]) * dt / 6);
    t += dt;
    points.push({ t, y: y.slice() });
  }

  const interp = {};
  varList.forEach((v, idx) => {
    interp[v] = (time) => {
      const pts = points;
      if (time <= pts[0].t) return pts[0].y[idx];
      if (time >= pts[pts.length-1].t) return pts[pts.length-1].y[idx];
      let lo = 0, hi = pts.length - 1;
      while (hi - lo > 1) {
        const mid = (lo + hi) >> 1;
        if (pts[mid].t < time) lo = mid; else hi = mid;
      }
      const t1 = pts[lo].t, t2 = pts[hi].t;
      const v1 = pts[lo].y[idx], v2 = pts[hi].y[idx];
      return v1 + (v2 - v1) * (time - t1) / (t2 - t1);
    };
  });
  return { varNames: varList, interp };
}

/* ---- 尝试解析 点 / 向量 ----
 * 传入 definedNames：本文件中所有 `名字 = (...)` 形式的标识符名
 * 用于区分 (a, b) 中的 a 是标量还是点引用
 *   A = (0, 3)                → point（两侧 scalar）
 *   A = (a, 3)                → point（带滑杆）
 *   u = (A, B)                → vector（两侧都是点引用，A/B 在 definedNames 里）
 *   w = ((0,2), (2,8))        → vector（两侧 pointLiteral）
 */
function tryParsePointOrVector(lhs, rhs, definedNames) {
if (!RE_ID_NAME.test(lhs)) return null;
  if (!rhs || rhs[0] !== '(') return null;

  let depth = 0;
  for (let i = 0; i < rhs.length; i++) {
    if (rhs[i] === '(') depth++;
    else if (rhs[i] === ')') {
      depth--;
      if (depth === 0) {
        if (i !== rhs.length - 1) return null;
        break;
      }
    }
  }
  if (depth !== 0) return null;

  const inner = rhs.slice(1, -1).trim();
  const parts = splitTopLevel(inner, ',');
  if (parts.length !== 2) return null;

  const parseSide = (s) => {
    s = s.trim();
    if (s.startsWith('(') && s.endsWith(')')) {
      let d = 0, ok = true;
      for (let i = 0; i < s.length; i++) {
        if (s[i] === '(') d++;
        else if (s[i] === ')') {
          d--;
          if (d === 0 && i !== s.length - 1) { ok = false; break; }
        }
      }
      if (ok && d === 0) {
        const innerS = s.slice(1, -1);
        const partsS = splitTopLevel(innerS, ',');
        if (partsS.length === 2) {
          try {
            return {
              kind: 'pointLiteral',
              ax: parseExpr(tokenize(partsS[0].trim())),
              ay: parseExpr(tokenize(partsS[1].trim()))
            };
          } catch (e) { return null; }
        }
      }
      return null;
    }
  if (RE_ID_NAME.test(s)) {
      /* 若这个名字在 definedNames 里（该文件里被 `xxx = (...)` 定义过），
         视为点引用；否则视为标量变量 */
      if (definedNames && definedNames.has(s)) {
        return { kind: 'ref', name: s };
      }
      try {
        return { kind: 'scalar', ast: parseExpr(tokenize(s)) };
      } catch (e) { return { kind: 'ref', name: s }; }
    }
    try {
      return { kind: 'scalar', ast: parseExpr(tokenize(s)) };
    } catch (e) { return null; }
  };

  const left = parseSide(parts[0]);
  const right = parseSide(parts[1]);
  if (!left || !right) {
    return { type: 'error',
      message: '点/向量坐标格式不正确：' + rhs +
               '（点应为 (x, y)，向量应为 (A, B) 或 ((x1,y1),(x2,y2))）' };
  }

  if (left.kind === 'scalar' && right.kind === 'scalar') {
    return { type: 'point', name: lhs, xAst: left.ast, yAst: right.ast };
  }
  return { type: 'vector', name: lhs, left, right };
}

/* ---- 预扫描：找出所有 `标识符 = (` 形式的定义名（用于区分点引用和标量） ---- */
function collectPointLikeNames(lines) {
  const names = new Set();
  for (const line of lines) {
    const eqIdx = findTopLevelEq(line);
    if (eqIdx < 0) continue;
    const lhs = line.slice(0, eqIdx).trim();
    const rhs = line.slice(eqIdx + 1).trim();
    if (RE_ID_NAME.test(lhs) && rhs[0] === '(') {   /* ★ 换正则 */
      names.add(lhs);
    }
  }
  return names;
}

function compileCode(code) {
  const out = { funcs: [], vars: new Set(), errors: [], odeDefs: {}, varInit: {} };
  const rawLines = String(code || '').split('\n');

  /* 1) 预处理：去注释、按空行分块 */
  const blocks = [];
  let curBlock = [];
  for (const raw of rawLines) {
    let line = raw;
    const hIdx = line.indexOf('#');
    if (hIdx >= 0) line = line.slice(0, hIdx);
    line = line.trim();
    if (!line) {
      if (curBlock.length) { blocks.push(curBlock); curBlock = []; }
      continue;
    }
    curBlock.push(line);
  }
  if (curBlock.length) blocks.push(curBlock);
  if (!blocks.length) blocks.push([]);

  /* 2) 预扫描整个文件的点名字（跨块共享） */
  const allLines = blocks.reduce((a, b) => a.concat(b), []);
  const definedNames = collectPointLikeNames(allLines);

  /* 3) 逐块编译 */
  blocks.forEach((blockLines, blockIdx) => {
    const blockOdeDefs = {};
    const blockFuncs = [];
    const blockVars = new Set();
    const blockErrors = [];
    const blockVarInit = {};

    for (const line of blockLines) {
      /* ODE 方程定义：x' = ... */
const odeMatch = line.match(RE_ODE_DEF);
      if (odeMatch) { blockOdeDefs[odeMatch[1]] = odeMatch[2].trim(); continue; }

      /* NSolveODE */
const nsMatch = line.match(RE_NSOLVE);
      if (nsMatch) {
        try {
          const name = nsMatch[1];
          const args = splitTopLevel(nsMatch[2], ',');
          if (args.length < 4) throw new Error('参数不足');
          const varList = splitTopLevel(args[0].trim().replace(/^\{|\}$/g, ''), ',')
            .map(s => stripPrime(s)).filter(s => s.length > 0);
          const t0 = parseFloat(args[1].trim()) || 0;
          const initVals = splitTopLevel(args[2].trim().replace(/^\{|\}$/g, ''), ',')
            .map(s => parseFloat(s.trim()) || 0);
          const tEnd = parseFloat(args[3].trim()) || 10;

          const rhsAsts = varList.map(v => {
            const rhs = blockOdeDefs[v];
            if (!rhs) throw new Error('未定义 ' + v + "'");
            const ast = parseExpr(tokenize(rhs));
            collectVars(ast, blockVars);
            return ast;
          });
          varList.forEach(v => blockVars.delete(v));

          if (!out.odeDefs[blockIdx]) out.odeDefs[blockIdx] = {};
          out.odeDefs[blockIdx][name] = {
            varList, t0, initVals, tEnd, steps: 1000, rhsAsts
          };
        } catch (e) { blockErrors.push('NSolveODE: ' + e.message); }
        continue;
      }

      /* Curve((fx, fy), param, tMin, tMax) */
      const curveMatch = line.match(/^Curve\s*\((.+)\)$/);
      if (curveMatch) {
        try {
          const args = splitTopLevel(curveMatch[1], ',');
          if (args.length < 2) throw new Error('参数不足');
          const tuple = args[0].trim().replace(/^\(|\)$/g, '');
          const tp = splitTopLevel(tuple, ',');
          if (tp.length < 2) throw new Error('坐标需要两个表达式');
          const xAst = parseExpr(tokenize(tp[0].trim()));
          const yAst = parseExpr(tokenize(tp[1].trim()));
          const param = args[1].trim();
          const tMinAst = args[2] ? parseExpr(tokenize(args[2].trim())) : { type: 'num', value: 0 };
          const tMaxAst = args[3] ? parseExpr(tokenize(args[3].trim())) : { type: 'num', value: 2*Math.PI };
          blockFuncs.push({ type: 'parametric', xAst, yAst, param, tMinAst, tMaxAst, blockIdx });
          collectVars(xAst, blockVars); collectVars(yAst, blockVars);
          collectVars(tMinAst, blockVars); collectVars(tMaxAst, blockVars);
          blockVars.delete(param);
        } catch (e) { blockErrors.push('Curve: ' + e.message); }
        continue;
      }

      /* 等式 */
      const eqIdx = findTopLevelEq(line);
      if (eqIdx >= 0) {
        const lhs = line.slice(0, eqIdx).trim();
        const rhs = line.slice(eqIdx + 1).trim();

        /* f(x) = ... */
const funcMatch = lhs.match(RE_FUNC_EQ);
        if (funcMatch) {
          try {
            const ast = parseExpr(tokenize(rhs));
            blockFuncs.push({ type: 'func', name: funcMatch[1], arg: funcMatch[2], ast, blockIdx });
            collectVars(ast, blockVars);
            blockVars.delete(funcMatch[2]);
          } catch (e) { blockErrors.push('函数: ' + e.message); }
          continue;
        }
        /* y = ... */
        if (lhs === 'y') {
          try {
            const ast = parseExpr(tokenize(rhs));
            blockFuncs.push({ type: 'func', name: 'y', arg: 'x', ast, blockIdx });
            collectVars(ast, blockVars);
            blockVars.delete('x');
          } catch (e) { blockErrors.push('y=: ' + e.message); }
          continue;
        }

        /* 点 / 向量 */
        const pv = tryParsePointOrVector(lhs, rhs, definedNames);
        if (pv) {
          if (pv.type === 'error') {
            blockErrors.push(pv.message);
            continue;
          }
          pv.blockIdx = blockIdx;
          if (pv.type === 'point') {
            collectVars(pv.xAst, blockVars);
            collectVars(pv.yAst, blockVars);
          } else if (pv.type === 'vector') {
            const collectSide = (side) => {
              if (side.kind === 'scalar') collectVars(side.ast, blockVars);
              else if (side.kind === 'pointLiteral') {
                collectVars(side.ax, blockVars);
                collectVars(side.ay, blockVars);
              }
            };
            collectSide(pv.left);
            collectSide(pv.right);
          }
          blockFuncs.push(pv);
          continue;
        }

        /* 变量赋值：a = 1 / b = 2*a
           注意：不主动加入 vars —— 只有被后续函数/点引用时才会成为滑杆；
                 varInit 只作为滑杆的初值 */
if (RE_ID_NAME.test(lhs) && lhs !== 'x' && lhs !== 'y' && lhs !== 't') {
          try {
            const ast = parseExpr(tokenize(rhs));
            blockVarInit[lhs] = ast;
            continue;
          } catch (e) {
            /* 解析失败 → 继续走隐式方程 */
          }
        }

        /* 隐式方程 */
        try {
          const lhsAst = parseExpr(tokenize(lhs));
          const rhsAst = parseExpr(tokenize(rhs));
          const diff = { type: 'binop', op: '-', left: lhsAst, right: rhsAst };
          blockFuncs.push({ type: 'implicit', ast: diff, lhs, rhs, blockIdx });
          collectVars(diff, blockVars);
          blockVars.delete('x'); blockVars.delete('y');
        } catch (e) { blockErrors.push('隐式: ' + e.message); }
        continue;
      }
    }

    /* 合并本块到全局 */
    out.funcs.push(...blockFuncs);
    blockVars.forEach(v => out.vars.add(v));
    blockErrors.forEach(e => out.errors.push(e));
    for (const k in blockVarInit) out.varInit[k] = blockVarInit[k];
  });

  ['x','t','y'].forEach(v => out.vars.delete(v));
  return out;
}

/* ---------- 计算变量赋值（支持 a=1, b=2*a 这种链式） ---------- */
function computeVarInits(varInit, baseEnv) {
  const env = Object.assign({}, baseEnv || {});
  if (!varInit) return env;
  for (let iter = 0; iter < 12; iter++) {
    let changed = false;
    for (const k in varInit) {
      try {
        const v = evalAst(varInit[k], env);
        if (isFinite(v) && env[k] !== v) { env[k] = v; changed = true; }
      } catch (e) {}
    }
    if (!changed) break;
  }
  return env;
}

/* ============================================================
 * 三、坐标系、布局与绘制
 * ============================================================ */
const CURVE_COLORS = ['#38bdf8','#f472b6','#34d399','#fbbf24','#a78bfa','#f87171','#22d3ee','#fb923c'];

/* 刻度固定值映射 */
const STEP_VALUES = {
  'auto': null,
  '0.5':  0.5,
  '1':    1,
  '2':    2,
  '5':    5,
  'pi/4': Math.PI / 4,
  'pi/2': Math.PI / 2,
  'pi':   Math.PI,
  '2pi':  Math.PI * 2
};
function stepLabel(key) {
  switch (key) {
    case 'auto': return '自动';
    case 'pi/4': return 'π/4';
    case 'pi/2': return 'π/2';
    case 'pi':   return 'π';
    case '2pi':  return '2π';
    default: return String(key);
  }
}

function aspectLabel(r) {
  if (!r) return '自由';
  const eps = 1e-6;
  if (Math.abs(r - 1)    < eps) return '1 : 1（等比例）';
  if (Math.abs(r - 2)    < eps) return '2 : 1';
  if (Math.abs(r - 0.5)  < eps) return '1 : 2';
  if (Math.abs(r - 4)    < eps) return '4 : 1';
  if (Math.abs(r - 0.25) < eps) return '1 : 4';
  return r.toFixed(2) + ' : 1';
}


/* 滑杆播放模式 */
const SLIDER_MODES = {
  'off':      '关闭自动播放',
  'oscillate':'振荡（来回摆动）',
  'loopUp':   '循环增加 (min→max→min)',
  'loopDown': '循环减小 (max→min→max)',
  'onceUp':   '单次增加到 max',
  'onceDown': '单次减小到 min'
};

function ensureCoord(o) {
  if (!o._coord) o._coord = {};
  const c = o._coord;
  if (c.xMin == null) c.xMin = -10;
  if (c.xMax == null) c.xMax = 10;
  if (c.yMin == null) c.yMin = -7.5;
  if (c.yMax == null) c.yMax = 7.5;
  if (c.showAxes == null) c.showAxes = true;
  if (c.showMajorGrid == null) c.showMajorGrid = true;
  if (c.showMinorGrid == null) c.showMinorGrid = false;
  if (c.showPolarGrid == null) c.showPolarGrid = false;

  /* ★ 新增：坐标比例。
   *   aspectRatio = null → 自由（不受约束）
   *   aspectRatio = r    → 像素比 pxPerUnitX / pxPerUnitY = r
   *                        r=1 表示正方形格子（等比例）
   *                        r=2 表示 x 方向单位长度是 y 方向单位长度的 2 倍
   * 兼容旧字段 equalAspect（true → aspectRatio=1） */
  if (c.aspectRatio === undefined) {
    c.aspectRatio = c.equalAspect ? 1 : null;
  }
  delete c.equalAspect;

  if (c.xStep == null) c.xStep = 'auto';
  if (c.yStep == null) c.yStep = 'auto';
  if (c.xLabel == null) c.xLabel = '';
  if (c.yLabel == null) c.yLabel = '';
  return c;
}

function ensureSliders(o, compiled) {
  if (!o._sliders) o._sliders = {};
  for (const k in o._sliders) if (!compiled.vars.has(k)) delete o._sliders[k];

  const inits = computeVarInits(compiled.varInit || {}, {});

  compiled.vars.forEach(name => {
    if (!o._sliders[name]) {
      let initVal = inits[name];
      if (!isFinite(initVal)) initVal = 1;
      let min = -10, max = 10;
      if (Math.abs(initVal) > 10) {
        const m = Math.abs(initVal) * 2;
        min = -m; max = m;
      }
      o._sliders[name] = {
        value: initVal,
        initValue: initVal,      /* ★ 记住初值，供「重置」使用 */
        min, max,
        step: 0.1,
        speed: 1,
        mode: 'off',
        _lastT: undefined,
        _phase: 0,
        _dragPaused: false
      };
    } else {
      const s = o._sliders[name];
      if (s.autoPlay && (!s.mode || s.mode === 'off')) {
        s.mode = 'oscillate';
        s.autoPlay = false;
      }
      if (!s.mode) s.mode = 'off';
      /* ★ 兼容旧数据：没有 initValue 时补上 */
      if (s.initValue === undefined) {
        const v = inits[name];
        s.initValue = isFinite(v) ? v : 1;
      }
    }
  });
}

/* ★ 单个滑杆重置为初值 */
function resetSliderToInit(o, name) {
  const s = o._sliders && o._sliders[name];
  if (!s) return false;
  const c = getCompiled(o);
  const inits = computeVarInits(c.varInit || {}, {});
  let init = inits[name];
  if (!isFinite(init)) init = (s.initValue !== undefined ? s.initValue : 1);
  s.value = Math.max(s.min, Math.min(s.max, init));
  s._lastT = undefined;
  s._phase = 0;
  return true;
}

/* ★ 全部滑杆重置为初值，返回重置的数量 */
function resetAllSliders(o) {
  const c = getCompiled(o);
  ensureSliders(o, c);
  const inits = computeVarInits(c.varInit || {}, {});
  let count = 0;
  for (const name in o._sliders) {
    const s = o._sliders[name];
    let init = inits[name];
    if (!isFinite(init)) init = (s.initValue !== undefined ? s.initValue : 1);
    s.value = Math.max(s.min, Math.min(s.max, init));
    s._lastT = undefined;
    s._phase = 0;
    count++;
  }
  return count;
}

/* 滑杆步进（基于对象本地 animT） */
function stepSlider(s, localT) {
  if (s._lastT === undefined) s._lastT = localT;
  let dt = localT - s._lastT;
  s._lastT = localT;
  if (dt < 0 || dt > 0.5) dt = 0;   // 时间重置 / 大跳变
  if (dt === 0) return;

  const speed = Math.abs(s.speed || 1);
  const range = s.max - s.min;
  if (range <= 0) return;
  const vps = range * 0.25 * speed;    // 每秒走 range 的 25%

  switch (s.mode) {
    case 'loopUp':
      s.value += dt * vps;
      if (s.value > s.max) s.value = s.min + ((s.value - s.min) % range);
      break;
    case 'loopDown':
      s.value -= dt * vps;
      if (s.value < s.min) s.value = s.max - ((s.max - s.value) % range);
      break;
    case 'onceUp':
      s.value += dt * vps;
      if (s.value >= s.max) s.value = s.max;
      break;
    case 'onceDown':
      s.value -= dt * vps;
      if (s.value <= s.min) s.value = s.min;
      break;
    case 'oscillate':
      s._phase = (s._phase || 0) + dt * speed * Math.PI * 2;
      s.value = s.min + range * (0.5 + 0.5 * Math.sin(s._phase));
      break;
    default:
      return;
  }
  if (!isFinite(s.value)) s.value = s.min;
  s.value = Math.max(s.min, Math.min(s.max, s.value));
}

function getCompiled(o) {
  const code = String(o['智能指令'] || '');
  if (!o._compiledCache || o._compiledCache._src !== code) {
    try {
      const c = compileCode(code);
      c._src = code;
      o._compiledCache = c;
    } catch (e) {
      o._compiledCache = {
        funcs: [], vars: new Set(), errors: [e.message],
        _src: code, odeDefs: {}, varInit: {}
      };
    }
    o._odeCache = null;

    /* ★ 源码变化 → 清空滑杆缓存，让 ensureSliders 用新 varInit 重建滑杆。
     *   这样 a=0 就不会因为旧代码 a=1 残留而显示 1。 */
    o._sliders = {};
    o._sliderDragging = false;
  }
  return o._compiledCache;
}
/* 返回 { shared, odeByBlock }：
 *   shared   —— 全局滑杆变量 + 点（点由 drawCurves 添加）
 *   odeByBlock[blockIdx] —— 该块的 ODE 解函数（x(t)、v(t)…）
 */
function getEnv(o) {
  const c = getCompiled(o);
  ensureSliders(o, c);

  const shared = {};
  if (o._sliders) for (const k in o._sliders) shared[k] = o._sliders[k].value;

  const odeByBlock = {};
  if (c.odeDefs && Object.keys(c.odeDefs).length) {
    const vars = Array.from(c.vars).sort();
    const sig = vars.map(k => (o._sliders[k] ? o._sliders[k].value : 0).toFixed(6)).join('|');
    if (!o._odeCache || o._odeCache.sig !== sig) {
      const sols = {};
      for (const blockIdx in c.odeDefs) {
        const blockOde = c.odeDefs[blockIdx];
        for (const name in blockOde) {
          try { sols[blockIdx + '::' + name] = solveODEFromDef(blockOde[name], shared); }
          catch (e) { /* 单条 ODE 求解失败不影响其它 */ }
        }
      }
      o._odeCache = { sig, sols };
    }
    for (const key in o._odeCache.sols) {
      const sep = key.indexOf('::');
      const blockIdx = key.slice(0, sep);
      const sol = o._odeCache.sols[key];
      if (!odeByBlock[blockIdx]) odeByBlock[blockIdx] = {};
      for (const v in sol.interp) {
        odeByBlock[blockIdx][v] = sol.interp[v];
      }
    }
  }

  return { shared, odeByBlock };
}

function getXStep(coord, content) {
  const fixed = STEP_VALUES[coord.xStep];
  if (fixed) return fixed;
  return niceStep(coord.xMax - coord.xMin, Math.max(4, content.w / 55));
}
function getYStep(coord, content) {
  const fixed = STEP_VALUES[coord.yStep];
  if (fixed) return fixed;
  return niceStep(coord.yMax - coord.yMin, Math.max(4, content.h / 55));
}
function isPiStep(key) {
  return key === 'pi/4' || key === 'pi/2' || key === 'pi' || key === '2pi';
}

function getLayout(o) {
  const b = (window.U_bbox ? window.U_bbox(o) : { x1:o.x1, y1:o.y1, x2:o.x2, y2:o.y2, w:o.x2-o.x1, h:o.y2-o.y1 });
  const coord = ensureCoord(o);
  const compiled = getCompiled(o);
  ensureSliders(o, compiled);

  const names = Object.keys(o._sliders);
  const sliderW = names.length ? Math.min(190, Math.max(110, b.w * 0.30)) : 0;
  const contentW = b.w - sliderW - (sliderW ? 8 : 0);
  const rowH = 26;
  const sliders = [];
  const namesArr = Object.keys(o._sliders);
  namesArr.forEach((name, i) => {
    const s = o._sliders[name];
    sliders.push({
      name,
      x: b.x1 + contentW + 8,
      y: b.y1 + 8 + i * rowH,
      w: sliderW,
      h: rowH - 4,
      pad: 22,
      min: s.min, max: s.max,
    });
  });

  /* ★ 坐标比例约束：根据 aspectRatio 自动调整 y 范围。
   *   思路：固定 x 范围，保持 y 中心不变，重新算 y 范围使得
   *   (contentW / xr) / (b.h / yr) === aspectRatio
   *   → yr = aspectRatio * xr * b.h / contentW */
  if (coord.aspectRatio && contentW > 20 && b.h > 20) {
    const xr = coord.xMax - coord.xMin;
    if (xr > 0) {
      const targetYr = coord.aspectRatio * xr * b.h / contentW;
      const cy = (coord.yMin + coord.yMax) / 2;
      const newYmin = cy - targetYr / 2;
      const newYmax = cy + targetYr / 2;
      if (Math.abs(newYmin - coord.yMin) > 1e-6 ||
          Math.abs(newYmax - coord.yMax) > 1e-6) {
        coord.yMin = newYmin;
        coord.yMax = newYmax;
      }
    }
  }

  return {
    bbox: b, coord,
    content: { x: b.x1, y: b.y1, w: contentW, h: b.h },
    sliders,
  };
}


function dataToWorld(dx, dy, content, coord) {
  const xr = coord.xMax - coord.xMin || 1;
  const yr = coord.yMax - coord.yMin || 1;
  return {
    x: content.x + (dx - coord.xMin) / xr * content.w,
    y: content.y + (coord.yMax - dy) / yr * content.h,
  };
}
function worldToData(wx, wy, content, coord) {
  const xr = coord.xMax - coord.xMin || 1;
  const yr = coord.yMax - coord.yMin || 1;
  return {
    x: coord.xMin + (wx - content.x) / content.w * xr,
    y: coord.yMax - (wy - content.y) / content.h * yr,
  };
}
function niceStep(range, target) {
  const rough = range / Math.max(1, target);
  const pow = Math.pow(10, Math.floor(Math.log10(rough)));
  const n = rough / pow;
  let step;
  if (n < 1.5) step = 1;
  else if (n < 3) step = 2;
  else if (n < 7) step = 5;
  else step = 10;
  return step * pow;
}
function fmtNum(x) {
  if (Math.abs(x) < 1e-9) return '0';
  const a = Math.abs(x);
  if (a >= 1000 || a < 0.01) return x.toExponential(1);
  return (Math.round(x * 1000) / 1000).toString();
}
function gcd(a, b) { while (b) { const t = b; b = a % b; a = t; } return a; }
function fmtPi(x) {
  if (Math.abs(x) < 1e-9) return '0';
  const ratio = x / Math.PI;
  const denoms = [1, 2, 3, 4, 6, 8];
  for (const d of denoms) {
    const n = ratio * d;
    if (Math.abs(n - Math.round(n)) < 1e-6) {
      const num = Math.round(n);
      if (num === 0) return '0';
      const sign = num < 0 ? '-' : '';
      const an = Math.abs(num);
      const g = gcd(an, d);
      const nn = an / g, dd = d / g;
      if (dd === 1) return sign + (nn === 1 ? '' : nn) + 'π';
      return sign + (nn === 1 ? '' : nn) + 'π/' + dd;
    }
  }
  return fmtNum(x);
}
function roundRect(c, x, y, w, h, r) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}

function drawPolarGrid(c, content, coord, isLight) {
  const origin = dataToWorld(0, 0, content, coord);
  const xStep = getXStep(coord, content);
  const maxR = Math.max(
    Math.hypot(coord.xMin, coord.yMin),
    Math.hypot(coord.xMax, coord.yMin),
    Math.hypot(coord.xMin, coord.yMax),
    Math.hypot(coord.xMax, coord.yMax)
  );
  const pxPerX = content.w / (coord.xMax - coord.xMin);
  const pxPerY = content.h / (coord.yMax - coord.yMin);

  c.strokeStyle = isLight ? 'rgba(60,80,120,0.14)' : 'rgba(120,180,255,0.10)';
  c.lineWidth = 1;

  /* 同心椭圆（等比例时是圆） */
  const rMax = Math.ceil(maxR / xStep) * xStep;
  for (let r = xStep; r <= rMax; r += xStep) {
    const rx = r * pxPerX;
    const ry = r * pxPerY;
    c.beginPath();
    if (c.ellipse) c.ellipse(origin.x, origin.y, rx, ry, 0, 0, Math.PI * 2);
    else c.arc(origin.x, origin.y, rx, 0, Math.PI * 2);
    c.stroke();
  }

  /* 12 条放射线 */
  const rBig = rMax;
  for (let a = 0; a < 12; a++) {
    const ang = a * Math.PI / 6;
    c.beginPath();
    c.moveTo(origin.x, origin.y);
    c.lineTo(origin.x + Math.cos(ang) * rBig * pxPerX,
             origin.y - Math.sin(ang) * rBig * pxPerY);
    c.stroke();
  }
}

function drawGrid(c, layout) {
  const { content, coord } = layout;
  const isLight = document.body.classList.contains('pb-light');

  c.save();
  c.beginPath();
  c.rect(content.x, content.y, content.w, content.h);
  c.clip();

  /* 极坐标网格 */
  if (coord.showPolarGrid) {
    drawPolarGrid(c, content, coord, isLight);
  }

  /* 主网格 */
  if (coord.showMajorGrid) {
    const xStep = getXStep(coord, content);
    const yStep = getYStep(coord, content);
    c.strokeStyle = isLight ? 'rgba(60,80,120,0.16)' : 'rgba(120,180,255,0.14)';
    c.lineWidth = 1;
    c.beginPath();
    for (let x = Math.ceil(coord.xMin / xStep) * xStep; x <= coord.xMax; x += xStep) {
      const w = dataToWorld(x, 0, content, coord);
      c.moveTo(w.x, content.y); c.lineTo(w.x, content.y + content.h);
    }
    for (let y = Math.ceil(coord.yMin / yStep) * yStep; y <= coord.yMax; y += yStep) {
      const w = dataToWorld(0, y, content, coord);
      c.moveTo(content.x, w.y); c.lineTo(content.x + content.w, w.y);
    }
    c.stroke();
  }

  /* 次网格（每格 1/5） */
  if (coord.showMinorGrid) {
    const xStepM = getXStep(coord, content) / 5;
    const yStepM = getYStep(coord, content) / 5;
    c.strokeStyle = isLight ? 'rgba(60,80,120,0.07)' : 'rgba(120,180,255,0.06)';
    c.lineWidth = 1;
    c.beginPath();
    for (let x = Math.ceil(coord.xMin / xStepM) * xStepM; x <= coord.xMax; x += xStepM) {
      const w = dataToWorld(x, 0, content, coord);
      c.moveTo(w.x, content.y); c.lineTo(w.x, content.y + content.h);
    }
    for (let y = Math.ceil(coord.yMin / yStepM) * yStepM; y <= coord.yMax; y += yStepM) {
      const w = dataToWorld(0, y, content, coord);
      c.moveTo(content.x, w.y); c.lineTo(content.x + content.w, w.y);
    }
    c.stroke();
  }

  c.restore();
}

function drawAxes(c, layout, o) {
  const { content, coord } = layout;
  const isLight = document.body.classList.contains('pb-light');

  c.save();
  c.beginPath();
  c.rect(content.x, content.y, content.w, content.h);
  c.clip();

  const origin = dataToWorld(0, 0, content, coord);
  const inX = origin.y >= content.y && origin.y <= content.y + content.h;
  const inY = origin.x >= content.x && origin.x <= content.x + content.w;

  if (coord.showAxes) {
    const axisColor = isLight ? 'rgba(30,50,90,0.85)' : 'rgba(200,220,250,0.75)';
    c.strokeStyle = axisColor;
    c.lineWidth = 1.2;
    c.beginPath();
    if (inX) { c.moveTo(content.x, origin.y); c.lineTo(content.x + content.w, origin.y); }
    if (inY) { c.moveTo(origin.x, content.y); c.lineTo(origin.x, content.y + content.h); }
    c.stroke();

    const arrowSize = 6;
    if (inX) {
      c.beginPath();
      c.moveTo(content.x + content.w, origin.y);
      c.lineTo(content.x + content.w - arrowSize, origin.y - arrowSize * 0.6);
      c.lineTo(content.x + content.w - arrowSize, origin.y + arrowSize * 0.6);
      c.closePath(); c.fillStyle = axisColor; c.fill();
    }
    if (inY) {
      c.beginPath();
      c.moveTo(origin.x, content.y);
      c.lineTo(origin.x - arrowSize * 0.6, content.y + arrowSize);
      c.lineTo(origin.x + arrowSize * 0.6, content.y + arrowSize);
      c.closePath(); c.fill();
    }

    /* 刻度与标签 */
    const xStep = getXStep(coord, content);
    const yStep = getYStep(coord, content);
    const usePiX = isPiStep(coord.xStep);
    const usePiY = isPiStep(coord.yStep);
    const labelColor = isLight ? 'rgba(30,50,90,0.9)' : 'rgba(180,200,230,0.85)';
    c.fillStyle = labelColor;
    c.font = '10px sans-serif';
    c.textAlign = 'center'; c.textBaseline = 'top';

    if (inX) {
      for (let x = Math.ceil(coord.xMin / xStep) * xStep; x <= coord.xMax; x += xStep) {
        if (Math.abs(x) < 1e-9) continue;
        const w = dataToWorld(x, 0, content, coord);
        c.beginPath(); c.moveTo(w.x, origin.y - 3); c.lineTo(w.x, origin.y + 3); c.stroke();
        if (Math.abs(w.x - origin.x) > 14) c.fillText(usePiX ? fmtPi(x) : fmtNum(x), w.x, origin.y + 5);
      }
    }
    if (inY) {
      c.textAlign = 'right'; c.textBaseline = 'middle';
      for (let y = Math.ceil(coord.yMin / yStep) * yStep; y <= coord.yMax; y += yStep) {
        if (Math.abs(y) < 1e-9) continue;
        const w = dataToWorld(0, y, content, coord);
        c.beginPath(); c.moveTo(origin.x - 3, w.y); c.lineTo(origin.x + 3, w.y); c.stroke();
        if (Math.abs(w.y - origin.y) > 8) c.fillText(usePiY ? fmtPi(y) : fmtNum(y), origin.x - 5, w.y);
      }
    }
    if (inX && inY) {
      c.textAlign = 'right'; c.textBaseline = 'top';
      c.fillStyle = labelColor;
      c.fillText('O', origin.x - 5, origin.y + 3);
    }

    /* ============================================================
     * ★ 轴标题：紧贴箭头
     *   X 标题 —— 默认在箭头上方（不挡刻度）；若上方空间不足则改为下方
     *   Y 标题 —— 默认在箭头右侧；若右侧空间不足则改为左侧
     * 轴不在视野内时，退化到画布角落显示
     * ============================================================ */
    const titleColor = isLight ? 'rgba(20,40,80,0.98)' : 'rgba(230,240,255,0.98)';
    c.fillStyle = titleColor;
    c.font = 'bold 13px system-ui, -apple-system, "PingFang SC", sans-serif';

    if (coord.xLabel) {
      if (inX) {
        const marginX = 6, gapY = 5;
        const tw = c.measureText(coord.xLabel).width;
        const th = 14;

        /* 候选 1：箭头左上方 */
        let lx = content.x + content.w - marginX;
        let ly = origin.y - gapY;
        let bl = 'bottom';

        /* 顶边放不下 → 换到轴线下方 */
        if (ly - th < content.y + 2) {
          ly = origin.y + gapY + 10;
          bl = 'top';
        }
        /* 若标题宽度超出（不应发生，因为默认短），截一下 */
        lx = Math.max(content.x + 4 + tw, lx);

        c.textAlign = 'right';
        c.textBaseline = bl;
        c.fillText(coord.xLabel, lx, ly);
      } else {
        c.textAlign = 'right';
        c.textBaseline = 'bottom';
        c.fillText(coord.xLabel, content.x + content.w - 6, content.y + content.h - 6);
      }
    }

    if (coord.yLabel) {
      if (inY) {
        const marginY = 4, gapX = 6;
        const tw = c.measureText(coord.yLabel).width;

        /* 候选 1：箭头右侧 */
        let lx = origin.x + gapX;
        let ly = content.y + marginY;
        let al = 'left';

        /* 右侧空间不足 → 换到左侧 */
        if (lx + tw > content.x + content.w - 4) {
          lx = origin.x - gapX;
          al = 'right';
        }

        c.textAlign = al;
        c.textBaseline = 'top';
        c.fillText(coord.yLabel, lx, ly);
      } else {
        c.textAlign = 'right';
        c.textBaseline = 'top';
        c.fillText(coord.yLabel, content.x + content.w - 6, content.y + 6);
      }
    }
  }

  c.restore();
}

function evalPointSide(side, env) {
  if (!side) return null;
  if (side.kind === 'pointLiteral') {
    const x = evalAst(side.ax, env);
    const y = evalAst(side.ay, env);
    if (!isFinite(x) || !isFinite(y)) return null;
    return { x, y };
  }
  if (side.kind === 'ref') {
    const v = env[side.name];
    if (v && typeof v === 'object' && typeof v.x === 'number' && typeof v.y === 'number') {
      return v;
    }
    return null;
  }
  return null;
}

function drawPointShape(c, fn, content, coord, env, color) {
  const p = env[fn.name];
  if (!p || !isFinite(p.x) || !isFinite(p.y)) return;
  const w = dataToWorld(p.x, p.y, content, coord);

  c.save();
  c.beginPath();
  c.arc(w.x, w.y, 4.2, 0, Math.PI * 2);
  c.fillStyle = color;
  c.fill();
  c.strokeStyle = '#ffffff';
  c.lineWidth = 1.5;
  c.stroke();

  c.font = 'bold 12px system-ui, -apple-system, sans-serif';
  c.fillStyle = color;
  c.textAlign = 'left';
  c.textBaseline = 'bottom';
  c.fillText(fn.name, w.x + 7, w.y - 7);
  c.restore();
}

function drawVectorShape(c, fn, content, coord, env, color) {
  let p1, p2;
  if (fn.left.kind === 'scalar' && fn.right.kind === 'scalar') {
    const a = evalAst(fn.left.ast, env);
    const b = evalAst(fn.right.ast, env);
    p1 = { x: 0, y: 0 };
    p2 = { x: a, y: b };
  } else {
    p1 = evalPointSide(fn.left, env);
    p2 = evalPointSide(fn.right, env);
  }
  if (!p1 || !p2) return;
  if (!isFinite(p1.x) || !isFinite(p1.y) || !isFinite(p2.x) || !isFinite(p2.y)) return;

  const w1 = dataToWorld(p1.x, p1.y, content, coord);
  const w2 = dataToWorld(p2.x, p2.y, content, coord);
  const dx = w2.x - w1.x;
  const dy = w2.y - w1.y;
  const len = Math.hypot(dx, dy);
  if (len < 1) return;

  c.save();
  c.strokeStyle = color;
  c.fillStyle = color;
  c.lineWidth = 2;

  c.beginPath();
  c.moveTo(w1.x, w1.y);
  c.lineTo(w2.x, w2.y);
  c.stroke();

  const ang = Math.atan2(dy, dx);
  const headLen = Math.max(8, Math.min(14, len * 0.3));
  c.beginPath();
  c.moveTo(w2.x, w2.y);
  c.lineTo(w2.x - headLen * Math.cos(ang - 0.36), w2.y - headLen * Math.sin(ang - 0.36));
  c.moveTo(w2.x, w2.y);
  c.lineTo(w2.x - headLen * Math.cos(ang + 0.36), w2.y - headLen * Math.sin(ang + 0.36));
  c.stroke();

  if (fn.name) {
    const mx = (w1.x + w2.x) / 2;
    const my = (w1.y + w2.y) / 2;
    const nx = -dy / len, ny = dx / len;
    c.font = 'bold 12px system-ui, -apple-system, sans-serif';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText(fn.name, mx + nx * 14, my + ny * 14);
  }
  c.restore();
}

function drawCurves(c, layout, o, compiled) {
  const { content, coord } = layout;
  const envData = getEnv(o);
  const baseEnv = Object.assign({}, envData.shared);

  /* 第一遍：先求所有点（共享给所有块） */
  for (const fn of compiled.funcs) {
    if (fn.type === 'point') {
      try {
        const x = evalAst(fn.xAst, baseEnv);
        const y = evalAst(fn.yAst, baseEnv);
        if (isFinite(x) && isFinite(y)) baseEnv[fn.name] = { x, y };
      } catch (e) {}
    }
  }

  /* 第二遍：按块绘制 */
  c.save();
  c.beginPath();
  c.rect(content.x, content.y, content.w, content.h);
  c.clip();
  c.lineJoin = 'round';
  c.lineCap = 'round';

  compiled.funcs.forEach((fn, i) => {
    const color = CURVE_COLORS[i % CURVE_COLORS.length];
    c.strokeStyle = color;
    c.fillStyle = color;
    c.lineWidth = 2;
    const env = Object.assign({}, baseEnv);
    env._ode = (fn.blockIdx != null && envData.odeByBlock[fn.blockIdx])
      ? envData.odeByBlock[fn.blockIdx]
      : {};
    try {
      if (fn.type === 'func') drawFuncCurve(c, fn, content, coord, env);
      else if (fn.type === 'parametric') drawParamCurve(c, fn, content, coord, env);
      else if (fn.type === 'implicit') drawImplicitCurve(c, fn, content, coord, env);
      else if (fn.type === 'point') drawPointShape(c, fn, content, coord, env, color);
      else if (fn.type === 'vector') drawVectorShape(c, fn, content, coord, env, color);
    } catch (e) { /* 忽略单条曲线错误 */ }
  });
  c.restore();
}

function drawFuncCurve(c, fn, content, coord, env) {
  const N = Math.max(600, Math.floor(content.w * 1.5));
  c.beginPath();
  let started = false;
  for (let i = 0; i <= N; i++) {
    const dx = coord.xMin + (coord.xMax - coord.xMin) * i / N;
    const e = Object.assign({}, env);
    e[fn.arg] = dx;
    e.__arg__ = dx;
    let dy;
    try { dy = evalAst(fn.ast, e); } catch (err) { dy = NaN; }
    if (!isFinite(dy)) { started = false; continue; }
    const w = dataToWorld(dx, dy, content, coord);
    if (!started) { c.moveTo(w.x, w.y); started = true; }
    else c.lineTo(w.x, w.y);
  }
  c.stroke();
}

function drawParamCurve(c, fn, content, coord, env) {
  const e = Object.assign({}, env);
  let tMin, tMax;
  try { tMin = evalAst(fn.tMinAst, e); } catch (err) { tMin = 0; }
  try { tMax = evalAst(fn.tMaxAst, e); } catch (err) { tMax = 2*Math.PI; }
  if (!isFinite(tMin) || !isFinite(tMax) || tMax <= tMin) return;
  const N = 800;
  c.beginPath();
  let started = false;
  for (let i = 0; i <= N; i++) {
    const t = tMin + (tMax - tMin) * i / N;
    const ee = Object.assign({}, e);
    ee[fn.param] = t;
    ee.__arg__ = t;
    let dx, dy;
    try { dx = evalAst(fn.xAst, ee); } catch (err) { dx = NaN; }
    try { dy = evalAst(fn.yAst, ee); } catch (err) { dy = NaN; }
    if (!isFinite(dx) || !isFinite(dy)) { started = false; continue; }
    const w = dataToWorld(dx, dy, content, coord);
    if (!started) { c.moveTo(w.x, w.y); started = true; }
    else c.lineTo(w.x, w.y);
  }
  c.stroke();
}

/* 隐式曲线：Marching Squares */
function drawImplicitCurve(c, fn, content, coord, env) {
  const cols = Math.max(180, Math.min(480, Math.floor(content.w / 2.5)));
  const rows = Math.max(140, Math.min(360, Math.floor(content.h / 2.5)));
  const xStep = (coord.xMax - coord.xMin) / cols;
  const yStep = (coord.yMax - coord.yMin) / rows;

  const grid = [];
  for (let j = 0; j <= rows; j++) {
    const row = new Array(cols + 1);
    const dy = coord.yMin + j * yStep;
    for (let i = 0; i <= cols; i++) {
      const dx = coord.xMin + i * xStep;
      const e = Object.assign({}, env);
      e.x = dx; e.y = dy;
      let v;
      try { v = evalAst(fn.ast, e); } catch (err) { v = NaN; }
      row[i] = v;
    }
    grid.push(row);
  }

  const centerCache = Object.create(null);
  function getCenter(i, j) {
    const key = i + ',' + j;
    if (key in centerCache) return centerCache[key];
    const cx = coord.xMin + (i + 0.5) * xStep;
    const cy = coord.yMin + (j + 0.5) * yStep;
    const e = Object.assign({}, env);
    e.x = cx; e.y = cy;
    let v;
    try { v = evalAst(fn.ast, e); } catch (err) { v = NaN; }
    centerCache[key] = v;
    return v;
  }

  c.beginPath();
  for (let j = 0; j < rows; j++) {
    const y0 = coord.yMin + j * yStep;
    const y1 = y0 + yStep;
    for (let i = 0; i < cols; i++) {
      const v00 = grid[j][i];
      const v10 = grid[j][i+1];
      const v01 = grid[j+1][i];
      const v11 = grid[j+1][i+1];
      if (!isFinite(v00) || !isFinite(v10) || !isFinite(v01) || !isFinite(v11)) continue;
      if (v00 === 0 && v10 === 0 && v01 === 0 && v11 === 0) continue;

      const x0 = coord.xMin + i * xStep;
      const x1 = x0 + xStep;

      const pts = [];
      if (v00 * v10 <= 0 && v00 !== v10) {
        pts.push({ edge: 0, x: x0 + (v00 / (v00 - v10)) * xStep, y: y0 });
      }
      if (v10 * v11 <= 0 && v10 !== v11) {
        pts.push({ edge: 1, x: x1, y: y0 + (v10 / (v10 - v11)) * yStep });
      }
      if (v01 * v11 <= 0 && v01 !== v11) {
        pts.push({ edge: 2, x: x0 + (v01 / (v01 - v11)) * xStep, y: y1 });
      }
      if (v00 * v01 <= 0 && v00 !== v01) {
        pts.push({ edge: 3, x: x0, y: y0 + (v00 / (v00 - v01)) * yStep });
      }

      if (pts.length === 2) {
        const w1 = dataToWorld(pts[0].x, pts[0].y, content, coord);
        const w2 = dataToWorld(pts[1].x, pts[1].y, content, coord);
        c.moveTo(w1.x, w1.y); c.lineTo(w2.x, w2.y);
      } else if (pts.length === 4) {
        const cv = getCenter(i, j);
        const sameDiag = v00 * v11 > 0;
        let connectA;
        if (sameDiag) connectA = (v00 > 0) === (cv > 0);
        else connectA = (v10 > 0) !== (cv > 0);
        const eMap = Object.create(null);
        for (const p of pts) eMap[p.edge] = p;
        const pairs = connectA ? [[0, 1], [2, 3]] : [[0, 3], [1, 2]];
        for (const pair of pairs) {
          const pa = eMap[pair[0]], pb = eMap[pair[1]];
          if (!pa || !pb) continue;
          const wa = dataToWorld(pa.x, pa.y, content, coord);
          const wb = dataToWorld(pb.x, pb.y, content, coord);
          c.moveTo(wa.x, wa.y); c.lineTo(wb.x, wb.y);
        }
      }
    }
  }
  c.stroke();
}

function drawSliders(c, layout, o) {
  if (!layout.sliders.length) return;
  const isLight = document.body.classList.contains('pb-light');
  c.save();
  c.font = '11px ui-monospace, Menlo, Consolas, monospace';
  layout.sliders.forEach(sl => {
    const s = o._sliders[sl.name];
    if (!s) return;
    const active = s.mode && s.mode !== 'off';
    c.fillStyle = active
      ? (isLight ? 'rgba(56,189,248,0.22)' : 'rgba(56,189,248,0.14)')
      : (isLight ? 'rgba(255,255,255,0.65)' : 'rgba(15,23,42,0.55)');
    roundRect(c, sl.x, sl.y, sl.w, sl.h, 5);
    c.fill();
    c.strokeStyle = active
      ? 'rgba(56,189,248,0.6)'
      : (isLight ? 'rgba(60,80,120,0.35)' : 'rgba(100,116,139,0.35)');
    c.lineWidth = 1;
    c.stroke();

    c.fillStyle = isLight ? 'rgba(30,50,90,0.95)' : 'rgba(203,213,225,0.95)';
    c.textAlign = 'left'; c.textBaseline = 'middle';
    c.fillText(sl.name, sl.x + 6, sl.y + sl.h / 2);

    const tx = sl.x + sl.pad + 16;
    const tw = sl.w - sl.pad * 2 - 58;
    const ty = sl.y + sl.h / 2;
    c.strokeStyle = isLight ? 'rgba(60,80,120,0.55)' : 'rgba(100,116,139,0.8)';
    c.lineWidth = 2.5;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(tx, ty); c.lineTo(tx + tw, ty);
    c.stroke();

    const pct = Math.max(0, Math.min(1, (s.value - s.min) / (s.max - s.min || 1)));
    c.strokeStyle = active ? '#4ade80' : '#38bdf8';
    c.beginPath();
    c.moveTo(tx, ty); c.lineTo(tx + tw * pct, ty);
    c.stroke();

    c.beginPath();
    c.arc(tx + tw * pct, ty, 5, 0, Math.PI * 2);
    c.fillStyle = active ? '#4ade80' : '#38bdf8';
    c.fill();
    c.strokeStyle = '#fff'; c.lineWidth = 1.5; c.stroke();

    c.fillStyle = isLight ? 'rgba(60,80,120,0.95)' : 'rgba(148,163,184,1)';
    c.textAlign = 'right';
    c.fillText(s.value.toFixed(2), sl.x + sl.w - 6, sl.y + sl.h / 2);
  });
  c.restore();
}

/* ============================================================
 * 四、右键菜单（支持子菜单）
 * ============================================================ */
const ctxMenus = [];

function hideCtxMenu() {
  for (const m of ctxMenus) {
    try { m.remove(); } catch (e) {}
  }
  ctxMenus.length = 0;
  document.removeEventListener('mousedown', outsideCtx, true);
}

function outsideCtx(e) {
  if (!ctxMenus.length) return;
  for (const m of ctxMenus) {
    if (m.contains(e.target)) return;
  }
  hideCtxMenu();
}

function makeMenuBtn(label, active, hasSub) {
  const btn = document.createElement('button');
  btn.textContent = (active ? '✓ ' : (hasSub ? '  ' : '  ')) + label + (hasSub ? '  ▸' : '');
  btn.style.cssText = `display:block;width:100%;padding:7px 12px;background:transparent;
    border:none;color:inherit;text-align:left;cursor:pointer;border-radius:6px;
    font:inherit;white-space:nowrap;`;
  btn.addEventListener('mouseenter', () => btn.style.background = 'rgba(56,189,248,.2)');
  btn.addEventListener('mouseleave', () => btn.style.background = 'transparent');
  return btn;
}

function showCtxMenu(x, y, items, level) {
  level = level || 0;
  if (level === 0) hideCtxMenu();

  /* 关闭比当前层级更深的子菜单 */
  while (ctxMenus.length > level) {
    const m = ctxMenus.pop();
    try { m.remove(); } catch (e) {}
  }

  const menu = document.createElement('div');
  menu.style.cssText = `position:fixed;left:${x}px;top:${y}px;z-index:${99999 + level};
    background:rgba(15,23,42,.97);color:#e2e8f0;border:1px solid rgba(56,189,248,.4);
    border-radius:9px;padding:5px;min-width:190px;max-height:80vh;overflow-y:auto;
    box-shadow:0 12px 36px rgba(0,0,0,.6);font-family:system-ui,sans-serif;font-size:13px;`;

  items.forEach(item => {
    if (item.sep) {
      const sep = document.createElement('div');
      sep.style.cssText = 'height:1px;background:rgba(56,189,248,.2);margin:4px 2px;';
      menu.appendChild(sep); return;
    }
    const hasSub = Array.isArray(item.submenu);
    const btn = makeMenuBtn(item.label, item.active, hasSub);
    if (hasSub) {
      let subTimer = null;
      const openSub = () => {
        clearTimeout(subTimer);
        subTimer = setTimeout(() => {
          const r = btn.getBoundingClientRect();
          const subX = r.right + 2;
          const subY = r.top;
          showCtxMenu(subX, subY, item.submenu, level + 1);
        }, 30);
      };
      btn.addEventListener('mouseenter', openSub);
      btn.addEventListener('click', openSub);
    } else {
      btn.addEventListener('click', () => {
        hideCtxMenu();
        item.onClick && item.onClick();
      });
    }
    menu.appendChild(btn);
  });

  document.body.appendChild(menu);
  ctxMenus.push(menu);

  /* 位置修正 */
  const r = menu.getBoundingClientRect();
  if (r.right > window.innerWidth - 8) {
    menu.style.left = Math.max(8, window.innerWidth - r.width - 8) + 'px';
  }
  if (r.bottom > window.innerHeight - 8) {
    menu.style.top = Math.max(8, window.innerHeight - r.height - 8) + 'px';
  }

  if (level === 0) {
    setTimeout(() => document.addEventListener('mousedown', outsideCtx, true), 0);
  }
}

function askNumber(title, def) {
  const v = prompt(title, String(def));
  if (v === null) return null;
  const n = parseFloat(v);
  return isFinite(n) ? n : null;
}
function askRange(title, a, b) {
  const v = prompt(title + '（格式：min,max）', a + ',' + b);
  if (!v) return null;
  const [x, y] = v.split(/[,，]/).map(s => parseFloat(s.trim()));
  if (!isFinite(x) || !isFinite(y) || y <= x) return null;
  return { min: x, max: y };
}
function askText(title, def) {
  const v = prompt(title, def == null ? '' : String(def));
  return v === null ? null : v;
}
function redraw() { window.__pbRedraw && window.__pbRedraw(); }

/* ---- 滑杆右键菜单 ---- */
function showSliderMenu(o, name, x, y) {
  const s = o._sliders[name];
  if (!s) return;

  const modeItems = Object.keys(SLIDER_MODES).map(k => ({
    label: SLIDER_MODES[k],
    active: s.mode === k,
    onClick: () => {
      const cur = o._sliders[name];
      if (!cur) return;
      cur.mode = k;
      cur._lastT = undefined;
      cur._phase = 0;
      redraw();
    }
  }));

  showCtxMenu(x, y, [
    { label: '变量：' + name, active: false, onClick: () => {} },
    { sep: true },
    { label: '最小值  ' + s.min.toFixed(3), onClick: () => {
      const cur = o._sliders[name]; if (!cur) return;
      const v = askNumber('最小值', cur.min);
      if (v !== null && v < cur.max) { cur.min = v; redraw(); }
    }},
    { label: '最大值  ' + s.max.toFixed(3), onClick: () => {
      const cur = o._sliders[name]; if (!cur) return;
      const v = askNumber('最大值', cur.max);
      if (v !== null && v > cur.min) { cur.max = v; redraw(); }
    }},
    { label: '当前值  ' + s.value.toFixed(3), onClick: () => {
      const cur = o._sliders[name]; if (!cur) return;
      const v = askNumber('当前值', cur.value);
      if (v !== null) { cur.value = Math.max(cur.min, Math.min(cur.max, v)); redraw(); }
    }},
    { label: '播放速度  ' + s.speed.toFixed(2) + '×', onClick: () => {
      const cur = o._sliders[name]; if (!cur) return;
      const v = askNumber('播放速度倍率', cur.speed);
      if (v !== null && v > 0) { cur.speed = v; redraw(); }
    }},
    { sep: true },
    { label: '播放模式：' + (SLIDER_MODES[s.mode] || SLIDER_MODES.off), submenu: modeItems },
    { sep: true },
    /* ★ 单个滑杆重置 */
    { label: '重置「' + name + '」为初值', onClick: () => {
      resetSliderToInit(o, name);
      redraw();
    }},
    /* ★ 全部滑杆重置 */
    { label: '重置全部滑杆为初值', onClick: () => {
      const n = resetAllSliders(o);
      redraw();
      if (typeof toast === 'function') toast('已重置 ' + n + ' 个滑杆');
    }}
  ]);
}



/* ---- 坐标右键菜单 ---- */
function showAxisMenu(o, x, y) {
  const c = ensureCoord(o);
  const compiled = getCompiled(o);
  ensureSliders(o, compiled);
  const sliderCount = Object.keys(o._sliders).length;

  const stepSub = (axis) => Object.keys(STEP_VALUES).map(k => ({
    label: stepLabel(k),
    active: (axis === 'x' ? c.xStep : c.yStep) === k,
    onClick: () => {
      if (axis === 'x') c.xStep = k;
      else c.yStep = k;
      redraw();
    }
  }));

  const aspectOptions = [
    { label: '自由（不约束）',              value: null },
    { label: '1 : 1（等比例 · 正方形格子）', value: 1    },
    { label: '2 : 1（x 方向拉伸 2 倍）',    value: 2    },
    { label: '1 : 2（y 方向拉伸 2 倍）',    value: 0.5  },
    { label: '4 : 1',                      value: 4    },
    { label: '1 : 4',                      value: 0.25 },
    { label: '8 : 1',                      value: 8    },
    { label: '1 : 8',                      value: 0.125 }
  ];
  const aspectSub = aspectOptions.map(opt => ({
    label: opt.label,
    active: (c.aspectRatio || null) === opt.value,
    onClick: () => { c.aspectRatio = opt.value; redraw(); }
  }));
  aspectSub.push({ sep: true });
  aspectSub.push({
    label: '自定义…（像素比 pxPerUnitX / pxPerUnitY）',
    onClick: () => {
      const v = askNumber(
        '横纵比例（像素比）\n  1 = 等比例正方形格子\n  2 = x 方向单位长度是 y 方向的 2 倍\n  0.5 = y 方向单位长度是 x 方向的 2 倍',
        c.aspectRatio || 1
      );
      if (v !== null && v > 0) { c.aspectRatio = v; redraw(); }
    }
  });

  const items = [
    { label: '显示坐标轴',     active: !!c.showAxes,      onClick: () => { c.showAxes = !c.showAxes; redraw(); } },
    { label: '显示主网格',     active: !!c.showMajorGrid, onClick: () => { c.showMajorGrid = !c.showMajorGrid; redraw(); } },
    { label: '显示次网格',     active: !!c.showMinorGrid, onClick: () => { c.showMinorGrid = !c.showMinorGrid; redraw(); } },
    { label: '显示极坐标网格', active: !!c.showPolarGrid, onClick: () => { c.showPolarGrid = !c.showPolarGrid; redraw(); } },
    { sep: true },
    { label: '横纵比例（格子宽高比）：' + aspectLabel(c.aspectRatio), submenu: aspectSub },
    { label: 'X 轴刻度：' + stepLabel(c.xStep), submenu: stepSub('x') },
    { label: 'Y 轴刻度：' + stepLabel(c.yStep), submenu: stepSub('y') },
    { sep: true },
    { label: 'X 轴范围  [' + c.xMin.toFixed(2) + ', ' + c.xMax.toFixed(2) + ']', onClick: () => {
      const r = askRange('X 轴范围', c.xMin, c.xMax);
      if (r) { c.xMin = r.min; c.xMax = r.max; redraw(); }
    }},
    { label: 'Y 轴范围  [' + c.yMin.toFixed(2) + ', ' + c.yMax.toFixed(2) + ']' +
             (c.aspectRatio ? '  （比例锁定中）' : ''), onClick: () => {
      if (c.aspectRatio) {
        if (!confirm('当前启用了横纵比例约束，手动设置 Y 范围会自动关闭比例。继续吗？')) return;
      }
      const r = askRange('Y 轴范围', c.yMin, c.yMax);
      if (r) {
        c.yMin = r.min; c.yMax = r.max;
        c.aspectRatio = null;
        redraw();
      }
    }},
    { sep: true },
    { label: 'X 轴标题  "' + (c.xLabel || '') + '"', onClick: () => {
      const t = askText('X 轴标题（留空则隐藏；可写 x/m、t/s 等量纲）', c.xLabel || '');
      if (t !== null) { c.xLabel = t; redraw(); }
    }},
    { label: 'Y 轴标题  "' + (c.yLabel || '') + '"', onClick: () => {
      const t = askText('Y 轴标题（留空则隐藏；可写 y/m、v/(m·s⁻¹) 等量纲）', c.yLabel || '');
      if (t !== null) { c.yLabel = t; redraw(); }
    }},
    /* ★ 有滑杆时才显示「重置全部滑杆」 */
    ...(sliderCount > 0 ? [
      { sep: true },
      { label: '重置全部滑杆为初值（共 ' + sliderCount + ' 个）', onClick: () => {
        const n = resetAllSliders(o);
        redraw();
        if (typeof toast === 'function') toast('已重置 ' + n + ' 个滑杆');
      }}
    ] : []),
    { sep: true },
    { label: '恢复默认视图（-10..10 × -7.5..7.5）', onClick: () => {
      c.xMin = -10; c.xMax = 10; c.yMin = -7.5; c.yMax = 7.5;
      redraw();
    }}
  ];

  showCtxMenu(x, y, items);
}

/* ---- 安装右键菜单 ---- */
function installContextMenu() {
  const board = document.getElementById('board');
  if (!board) { setTimeout(installContextMenu, 400); return; }
  board.addEventListener('contextmenu', e => {
    const sw = window.screenToWorld ? window.screenToWorld(e.clientX, e.clientY) : null;
    if (!sw) return;
    const pt = sw;

    const objects = getObjects();
    for (let i = objects.length - 1; i >= 0; i--) {
      const o = objects[i];
      if (o.type !== 'funcPlotter') continue;
      const b = window.U_bbox ? window.U_bbox(o) : { x1:o.x1, y1:o.y1, x2:o.x2, y2:o.y2 };
      if (pt.x < b.x1 || pt.x > b.x2 || pt.y < b.y1 || pt.y > b.y2) continue;

      const layout = getLayout(o);

      /* 命中滑杆 */
      for (const sl of layout.sliders) {
        if (pt.x >= sl.x && pt.x <= sl.x + sl.w && pt.y >= sl.y && pt.y <= sl.y + sl.h) {
          e.preventDefault(); e.stopPropagation();
          showSliderMenu(o, sl.name, e.clientX, e.clientY);
          return;
        }
      }

      /* 其余区域 → 坐标设置菜单 */
      e.preventDefault(); e.stopPropagation();
      showAxisMenu(o, e.clientX, e.clientY);
      return;
    }
  }, true);
}

function getObjects() {
  if (window.__pbGetObjects) return window.__pbGetObjects();
  return [];
}

/* ============================================================
 * 五、图形定义
 * ============================================================ */

param('智能指令', {
  label: '函数代码',
  type: 'textarea',
  rows: 10,
  def: '',
  placeholder:
    '输入函数代码，一行一个；空行分隔可写多组互不影响的代码块：\n\n' +
    '变量（作为滑杆初值）：\n' +
    'a = 1\n' +
    'b = 2\n' +
    'A = (a, b)\n' +
    'B = (3, 4)\n' +
    'u = (A, B)\n\n' +
    '基本函数：y = x^2 + 2 x + 1\n' +
    '          f(x) = sin(x) + A sin(3 x)\n' +
    '隐式方程：x^2 + y^2 = 4\n' +
    '参数方程：Curve((cos(t), sin(t)), t, 0, 2π)\n\n' +
    "ODE：x' = -ω y\n" +
    "     y' = ω x\n" +
    "     sol = NSolveODE({x', y'}, 0, {1, 0}, 10)\n" +
    "     Curve((x(t), y(t)), t, 0, 10)\n\n" +
    "（用空行隔开即可同时绘制多个 ODE 系统）",
});

shape({
  key: 'funcPlotter',
cat: 'basic', 
  geom: 'box',
  label: '函数绘图器',
  icon:
    '<path d="M3 21h18M3 21V3" stroke-width="1.6"/>' +
    '<path d="M4 16 Q8 4 12 12 T20 6" fill="none" stroke-width="2.2"/>',
  interactive: true,
  animatable: true,
  defaultSize: { w: 680, h: 500 },
  params: ['智能指令'],

  draw(c, o, U) {
    const compiled = getCompiled(o);
    ensureSliders(o, compiled);

    /* 滑杆自动播放：以对象本地时间 o.animT 为时间源 */
    const localT = (typeof o.animT === 'number') ? o.animT : 0;
    if (o._sliders) {
      const skip = !!o._sliderDragging;
      for (const k in o._sliders) {
        const s = o._sliders[k];
        if (!s.mode || s.mode === 'off') { s._lastT = localT; continue; }
        if (skip || !o.animPlaying) { s._lastT = localT; continue; }
        stepSlider(s, localT);
      }
    }

    const layout = getLayout(o);

    c.save();
    c.strokeStyle = 'rgba(56,189,248,0.18)';
    c.lineWidth = 1;
    c.strokeRect(layout.bbox.x1, layout.bbox.y1,
                 layout.bbox.x2 - layout.bbox.x1,
                 layout.bbox.y2 - layout.bbox.y1);
    c.restore();

    drawGrid(c, layout);
    drawAxes(c, layout, o);
    drawCurves(c, layout, o, compiled);
    drawSliders(c, layout, o);

    /* 编译错误提示 */
    if (compiled.errors && compiled.errors.length) {
      c.save();
      c.fillStyle = 'rgba(248,113,113,0.9)';
      c.font = '11px ui-monospace, monospace';
      c.textAlign = 'left';
      c.textBaseline = 'top';
      compiled.errors.slice(0, 4).forEach((msg, i) => {
        c.fillText('⚠ ' + msg, layout.content.x + 6, layout.content.y + 6 + i * 14);
      });
      c.restore();
    }
  },

  onClick(o, ctx) {
    const pt = ctx.worldPt;
    const layout = getLayout(o);

    /* 滑杆 → 直接处理并阻止平移 */
    for (const sl of layout.sliders) {
      if (pt.x >= sl.x && pt.x <= sl.x + sl.w && pt.y >= sl.y && pt.y <= sl.y + sl.h) {
        const s = o._sliders[sl.name];
        if (!s) continue;
        const tx = sl.x + sl.pad + 16;
        const tw = sl.w - sl.pad * 2 - 58;
        const pct = Math.max(0, Math.min(1, (pt.x - tx) / tw));
        let v = s.min + pct * (s.max - s.min);
        if (s.step > 0) v = Math.round(v / s.step) * s.step;
        s.value = Math.max(s.min, Math.min(s.max, v));
        s._lastT = undefined;
        s._phase = 0;
        o._dragSlider = sl.name;
        o._sliderDragging = true;
        ctx.requestRedraw();
        return true;
      }
    }

    /* 记录平移起点（app.js 后续拖动会走 onPan） */
    const coord = ensureCoord(o);
    o._panStartCoord = {
      xMin: coord.xMin, xMax: coord.xMax,
      yMin: coord.yMin, yMax: coord.yMax,
    };
    return false;
  },

  onDrag(o, ctx) {
    if (!o._dragSlider) return false;
    o._sliderDragging = true;
    const sl = getLayout(o).sliders.find(s => s.name === o._dragSlider);
    if (!sl) { o._dragSlider = null; o._sliderDragging = false; return false; }
    const s = o._sliders[sl.name];
    if (!s) return false;
    const tx = sl.x + sl.pad + 16;
    const tw = sl.w - sl.pad * 2 - 58;
    const pct = Math.max(0, Math.min(1, (ctx.worldPt.x - tx) / tw));
    let v = s.min + pct * (s.max - s.min);
    if (s.step > 0) v = Math.round(v / s.step) * s.step;
    s.value = Math.max(s.min, Math.min(s.max, v));
    s._lastT = undefined;
    s._phase = 0;
    ctx.requestRedraw();
    return true;
  },

  onDragEnd(o) {
    o._dragSlider = null;
    o._sliderDragging = false;
  },

  /* 绘图区内拖动 = 平移视图 */
  onPan(o, dx, dy, startView) {
    if (!o._panStartCoord) return;
    const layout = getLayout(o);
    const xr = o._panStartCoord.xMax - o._panStartCoord.xMin;
    const yr = o._panStartCoord.yMax - o._panStartCoord.yMin;
    const xPerPx = xr / layout.content.w;
    const yPerPx = yr / layout.content.h;
    const coord = ensureCoord(o);

    coord.xMin = o._panStartCoord.xMin - dx * xPerPx;
    coord.xMax = o._panStartCoord.xMax - dx * xPerPx;

    if (!coord.aspectRatio) {
      /* 自由模式：x、y 都平移 */
      coord.yMin = o._panStartCoord.yMin + dy * yPerPx;
      coord.yMax = o._panStartCoord.yMax + dy * yPerPx;
    } else {
      /* 比例锁定：y 中心不变，由 getLayout 重算 y 范围 */
      const cy = (o._panStartCoord.yMin + o._panStartCoord.yMax) / 2;
      const half = (coord.yMax - coord.yMin) / 2;
      coord.yMin = cy - half;
      coord.yMax = cy + half;
    }
  },

  /* 绘图区内滚轮 = 以鼠标为中心缩放 */
  onWheel(o, ctx) {
    const coord = ensureCoord(o);
    const layout = getLayout(o);
    const data = worldToData(ctx.worldPt.x, ctx.worldPt.y, layout.content, layout.coord);
    const deltaY = ctx.deltaY || 0;
    if (deltaY === 0) return;
    const factor = deltaY > 0 ? 1.15 : 1 / 1.15;

    /* 缩放 x 范围（以鼠标处 x 为中心） */
    coord.xMin = data.x + (coord.xMin - data.x) * factor;
    coord.xMax = data.x + (coord.xMax - data.x) * factor;

    if (!coord.aspectRatio) {
      /* 自由模式：y 也以鼠标处为中心缩放 */
      coord.yMin = data.y + (coord.yMin - data.y) * factor;
      coord.yMax = data.y + (coord.yMax - data.y) * factor;
    }
    /* 比例锁定时 y 范围由 getLayout 自动重算 */
  },
});

/* ============================================================
 * 六、抽屉数据（内置分组 + 自定义分组）
 * ============================================================ */
const FORMULA_FILE = 'custom-formulas.json';
const FORMULA_LS_KEY = '__pb_custom_formulas';

const BUILTIN_GROUPS = [
  {
    id: 'basic', name: '基本函数', builtin: true, hidden: false, items: [
      { id: 'b1', label: '一次函数 y = a x + b',            builtin: true, code: 'a = 1\nb = 0\nf(x) = a x + b' },
      { id: 'b2', label: '二次函数 y = a x² + b x + c',     builtin: true, code: 'a = 1\nb = 0\nc = 0\nf(x) = a x^2 + b x + c' },
      { id: 'b3', label: '指数函数 y = exp(x)',             builtin: true, code: 'f(x) = exp(x)' },
      { id: 'b4', label: '自然对数 y = ln(x)',              builtin: true, code: 'f(x) = ln(x)' },
      { id: 'b5', label: '简谐振动 y = A sin(ω x + φ)',     builtin: true, code: 'A = 1\nω = 2\nφ = 0\nf(x) = A sin(ω x + φ)' },
    ]
  },
  {
    id: 'conic', name: '圆锥曲线', builtin: true, hidden: false, items: [
      { id: 'c1', label: '圆 x² + y² = 4',                  builtin: true, code: 'x^2 + y^2 = 4' },
      { id: 'c2', label: '椭圆 x²/a² + y²/b² = 1',          builtin: true, code: 'a = 5\nb = 3\nx^2 / a^2 + y^2 / b^2 = 1' },
      { id: 'c3', label: '双曲线 x²/a² − y²/b² = 1',        builtin: true, code: 'a = 3\nb = 2\nx^2 / a^2 - y^2 / b^2 = 1' },
      { id: 'c4', label: '抛物线 y² = 2 p x',               builtin: true, code: 'p = 2\ny^2 = 2 p x' },
    ]
  },
  {
    id: 'param', name: '参数方程', builtin: true, hidden: false, items: [
      { id: 'p1', label: '平抛运动',                        builtin: true,
        code: 'v0 = 10\ng = 9.8\nCurve((v0 * t, 1/2 * g * t^2), t, 0, 2)' },
      { id: 'p2', label: '二维匀变速曲线运动',              builtin: true,
        code: 'vx = 10\nvy = 5\nax = 1\nay = 2\nCurve((vx * t + 1/2 * ax * t^2, vy * t + 1/2 * ay * t^2), t, 0, 3)' },
      { id: 'p3', label: '摆线',                            builtin: true,
        code: 'Curve((t - sin(t), 1 - cos(t)), t, 0, 2π)' },
      { id: 'p4', label: '斜抛运动',                        builtin: true,
        code: 'v0 = 15\nθ = 45\ng = 9.8\nCurve((v0 * cos(θ) * t, v0 * sin(θ) * t - 1/2 * g * t^2), t, 0, 4)' },
    ]
  },
  {
    id: 'polar', name: '极坐标曲线', builtin: true, hidden: false, items: [
      { id: 'pol1', label: '阿基米德螺线',                  builtin: true,
        code: 'k = 1\nCurve((k * θ * cos(θ), k * θ * sin(θ)), θ, 0, 2π)' },
      { id: 'pol2', label: '引力圆锥曲线轨道',              builtin: true,
        code: 'p = 4\ne1 = 0.6\nCurve(((p/(1 + e1 cos(θ))) * cos(θ), (p/(1 + e1 cos(θ))) * sin(θ)), θ, 0, 2π)' },
      { id: 'pol3', label: '对数螺线',                      builtin: true,
        code: 'r0 = 1\nk = 0.15\nCurve((r0 * exp(k θ) * cos(θ), r0 * exp(k θ) * sin(θ)), θ, 0, π)' },
    ]
  },
  {
    id: 'pointvec', name: '点与向量', builtin: true, hidden: false, items: [
      { id: 'pv1', label: '点 A(0,3)、B(2,6)',              builtin: true,
        code: 'A = (0, 3)\nB = (2, 6)' },
      { id: 'pv2', label: '向量 u 从 A 到 B',               builtin: true,
        code: 'A = (-2, 1)\nB = (2, 4)\nu = (A, B)' },
      { id: 'pv3', label: '自由向量 w',                     builtin: true,
        code: 'w = ((0, 2), (2, 8))' },
      { id: 'pv4', label: '向量三角形 u+v=w',               builtin: true,
        code: 'A = (0, 0)\nB = (3, 1)\nC = (1, 3)\nu = (A, B)\nv = (A, C)\nw = (B, C)' },
      { id: 'pv5', label: '带滑杆的点 A = (a, b)',          builtin: true,
        code: 'a = 2\nb = 3\nA = (a, b)' },
    ]
  },
  {
    id: 'piecewise', name: '分段函数', builtin: true, hidden: false, items: [
      { id: 'pw1', label: '分段示例',                       builtin: true,
        code: 'w(x) = If(-5 <= x < 6, sin(x), 6 <= x < 10, 2, 10 <= x <= 14, ln(x))' },
    ]
  },
  {
    id: 'calculus', name: '原函数与导函数', builtin: true, hidden: false, items: [
      { id: 'cal1', label: '速度积分求位移',                builtin: true,
        code: 'v0 = 5\na = 2\nF(x) = Integral(v0 + a * t, t)' },
      { id: 'cal2', label: '位移求导得到速度',              builtin: true,
        code: 'v0 = 5\na = 2\nV(x) = Derivative(v0 * t + 1/2 * a * t^2, t)' },
    ]
  },
  {
    id: 'ode', name: '微分方程组', builtin: true, hidden: false, items: [
      { id: 'ode3', label: '万有引力椭圆轨道',              builtin: true,
        code: "GM = 1\nx' = vx\nvx' = -GM * x / (x^2 + y^2)^(3/2)\ny' = vy\nvy' = -GM * y / (x^2 + y^2)^(3/2)\nsol3 = NSolveODE({x', vx', y', vy'}, 0, {1, 0, 0, 0.8}, 15)\nCurve((x(t), y(t)), t, 0, 15)" },
      { id: 'ode4', label: '匀强磁场带电粒子回旋',          builtin: true,
        code: "ωc = 1\nx' = vx\nvx' = ωc * vy\ny' = vy\nvy' = -ωc * vx\nsol4 = NSolveODE({x', vx', y', vy'}, 0, {0, 0, 0, 1}, 10)\nCurve((x(t), y(t)), t, 0, 10)" },
      { id: 'ode6', label: '阻尼简谐振动（x-t 与 v-t）',     builtin: true,
        code: "ω = 3\nγ = 0.3\nx' = v\nv' = -ω^2 x - γ v\nsol6 = NSolveODE({x', v'}, 0, {1, 0}, 20)\nCurve((t, x(t)), t, 0, 20)\nCurve((t, v(t)), t, 0, 20)" },
      { id: 'ode7', label: '受迫振动（带阻尼）',             builtin: true,
        code: "ω0 = 3\nγ = 0.3\nF0 = 1\nω = 2\nx' = v\nv' = -ω0^2 x - γ v + F0 cos(ω t)\nsol7 = NSolveODE({x', v'}, 0, {1, 0}, 30)\nCurve((t, x(t)), t, 0, 30)\nCurve((t, v(t)), t, 0, 30)" },
      { id: 'ode8', label: '洛伦兹力（斜入射）',              builtin: true,
        code: "ωc = 1\nx' = vx\nvx' = ωc * vy\ny' = vy\nvy' = -ωc * vx\nsol8 = NSolveODE({x', vx', y', vy'}, 0, {0, 1, 0, 0}, 12)\nCurve((x(t), y(t)), t, 0, 12)" },
      { id: 'ode9', label: '有心力径向运动',                  builtin: true,
        code: "GM = 1\nr' = u\nu' = -GM / r^2\nsol9 = NSolveODE({r', u'}, 0, {2, 0}, 10)\nCurve((r(t), u(t)), t, 0, 10)" },
      { id: 'ode10', label: '两个独立的 ODE 系统（空行分隔）', builtin: true,
        code:
          "# 系统 1：简谐振动（在另一个代码块里）\n" +
          "ω1 = 2\nx' = v\nv' = -ω1^2 x\nsolA = NSolveODE({x', v'}, 0, {1, 0}, 10)\nCurve((t, x(t)), t, 0, 10)\n\n" +
          "# 系统 2：阻尼振动（空行隔开）\n" +
          "ω2 = 3\nγ = 0.4\ny' = vy\nvy' = -ω2^2 y - γ vy\nsolB = NSolveODE({y', vy'}, 0, {1, 0}, 10)\nCurve((t, y(t)), t, 0, 10)" },
    ]
  },
];

function cloneGroups(src) {
  return src.map(g => ({
    id: g.id, name: g.name, builtin: !!g.builtin, hidden: !!g.hidden,
    items: (g.items || []).map(it => ({
      id: it.id, label: it.label, code: it.code,
      builtin: !!it.builtin, hidden: !!it.hidden,
    })),
  }));
}

async function fsReadFile(name) {
  if (window.__pbFS && typeof window.__pbFS.readFile === 'function') {
    try {
      const v = await window.__pbFS.readFile(name);
      if (v != null) return v;
    } catch (e) {}
  }
  try { return localStorage.getItem(FORMULA_LS_KEY); } catch (e) { return null; }
}
async function fsWriteFile(name, content) {
  let ok = false;
  if (window.__pbFS && typeof window.__pbFS.writeFile === 'function') {
    try { await window.__pbFS.writeFile(name, content); ok = true; } catch (e) {}
  }
  if (!ok) {
    try { localStorage.setItem(FORMULA_LS_KEY, content); ok = true; } catch (e) {}
  }
  return ok;
}

async function loadGroups() {
  const raw = await fsReadFile(FORMULA_FILE);
  if (!raw) return cloneGroups(BUILTIN_GROUPS);

  let saved;
  try { saved = JSON.parse(raw); } catch (e) { return cloneGroups(BUILTIN_GROUPS); }
  if (!saved || !Array.isArray(saved.groups)) return cloneGroups(BUILTIN_GROUPS);

  const builtinMap = {};
  BUILTIN_GROUPS.forEach(g => { builtinMap[g.id] = g; });

  const result = [];
  const seenBuiltin = new Set();

  for (const g of saved.groups) {
    if (!g || !g.id) continue;
    if (builtinMap[g.id]) {
      const bg = builtinMap[g.id];
      const items = bg.items.map(it => {
        const sv = (g.items || []).find(x => x && x.id === it.id);
        return Object.assign({}, it, {
          hidden: sv ? !!sv.hidden : false,
          label: it.label, code: it.code, builtin: true
        });
      });
      result.push({
        id: bg.id, name: bg.name, builtin: true,
        hidden: !!g.hidden,
        items,
      });
      seenBuiltin.add(g.id);
    } else {
      const items = (g.items || []).map(it => ({
        id: it.id || genId(),
        label: String(it.label || ''),
        code: String(it.code || ''),
        builtin: !!it.builtin,
        hidden: !!it.hidden,
      })).filter(it => it.code || it.label);
      result.push({
        id: g.id, name: String(g.name || '未命名'), builtin: false,
        hidden: !!g.hidden,
        items,
      });
    }
  }
  BUILTIN_GROUPS.forEach(bg => {
    if (!seenBuiltin.has(bg.id)) result.push(cloneGroups([bg])[0]);
  });
  return result;
}

async function saveGroups(groups) {
  return await fsWriteFile(FORMULA_FILE, JSON.stringify({ groups }, null, 2));
}

let _groupsCache = cloneGroups(BUILTIN_GROUPS);
let _saveTimer = null;

function genId() {
  return 'cg_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}
function scheduleSave() {
  if (_saveTimer) clearTimeout(_saveTimer);
  _saveTimer = setTimeout(async () => {
    _saveTimer = null;
    await saveGroups(_groupsCache);
    if (typeof window.__exDrawerElRefresh === 'function') window.__exDrawerElRefresh();
  }, 220);
}
async function refreshGroupsFromFile() {
  try {
    _groupsCache = await loadGroups();
    if (typeof window.__exDrawerElRefresh === 'function') window.__exDrawerElRefresh();
  } catch (e) { console.warn('[funcPlotter] 刷新抽屉失败：', e); }
}

const FUNC_AI_PROMPT = `我在 PhysBoard 电子白板的「函数绘图」图形里编写数学/物理函数图像。请给我可直接粘贴到「函数代码」输入框的代码。

【语法规则】
1. 变量赋值（作为滑杆初值）：
   a = 1
   b = 2
   A = (a, b)          ← 若 a,b 是标量，A 是点
2. 显式函数：
   y = x^2 + 2x + 1
   f(x) = sin(x) + A sin(3x)
3. 隐式方程：x^2 + y^2 = 4
4. 参数方程：Curve((v0 * t, 1/2 * g * t^2), t, 0, 2)
5. 点：A = (0, 3)     向量：u = (A, B) 或 w = ((0,2),(2,8))
6. 分段函数：f(x) = If(x < 0, -x, x >= 0, x)
7. 积分/导数：F(x) = Integral(v0 + a * t, t)
8. ODE 系统：
   x' = v
   v' = -ω^2 x - γ v
   sol = NSolveODE({x', v'}, 0, {1, 0}, 20)
   Curve((x(t), v(t)), t, 0, 20)

【重要：多组代码用空行隔开】
两个独立的 ODE 系统必须用空行隔开，否则会互相干扰：
   系统 1 代码...
   系统 1 代码...

   系统 2 代码...
   系统 2 代码...

【可用运算符】 + - * / ^  < > <= >= == !=
【可用函数】  sin cos tan asin acos atan sinh cosh tanh
             exp ln log10 sqrt abs sign floor ceil round
             min max pow If Integral Derivative NSolveODE Curve
【常量】      pi π e tau
【滑杆变量】  代码里出现、但不是 x/t/常量/函数/自身定义的符号，会自动变成可拖动的滑杆

只输出代码，不要解释。`;

const API = {
  getGroups() {
    return _groupsCache.map(g => ({
      id: g.id, name: g.name, builtin: !!g.builtin, hidden: !!g.hidden,
      items: (g.items || []).map(it => ({
        id: it.id, label: it.label, code: it.code,
        builtin: !!it.builtin, hidden: !!it.hidden,
      })),
    }));
  },
  async addGroup(name) {
    const group = { id: genId(), name: name || '未命名', builtin: false, hidden: false, items: [] };
    _groupsCache.push(group);
    scheduleSave();
    return group;
  },
  async addItem(groupId, label, code) {
    const grp = _groupsCache.find(x => x.id === groupId);
    if (!grp) return null;
    const item = {
      id: genId(), label: label || '未命名函数', code: String(code || ''),
      builtin: false, hidden: false,
    };
    grp.items.push(item);
    scheduleSave();
    return item;
  },
  async deleteGroup(groupId) {
    const idx = _groupsCache.findIndex(x => x.id === groupId);
    if (idx < 0) return false;
    if (_groupsCache[idx].builtin) return false;
    _groupsCache.splice(idx, 1);
    scheduleSave();
    return true;
  },
  async deleteItem(groupId, itemId) {
    const grp = _groupsCache.find(x => x.id === groupId);
    if (!grp) return false;
    const idx = grp.items.findIndex(it => it.id === itemId);
    if (idx < 0) return false;
    if (grp.items[idx].builtin) return false;
    grp.items.splice(idx, 1);
    scheduleSave();
    return true;
  },
  async updateItem(groupId, itemId, patch) {
    const grp = _groupsCache.find(x => x.id === groupId);
    if (!grp) return false;
    const it = grp.items.find(x => x.id === itemId);
    if (!it) return false;
    if (patch && patch.label != null) it.label = String(patch.label);
    if (patch && patch.code != null) it.code = String(patch.code);
    scheduleSave();
    return true;
  },
  async moveItem(fromGid, itemId, toGid, beforeItemId) {
    const from = _groupsCache.find(x => x.id === fromGid);
    const to   = _groupsCache.find(x => x.id === toGid);
    if (!from || !to) return false;
    const idx = from.items.findIndex(x => x.id === itemId);
    if (idx < 0) return false;
    const [item] = from.items.splice(idx, 1);
    if (from === to) {
      if (beforeItemId) {
        const bi = to.items.findIndex(x => x.id === beforeItemId);
        if (bi >= 0) to.items.splice(bi, 0, item);
        else to.items.push(item);
      } else {
        to.items.push(item);
      }
    } else {
      if (beforeItemId) {
        const bi = to.items.findIndex(x => x.id === beforeItemId);
        if (bi >= 0) to.items.splice(bi, 0, item);
        else to.items.push(item);
      } else {
        to.items.push(item);
      }
    }
    scheduleSave();
    return true;
  },
  async setGroupHidden(groupId, hidden) {
    const grp = _groupsCache.find(x => x.id === groupId);
    if (!grp) return false;
    grp.hidden = !!hidden;
    scheduleSave();
    return true;
  },
  async setItemHidden(groupId, itemId, hidden) {
    const grp = _groupsCache.find(x => x.id === groupId);
    if (!grp) return false;
    const it = grp.items.find(x => x.id === itemId);
    if (!it) return false;
    it.hidden = !!hidden;
    scheduleSave();
    return true;
  },
  async moveGroup(groupId, dir) {
    const idx = _groupsCache.findIndex(x => x.id === groupId);
    if (idx < 0) return false;
    let target;
    if (dir === 'up')   target = Math.max(0, idx - 1);
    else if (dir === 'down') target = Math.min(_groupsCache.length - 1, idx + 1);
    else return false;
    if (target === idx) return false;
    const [tmp] = _groupsCache.splice(idx, 1);
    _groupsCache.splice(target, 0, tmp);
    scheduleSave();
    return true;
  },
  async renameGroup(groupId, name) {
    const grp = _groupsCache.find(x => x.id === groupId);
    if (!grp || grp.builtin) return false;
    grp.name = String(name || '未命名');
    scheduleSave();
    return true;
  },
  async resetOrder() {
    _groupsCache = cloneGroups(BUILTIN_GROUPS);
    scheduleSave();
    return true;
  },
  getAIPrompt() { return FUNC_AI_PROMPT; },
  exportCustomGroups() {
    const custom = _groupsCache.filter(g => !g.builtin);
    return JSON.stringify({ groups: custom }, null, 2);
  },
  async importCustomGroups(text, append) {
    let data;
    try { data = JSON.parse(text); } catch (e) { return false; }
    if (!data || !Array.isArray(data.groups)) return false;
    if (!append) {
      for (let i = _groupsCache.length - 1; i >= 0; i--) {
        if (!_groupsCache[i].builtin) _groupsCache.splice(i, 1);
      }
    }
    for (const cg of data.groups) {
      if (!cg || !cg.id) continue;
      if (_groupsCache.some(x => x.id === cg.id)) continue;
      _groupsCache.push({
        id: cg.id, name: cg.name || '导入的分组',
        builtin: false, hidden: false,
        items: (cg.items || []).map(it => ({
          id: it.id || genId(),
          label: it.label || '未命名',
          code: it.code || '',
          builtin: false,
          hidden: !!it.hidden,
        })),
      });
    }
    scheduleSave();
    return true;
  },
};

window.__pbFuncPlotter = API;

setTimeout(() => refreshGroupsFromFile(), 60);

/* ============================================================
 * 七、坐标变换、对象追踪、右键菜单补全
 * ============================================================ */
let _mainTransform = null;
let _mainViewScale = 1;

function _captureTransform(c, o) {
  try {
    if (!c || !c.canvas) return;
    if (c.canvas.id !== 'board') return;
    _mainTransform = c.getTransform();
    const s = (o && typeof o._viewScale === 'number') ? o._viewScale : 1;
    _mainViewScale = s || 1;
  } catch (e) {}
}

window.screenToWorld = function (sx, sy) {
  const m = _mainTransform;
  const scale = _mainViewScale || 1;
  if (!m || !isFinite(m.a) || m.a === 0) return { x: sx, y: sy };
  const dpr = m.a / scale;
  if (!dpr) return { x: sx, y: sy };
  return {
    x: (sx - m.e / dpr) / scale,
    y: (sy - m.f / dpr) / scale,
  };
};

const _seenObjects = new Map();
function _registerObject(o) { _seenObjects.set(o, performance.now()); }
window.__pbGetObjects = function () { return Array.from(_seenObjects.keys()); };

(function hookFuncPlotterDraw() {
  const def = window.PhysBoard && window.PhysBoard.shapes && window.PhysBoard.shapes['funcPlotter'];
  if (!def || def._hookedDraw) return;
  const orig = def.draw;
  def.draw = function (c, o, U) {
    _captureTransform(c, o);
    _registerObject(o);
    return orig.call(this, c, o, U);
  };
  def._hookedDraw = true;
})();

if (typeof installContextMenu === 'function') installContextMenu();

/* ============================================================
 * 八、启动
 * ============================================================ */
(function boot() {
  refreshGroupsFromFile();
  if (typeof window.__exDrawerElRefresh === 'function') window.__exDrawerElRefresh();
  console.log('[funcPlotter] v5 已就绪：变量赋值 + 多代码块 ODE + 播放模式 + 坐标设置');
})();

setTimeout(() => {
  if (typeof window.__exDrawerElRefresh === 'function') window.__exDrawerElRefresh();
}, 800);



/* ============================================================
 * 九、全局「重置」按钮 → 同时重置所有 funcPlotter 滑杆
 *   顶部工具栏的 resetAllBtn（播放 / 暂停 旁边那个）
 *   app.js 原本只重置 animT，这里追加滑杆重置
 * ============================================================ */
window.__pbResetAllFuncPlotterSliders = function () {
  const objs = (window.__pbGetObjects ? window.__pbGetObjects() : []);
  let total = 0;
  for (const o of objs) {
    if (!o || o.type !== 'funcPlotter' || !o._sliders) continue;
    try {
      const n = resetAllSliders(o);
      total += n;
    } catch (e) {}
  }
  if (total > 0) {
    try { window.__pbRedraw && window.__pbRedraw(); } catch (e) {}
  }
  return total;
};

(function hookGlobalResetButton() {
  /* 只绑定一次；多次执行 shapes-self.js 时复用同一个监听器，
     内部每次都调用最新的 window.__pbResetAllFuncPlotterSliders */
  if (window.__pbGlobalResetHooked) return;
  window.__pbGlobalResetHooked = true;

  const tryBind = () => {
    const btn = document.getElementById('resetAllBtn');
    if (!btn) { setTimeout(tryBind, 300); return; }
    btn.addEventListener('click', () => {
      if (typeof window.__pbResetAllFuncPlotterSliders === 'function') {
        window.__pbResetAllFuncPlotterSliders();
      }
    });
  };
  tryBind();
})();


/* ============================================================
 * 十、图形下方 selBar 的「重置」按钮 → 同时重置该对象滑杆
 *     app.js 的 tagResetAnim 只调用 resetObjAnim(o)，仅重置 animT，
 *     这里额外把该 funcPlotter 的所有滑杆恢复到初值
 * ============================================================ */
(function hookSelBarResetButton() {
  if (window.__pbSelBarResetHooked) return;
  window.__pbSelBarResetHooked = true;

  const tryBind = () => {
    const btn = document.getElementById('tagResetAnim');
    if (!btn) { setTimeout(tryBind, 300); return; }
    btn.addEventListener('click', () => {
      /* 取当前选中对象（selBar 只在单选时显示 tagResetAnim） */
      const sel = window.PhysBoard && window.PhysBoard.getSelection;
      if (typeof sel !== 'function') return;
      const arr = sel();
      if (!arr || arr.length !== 1) return;
      const o = arr[0];
      if (!o || o.type !== 'funcPlotter' || !o._sliders) return;

      try {
        const n = resetAllSliders(o);
        if (n > 0 && typeof window.__pbRedraw === 'function') {
          window.__pbRedraw();
        }
      } catch (e) {}
    });
  };
  tryBind();
})();



})();






/* ============================================================================
 * 电路板图形 · 分层语法布局 v9
 *   v9 变更：
 *     - 电池改为「理想源 + 内阻」模型（默认 0.01Ω），MNA 不再奇异
 *     - 多电源并联/串联均可求解，电流方向按内部电流（放电时负→正）
 *     - openToolbar 先清理所有旧面板，不再累积
 *     - 移除 selBar 电路按钮（点击电路图直接打开）
 *   v9.1 修复：
 *     - 常用电路图拖拽排序失效（改用 Pointer Events 模拟，不依赖 HTML5 drag API）
 * ============================================================================ */
(function () {
'use strict';

const BASE_W = 800, BASE_H = 500, SNAP = 10, STUB = 18;
const SYNTAX_LS_KEY = '__circuit_syntax_last';
/* ★ 常用电路图预设存储 */
const SYNTAX_PRESETS_KEY = '__circuit_syntax_presets';

function loadSyntaxPresets() {
  try {
    const raw = localStorage.getItem(SYNTAX_PRESETS_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch (e) { return []; }
}
function saveSyntaxPresets(arr) {
  try {
    localStorage.setItem(SYNTAX_PRESETS_KEY, JSON.stringify(arr));
    return true;
  } catch (e) { return false; }
}
function genPresetId() {
  return 'sp_' + Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);
}
const DEFAULT_SYNTAX = [
  '# 分压法测电阻（分层布局）',
  '# 层 a/b/c/d/e 从上到下，等势组 (...) 确定列对齐',
  '# 末尾 (a1,b1,d1,e1)=0 表示这些点电势为 0V',
  'a1,a2,V1',
  'b1,b2,R1,A1',
  'e1,e2,E,S',
  'Rp:横向d1,d2,c1',
  '(a1,b1,d1,e1)=0',
  '(a2,b2,c1)',
  '(d2,e2)'
].join('\n');

let __pendingPortClick = null;
let __propPanelEl = null;
let __calcPanelEl = null;

function getLastSyntax() { try { return localStorage.getItem(SYNTAX_LS_KEY) || ''; } catch (e) { return ''; } }
function saveLastSyntax(t) { try { localStorage.setItem(SYNTAX_LS_KEY, t); } catch (e) {} }

function getBBoxOf(o) {
  if (typeof window.U_bbox === 'function') return window.U_bbox(o);
  const x1 = Math.min(o.x1, o.x2), y1 = Math.min(o.y1, o.y2);
  const x2 = Math.max(o.x1, o.x2), y2 = Math.max(o.y1, o.y2);
  return { x1, y1, x2, y2, w: x2 - x1, h: y2 - y1 };
}

/* ============================ 元件类型 ============================ */
const TYPES = {
  battery: {
    label: '电池', keepUpright: false,
    ports: [{ id:'L', cx:-40, cy:0, dir:[-1,0] }, { id:'R', cx:40, cy:0, dir:[1,0] }],
    /* ★ v9：默认内阻 0.01Ω，防 MNA 奇异 */
    defaultProps: { emf: 6, r: 0 },
    propFields: [
      { key:'emf', label:'电动势', unit:'V', min:0, max:50, step:0.1 },
      { key:'r',   label:'内阻',   unit:'Ω', min:0, max:50, step:0.01 }
    ],
    dynamic: (c) => {
      const rev = c && c.props && c.props.reversed;
      if (rev) return [
        { kind:'line', x1:-40, y1:0, x2:-6, y2:0 },
        { kind:'line', x1:-6, y1:-7, x2:-6, y2:7, sw:6 },
        { kind:'line', x1:6, y1:-14, x2:6, y2:14, sw:2.5 },
        { kind:'line', x1:6, y1:0, x2:40, y2:0 }
      ];
      return [
        { kind:'line', x1:-40, y1:0, x2:-6, y2:0 },
        { kind:'line', x1:-6, y1:-14, x2:-6, y2:14, sw:2.5 },
        { kind:'line', x1:6, y1:-7, x2:6, y2:7, sw:6 },
        { kind:'line', x1:6, y1:0, x2:40, y2:0 }
      ];
    }
  },
  resistor: {
    label: '电阻', keepUpright: false,
    ports: [{ id:'L', cx:-40, cy:0, dir:[-1,0] }, { id:'R', cx:40, cy:0, dir:[1,0] }],
    defaultProps: { R: 10 },
    propFields: [{ key:'R', label:'阻值', unit:'Ω', min:0.1, max:1000, step:0.1 }],
    shapes: [
      { kind:'line', x1:-40, y1:0, x2:-22, y2:0 },
      { kind:'rect', cx:0, cy:0, rw:44, rh:20 },
      { kind:'line', x1:22, y1:0, x2:40, y2:0 }
    ]
  },
  resistorBox: {
    label: '电阻箱', keepUpright: false,
    ports: [{ id:'L', cx:-40, cy:0, dir:[-1,0] }, { id:'R', cx:40, cy:0, dir:[1,0] }],
    defaultProps: { R: 100 },
    propFields: [{ key:'R', label:'阻值', unit:'Ω', min:0, max:99999, step:1 }],
    shapes: [
      { kind:'line', x1:-40, y1:0, x2:-22, y2:0 },
      { kind:'rect', cx:0, cy:0, rw:44, rh:20 },
      { kind:'line', x1:-10, y1:-10, x2:-10, y2:10 },
      { kind:'line', x1:10, y1:-10, x2:10, y2:10 },
      { kind:'line', x1:22, y1:0, x2:40, y2:0 }
    ]
  },
  lamp: {
    label: '灯泡', keepUpright: true,
    ports: [{ id:'L', cx:-40, cy:0, dir:[-1,0] }, { id:'R', cx:40, cy:0, dir:[1,0] }],
    defaultProps: { R: 20 },
    propFields: [{ key:'R', label:'阻值', unit:'Ω', min:0.1, max:1000, step:0.1 }],
    shapes: [
      { kind:'line', x1:-40, y1:0, x2:-15, y2:0 },
      { kind:'circle', cx:0, cy:0, r:15 },
      { kind:'line', x1:-10.6, y1:-10.6, x2:10.6, y2:10.6 },
      { kind:'line', x1:-10.6, y1:10.6, x2:10.6, y2:-10.6 },
      { kind:'line', x1:15, y1:0, x2:40, y2:0 }
    ]
  },
  ammeter: {
    label: '电流表', keepUpright: true,
    ports: [{ id:'L', cx:-40, cy:0, dir:[-1,0] }, { id:'R', cx:40, cy:0, dir:[1,0] }],
    defaultProps: { R: 0 },
    propFields: [{ key:'R', label:'内阻', unit:'Ω', min:0, max:1000, step:0.1 }],
    shapes: [
      { kind:'line', x1:-40, y1:0, x2:-16, y2:0 },
      { kind:'circle', cx:0, cy:0, r:16 },
      { kind:'text', cx:0, cy:0, text:'A', size:17, bold:true },
      { kind:'line', x1:16, y1:0, x2:40, y2:0 }
    ]
  },
  voltmeter: {
    label: '电压表', keepUpright: true,
    ports: [{ id:'L', cx:-40, cy:0, dir:[-1,0] }, { id:'R', cx:40, cy:0, dir:[1,0] }],
    defaultProps: { R: 1e9 },
    propFields: [{ key:'R', label:'内阻', unit:'Ω', min:1, max:1e12, step:1000 }],
    shapes: [
      { kind:'line', x1:-40, y1:0, x2:-16, y2:0 },
      { kind:'circle', cx:0, cy:0, r:16 },
      { kind:'text', cx:0, cy:0, text:'V', size:17, bold:true },
      { kind:'line', x1:16, y1:0, x2:40, y2:0 }
    ]
  },
  motor: {
    label: '电动机', keepUpright: true,
    ports: [{ id:'L', cx:-40, cy:0, dir:[-1,0] }, { id:'R', cx:40, cy:0, dir:[1,0] }],
    defaultProps: { R: 15 },
    propFields: [{ key:'R', label:'等效阻值', unit:'Ω', min:0.1, max:1000, step:0.1 }],
    shapes: [
      { kind:'line', x1:-40, y1:0, x2:-16, y2:0 },
      { kind:'circle', cx:0, cy:0, r:16 },
      { kind:'text', cx:0, cy:0, text:'M', size:16, bold:true },
      { kind:'line', x1:16, y1:0, x2:40, y2:0 }
    ]
  },
  capacitor: {
    label: '电容器', keepUpright: false,
    ports: [{ id:'L', cx:-40, cy:0, dir:[-1,0] }, { id:'R', cx:40, cy:0, dir:[1,0] }],
    defaultProps: {},
    propFields: [],
    shapes: [
      { kind:'line', x1:-40, y1:0, x2:-5, y2:0 },
      { kind:'line', x1:-5, y1:-16, x2:-5, y2:16, sw:2.5 },
      { kind:'line', x1:5, y1:-16, x2:5, y2:16, sw:2.5 },
      { kind:'line', x1:5, y1:0, x2:40, y2:0 }
    ]
  },
  switch: {
    label: '开关', keepUpright: false,
    ports: [{ id:'L', cx:-40, cy:0, dir:[-1,0] }, { id:'R', cx:40, cy:0, dir:[1,0] }],
    defaultProps: { closed: true },
    propFields: [{ key:'closed', label:'闭合', unit:'', type:'toggle' }],
    dynamic: (c) => {
      const closed = !(c && c.props && c.props.closed === false);
      return [
        { kind:'line', x1:-40, y1:0, x2:-22, y2:0 },
        { kind:'circle', cx:-22, cy:0, r:3, fill:'currentColor' },
        closed ? { kind:'line', x1:-22, y1:0, x2:22, y2:0 }
               : { kind:'line', x1:-22, y1:0, x2:12, y2:-16 },
        { kind:'circle', cx:22, cy:0, r:3, fill:'currentColor' },
        { kind:'line', x1:22, y1:0, x2:40, y2:0 }
      ];
    }
  },
  diode: {
    label: '二极管', keepUpright: false,
    ports: [{ id:'L', cx:-40, cy:0, dir:[-1,0] }, { id:'R', cx:40, cy:0, dir:[1,0] }],
    defaultProps: { Rf: 0, Rr: 1e9, reversed: false },
    propFields: [
      { key:'reversed', label:'反向', unit:'', type:'toggle' },
      { key:'Rf', label:'正向电阻', unit:'Ω', min:0, max:1000, step:0.1 },
      { key:'Rr', label:'反向电阻', unit:'Ω', min:1, max:1e12, step:1000 }
    ],
    dynamic: (c) => {
      const rev = c && c.props && c.props.reversed;
      if (rev) return [
        { kind:'line', x1:-40, y1:0, x2:-11, y2:0 },
        { kind:'line', x1:-11, y1:-11, x2:-11, y2:11, sw:2.5 },
        { kind:'path', pts:[{x:11,y:-11},{x:11,y:11},{x:-11,y:0}], closed:true },
        { kind:'line', x1:11, y1:0, x2:40, y2:0 }
      ];
      return [
        { kind:'line', x1:-40, y1:0, x2:-11, y2:0 },
        { kind:'path', pts:[{x:-11,y:-11},{x:-11,y:11},{x:11,y:0}], closed:true },
        { kind:'line', x1:11, y1:-11, x2:11, y2:11, sw:2.5 },
        { kind:'line', x1:11, y1:0, x2:40, y2:0 }
      ];
    }
  },
  rheostat: {
    label: '滑动变阻器', keepUpright: false,
    ports: [
      { id:'A', cx:-40, cy:0, dir:[-1,0] },
      { id:'B', cx: 40, cy:0, dir:[ 1,0] },
      { id:'C', cx:  0, cy:-40, dir:[0,-1] }
    ],
    defaultProps: { R: 20, p: 0.5 },
    propFields: [
      { key:'R', label:'总阻值', unit:'Ω', min:0.1, max:1000, step:0.1 },
      { key:'p', label:'滑片位置', unit:'', min:0, max:1, step:0.01 }
    ],
    shapes: [
      { kind:'line', x1:-40, y1:0, x2:-22, y2:0 },
      { kind:'rect', cx:0, cy:0, rw:44, rh:20 },
      { kind:'line', x1:22, y1:0, x2:40, y2:0 },
      { kind:'line', x1:0, y1:-40, x2:0, y2:-16 },
      { kind:'path', pts:[{x:0,y:-10},{x:-6,y:-16},{x:6,y:-16}], closed:true, fill:'currentColor', stroke:'none' }
    ]
  },
  junction: {
    label: '节点', keepUpright: false,
    ports: [
      { id:'L', cx:0, cy:0, dir:null },
      { id:'R', cx:0, cy:0, dir:null }
    ],
    defaultProps: {},
    propFields: [{ key:'label', label:'名称', type:'text' }],
    dynamic: (c) => {
      const arr = [{ kind:'circle', cx:0, cy:0, r:5, fill:'currentColor' }];
      const label = c && c.props && c.props.label;
      if (label) arr.push({ kind:'text', cx:0, cy:-14, text: label, size:12, bold:true });
      return arr;
    }
  }
};

function ensureData(o) {
  if (!o._circuit) o._circuit = {
    comps: [], shapes: [], wires: [], selected: null, editing: false,
    wireDraft: null, dragState: null, nextId: 1,
    showNodes: false, showSolution: false, showPotential: true,
    zeroGroups: [], baseW: BASE_W, baseH: BASE_H,
    _solution: null, _solutionKey: null,
    multiSelected: [], _marquee: null, _mouseDownInner: null
  };
  if (o._circuit.showNodes === undefined) o._circuit.showNodes = false;
  if (!o._circuit.baseW) o._circuit.baseW = BASE_W;
  if (!o._circuit.baseH) o._circuit.baseH = BASE_H;
  if (!o._circuit.multiSelected) o._circuit.multiSelected = [];
  if (!o._circuit._marquee) o._circuit._marquee = null;
  return o._circuit;
}
function newId(d) { return 'e' + (d.nextId++); }

function getTransform(o) {
  const b = getBBoxOf(o);
  const data = o._circuit || {};
  const BW = data.baseW || BASE_W;
  const BH = data.baseH || BASE_H;
  const s = Math.min(b.w / BW, b.h / BH);
  const ox = b.x1 + (b.w - BW * s) / 2;
  const oy = b.y1 + (b.h - BH * s) / 2;
  return { s, ox, oy, b, BW, BH };
}
function worldToInner(o, wp) {
  const t = getTransform(o);
  return { x: (wp.x - t.ox) / t.s, y: (wp.y - t.oy) / t.s };
}
function hitRadius(o) { return 12 / getTransform(o).s; }

function __isPortUsed(data, compId, portId) {
  for (const w of data.wires) {
    if (w.a && w.a.elem === compId && w.a.port === portId) return true;
    if (w.b && w.b.elem === compId && w.b.port === portId) return true;
  }
  return false;
}

/* ============================ 求解 ============================ */
function __gaussSolve(A, b) {
  const n = A.length;
  const M = A.map((row, i) => row.concat([b[i]]));
  for (let col = 0; col < n; col++) {
    let pivot = col;
    for (let r = col + 1; r < n; r++) {
      if (Math.abs(M[r][col]) > Math.abs(M[pivot][col])) pivot = r;
    }
    if (Math.abs(M[pivot][col]) < 1e-10) return null;
    if (pivot !== col) { const t = M[col]; M[col] = M[pivot]; M[pivot] = t; }
    for (let r = col + 1; r < n; r++) {
      const f = M[r][col] / M[col][col];
      if (f === 0) continue;
      for (let k = col; k <= n; k++) M[r][k] -= f * M[col][k];
    }
  }
  const x = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let sum = M[i][n];
    for (let j = i + 1; j < n; j++) sum -= M[i][j] * x[j];
    x[i] = sum / M[i][i];
  }
  return x;
}

function __elementModel(comp, data) {
  const p = comp.props || {};
  switch (comp.type) {
    /* ★ v9：电池返回内阻（最小 1e-6，防矩阵奇异） */
    case 'battery': return {
      kind: 'vsrc',
      E: p.emf != null ? p.emf : 6,
      r: Math.max(p.r != null ? p.r : 0.01, 1e-6),
      reversed: !!p.reversed
    };
    case 'resistor':    return { kind:'res', R: p.R != null ? p.R : 10 };
    case 'resistorBox': return { kind:'res', R: p.R != null ? p.R : 100 };
    case 'lamp':        return { kind:'res', R: p.R != null ? p.R : 20 };
    case 'motor':       return { kind:'res', R: p.R != null ? p.R : 15 };
    case 'ammeter': {
      const R = p.R != null ? p.R : 0;
      if (R <= 1e-6) return { kind: 'wire' };
      return { kind:'res', R };
    }
    case 'voltmeter': {
      const R = p.R != null ? p.R : 1e9;
      if (R >= 1e8) return { kind: 'open' };
      return { kind:'res', R };
    }
    case 'capacitor':   return { kind:'open' };
    case 'switch':      return (p.closed === false) ? { kind:'open' } : { kind:'wire' };
    case 'diode': {
      const rev = !!p.reversed;
      const Rf = p.Rf != null ? p.Rf : 0;
      const Rr = p.Rr != null ? p.Rr : 1e9;
      const R = rev ? Rr : Rf;
      if (R <= 1e-6) return { kind: 'wire' };
      if (R >= 1e8) return { kind: 'open' };
      return { kind:'res', R };
    }
    case 'rheostat': {
      const R = p.R != null ? p.R : 20;
      const pos = p.p != null ? Math.max(0, Math.min(1, p.p)) : 0.5;
      const uA = __isPortUsed(data, comp.id, 'A');
      const uB = __isPortUsed(data, comp.id, 'B');
      const uC = __isPortUsed(data, comp.id, 'C');
      if (uC && uA && uB) {
        return {
          kind: 'composite',
          parts: [
            { fromPort: 'A', toPort: 'C', R: Math.max(pos * R, 1e-6) },
            { fromPort: 'C', toPort: 'B', R: Math.max((1 - pos) * R, 1e-6) }
          ]
        };
      }
      if (uA && uC && !uB) return { kind: 'res', R: Math.max(pos * R, 1e-6) };
      if (uB && uC && !uA) return { kind: 'res', R: Math.max((1 - pos) * R, 1e-6) };
      return { kind: 'res', R: Math.max(R, 1e-6) };
    }
    default: return { kind:'open' };
  }
}

function __solveCircuit(data) {
  const comps = data.comps.filter(c => c.type !== 'junction');
  const junctions = data.comps.filter(c => c.type === 'junction');
  if (!comps.length) return { ok: false, error: '没有可计算的元件' };

  const parent = new Map();
  function find(x) {
    if (!parent.has(x)) parent.set(x, x);
    let r = x;
    while (parent.get(r) !== r) r = parent.get(r);
    while (parent.get(x) !== r) { const nx = parent.get(x); parent.set(x, r); x = nx; }
    return r;
  }
  function union(a, b) { const ra = find(a), rb = find(b); if (ra !== rb) parent.set(ra, rb); }

  for (const w of data.wires) {
    if (!w.a || !w.b) continue;
    union(w.a.elem + '::' + w.a.port, w.b.elem + '::' + w.b.port);
  }
  for (const j of junctions) union(j.id + '::L', j.id + '::R');

  const wireComps = [];
  for (const comp of comps) {
    const model = __elementModel(comp, data);
    if (model.kind === 'wire') {
      const def = TYPES[comp.type];
      if (!def || def.ports.length < 2) continue;
      let p1, p2;
      if (comp.type === 'diode') {
        const rev = !!(comp.props && comp.props.reversed);
        p1 = def.ports.find(x => x.id === (rev ? 'R' : 'L'));
        p2 = def.ports.find(x => x.id === (rev ? 'L' : 'R'));
      } else {
        p1 = def.ports.find(x => x.id === 'L') || def.ports[0];
        p2 = def.ports.find(x => x.id === 'R') || def.ports[1];
      }
      if (p1 && p2) {
        union(comp.id + '::' + p1.id, comp.id + '::' + p2.id);
        wireComps.push(comp);
      }
    }
  }

  const zeroJunctions = [];
  for (const g of (data.zeroGroups || [])) {
    const nodes = Array.isArray(g) ? g : (g.nodes || []);
    for (const name of nodes) {
      const j = junctions.find(x => x.props && x.props.label === name);
      if (j) zeroJunctions.push(j);
    }
  }
  for (let i = 1; i < zeroJunctions.length; i++) {
    union(zeroJunctions[0].id + '::L', zeroJunctions[i].id + '::L');
  }

  /* ★ v9：先收集电池内部节点 */
  const internalMids = new Set();
  for (const comp of comps) {
    if (comp.type === 'battery') internalMids.add('mid_' + comp.id);
  }

  const nodeSet = new Set();
  for (const comp of comps) {
    const def = TYPES[comp.type];
    if (!def) continue;
    for (const port of def.ports) nodeSet.add(find(comp.id + '::' + port.id));
  }
  for (const j of junctions) nodeSet.add(find(j.id + '::L'));
  for (const m of internalMids) nodeSet.add(m);

  /* refNode 避开内部节点 */
  let refNode;
  if (zeroJunctions.length > 0) refNode = find(zeroJunctions[0].id + '::L');
  else {
    const ext = Array.from(nodeSet).filter(n => !String(n).startsWith('mid_'));
    refNode = ext[0] || Array.from(nodeSet)[0];
  }

  const otherNodes = Array.from(nodeSet).filter(x => x !== refNode);
  const nodeIndex = new Map();
  otherNodes.forEach((n, i) => nodeIndex.set(n, i));

  const resistors = [], vSources = [];
  for (const comp of comps) {
    const def = TYPES[comp.type];
    if (!def) continue;
    const model = __elementModel(comp, data);
    if (model.kind === 'open' || model.kind === 'wire') continue;

    if (model.kind === 'composite') {
      for (let pi = 0; pi < model.parts.length; pi++) {
        const part = model.parts[pi];
        const fromP = def.ports.find(x => x.id === part.fromPort);
        const toP = def.ports.find(x => x.id === part.toPort);
        if (!fromP || !toP) continue;
        const nFrom = find(comp.id + '::' + fromP.id);
        const nTo = find(comp.id + '::' + toP.id);
        resistors.push({
          comp, virtualId: comp.id + '#' + pi,
          segment: { fromPort: fromP.id, toPort: toP.id },
          nodeA: nFrom, nodeB: nTo, R: Math.max(part.R, 1e-6)
        });
      }
      continue;
    }

    if (model.kind === 'vsrc') {
      /* ★ v9：电池拆成 [pos] -- r -- [mid] -- E源 -- [neg] */
      const posPort = def.ports.find(x => x.id === (model.reversed ? 'R' : 'L'));
      const negPort = def.ports.find(x => x.id === (model.reversed ? 'L' : 'R'));
      if (!posPort || !negPort) continue;
      const nPos = find(comp.id + '::' + posPort.id);
      const nNeg = find(comp.id + '::' + negPort.id);
      const nMid = 'mid_' + comp.id;

      resistors.push({
        comp, nodeA: nPos, nodeB: nMid, R: model.r,
        isBatteryR: true, reversed: model.reversed
      });
      vSources.push({
        comp, nodeA: nMid, nodeB: nNeg, E: model.E,
        isBattery: true
      });
      continue;
    }

    const posPort = def.ports[0];
    const negPort = def.ports[1];
    if (!posPort || !negPort) continue;
    const nA = find(comp.id + '::' + posPort.id);
    const nB = find(comp.id + '::' + negPort.id);
    resistors.push({ comp, nodeA: nA, nodeB: nB, R: Math.max(model.R, 1e-6) });
  }

  const n = otherNodes.length, m = vSources.length, size = n + m;
  const potentials = {}, currents = {}, elemInfo = {}, portPotentials = {};

  if (size === 0) {
    potentials[refNode] = 0;
    const jPot = {};
    for (const j of junctions) jPot[j.id] = 0;
    for (const comp of data.comps) {
      const def = TYPES[comp.type];
      if (!def) continue;
      for (const port of def.ports) portPotentials[comp.id + '::' + port.id] = 0;
    }
    return { ok: true, potentials, currents, junctions: jPot, elemInfo, refNode, portPotentials };
  }

  const A = Array.from({ length: size }, () => new Array(size).fill(0));
  const b = new Array(size).fill(0);

  for (const r of resistors) {
    const g = 1 / r.R;
    const ia = nodeIndex.has(r.nodeA) ? nodeIndex.get(r.nodeA) : -1;
    const ib = nodeIndex.has(r.nodeB) ? nodeIndex.get(r.nodeB) : -1;
    if (ia >= 0) A[ia][ia] += g;
    if (ib >= 0) A[ib][ib] += g;
    if (ia >= 0 && ib >= 0) { A[ia][ib] -= g; A[ib][ia] -= g; }
  }

  vSources.forEach((vs, k) => {
    const row = n + k;
    const ia = nodeIndex.has(vs.nodeA) ? nodeIndex.get(vs.nodeA) : -1;
    const ib = nodeIndex.has(vs.nodeB) ? nodeIndex.get(vs.nodeB) : -1;
    if (ia >= 0) { A[ia][row] += 1; A[row][ia] += 1; }
    if (ib >= 0) { A[ib][row] -= 1; A[row][ib] -= 1; }
    b[row] = vs.E;
  });

  const x = __gaussSolve(A, b);
  if (!x) return { ok: false, error: '电路求解失败（可能不闭合或存在理想电压源环路）' };

  potentials[refNode] = 0;
  otherNodes.forEach((nid, i) => { potentials[nid] = x[i]; });

  const compositeSegments = {};
  for (const r of resistors) {
    const Va = potentials[r.nodeA] != null ? potentials[r.nodeA] : 0;
    const Vb = potentials[r.nodeB] != null ? potentials[r.nodeB] : 0;
    const I = (Va - Vb) / r.R;

    if (r.virtualId) {
      currents[r.virtualId] = I;
      if (!compositeSegments[r.comp.id]) compositeSegments[r.comp.id] = [];
      compositeSegments[r.comp.id].push({ ...r.segment, I });
    } else if (r.isBatteryR) {
      /* ★ v9：电池内阻电流 → 电池内部电流 */
      const displayI = r.reversed ? -I : I;
      currents[r.comp.id] = displayI;
      elemInfo[r.comp.id] = { I: displayI };
    } else {
      currents[r.comp.id] = I;
      elemInfo[r.comp.id] = { from: 'L', to: 'R', I };
    }
  }

  vSources.forEach((vs, k) => {
    if (vs.isBattery) return;
    const I = x[n + k];
    currents[vs.comp.id] = I;
    const rev = vs.comp.props && vs.comp.props.reversed;
    elemInfo[vs.comp.id] = { from: rev ? 'R' : 'L', to: rev ? 'L' : 'R', I };
  });

  for (const compId in compositeSegments) {
    elemInfo[compId] = { segments: compositeSegments[compId] };
  }
  for (const comp of wireComps) {
    if (!elemInfo[comp.id]) elemInfo[comp.id] = { isWire: true, I: null };
  }

  const jPotentials = {};
  for (const j of junctions) {
    const nid = find(j.id + '::L');
    jPotentials[j.id] = potentials[nid] != null ? potentials[nid] : 0;
  }

  for (const comp of data.comps) {
    const def = TYPES[comp.type];
    if (!def) continue;
    for (const port of def.ports) {
      const nid = find(comp.id + '::' + port.id);
      portPotentials[comp.id + '::' + port.id] = potentials[nid] != null ? potentials[nid] : 0;
    }
  }

  return { ok: true, potentials, currents, junctions: jPotentials, elemInfo, refNode, portPotentials };
}

function getSolutionKey(data) {
  const parts = [];
  for (const c of data.comps) parts.push(c.id + '|' + c.type + '|' + JSON.stringify(c.props || {}));
  for (const w of data.wires) parts.push(w.a.elem + ':' + w.a.port + '-' + w.b.elem + ':' + w.b.port);
  parts.push('Z:' + JSON.stringify(data.zeroGroups || []));
  return parts.join(';');
}

/* ============================ 绘制 ============================ */
function drawShapeData(c, s, lineColor) {
  c.save();
  c.strokeStyle = s.stroke === 'none' ? 'none' : lineColor;
  c.lineWidth = s.sw || 2;
  c.lineCap = 'round'; c.lineJoin = 'round';
  switch (s.kind) {
    case 'line':
      c.beginPath(); c.moveTo(s.x1, s.y1); c.lineTo(s.x2, s.y2); c.stroke(); break;
    case 'rect':
      c.beginPath();
      c.rect((s.cx||0) - s.rw/2, (s.cy||0) - s.rh/2, s.rw, s.rh);
      c.stroke(); break;
    case 'circle':
      c.beginPath(); c.arc(s.cx||0, s.cy||0, s.r, 0, Math.PI*2);
      if (s.stroke !== 'none') c.stroke(); break;
    case 'path': {
      if (!s.pts || !s.pts.length) break;
      c.beginPath();
      c.moveTo(s.pts[0].x, s.pts[0].y);
      for (let i = 1; i < s.pts.length; i++) c.lineTo(s.pts[i].x, s.pts[i].y);
      if (s.closed) c.closePath();
      if (s.fill && s.fill !== 'none') {
        c.fillStyle = s.fill === 'currentColor' ? lineColor : s.fill;
        c.fill();
      }
      if (s.stroke !== 'none') c.stroke();
      break;
    }
    case 'text':
      c.font = (s.bold ? '700 ' : '400 ') + (s.size || 16) + 'px system-ui, sans-serif';
      c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillStyle = lineColor;
      c.fillText(s.text || '', s.cx || 0, s.cy || 0);
      break;
  }
  c.restore();
}

function drawCompData(c, comp, lineColor) {
  const def = TYPES[comp.type];
  if (!def) return;
  const rotRad = (comp.rot || 0) * Math.PI / 180;
  c.save();
  c.translate(comp.x, comp.y);
  c.rotate(rotRad);
  const shapes = def.dynamic ? def.dynamic(comp) : def.shapes;
  for (const s of shapes) if (s.kind !== 'text') drawShapeData(c, s, lineColor);
  for (const s of shapes) {
    if (s.kind !== 'text') continue;
    if (def.keepUpright && (Math.abs(comp.rot % 360) === 90 || Math.abs(comp.rot % 360) === 270)) {
      c.save();
      c.translate(s.cx || 0, s.cy || 0);
      c.rotate(-rotRad);
      c.font = (s.bold ? '700 ' : '400 ') + (s.size || 16) + 'px system-ui, sans-serif';
      c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillStyle = lineColor;
      c.fillText(s.text || '', 0, 0);
      c.restore();
    } else drawShapeData(c, s, lineColor);
  }
  for (const p of def.ports) {
    c.beginPath(); c.arc(p.cx, p.cy, 3.5, 0, Math.PI*2);
    c.strokeStyle = lineColor; c.lineWidth = 1.2; c.stroke();
  }
  c.restore();
}

function drawCurrentLabel(c, comp, I) {
  if (Math.abs(I) < 1e-6) return;
  const rotRad = (comp.rot || 0) * Math.PI / 180;
  const cos = Math.cos(rotRad), sin = Math.sin(rotRad);
  const dir = I > 0 ? 1 : -1;
  const x0 = comp.x, y0 = comp.y;
  const a1 = { x: x0 + dir * 20 * cos - 20 * sin, y: y0 + dir * 20 * sin + 20 * cos };
  const a2 = { x: x0 + dir * 44 * cos - 20 * sin, y: y0 + dir * 44 * sin + 20 * cos };
  c.save();
  c.strokeStyle = 'rgba(220,38,38,0.95)';
  c.fillStyle = 'rgba(220,38,38,0.95)';
  c.lineWidth = 2;
  c.beginPath(); c.moveTo(a1.x, a1.y); c.lineTo(a2.x, a2.y); c.stroke();
  const worldAng = Math.atan2(a2.y - a1.y, a2.x - a1.x);
  const headLen = 7;
  c.beginPath();
  c.moveTo(a2.x, a2.y);
  c.lineTo(a2.x - headLen * Math.cos(worldAng - Math.PI/6), a2.y - headLen * Math.sin(worldAng - Math.PI/6));
  c.moveTo(a2.x, a2.y);
  c.lineTo(a2.x - headLen * Math.cos(worldAng + Math.PI/6), a2.y - headLen * Math.sin(worldAng + Math.PI/6));
  c.stroke();
  const absI = Math.abs(I);
  const txt = absI < 0.001 ? absI.toExponential(1) + 'A'
            : (absI < 1 ? absI.toFixed(3) + 'A' : absI.toFixed(2) + 'A');
  c.font = 'bold 11px ui-monospace, monospace';
  c.textAlign = 'center'; c.textBaseline = 'top';
  c.fillText(txt, x0 + dir * 32 * cos - 40 * sin, y0 + dir * 32 * sin + 40 * cos);
  c.restore();
}

function drawCompositeCurrents(c, comp, elemInfo) {
  const def = TYPES[comp.type];
  if (!def || !elemInfo.segments) return;
  const rotRad = (comp.rot || 0) * Math.PI / 180;
  const cos = Math.cos(rotRad), sin = Math.sin(rotRad);
  for (const seg of elemInfo.segments) {
    const fromP = def.ports.find(x => x.id === seg.fromPort);
    const toP = def.ports.find(x => x.id === seg.toPort);
    if (!fromP || !toP) continue;
    const I = seg.I;
    if (Math.abs(I) < 1e-6) continue;
    const lx1 = fromP.cx, ly1 = fromP.cy, lx2 = toP.cx, ly2 = toP.cy;
    const dx = lx2 - lx1, dy = ly2 - ly1;
    const len = Math.hypot(dx, dy);
    if (len < 1) continue;
    const ux = dx / len, uy = dy / len;
    const mx = (lx1 + lx2) / 2, my = (ly1 + ly2) / 2;
    const wx = comp.x + mx * cos - my * sin;
    const wy = comp.y + mx * sin + my * cos;
    const wux = ux * cos - uy * sin;
    const wuy = ux * sin + uy * cos;
    const dir = I > 0 ? 1 : -1;
    const segLen = Math.min(20, len * 0.35);
    const a1 = { x: wx - dir * segLen * wux, y: wy - dir * segLen * wuy };
    const a2 = { x: wx + dir * segLen * wux, y: wy + dir * segLen * wuy };
    c.save();
    c.strokeStyle = 'rgba(220,38,38,0.95)';
    c.fillStyle = 'rgba(220,38,38,0.95)';
    c.lineWidth = 2;
    c.beginPath(); c.moveTo(a1.x, a1.y); c.lineTo(a2.x, a2.y); c.stroke();
    const worldAng = Math.atan2(a2.y - a1.y, a2.x - a1.x);
    const headLen = 6;
    c.beginPath();
    c.moveTo(a2.x, a2.y);
    c.lineTo(a2.x - headLen * Math.cos(worldAng - Math.PI/6), a2.y - headLen * Math.sin(worldAng - Math.PI/6));
    c.moveTo(a2.x, a2.y);
    c.lineTo(a2.x - headLen * Math.cos(worldAng + Math.PI/6), a2.y - headLen * Math.sin(worldAng + Math.PI/6));
    c.stroke();
    const absI = Math.abs(I);
    const txt = absI < 0.001 ? absI.toExponential(1) + 'A'
              : (absI < 1 ? absI.toFixed(3) + 'A' : absI.toFixed(2) + 'A');
    c.font = 'bold 10px ui-monospace, monospace';
    c.textAlign = 'center'; c.textBaseline = 'middle';
    const nx = -wuy, ny = wux;
    c.fillText(txt, wx + nx * 14, wy + ny * 14);
    c.restore();
  }
}

function drawCircuit(c, o, U) {
  const data = ensureData(o);
  const t = getTransform(o);
  const b = t.b;
  const isLight = document.body.classList.contains('pb-light');

  const STD_LIGHT = '#e6edf7';
  const STD_DARK  = '#1a1a1a';
  let lineColor = o.color || STD_LIGHT;
  if (lineColor === STD_LIGHT || lineColor === STD_DARK) {
    lineColor = isLight ? STD_DARK : STD_LIGHT;
  }

  const isMultiSel = (kind, id) => {
    if (!data.multiSelected) return false;
    return data.multiSelected.some(s => s.kind === kind && s.id === id);
  };

  c.save();
  c.translate(t.ox, t.oy);
  c.scale(t.s, t.s);
  c.beginPath(); c.rect(0, 0, t.BW, t.BH); c.clip();

  const gridColor = isLight ? 'rgba(60,80,120,0.10)' : 'rgba(180,200,230,0.10)';
  c.strokeStyle = gridColor;
  c.lineWidth = 1 / t.s;
  for (let x = 0; x <= t.BW; x += 20) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, t.BH); c.stroke(); }
  for (let y = 0; y <= t.BH; y += 20) { c.beginPath(); c.moveTo(0, y); c.lineTo(t.BW, y); c.stroke(); }

  if (data.showSolution) {
    const key = getSolutionKey(data);
    if (!data._solution || data._solutionKey !== key) {
      data._solution = __solveCircuit(data);
      data._solutionKey = key;
    }
  } else {
    data._solution = null;
  }
  const sol = data._solution;

  for (const comp of data.comps) {
    if (comp.type === 'junction') continue;
    const sel1 = data.selected && data.selected.kind === 'comp' && data.selected.id === comp.id;
    const sel2 = isMultiSel('comp', comp.id);
    if (sel1 || sel2) {
      c.save();
      c.strokeStyle = sel2 ? '#fbbf24' : 'rgba(56, 189, 248, 0.85)';
      c.lineWidth = 2 / t.s;
      c.setLineDash([5 / t.s, 3 / t.s]);
      c.strokeRect(comp.x - 52, comp.y - 32, 104, 64);
      c.restore();
    }
    drawCompData(c, comp, lineColor);
  }

  for (const wire of data.wires) {
    const pts = getWirePath(data, wire);
    if (!pts) continue;
    const isSel1 = data.selected && data.selected.kind === 'wire' && data.selected.id === wire.id;
    const isSel2 = isMultiSel('wire', wire.id);
    const isSel = isSel1 || isSel2;
    c.strokeStyle = isSel ? (isSel2 ? '#fbbf24' : '#22d3ee') : lineColor;
    c.lineWidth = isSel ? 3.2 : 2.4;
    c.lineCap = 'round'; c.lineJoin = 'round';
    c.beginPath(); c.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) c.lineTo(pts[i].x, pts[i].y);
    c.stroke();
  }

  for (const comp of data.comps) {
    if (!comp.label || comp.type === 'junction') continue;
    c.save();
    c.fillStyle = lineColor;
    c.font = '600 12px system-ui, sans-serif';
    c.textAlign = 'center'; c.textBaseline = 'bottom';
    c.fillText(comp.label, comp.x, comp.y - 32);
    c.restore();
  }

  if (sol && sol.ok) {
    for (const comp of data.comps) {
      if (comp.type === 'junction') continue;
      const elem = sol.elemInfo[comp.id];
      if (!elem) continue;
      if (elem.segments) drawCompositeCurrents(c, comp, elem);
      else if (elem.I !== null && elem.I !== undefined) drawCurrentLabel(c, comp, elem.I);
    }
  }

  if (data.showNodes) {
    for (const j of data.comps) {
      if (j.type !== 'junction') continue;
      c.save();
      c.beginPath(); c.arc(j.x, j.y, 5, 0, Math.PI * 2);
      c.strokeStyle = lineColor; c.lineWidth = 1.5; c.stroke();
      c.beginPath(); c.arc(j.x, j.y, 1.8, 0, Math.PI * 2);
      c.fillStyle = lineColor; c.fill();
      if (j.props && j.props.label) {
        c.fillStyle = lineColor;
        c.font = '600 11px ui-monospace, monospace';
        c.textAlign = 'center'; c.textBaseline = 'bottom';
        c.fillText(j.props.label, j.x, j.y - 8);
      }
      c.restore();
    }
  }

  if (data.selected && data.selected.kind === 'comp') {
    const selComp = data.comps.find(c => c.id === data.selected.id);
    if (selComp && selComp.type === 'junction') {
      const hx = selComp.x + 30, hy = selComp.y - 30;
      c.save();
      c.strokeStyle = 'rgba(147,197,253,0.8)';
      c.lineWidth = 1 / t.s;
      c.setLineDash([3 / t.s, 3 / t.s]);
      c.beginPath(); c.moveTo(selComp.x + 6, selComp.y - 6); c.lineTo(hx - 8, hy + 8); c.stroke();
      c.setLineDash([]);
      c.fillStyle = '#2563eb'; c.strokeStyle = '#fff'; c.lineWidth = 1.5 / t.s;
      c.beginPath(); c.arc(hx, hy, 9, 0, Math.PI*2); c.fill(); c.stroke();
      c.strokeStyle = '#fff'; c.lineWidth = 2 / t.s;
      c.beginPath();
      c.moveTo(hx - 4, hy); c.lineTo(hx + 4, hy);
      c.moveTo(hx, hy - 4); c.lineTo(hx, hy + 4);
      c.stroke();
      c.restore();
    }
  }

  if (sol && sol.ok && data.showPotential && sol.portPotentials) {
    const drawn = new Set();
    for (const comp of data.comps) {
      const def = TYPES[comp.type];
      if (!def) continue;
      const rad = (comp.rot || 0) * Math.PI / 180;
      const cos = Math.cos(rad), sin = Math.sin(rad);
      for (const port of def.ports) {
        const V = sol.portPotentials[comp.id + '::' + port.id];
        if (V === undefined) continue;
        const wx = comp.x + port.cx * cos - port.cy * sin;
        const wy = comp.y + port.cx * sin + port.cy * cos;
        const key = Math.round(wx) + ',' + Math.round(wy);
        if (drawn.has(key)) continue;
        drawn.add(key);
        let offX, offY;
        if (port.cx < 0) { offX = -16; offY = -10; }
        else if (port.cx > 0) { offX = 16; offY = -10; }
        else if (port.cy < 0) { offX = 14; offY = -14; }
        else { offX = 12; offY = 12; }
        const tx = wx + offX * cos - offY * sin;
        const ty = wy + offX * sin + offY * cos;
        c.save();
        c.font = 'bold 10px ui-monospace, monospace';
        c.textAlign = 'center'; c.textBaseline = 'middle';
        const txt = V.toFixed(2) + 'V';
        const tw = c.measureText(txt).width;
        c.fillStyle = isLight ? 'rgba(255,255,255,0.85)' : 'rgba(10,18,32,0.85)';
        c.beginPath();
        if (c.roundRect) c.roundRect(tx - tw/2 - 3, ty - 7, tw + 6, 14, 4);
        else c.rect(tx - tw/2 - 3, ty - 7, tw + 6, 14);
        c.fill();
        c.fillStyle = isLight ? '#7c3aed' : '#c084fc';
        c.fillText(txt, tx, ty);
        c.restore();
      }
    }
  }

  if (data.wireDraft) {
    c.save();
    c.strokeStyle = '#2563eb'; c.lineWidth = 2.4;
    c.setLineDash([7, 5]);
    c.beginPath();
    c.moveTo(data.wireDraft.start.x, data.wireDraft.start.y);
    c.lineTo(data.wireDraft.cur.x, data.wireDraft.cur.y);
    c.stroke(); c.restore();
  }

  if (data._marquee) {
    const m = data._marquee;
    const x1 = Math.min(m.x1, m.x2), x2 = Math.max(m.x1, m.x2);
    const y1 = Math.min(m.y1, m.y2), y2 = Math.max(m.y1, m.y2);
    c.save();
    c.fillStyle = 'rgba(56,189,248,0.10)';
    c.strokeStyle = 'rgba(56,189,248,0.85)';
    c.lineWidth = 1.5 / t.s;
    c.setLineDash([5 / t.s, 4 / t.s]);
    c.beginPath();
    c.rect(x1, y1, x2 - x1, y2 - y1);
    c.fill();
    c.stroke();
    c.restore();
  }

  c.restore();

  if (!data.comps.length && !data.editing) {
    c.save();
    c.fillStyle = lineColor;
    c.font = '14px system-ui, sans-serif';
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText('点击进入电路编辑', (b.x1 + b.x2) / 2, (b.y1 + b.y2) / 2);
    c.restore();
  }
}

/* ============================ 端口 / 导线 ============================ */
function portAbs(comp, port) {
  const rad = (comp.rot || 0) * Math.PI / 180;
  const cos = Math.cos(rad), sin = Math.sin(rad);
  return { x: comp.x + port.cx * cos - port.cy * sin, y: comp.y + port.cx * sin + port.cy * cos };
}
function portDirAbs(comp, port) {
  if (!port.dir) return null;
  const rad = (comp.rot || 0) * Math.PI / 180;
  const cos = Math.cos(rad), sin = Math.sin(rad);
  return { x: port.dir[0] * cos - port.dir[1] * sin, y: port.dir[0] * sin + port.dir[1] * cos };
}
function simplifyPath(pts) {
  const out = [];
  for (const p of pts) {
    const last = out[out.length - 1];
    if (last && Math.abs(last.x - p.x) < 0.01 && Math.abs(last.y - p.y) < 0.01) continue;
    out.push(p);
  }
  if (out.length < 3) return out;
  const res = [out[0]];
  for (let i = 1; i < out.length - 1; i++) {
    const a = res[res.length - 1], bb = out[i], c = out[i + 1];
    const cross = (bb.x - a.x) * (c.y - a.y) - (bb.y - a.y) * (c.x - a.x);
    if (Math.abs(cross) > 0.01) res.push(bb);
  }
  res.push(out[out.length - 1]);
  return res;
}
function routeWire(p1, d1, p2, d2) {
  if (Math.abs(p1.x - p2.x) < 0.5 || Math.abs(p1.y - p2.y) < 0.5) return simplifyPath([p1, p2]);
  const h1 = d1 ? Math.abs(d1.x) > 0.5 : null;
  const h2 = d2 ? Math.abs(d2.x) > 0.5 : null;
  const s1 = d1 ? { x: p1.x + d1.x * STUB, y: p1.y + d1.y * STUB } : p1;
  const s2 = d2 ? { x: p2.x + d2.x * STUB, y: p2.y + d2.y * STUB } : p2;
  const pts = [p1];
  if (d1) pts.push(s1);
  if (h1 === null && h2 === null) pts.push({ x: s2.x, y: s1.y });
  else if (h1 === null) { if (h2) pts.push({ x: s1.x, y: s2.y }); else pts.push({ x: s2.x, y: s1.y }); }
  else if (h2 === null) { if (h1) pts.push({ x: s2.x, y: s1.y }); else pts.push({ x: s1.x, y: s2.y }); }
  else if (h1 && h2) {
    let mx;
    if (d1.x * d2.x < 0) mx = (s1.x + s2.x) / 2;
    else if (d1.x > 0) mx = Math.max(s1.x, s2.x);
    else mx = Math.min(s1.x, s2.x);
    pts.push({ x: mx, y: s1.y }, { x: mx, y: s2.y });
  } else if (!h1 && !h2) {
    let my;
    if (d1.y * d2.y < 0) my = (s1.y + s2.y) / 2;
    else if (d1.y > 0) my = Math.max(s1.y, s2.y);
    else my = Math.min(s1.y, s2.y);
    pts.push({ x: s1.x, y: my }, { x: s2.x, y: my });
  } else if (h1) pts.push({ x: s2.x, y: s1.y });
  else pts.push({ x: s1.x, y: s2.y });
  if (d2) pts.push(s2);
  pts.push(p2);
  return simplifyPath(pts);
}
function getWirePath(data, wire) {
  if (!wire.a || !wire.a.elem || !wire.b || !wire.b.elem) return null;
  const a = data.comps.find(c => c.id === wire.a.elem);
  const b = data.comps.find(c => c.id === wire.b.elem);
  if (!a || !b) return null;
  const da = TYPES[a.type], db = TYPES[b.type];
  if (!da || !db) return null;
  const pa = da.ports.find(p => p.id === wire.a.port);
  const pb = db.ports.find(p => p.id === wire.b.port);
  if (!pa || !pb) return null;
  return routeWire(portAbs(a, pa), portDirAbs(a, pa), portAbs(b, pb), portDirAbs(b, pb));
}

/* ============================ 命中 ============================ */
function findPortAt(data, pt, r) {
  for (const comp of data.comps) {
    const def = TYPES[comp.type];
    if (!def) continue;
    for (const p of def.ports) {
      const abs = portAbs(comp, p);
      if (Math.hypot(abs.x - pt.x, abs.y - pt.y) < r) return { comp, port: p, pos: abs };
    }
  }
  return null;
}
function findNearestPort(data, pt, exclude, r) {
  let best = null, bestD = r;
  for (const comp of data.comps) {
    const def = TYPES[comp.type];
    if (!def) continue;
    for (const p of def.ports) {
      if (exclude && comp.id === exclude.elem && p.id === exclude.port) continue;
      const abs = portAbs(comp, p);
      const d = Math.hypot(abs.x - pt.x, abs.y - pt.y);
      if (d < bestD) { bestD = d; best = { comp, port: p, pos: abs, elemId: comp.id, portId: p.id }; }
    }
  }
  return best;
}
function hitComp(data, pt) {
  for (let i = data.comps.length - 1; i >= 0; i--) {
    const comp = data.comps[i];
    const rad = -(comp.rot || 0) * Math.PI / 180;
    const cos = Math.cos(rad), sin = Math.sin(rad);
    const dx = pt.x - comp.x, dy = pt.y - comp.y;
    const lx = dx * cos - dy * sin, ly = dx * sin + dy * cos;
    const def = TYPES[comp.type];
    if (!def) continue;
    const shapes = def.dynamic ? def.dynamic(comp) : def.shapes;
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const s of shapes) {
      if (s.x1 !== undefined) { x0 = Math.min(x0, s.x1, s.x2); y0 = Math.min(y0, s.y1, s.y2); x1 = Math.max(x1, s.x1, s.x2); y1 = Math.max(y1, s.y1, s.y2); }
      if (s.r !== undefined) { x0 = Math.min(x0, (s.cx||0)-s.r); y0 = Math.min(y0, (s.cy||0)-s.r); x1 = Math.max(x1, (s.cx||0)+s.r); y1 = Math.max(y1, (s.cy||0)+s.r); }
      if (s.rw !== undefined) { x0 = Math.min(x0, (s.cx||0)-s.rw/2); y0 = Math.min(y0, (s.cy||0)-s.rh/2); x1 = Math.max(x1, (s.cx||0)+s.rw/2); y1 = Math.max(y1, (s.cy||0)+s.rh/2); }
      if (s.kind === 'path' && s.pts) for (const p of s.pts) { x0 = Math.min(x0, p.x); y0 = Math.min(y0, p.y); x1 = Math.max(x1, p.x); y1 = Math.max(y1, p.y); }
      if (s.kind === 'text') continue;
    }
    if (!isFinite(x0)) { x0 = -6; y0 = -6; x1 = 6; y1 = 6; }
    if (lx >= x0 && lx <= x1 && ly >= y0 && ly <= y1) return comp;
  }
  return null;
}
function hitWire(data, pt, r) {
  for (let i = data.wires.length - 1; i >= 0; i--) {
    const wire = data.wires[i];
    const pts = getWirePath(data, wire);
    if (!pts) continue;
    for (let k = 1; k < pts.length; k++) {
      const a = pts[k-1], bb = pts[k];
      const dx = bb.x - a.x, dy = bb.y - a.y;
      const l2 = dx*dx + dy*dy;
      if (l2 === 0) continue;
      let t = ((pt.x - a.x)*dx + (pt.y - a.y)*dy) / l2;
      t = Math.max(0, Math.min(1, t));
      const px = a.x + t*dx, py = a.y + t*dy;
      if (Math.hypot(pt.x - px, pt.y - py) < r) return wire;
    }
  }
  return null;
}
function isHandleHit(junctionComp, ptInner) {
  if (!junctionComp || junctionComp.type !== 'junction') return false;
  const hx = junctionComp.x + 30, hy = junctionComp.y - 30;
  return Math.hypot(ptInner.x - hx, ptInner.y - hy) < 12;
}

/* ============================ 交互 ============================ */
function circuitClick(o, e) {
  const data = ensureData(o);
  if (!data.editing) {
    data.editing = true;
    openToolbar(o);
    e.requestRedraw();
    return true;
  }
  const inner = worldToInner(o, e.worldPt);
  data._mouseDownInner = inner;
  data._marquee = null;
  const r = hitRadius(o);

  if (data.selected && data.selected.kind === 'comp') {
    const selComp = data.comps.find(c => c.id === data.selected.id);
    if (selComp && selComp.type === 'junction' && isHandleHit(selComp, inner)) {
      data.dragState = { kind: 'move-junction', elem: selComp, start: inner, orig: { x: selComp.x, y: selComp.y } };
      data.multiSelected = [];
      e.requestRedraw();
      return true;
    }
  }

  const portHit = findPortAt(data, inner, r);
  if (portHit) {
    data.selected = { kind: 'comp', id: portHit.comp.id };
    data.multiSelected = [];
    __pendingPortClick = { from: { elem: portHit.comp.id, port: portHit.port.id }, start: inner };
    refreshPropPanel(o);
    e.requestRedraw();
    return true;
  }
  const compHit = hitComp(data, inner);
  if (compHit) {
    data.selected = { kind: 'comp', id: compHit.id };
    data.multiSelected = [];
    __pendingPortClick = null;
    data.dragState = { kind: 'comp', elem: compHit, start: inner, orig: { x: compHit.x, y: compHit.y } };
    refreshPropPanel(o);
    e.requestRedraw();
    return true;
  }
  const wireHit = hitWire(data, inner, r);
  if (wireHit) {
    data.selected = { kind: 'wire', id: wireHit.id };
    data.multiSelected = [];
    __pendingPortClick = null;
    refreshPropPanel(o);
    e.requestRedraw();
    return true;
  }

  data.selected = null;
  data.multiSelected = [];
  __pendingPortClick = null;
  refreshPropPanel(o);
  e.requestRedraw();
  return true;
}

function circuitDrag(o, e) {
  const data = ensureData(o);
  if (!data.editing) {
    if (!o._circuitDragStart) {
      o._circuitDragStart = { x1: o.x1, y1: o.y1, x2: o.x2, y2: o.y2, startPt: e.startPt };
    }
    const dx = e.worldPt.x - o._circuitDragStart.startPt.x;
    const dy = e.worldPt.y - o._circuitDragStart.startPt.y;
    o.x1 = o._circuitDragStart.x1 + dx;
    o.y1 = o._circuitDragStart.y1 + dy;
    o.x2 = o._circuitDragStart.x2 + dx;
    o.y2 = o._circuitDragStart.y2 + dy;
    e.requestRedraw();
    return true;
  }
  const inner = worldToInner(o, e.worldPt);

  if (data.dragState && data.dragState.kind === 'move-junction') {
    const d = data.dragState;
    d.elem.x = Math.round((d.orig.x + inner.x - d.start.x) / SNAP) * SNAP;
    d.elem.y = Math.round((d.orig.y + inner.y - d.start.y) / SNAP) * SNAP;
    e.requestRedraw();
    return true;
  }
  if (data.dragState && data.dragState.kind === 'comp') {
    const d = data.dragState;
    d.elem.x = Math.round((d.orig.x + inner.x - d.start.x) / SNAP) * SNAP;
    d.elem.y = Math.round((d.orig.y + inner.y - d.start.y) / SNAP) * SNAP;
    e.requestRedraw();
    return true;
  }
  if (__pendingPortClick && !data.wireDraft) {
    const t = getTransform(o);
    const dx = (inner.x - __pendingPortClick.start.x) * t.s;
    const dy = (inner.y - __pendingPortClick.start.y) * t.s;
    if (Math.hypot(dx, dy) > 6) {
      data.wireDraft = { from: __pendingPortClick.from, start: __pendingPortClick.start, cur: inner };
      __pendingPortClick = null;
    } else return true;
  }
  if (data.wireDraft) {
    const r = hitRadius(o);
    const snap = findNearestPort(data, inner, data.wireDraft.from, r * 2);
    data.wireDraft.cur = snap ? snap.pos : inner;
    e.requestRedraw();
    return true;
  }
  if (data._mouseDownInner) {
    const start = data._mouseDownInner;
    const dist = Math.hypot(inner.x - start.x, inner.y - start.y);
    const threshold = 5 / getTransform(o).s;
    if (data._marquee || dist > threshold) {
      data._marquee = { x1: start.x, y1: start.y, x2: inner.x, y2: inner.y };
      e.requestRedraw();
      return true;
    }
  }
  return false;
}

function circuitDragEnd(o, e) {
  const data = ensureData(o);
  if (!data.editing) { o._circuitDragStart = null; return true; }
  if (data.dragState && data.dragState.kind === 'move-junction') {
    data.dragState = null; e.requestRedraw(); return true;
  }
  if (data.dragState && data.dragState.kind === 'comp') {
    data.dragState = null; e.requestRedraw(); return true;
  }
  if (__pendingPortClick) { __pendingPortClick = null; return true; }
  if (data.wireDraft) {
    const inner = data.wireDraft.cur;
    const r = hitRadius(o);
    const snap = findNearestPort(data, inner, data.wireDraft.from, r * 2);
    if (snap) {
      const dup = data.wires.some(w =>
        (w.a.elem === data.wireDraft.from.elem && w.a.port === data.wireDraft.from.port && w.b.elem === snap.elemId && w.b.port === snap.portId) ||
        (w.b.elem === data.wireDraft.from.elem && w.b.port === data.wireDraft.from.port && w.a.elem === snap.elemId && w.a.port === snap.portId));
      if (!dup) data.wires.push({ id: newId(data),
        a: { elem: data.wireDraft.from.elem, port: data.wireDraft.from.port },
        b: { elem: snap.elemId, port: snap.portId } });
    }
    data.wireDraft = null;
    e.requestRedraw();
    return true;
  }
  if (data._marquee) {
    const m = data._marquee;
    const mx1 = Math.min(m.x1, m.x2), mx2 = Math.max(m.x1, m.x2);
    const my1 = Math.min(m.y1, m.y2), my2 = Math.max(m.y1, m.y2);
    const selected = [];
    for (const comp of data.comps) {
      if (comp.type === 'junction') {
        if (comp.x >= mx1 && comp.x <= mx2 && comp.y >= my1 && comp.y <= my2) {
          selected.push({ kind: 'comp', id: comp.id });
        }
        continue;
      }
      const def = TYPES[comp.type];
      if (!def) continue;
      const rad = (comp.rot || 0) * Math.PI / 180;
      const cos = Math.cos(rad), sin = Math.sin(rad);
      let inside = false;
      for (const port of def.ports) {
        const wx = comp.x + port.cx * cos - port.cy * sin;
        const wy = comp.y + port.cx * sin + port.cy * cos;
        if (wx >= mx1 && wx <= mx2 && wy >= my1 && wy <= my2) { inside = true; break; }
      }
      if (!inside && comp.x >= mx1 && comp.x <= mx2 && comp.y >= my1 && comp.y <= my2) inside = true;
      if (inside) selected.push({ kind: 'comp', id: comp.id });
    }
    for (const wire of data.wires) {
      const pts = getWirePath(data, wire);
      if (!pts) continue;
      let inside = false;
      for (const p of pts) {
        if (p.x >= mx1 && p.x <= mx2 && p.y >= my1 && p.y <= my2) { inside = true; break; }
      }
      if (inside) selected.push({ kind: 'wire', id: wire.id });
    }
    data.multiSelected = selected;
    data._marquee = null;
    data._mouseDownInner = null;
    refreshPropPanel(o);
    e.requestRedraw();
    return true;
  }
  data._mouseDownInner = null;
  e.requestRedraw();
  return true;
}

/* ============================ 刷新 / Toast ============================ */
function redraw() {
  if (typeof window.__pbRedraw === 'function') window.__pbRedraw();
}
function showToast(msg) {
  if (typeof window.toast === 'function') { window.toast(msg); return; }
  let el = document.getElementById('__circuit_toast');
  if (!el) {
    el = document.createElement('div');
    el.id = '__circuit_toast';
    el.style.cssText = 'position:fixed; left:50%; top:30px; transform:translateX(-50%); background:rgba(16,26,44,.95); color:#e6edf7; padding:10px 22px; border-radius:20px; font-size:13.5px; z-index:2000; opacity:0; transition:opacity .25s; pointer-events:none;';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.style.opacity = '1';
  clearTimeout(el._t);
  el._t = setTimeout(() => { el.style.opacity = '0'; }, 2400);
}

/* ============================ 属性面板 ============================ */
function refreshPropPanel(o) {
  const data = ensureData(o);
  if (!__propPanelEl) return;
  const body = __propPanelEl.querySelector('.pb-cb-body');
  if (!body) return;
  body.innerHTML = '';

  if (data.multiSelected && data.multiSelected.length > 0) {
    const compCount = data.multiSelected.filter(s => s.kind === 'comp').length;
    const wireCount = data.multiSelected.filter(s => s.kind === 'wire').length;
    const tip = document.createElement('div');
    tip.style.cssText = 'padding:10px 4px;color:#fbbf24;font-size:12px;text-align:center;line-height:1.65;';
    tip.innerHTML = '已框选 <b>' + compCount + '</b> 个元件 + <b>' + wireCount + '</b> 条导线<br>' +
                    '<span style="font-size:11px;color:#8fa3c0;">点「删除选中」或按 Delete 删除</span>';
    body.appendChild(tip);
    return;
  }

  if (!data.selected || data.selected.kind !== 'comp') {
    const tip = document.createElement('div');
    tip.style.cssText = 'padding:10px 4px;color:#8fa3c0;font-size:12px;text-align:center;line-height:1.6;';
    tip.innerHTML = '点击元件进行编辑<br><span style="font-size:11px;color:#6b7c96;">或在空白处拖动框选</span>';
    body.appendChild(tip);
    return;
  }
  const comp = data.comps.find(c => c.id === data.selected.id);
  if (!comp) return;
  const def = TYPES[comp.type];
  if (!def) return;

  const title = document.createElement('div');
  title.style.cssText = 'font-size:12.5px;font-weight:600;color:#7dd3fc;margin-bottom:8px;';
  title.textContent = (def.label || comp.type) + (comp.label ? ' · ' + comp.label : '');
  body.appendChild(title);

  const labelInput = document.createElement('input');
  labelInput.type = 'text';
  labelInput.className = 'gm-input';
  labelInput.placeholder = '标号（如 R1）';
  labelInput.value = comp.label || '';
  labelInput.style.cssText = 'width:100%;height:30px;padding:0 8px;font-size:12px;margin-bottom:6px;';
  labelInput.addEventListener('input', () => { comp.label = labelInput.value; redraw(); });
  body.appendChild(labelInput);

  if (def.propFields) {
    for (const f of def.propFields) {
      if (!comp.props) comp.props = {};
      if (comp.props[f.key] === undefined && f.min !== undefined) comp.props[f.key] = f.min;

      const wrap = document.createElement('div');
      wrap.style.cssText = 'display:flex;align-items:center;gap:6px;margin-bottom:5px;';
      const label = document.createElement('span');
      label.textContent = f.label;
      label.style.cssText = 'font-size:11.5px;color:#b8c7de;flex:0 0 64px;';

      let input;
      if (f.type === 'toggle') {
        input = document.createElement('input');
        input.type = 'checkbox';
        input.checked = !!comp.props[f.key];
        input.addEventListener('change', () => { comp.props[f.key] = input.checked; redraw(); });
      } else if (f.type === 'text') {
        input = document.createElement('input');
        input.type = 'text';
        input.value = comp.props[f.key] == null ? '' : comp.props[f.key];
        input.addEventListener('input', () => { comp.props[f.key] = input.value; redraw(); });
        input.style.cssText = 'flex:1;height:26px;padding:0 6px;background:rgba(56,189,248,.08);border:1px solid rgba(56,189,248,.24);border-radius:6px;color:#e6edf7;font-size:12px;font-family:inherit;outline:none;';
      } else {
        input = document.createElement('input');
        input.type = 'number';
        if (f.min != null) input.min = f.min;
        if (f.max != null) input.max = f.max;
        if (f.step != null) input.step = f.step;
        input.value = comp.props[f.key];
        input.addEventListener('input', () => {
          const v = parseFloat(input.value);
          if (isFinite(v)) { comp.props[f.key] = v; redraw(); }
        });
        input.style.cssText = 'flex:1;height:26px;padding:0 6px;background:rgba(56,189,248,.08);border:1px solid rgba(56,189,248,.24);border-radius:6px;color:#e6edf7;font-size:12px;font-family:ui-monospace,monospace;outline:none;';
      }
      wrap.appendChild(label);
      wrap.appendChild(input);
      if (f.unit) {
        const u = document.createElement('span');
        u.textContent = f.unit;
        u.style.cssText = 'font-size:11px;color:#6b7c96;';
        wrap.appendChild(u);
      }
      body.appendChild(wrap);
    }
  }

  const delBtn = document.createElement('button');
  delBtn.textContent = '删除此元件';
  delBtn.style.cssText = 'width:100%;height:28px;margin-top:8px;border-radius:7px;border:1px solid rgba(248,113,113,.35);background:rgba(248,113,113,.1);color:#fca5a5;font-family:inherit;font-size:11.5px;cursor:pointer;';
  delBtn.addEventListener('click', () => {
    data.comps = data.comps.filter(c => c.id !== comp.id);
    data.wires = data.wires.filter(w => w.a.elem !== comp.id && w.b.elem !== comp.id);
    data.selected = null;
    refreshPropPanel(o);
    redraw();
  });
  body.appendChild(delBtn);
}

/* ============================ 计算面板 ============================ */
function refreshCalcPanel(o) {
  const data = ensureData(o);
  if (!__calcPanelEl) return;
  const body = __calcPanelEl.querySelector('.pb-cb-body');
  if (!body) return;
  body.innerHTML = '';

  const sol = data._solution;
  if (!data.showSolution) {
    body.innerHTML = '<div style="padding:6px 4px;color:#8fa3c0;font-size:12px;text-align:center;">勾选上方"计算"来求解电路</div>';
    return;
  }
  if (!sol || !sol.ok) {
    body.innerHTML = '<div style="padding:6px 4px;color:#fca5a5;font-size:12px;text-align:center;">' +
      ((sol && sol.error) || '等待计算…') + '</div>';
    return;
  }

  const rows = [];
  for (const j of data.comps) {
    if (j.type !== 'junction') continue;
    const V = sol.junctions[j.id];
    if (V === undefined) continue;
    const label = (j.props && j.props.label) || j.id;
    rows.push({ k: '节点 ' + label, v: V.toFixed(3) + ' V', c: '#c084fc' });
  }
  for (const comp of data.comps) {
    if (comp.type === 'junction') continue;
    const elem = sol.elemInfo[comp.id];
    if (!elem) continue;
    if (elem.segments) {
      const label = comp.label || (TYPES[comp.type] && TYPES[comp.type].label) || comp.type;
      for (const seg of elem.segments) {
        const absI = Math.abs(seg.I);
        if (absI < 1e-9) continue;
        const dir = seg.I > 0 ? '→' : '←';
        rows.push({ k: label + '(' + seg.fromPort + '→' + seg.toPort + ')',
                    v: dir + ' ' + absI.toFixed(3) + ' A', c: '#fbbf24' });
      }
    } else if (elem.I !== null && elem.I !== undefined) {
      const absI = Math.abs(elem.I);
      if (absI < 1e-9) continue;
      const dir = elem.I > 0 ? '→' : '←';
      const label = comp.label || (TYPES[comp.type] && TYPES[comp.type].label) || comp.type;
      rows.push({ k: label, v: dir + ' ' + absI.toFixed(3) + ' A', c: '#fbbf24' });
    }
  }

  if (!rows.length) {
    body.innerHTML = '<div style="padding:6px 4px;color:#8fa3c0;font-size:12px;text-align:center;">无数据</div>';
    return;
  }
  for (const r of rows) {
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;justify-content:space-between;gap:8px;padding:3px 4px;font-size:11.5px;border-bottom:1px solid rgba(56,189,248,.1);';
    row.innerHTML = '<span style="color:#b8c7de;">' + r.k + '</span>' +
                    '<span style="color:' + r.c + ';font-family:ui-monospace,monospace;font-weight:600;">' + r.v + '</span>';
    body.appendChild(row);
  }
}

/* ============================ 工具栏 ============================ */
let __toolbarEl = null;
let __toolbarBoard = null;

function closeToolbar() {
  if (__propPanelEl) { __propPanelEl.remove(); __propPanelEl = null; }
  if (__calcPanelEl) { __calcPanelEl.remove(); __calcPanelEl = null; }
  if (__toolbarEl) { __toolbarEl.remove(); __toolbarEl = null; }
  if (__toolbarBoard) {
    const d = ensureData(__toolbarBoard);
    d.editing = false; d.selected = null; d.wireDraft = null; d.dragState = null;
    d.multiSelected = []; d._marquee = null;
    __pendingPortClick = null;
    __toolbarBoard = null;
    redraw();
  }
}

function openToolbar(o) {
  /* ★ v9 修复：先清理所有旧面板，防止累积 */
  if (__propPanelEl) { __propPanelEl.remove(); __propPanelEl = null; }
  if (__calcPanelEl) { __calcPanelEl.remove(); __calcPanelEl = null; }
  if (__toolbarEl) { __toolbarEl.remove(); __toolbarEl = null; }

  if (__toolbarBoard && __toolbarBoard !== o) {
    const d = ensureData(__toolbarBoard); d.editing = false;
  }
  __toolbarBoard = o;
  const data = ensureData(o);
  data.editing = true;

  const el = document.createElement('div');
  el.style.cssText =
    'position:fixed; right:20px; top:90px; z-index:500; width:270px; max-height:calc(100vh - 140px);' +
    'background:linear-gradient(160deg, rgba(16,26,48,.98), rgba(10,18,32,.98));' +
    'border:1px solid rgba(56,189,248,.42); border-radius:14px;' +
    'box-shadow:0 20px 60px rgba(0,0,0,.6), 0 0 30px rgba(56,189,248,.18);' +
    'display:flex; flex-direction:column; overflow:hidden; font-family:inherit;' +
    'backdrop-filter:blur(20px); -webkit-backdrop-filter:blur(20px);';

  const head = document.createElement('div');
  head.style.cssText = 'display:flex; align-items:center; justify-content:space-between; padding:10px 12px; border-bottom:1px solid rgba(56,189,248,.22);';
  head.innerHTML = '<span style="color:#fff; font-size:13px; font-weight:600; letter-spacing:.3px;">⚡ 电路编辑器</span>';
  const closeBtn = document.createElement('button');
  closeBtn.textContent = '✕';
  closeBtn.style.cssText = 'width:24px; height:24px; padding:0; border:none; border-radius:6px; background:rgba(120,180,255,.1); color:#94a3b8; cursor:pointer; font-size:12px;';
  closeBtn.onclick = closeToolbar;
  head.appendChild(closeBtn);
  el.appendChild(head);

  const body = document.createElement('div');
  body.style.cssText = 'flex:1; overflow-y:auto; padding:8px; scrollbar-width:thin;';

  const optsRow = document.createElement('div');
  optsRow.style.cssText = 'display:flex; gap:8px; padding:4px 4px 8px; border-bottom:1px solid rgba(56,189,248,.15); margin-bottom:8px; font-size:11.5px; color:#b8c7de; flex-wrap:wrap;';
  const mkCheck = (label, checked, cb) => {
    const wrap = document.createElement('label');
    wrap.style.cssText = 'display:flex;align-items:center;gap:4px;cursor:pointer;';
    const inp = document.createElement('input');
    inp.type = 'checkbox';
    inp.checked = checked;
    inp.style.cssText = 'accent-color:#22d3ee;';
    inp.addEventListener('change', () => cb(inp.checked));
    wrap.appendChild(inp);
    wrap.appendChild(document.createTextNode(label));
    return wrap;
  };
  optsRow.appendChild(mkCheck('显示节点', data.showNodes, v => { data.showNodes = v; redraw(); }));
  optsRow.appendChild(mkCheck('计算', data.showSolution, v => {
    data.showSolution = v;
    data._solution = null; data._solutionKey = null;
    refreshCalcPanel(o);
    redraw();
  }));
  optsRow.appendChild(mkCheck('显示电势', data.showPotential, v => { data.showPotential = v; redraw(); }));
  body.appendChild(optsRow);

  const section1 = document.createElement('div');
  section1.innerHTML = '<div style="color:#94a3b8; font-size:11px; font-weight:600; letter-spacing:.5px; padding:6px 4px 4px;">器材</div>';
  const grid = document.createElement('div');
  grid.style.cssText = 'display:grid; grid-template-columns:repeat(3, 1fr); gap:5px;';
  ['battery', 'resistor', 'resistorBox', 'lamp', 'ammeter', 'voltmeter', 'motor', 'capacitor', 'switch', 'diode', 'rheostat'].forEach(key => {
    const def = TYPES[key];
    if (!def) return;
    const btn = document.createElement('button');
    btn.textContent = def.label;
    btn.style.cssText = 'padding:8px 4px; border-radius:8px; border:1px solid rgba(56,189,248,.22); background:rgba(56,189,248,.06); color:#7dd3fc; cursor:pointer; font-family:inherit; font-size:11px;';
    btn.addEventListener('mouseenter', () => { btn.style.background = 'rgba(56,189,248,.18)'; btn.style.color = '#fff'; });
    btn.addEventListener('mouseleave', () => { btn.style.background = 'rgba(56,189,248,.06)'; btn.style.color = '#7dd3fc'; });
    btn.addEventListener('click', () => addItem(o, key));
    grid.appendChild(btn);
  });
  section1.appendChild(grid);
  body.appendChild(section1);

  const propBox = document.createElement('div');
  propBox.style.cssText = 'margin-top:10px;padding-top:10px;border-top:1px solid rgba(56,189,248,.15);';
  propBox.innerHTML = '<div style="color:#94a3b8; font-size:11px; font-weight:600; letter-spacing:.5px; padding:0 4px 6px;">属性</div><div class="pb-cb-body"></div>';
  body.appendChild(propBox);

  const footer = document.createElement('div');
  footer.style.cssText = 'padding:8px; border-top:1px solid rgba(56,189,248,.22); display:flex; gap:5px; flex-wrap:wrap;';

  const delBtn = document.createElement('button');
  delBtn.textContent = '删除选中';
  delBtn.style.cssText = 'flex:1; padding:8px 4px; border-radius:8px; border:1px solid rgba(248,113,113,.3); background:rgba(248,113,113,.1); color:#fca5a5; cursor:pointer; font-family:inherit; font-size:11.5px;';
  delBtn.onclick = () => deleteSelected(o);
  footer.appendChild(delBtn);

  const clearBtn = document.createElement('button');
  clearBtn.textContent = '清空';
  clearBtn.style.cssText = 'flex:1; padding:8px 4px; border-radius:8px; border:1px solid rgba(248,113,113,.5); background:rgba(248,113,113,.18); color:#fca5a5; cursor:pointer; font-family:inherit; font-size:11.5px; font-weight:600;';
  clearBtn.onclick = () => {
    if (!confirm('清空整个电路图？此操作不可撤销')) return;
    data.comps = [];
    data.wires = [];
    data.selected = null;
    data.multiSelected = [];
    data._solution = null;
    data._solutionKey = null;
    data.baseW = BASE_W;
    data.baseH = BASE_H;
    refreshPropPanel(o);
    refreshCalcPanel(o);
    redraw();
  };
  footer.appendChild(clearBtn);

  const syntaxBtn = document.createElement('button');
  syntaxBtn.textContent = '⚡ 语法';
  syntaxBtn.style.cssText = 'flex:1; padding:8px 4px; border-radius:8px; border:1px solid rgba(168,85,247,.45); background:rgba(168,85,247,.12); color:#c084fc; cursor:pointer; font-family:inherit; font-size:11.5px; font-weight:600;';
  syntaxBtn.onclick = () => openSyntaxDialog(o);
  footer.appendChild(syntaxBtn);

  const doneBtn = document.createElement('button');
  doneBtn.textContent = '完成';
  doneBtn.style.cssText = 'flex:1; padding:8px 4px; border-radius:8px; border:1px solid rgba(56,189,248,.5); background:linear-gradient(135deg, rgba(56,189,248,.4), rgba(129,140,248,.3)); color:#fff; cursor:pointer; font-family:inherit; font-size:11.5px; font-weight:600;';
  doneBtn.onclick = closeToolbar;
  footer.appendChild(doneBtn);

  el.appendChild(body);
  el.appendChild(footer);
  document.body.appendChild(el);
  __toolbarEl = el;
  __propPanelEl = propBox;

  const calc = document.createElement('div');
  calc.style.cssText =
    'position:fixed; right:20px; top:calc(90px + 60vh + 8px); z-index:501; width:270px; max-height:30vh;' +
    'background:linear-gradient(160deg, rgba(16,26,48,.98), rgba(10,18,32,.98));' +
    'border:1px solid rgba(251,191,36,.42); border-radius:14px; overflow:hidden;' +
    'box-shadow:0 20px 60px rgba(0,0,0,.6); display:flex; flex-direction:column;';
  calc.innerHTML = '<div style="padding:8px 12px; border-bottom:1px solid rgba(251,191,36,.22); color:#fbbf24; font-size:12.5px; font-weight:600;">📊 计算结果</div>' +
    '<div class="pb-cb-body" style="padding:8px; overflow-y:auto; flex:1;"></div>';
  document.body.appendChild(calc);
  __calcPanelEl = calc;

  refreshPropPanel(o);
  refreshCalcPanel(o);
}

function addItem(o, key) {
  const data = ensureData(o);
  const cx = data.baseW / 2, cy = data.baseH / 2;
  const offset = data.comps.length * 12;
  const comp = { id: newId(data), type: key, x: cx + offset, y: cy + offset, rot: 0, props: {} };
  const def = TYPES[key];
  if (def && def.defaultProps) Object.assign(comp.props, def.defaultProps);
  data.comps.push(comp);
  data.selected = { kind: 'comp', id: comp.id };
  data.multiSelected = [];
  refreshPropPanel(o);
  redraw();
}

function deleteSelected(o) {
  const data = ensureData(o);
  const compIds = new Set();
  const wireIds = new Set();
  if (data.multiSelected && data.multiSelected.length) {
    for (const sel of data.multiSelected) {
      if (sel.kind === 'comp') compIds.add(sel.id);
      if (sel.kind === 'wire') wireIds.add(sel.id);
    }
  } else if (data.selected) {
    if (data.selected.kind === 'comp') compIds.add(data.selected.id);
    if (data.selected.kind === 'wire') wireIds.add(data.selected.id);
  }
  if (!compIds.size && !wireIds.size) return;
  data.comps = data.comps.filter(c => !compIds.has(c.id));
  data.wires = data.wires.filter(w => {
    if (wireIds.has(w.id)) return false;
    if (compIds.has(w.a.elem) || compIds.has(w.b.elem)) return false;
    return true;
  });
  data.selected = null;
  data.multiSelected = [];
  refreshPropPanel(o);
  redraw();
}

window.addEventListener('keydown', (e) => {
  if (e.key !== 'Delete' && e.key !== 'Backspace') return;
  if (!__toolbarBoard) return;
  const data = ensureData(__toolbarBoard);
  if (!data.editing) return;
  const hasMulti = data.multiSelected && data.multiSelected.length > 0;
  const hasSingle = data.selected && (data.selected.kind === 'comp' || data.selected.kind === 'wire');
  if (hasMulti || hasSingle) {
    e.preventDefault();
    e.stopPropagation();
    deleteSelected(__toolbarBoard);
  }
}, true);

/* ============================ 自动关闭监听 ============================ */
(function setupAutoClose() {
  setInterval(() => {
    if (!__toolbarBoard) return;
    const getSel = window.PhysBoard && window.PhysBoard.getSelection;
    if (typeof getSel !== 'function') return;
    const sel = getSel();
    if (!sel || !sel.includes(__toolbarBoard)) {
      closeToolbar();
    }
  }, 200);
})();

/* ============================ 语法解析 ============================ */
const FIRST_MAP = {
  E: 'battery', R: 'resistor', A: 'ammeter', V: 'voltmeter',
  L: 'lamp', C: 'capacitor', S: 'switch', M: 'motor', D: 'diode'
};

function parseCompToken(token) {
  let s = token.trim();
  if (!s) return null;
  let reversed = false;
  if (s.startsWith('-')) { reversed = true; s = s.slice(1); }
  const m = s.match(/^([A-Za-z][A-Za-z0-9]*)$/);
  if (!m) return null;
  const label = m[1];
  const type = FIRST_MAP[label[0].toUpperCase()];
  if (!type) return null;
  return { type, label, reversed };
}

function parseSyntax(text) {
  const lines = text.split('\n');
  const edges = [], triComps = [], groups = [], zeroGroups = [], errors = [];

  lines.forEach((line, i) => {
    const s = line.trim();
    if (!s || s.startsWith('#')) return;

    const eqM = s.match(/^\(([^)]+)\)\s*(?:=\s*(-?[\d.]+))?$/);
    if (eqM) {
      const nodes = eqM[1].split(',').map(x => x.trim()).filter(Boolean);
      if (nodes.length < 2) { errors.push('第 ' + (i + 1) + ' 行：等势组至少 2 个节点'); return; }
      groups.push(nodes);
      if (eqM[2] !== undefined) {
        const v = parseFloat(eqM[2]);
        if (isFinite(v) && Math.abs(v) < 1e-9) zeroGroups.push({ nodes: nodes.slice() });
      }
      return;
    }

    const triM = s.match(/^([A-Za-z][A-Za-z0-9]*)\s*:\s*(横向|竖向)\s*(.+)$/);
    if (triM) {
      const nodes = triM[3].split(',').map(x => x.trim()).filter(Boolean);
      if (nodes.length !== 3) { errors.push('第 ' + (i + 1) + ' 行：三端元件需 3 节点'); return; }
      triComps.push({ label: triM[1], dir: triM[2], nodes });
      return;
    }

    const tokens = s.split(',').map(x => x.trim()).filter(Boolean);
    if (tokens.length < 3) { errors.push('第 ' + (i + 1) + ' 行：至少"起点,终点,元件"'); return; }
    const comps = [];
    for (let j = 2; j < tokens.length; j++) {
      const c = parseCompToken(tokens[j]);
      if (!c) { errors.push('第 ' + (i + 1) + ' 行：无法识别 "' + tokens[j] + '"'); return; }
      comps.push(c);
    }
    edges.push({ from: tokens[0], to: tokens[1], comps });
  });

  return { edges, triComps, groups, zeroGroups, errors };
}

function analyzeNodes(parsed) {
  const allNodes = new Set();
  for (const e of parsed.edges) { allNodes.add(e.from); allNodes.add(e.to); }
  for (const t of parsed.triComps) t.nodes.forEach(n => allNodes.add(n));
  for (const g of parsed.groups) g.forEach(n => allNodes.add(n));

  const nodeGroup = {};
  const allGroups = parsed.groups.slice();
  allGroups.forEach((g, gi) => { g.forEach(n => { nodeGroup[n] = gi; }); });

  for (const n of allNodes) {
    if (nodeGroup[n] === undefined) {
      allGroups.push([n]);
      nodeGroup[n] = allGroups.length - 1;
    }
  }

  const layerNodes = {};
  for (const n of allNodes) {
    const layer = n[0].toLowerCase();
    if (!layerNodes[layer]) layerNodes[layer] = [];
    layerNodes[layer].push(n);
  }
  const layerOrder = Object.keys(layerNodes).sort();

  return { allNodes: [...allNodes], nodeGroup, allGroups, layerNodes, layerOrder };
}

function computeLayout(analysis) {
  const W = BASE_W, H = BASE_H;
  const MX = 100, MY = 80;
  const groupCount = analysis.allGroups.length;
  const layerCount = analysis.layerOrder.length;

  const groupX = [];
  for (let i = 0; i < groupCount; i++) {
    if (groupCount === 1) groupX.push(W / 2);
    else groupX.push(MX + (W - 2 * MX) * i / (groupCount - 1));
  }
  const layerY = {};
  for (let i = 0; i < layerCount; i++) {
    if (layerCount === 1) layerY[analysis.layerOrder[i]] = H / 2;
    else layerY[analysis.layerOrder[i]] = MY + (H - 2 * MY) * i / (layerCount - 1);
  }
  const nodePos = {};
  for (const n of analysis.allNodes) {
    const layer = n[0].toLowerCase();
    const gid = analysis.nodeGroup[n];
    nodePos[n] = { x: Math.round(groupX[gid]), y: Math.round(layerY[layer]) };
  }
  return { nodePos };
}

function compactLayout(data) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const comp of data.comps) {
    minX = Math.min(minX, comp.x - 60);
    minY = Math.min(minY, comp.y - 60);
    maxX = Math.max(maxX, comp.x + 60);
    maxY = Math.max(maxY, comp.y + 60);
  }
  if (!isFinite(minX)) { data.baseW = BASE_W; data.baseH = BASE_H; return; }
  const pad = 40;
  minX -= pad; minY -= pad; maxX += pad; maxY += pad;
  for (const comp of data.comps) { comp.x -= minX; comp.y -= minY; }
  data.baseW = Math.max(200, maxX - minX);
  data.baseH = Math.max(150, maxY - minY);
}

function generateFromSyntax(boardObj, text) {
  const parsed = parseSyntax(text);
  if (parsed.errors.length) throw new Error(parsed.errors.join('\n'));
  if (!parsed.edges.length && !parsed.triComps.length) throw new Error('没有有效元件');

  const analysis = analyzeNodes(parsed);
  const { nodePos } = computeLayout(analysis);

  const data = ensureData(boardObj);
  data.comps = []; data.wires = []; data.shapes = [];
  data.selected = null; data.wireDraft = null; data.dragState = null;
  data.multiSelected = []; data._marquee = null;
  data._solution = null; data._solutionKey = null;
  data.baseW = BASE_W; data.baseH = BASE_H;
  data.zeroGroups = (parsed.zeroGroups || []).map(g => ({ nodes: g.nodes.slice() }));
  __pendingPortClick = null;

  let idCounter = 1;
  const nid = () => 'e' + (idCounter++);

  const nodeMap = {};
  for (const n of analysis.allNodes) {
    const pos = nodePos[n];
    const jc = { id: nid(), type: 'junction', x: pos.x, y: pos.y, rot: 0, props: { label: n } };
    data.comps.push(jc);
    nodeMap[n] = jc;
  }

  const COMP_W = 80;
  for (const edge of parsed.edges) {
    const p1 = nodePos[edge.from], p2 = nodePos[edge.to];
    if (!p1 || !p2) continue;
    const isHorizontal = Math.abs(p1.y - p2.y) < 5;
    const isVertical = Math.abs(p1.x - p2.x) < 5 && !isHorizontal;

    if (isHorizontal) {
      let leftN = edge.from, rightN = edge.to;
      let x1 = p1.x, x2 = p2.x;
      if (x1 > x2) { [x1, x2] = [x2, x1]; [leftN, rightN] = [rightN, leftN]; }
      const N = edge.comps.length;
      const gap = (x2 - x1 - N * COMP_W) / (N + 1);
      const compObjs = [];
      for (let i = 0; i < N; i++) {
        const cx = x1 + gap + COMP_W / 2 + i * (COMP_W + gap);
        const c = edge.comps[i];
        const obj = { id: nid(), type: c.type, x: Math.round(cx), y: p1.y, rot: 0, props: {}, label: c.label };
        const def = TYPES[c.type];
        if (def && def.defaultProps) Object.assign(obj.props, def.defaultProps);
        if (c.reversed) obj.props.reversed = true;
        data.comps.push(obj);
        compObjs.push(obj);
      }
      data.wires.push({ id: nid(), a: { elem: nodeMap[leftN].id, port: 'L' }, b: { elem: compObjs[0].id, port: 'L' } });
      for (let i = 0; i < N - 1; i++) {
        data.wires.push({ id: nid(), a: { elem: compObjs[i].id, port: 'R' }, b: { elem: compObjs[i+1].id, port: 'L' } });
      }
      data.wires.push({ id: nid(), a: { elem: compObjs[N-1].id, port: 'R' }, b: { elem: nodeMap[rightN].id, port: 'L' } });
    } else if (isVertical) {
      let topN = edge.from, botN = edge.to;
      let y1 = p1.y, y2 = p2.y;
      if (y1 > y2) { [y1, y2] = [y2, y1]; [topN, botN] = [botN, topN]; }
      const N = edge.comps.length;
      const gap = (y2 - y1 - N * COMP_W) / (N + 1);
      const compObjs = [];
      for (let i = 0; i < N; i++) {
        const cy = y1 + gap + COMP_W / 2 + i * (COMP_W + gap);
        const c = edge.comps[i];
        const obj = { id: nid(), type: c.type, x: p1.x, y: Math.round(cy), rot: 90, props: {}, label: c.label };
        const def = TYPES[c.type];
        if (def && def.defaultProps) Object.assign(obj.props, def.defaultProps);
        if (c.reversed) obj.props.reversed = true;
        data.comps.push(obj);
        compObjs.push(obj);
      }
      data.wires.push({ id: nid(), a: { elem: nodeMap[topN].id, port: 'L' }, b: { elem: compObjs[0].id, port: 'L' } });
      for (let i = 0; i < N - 1; i++) {
        data.wires.push({ id: nid(), a: { elem: compObjs[i].id, port: 'R' }, b: { elem: compObjs[i+1].id, port: 'L' } });
      }
      data.wires.push({ id: nid(), a: { elem: compObjs[N-1].id, port: 'R' }, b: { elem: nodeMap[botN].id, port: 'L' } });
    } else {
      throw new Error('跨层且不同列的二端元件暂不支持：' + edge.from + ' - ' + edge.to);
    }
  }

  for (const tri of parsed.triComps) {
    const [nA, nB, nC] = tri.nodes;
    const pA = nodePos[nA], pB = nodePos[nB], pC = nodePos[nC];
    if (!pA || !pB || !pC) continue;
    if (tri.dir === '横向') {
      const rp = { id: nid(), type: 'rheostat', x: Math.round(pC.x), y: Math.round(pA.y), rot: 0, props: { R: 20, p: 0.5 }, label: tri.label };
      data.comps.push(rp);
      data.wires.push({ id: nid(), a: { elem: rp.id, port: 'A' }, b: { elem: nodeMap[nA].id, port: 'L' } });
      data.wires.push({ id: nid(), a: { elem: rp.id, port: 'B' }, b: { elem: nodeMap[nB].id, port: 'L' } });
      data.wires.push({ id: nid(), a: { elem: rp.id, port: 'C' }, b: { elem: nodeMap[nC].id, port: 'L' } });
    } else {
      const cx = pA.x, cy = (pA.y + pB.y) / 2;
      let rot = 90;
      if (pC.x < cx) rot = 270;
      const rp = { id: nid(), type: 'rheostat', x: Math.round(cx), y: Math.round(cy), rot, props: { R: 20, p: 0.5 }, label: tri.label };
      data.comps.push(rp);
      data.wires.push({ id: nid(), a: { elem: rp.id, port: 'A' }, b: { elem: nodeMap[nA].id, port: 'L' } });
      data.wires.push({ id: nid(), a: { elem: rp.id, port: 'B' }, b: { elem: nodeMap[nB].id, port: 'L' } });
      data.wires.push({ id: nid(), a: { elem: rp.id, port: 'C' }, b: { elem: nodeMap[nC].id, port: 'L' } });
    }
  }

  for (const g of analysis.allGroups) {
    if (g.length < 2) continue;
    const sorted = g.slice().sort((a, b) => nodePos[a].y - nodePos[b].y);
    for (let i = 0; i < sorted.length - 1; i++) {
      data.wires.push({ id: nid(),
        a: { elem: nodeMap[sorted[i]].id, port: 'L' },
        b: { elem: nodeMap[sorted[i+1]].id, port: 'L' } });
    }
  }

  data.nextId = Math.max(data.nextId, idCounter);
  compactLayout(data);
  data.editing = true;
  openToolbar(boardObj);
  redraw();
  showToast('已根据分层语法生成电路图');
}

/* ============================================================
 * 语法对话框（含常用电路图 · Pointer 拖拽排序）
 * ============================================================ */
function openSyntaxDialog(o) {
  const old = document.getElementById('__circuitSyntaxDlg');
  if (old) old.remove();

  const dlg = document.createElement('div');
  dlg.id = '__circuitSyntaxDlg';
  dlg.style.cssText = 'position:fixed; inset:0; z-index:1000; background:rgba(4,10,22,.72); display:flex; align-items:center; justify-content:center; padding:20px; backdrop-filter:blur(6px); -webkit-backdrop-filter:blur(6px);';

  /* ===== 注入样式 ===== */
  const styleEl = document.createElement('style');
  styleEl.textContent = `
    .__csp-wrap {
      position: relative;
      display: inline-block;
      transition: transform .12s, opacity .12s, filter .12s;
      user-select: none;
      -webkit-user-select: none;
      touch-action: none;
      cursor: grab;
    }
    .__csp-wrap.__csp-dragging {
      opacity: .35;
      transform: scale(.94);
      filter: grayscale(.5);
      cursor: grabbing;
      outline: 1px dashed rgba(34,211,238,.5);
      outline-offset: 2px;
    }
    .__csp-wrap.__csp-drop-left::after,
    .__csp-wrap.__csp-drop-right::after {
      content: '';
      position: absolute;
      top: -4px;
      bottom: -4px;
      width: 3px;
      border-radius: 2px;
      background: #22d3ee;
      box-shadow: 0 0 8px #22d3ee, 0 0 16px rgba(34,211,238,.8);
      pointer-events: none;
      z-index: 5;
      animation: __csp_pulse .75s ease-in-out infinite;
    }
    .__csp-wrap.__csp-drop-left::after  { left:  -6px; }
    .__csp-wrap.__csp-drop-right::after { right: -6px; }
    @keyframes __csp_pulse {
      0%, 100% { opacity: .6; transform: scaleY(.82); }
      50%      { opacity: 1;  transform: scaleY(1);   }
    }
    .__csp-btn {
      padding: 6px 10px;
      border-radius: 8px;
      border: 1px solid rgba(34,211,238,.25);
      background: rgba(34,211,238,.06);
      color: #c9e4f5;
      cursor: inherit;
      font-family: inherit;
      font-size: 11.5px;
      white-space: nowrap;
      max-width: 200px;
      overflow: hidden;
      text-overflow: ellipsis;
      transition: all .15s;
      user-select: none;
      -webkit-user-select: none;
      display: inline-block;
    }
    .__csp-btn:hover {
      background: rgba(34,211,238,.16);
      color: #22d3ee;
      border-color: rgba(34,211,238,.5);
    }
    .__csp-badge {
      position: absolute;
      top: -6px;
      right: -6px;
      width: 16px;
      height: 16px;
      padding: 0;
      border-radius: 50%;
      border: 1px solid rgba(248,113,113,.5);
      background: linear-gradient(135deg,#0a1220,#14202f);
      color: #f87171;
      cursor: pointer;
      font-family: inherit;
      font-size: 11px;
      font-weight: 700;
      display: grid;
      place-items: center;
      opacity: 0;
      transition: all .15s;
      box-shadow: 0 0 8px rgba(248,113,113,.4);
      z-index: 2;
      line-height: 1;
    }
    .__csp-wrap:hover .__csp-badge { opacity: 1; }
    .__csp-badge:hover {
      background: rgba(248,113,113,.9) !important;
      color: #fff !important;
    }
  `;
  dlg.appendChild(styleEl);

  /* ========================================================
   *  ★ 预览数据构建（独立于真实 board）
   * ======================================================== */
  function buildPreviewData(code) {
    const parsed = parseSyntax(code);
    if (parsed.errors.length) return null;
    if (!parsed.edges.length && !parsed.triComps.length) return null;

    const analysis = analyzeNodes(parsed);
    const { nodePos } = computeLayout(analysis);

    const data = {
      comps: [], wires: [], shapes: [],
      baseW: BASE_W, baseH: BASE_H,
      nextId: 1
    };
    const nid = () => 'e' + (data.nextId++);

    const nodeMap = {};
    for (const n of analysis.allNodes) {
      const pos = nodePos[n];
      const jc = { id: nid(), type: 'junction', x: pos.x, y: pos.y, rot: 0, props: { label: n } };
      data.comps.push(jc);
      nodeMap[n] = jc;
    }

    const COMP_W = 80;
    for (const edge of parsed.edges) {
      const p1 = nodePos[edge.from], p2 = nodePos[edge.to];
      if (!p1 || !p2) return null;
      const isH = Math.abs(p1.y - p2.y) < 5;
      const isV = Math.abs(p1.x - p2.x) < 5 && !isH;
      if (isH) {
        let leftN = edge.from, rightN = edge.to, x1 = p1.x, x2 = p2.x;
        if (x1 > x2) { [x1, x2] = [x2, x1]; [leftN, rightN] = [rightN, leftN]; }
        const N = edge.comps.length;
        const gap = (x2 - x1 - N * COMP_W) / (N + 1);
        const compObjs = [];
        for (let i = 0; i < N; i++) {
          const cx = x1 + gap + COMP_W / 2 + i * (COMP_W + gap);
          const c = edge.comps[i];
          const obj = { id: nid(), type: c.type, x: Math.round(cx), y: p1.y, rot: 0, props: {}, label: c.label };
          const def = TYPES[c.type];
          if (def && def.defaultProps) Object.assign(obj.props, def.defaultProps);
          if (c.reversed) obj.props.reversed = true;
          data.comps.push(obj);
          compObjs.push(obj);
        }
        data.wires.push({ id: nid(), a: { elem: nodeMap[leftN].id, port: 'L' }, b: { elem: compObjs[0].id, port: 'L' } });
        for (let i = 0; i < N - 1; i++) {
          data.wires.push({ id: nid(), a: { elem: compObjs[i].id, port: 'R' }, b: { elem: compObjs[i+1].id, port: 'L' } });
        }
        data.wires.push({ id: nid(), a: { elem: compObjs[N-1].id, port: 'R' }, b: { elem: nodeMap[rightN].id, port: 'L' } });
      } else if (isV) {
        let topN = edge.from, botN = edge.to, y1 = p1.y, y2 = p2.y;
        if (y1 > y2) { [y1, y2] = [y2, y1]; [topN, botN] = [botN, topN]; }
        const N = edge.comps.length;
        const gap = (y2 - y1 - N * COMP_W) / (N + 1);
        const compObjs = [];
        for (let i = 0; i < N; i++) {
          const cy = y1 + gap + COMP_W / 2 + i * (COMP_W + gap);
          const c = edge.comps[i];
          const obj = { id: nid(), type: c.type, x: p1.x, y: Math.round(cy), rot: 90, props: {}, label: c.label };
          const def = TYPES[c.type];
          if (def && def.defaultProps) Object.assign(obj.props, def.defaultProps);
          if (c.reversed) obj.props.reversed = true;
          data.comps.push(obj);
          compObjs.push(obj);
        }
        data.wires.push({ id: nid(), a: { elem: nodeMap[topN].id, port: 'L' }, b: { elem: compObjs[0].id, port: 'L' } });
        for (let i = 0; i < N - 1; i++) {
          data.wires.push({ id: nid(), a: { elem: compObjs[i].id, port: 'R' }, b: { elem: compObjs[i+1].id, port: 'L' } });
        }
        data.wires.push({ id: nid(), a: { elem: compObjs[N-1].id, port: 'R' }, b: { elem: nodeMap[botN].id, port: 'L' } });
      } else {
        return null;
      }
    }

    for (const tri of parsed.triComps) {
      const [nA, nB, nC] = tri.nodes;
      const pA = nodePos[nA], pB = nodePos[nB], pC = nodePos[nC];
      if (!pA || !pB || !pC) continue;
      if (tri.dir === '横向') {
        const rp = { id: nid(), type: 'rheostat', x: Math.round(pC.x), y: Math.round(pA.y), rot: 0, props: { R: 20, p: 0.5 }, label: tri.label };
        data.comps.push(rp);
        data.wires.push({ id: nid(), a: { elem: rp.id, port: 'A' }, b: { elem: nodeMap[nA].id, port: 'L' } });
        data.wires.push({ id: nid(), a: { elem: rp.id, port: 'B' }, b: { elem: nodeMap[nB].id, port: 'L' } });
        data.wires.push({ id: nid(), a: { elem: rp.id, port: 'C' }, b: { elem: nodeMap[nC].id, port: 'L' } });
      } else {
        const cx = pA.x, cy = (pA.y + pB.y) / 2;
        let rot = 90;
        if (pC.x < cx) rot = 270;
        const rp = { id: nid(), type: 'rheostat', x: Math.round(cx), y: Math.round(cy), rot, props: { R: 20, p: 0.5 }, label: tri.label };
        data.comps.push(rp);
        data.wires.push({ id: nid(), a: { elem: rp.id, port: 'A' }, b: { elem: nodeMap[nA].id, port: 'L' } });
        data.wires.push({ id: nid(), a: { elem: rp.id, port: 'B' }, b: { elem: nodeMap[nB].id, port: 'L' } });
        data.wires.push({ id: nid(), a: { elem: rp.id, port: 'C' }, b: { elem: nodeMap[nC].id, port: 'L' } });
      }
    }

    for (const g of analysis.allGroups) {
      if (g.length < 2) continue;
      const sorted = g.slice().sort((a, b) => nodePos[a].y - nodePos[b].y);
      for (let i = 0; i < sorted.length - 1; i++) {
        data.wires.push({ id: nid(),
          a: { elem: nodeMap[sorted[i]].id, port: 'L' },
          b: { elem: nodeMap[sorted[i+1]].id, port: 'L' } });
      }
    }

    /* compact */
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const comp of data.comps) {
      minX = Math.min(minX, comp.x - 60);
      minY = Math.min(minY, comp.y - 60);
      maxX = Math.max(maxX, comp.x + 60);
      maxY = Math.max(maxY, comp.y + 60);
    }
    if (!isFinite(minX)) return data;
    const pad = 40;
    minX -= pad; minY -= pad; maxX += pad; maxY += pad;
    for (const comp of data.comps) { comp.x -= minX; comp.y -= minY; }
    data.baseW = Math.max(200, maxX - minX);
    data.baseH = Math.max(150, maxY - minY);
    return data;
  }

  /* ========================================================
   *  ★ 把预览数据画到 canvas
   * ======================================================== */
  function renderPreviewToCanvas(canvas, code) {
    const c = canvas.getContext('2d');
    c.clearRect(0, 0, canvas.width, canvas.height);

    /* 背景 */
    c.fillStyle = 'rgba(10,18,32,0.98)';
    c.fillRect(0, 0, canvas.width, canvas.height);

    const data = buildPreviewData(code);
    if (!data) {
      c.fillStyle = '#6b7a90';
      c.font = '13px system-ui, "PingFang SC", sans-serif';
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillText('（语法不完整，无法预览）', canvas.width / 2, canvas.height / 2);
      return;
    }

    const fakeO = {
      x1: 0, y1: 0,
      x2: canvas.width, y2: canvas.height,
      color: '#e6edf7',
      _circuit: Object.assign({}, data, {
        showSolution: false,
        showPotential: false,
        showNodes: false,
        selected: null,
        editing: false,
        multiSelected: [],
        _marquee: null,
        wireDraft: null,
        dragState: null,
        _solution: null,
        _solutionKey: null
      })
    };

    try {
      const hadLight = document.body.classList.contains('pb-light');
      if (hadLight) document.body.classList.remove('pb-light');
      drawCircuit(c, fakeO, {});
      if (hadLight) document.body.classList.add('pb-light');
    } catch (e) {
      console.error('[preview] 绘制失败:', e);
      c.fillStyle = '#fca5a5';
      c.font = '12px system-ui';
      c.textAlign = 'center';
      c.fillText('预览绘制失败', canvas.width / 2, canvas.height / 2);
    }
  }

  /* ========================================================
   *  ★ 预览浮层
   * ======================================================== */
  let previewEl = null;
  let previewTimer = null;

  function ensurePreviewEl() {
    if (previewEl) return previewEl;
    previewEl = document.createElement('div');
    previewEl.style.cssText =
      'position:fixed; z-index:2147483647; pointer-events:none; ' +
      'padding:8px; background:rgba(10,18,32,.98); ' +
      'border:1px solid rgba(56,189,248,.45); border-radius:12px; ' +
      'box-shadow:0 20px 60px rgba(0,0,0,.75), 0 0 30px rgba(56,189,248,.25); ' +
      'display:none; transition:opacity .12s;';
    previewEl.innerHTML =
      '<canvas width="440" height="280" style="display:block; border-radius:8px; background:rgba(6,10,20,.85);"></canvas>';
    document.body.appendChild(previewEl);
    return previewEl;
  }

  function showPreview(preset, cardRect) {
    const el = ensurePreviewEl();
    const canvas = el.querySelector('canvas');
    renderPreviewToCanvas(canvas, preset.code);
    el.style.display = 'block';

    const pw = 440 + 16;
    const ph = 280 + 16;

    let left = cardRect.left + cardRect.width / 2 - pw / 2;
    let top = cardRect.bottom + 10;

    if (left + pw > window.innerWidth - 10) left = window.innerWidth - pw - 10;
    if (left < 10) left = 10;
    if (top + ph > window.innerHeight - 10) top = cardRect.top - ph - 10;
    if (top < 10) top = 10;

    el.style.left = left + 'px';
    el.style.top = top + 'px';
    el.style.opacity = '0';
    requestAnimationFrame(() => { if (previewEl) previewEl.style.opacity = '1'; });
  }

  function hidePreview() {
    if (previewTimer) { clearTimeout(previewTimer); previewTimer = null; }
    if (previewEl) {
      previewEl.style.opacity = '0';
      const el = previewEl;
      setTimeout(() => { if (el === previewEl) el.style.display = 'none'; }, 120);
    }
  }

  function destroyPreview() {
    hidePreview();
    if (previewEl) { previewEl.remove(); previewEl = null; }
  }

  /* ========================================================
   *  主对话框
   * ======================================================== */
  const card = document.createElement('div');
  card.style.cssText = 'width:100%; max-width:680px; max-height:90vh; background:linear-gradient(160deg, rgba(24,36,60,.98), rgba(14,22,40,.98)); border:1px solid rgba(168,85,247,.35); border-radius:16px; display:flex; flex-direction:column; overflow:hidden; box-shadow:0 30px 80px rgba(0,8,24,.75);';

  const head = document.createElement('div');
  head.style.cssText = 'padding:14px 18px; border-bottom:1px solid rgba(120,180,255,.14); display:flex; align-items:center; flex:none;';
  head.innerHTML = '<span style="flex:1; color:#fff; font-size:15px; font-weight:600;">⚡ 分层语法生成电路图</span>';
  const closeBtn = document.createElement('button');
  closeBtn.textContent = '✕';
  closeBtn.style.cssText = 'width:28px; height:28px; border:none; border-radius:7px; background:rgba(120,180,255,.1); color:#94a3b8; cursor:pointer; font-size:13px;';
  closeBtn.onclick = () => { destroyPreview(); dlg.remove(); };
  head.appendChild(closeBtn);
  card.appendChild(head);

  const body = document.createElement('div');
  body.style.cssText = 'flex:1; overflow-y:auto; padding:14px 18px;';

  const hint = document.createElement('div');
  hint.style.cssText = 'color:#8fa3c0; font-size:12px; line-height:1.85; margin-bottom:10px; padding:8px 12px; background:rgba(168,85,247,.08); border-radius:8px; border:1px solid rgba(168,85,247,.18);';
  hint.innerHTML =
    '<b style="color:#c084fc;">分层布局：</b>节点名首字母代表层（a/b/c…），等势组 (...) 决定列对齐 · ' +
    '<b style="color:#c084fc;">二端行：</b><code style="color:#7dd3fc;">a1,a2,V1</code> · ' +
    '<b style="color:#c084fc;">三端行：</b><code style="color:#7dd3fc;">Rp:横向d1,d2,c1</code> · ' +
    '<b style="color:#c084fc;">零电势：</b><code style="color:#7dd3fc;">(a1,b1)=0</code><br>' +
    '<b>元件首字母：</b><code>E</code>电池 <code>R</code>电阻 <code>A</code>电流表 <code>V</code>电压表 <code>L</code>灯泡 <code>C</code>电容 <code>S</code>开关 <code>M</code>电动机 <code>D</code>二极管 <code>Rp</code>滑动变阻器';
  body.appendChild(hint);

  const ta = document.createElement('textarea');
  ta.style.cssText = 'width:100%; height:200px; padding:10px 12px; font-family:ui-monospace, Menlo, Consolas, monospace; font-size:12.5px; line-height:1.7; background:#0a101c; color:#e6edf7; border:1px solid rgba(56,189,248,.22); border-radius:8px; resize:vertical; outline:none; box-sizing:border-box;';
  const saved = getLastSyntax();
  ta.value = saved || DEFAULT_SYNTAX;
  body.appendChild(ta);

  const errBox = document.createElement('div');
  errBox.style.cssText = 'margin-top:6px; color:#7dd3fc; font-size:12px; white-space:pre-wrap; min-height:16px; font-family:ui-monospace, monospace; transition:color .2s;';
  let errTimer = null;
  function setMsg(msg, color, ms) {
    errBox.style.color = color || '#7dd3fc';
    errBox.textContent = msg || '';
    clearTimeout(errTimer);
    if (ms) errTimer = setTimeout(() => { errBox.textContent = ''; }, ms);
  }
  body.appendChild(errBox);

  /* ========== 常用电路图区 ========== */
  const presetSection = document.createElement('div');
  presetSection.style.cssText = 'margin-top:12px; padding:10px 12px; background:rgba(56,189,248,.04); border:1px dashed rgba(56,189,248,.22); border-radius:8px;';

  const presetHead = document.createElement('div');
  presetHead.style.cssText = 'display:flex; align-items:center; gap:8px; margin-bottom:8px;';

  const presetTitle = document.createElement('span');
  presetTitle.textContent = '📚 常用电路图（悬停预览 · 点击复制 · 拖动排序）';
  presetTitle.style.cssText = 'flex:1; color:#94a3b8; font-size:11.5px; font-weight:600; letter-spacing:.5px;';
  presetHead.appendChild(presetTitle);

  const savePresetBtn = document.createElement('button');
  savePresetBtn.type = 'button';
  savePresetBtn.textContent = '+ 保存当前语法';
  savePresetBtn.style.cssText = 'height:26px; padding:0 12px; border-radius:6px; border:1px solid rgba(56,189,248,.4); background:rgba(56,189,248,.1); color:#7dd3fc; font-family:inherit; font-size:11px; cursor:pointer; transition:all .15s;';
  savePresetBtn.addEventListener('mouseenter', () => {
    savePresetBtn.style.background = 'rgba(56,189,248,.22)';
    savePresetBtn.style.color = '#fff';
  });
  savePresetBtn.addEventListener('mouseleave', () => {
    savePresetBtn.style.background = 'rgba(56,189,248,.1)';
    savePresetBtn.style.color = '#7dd3fc';
  });
  savePresetBtn.onclick = () => {
    const txt = ta.value.trim();
    if (!txt) { setMsg('语法为空，无法保存', '#fca5a5', 2000); return; }
    const firstLine = txt.split('\n').find(l => l.trim() && !l.trim().startsWith('#')) || '未命名电路';
    const name = prompt('给这段电路图起个名字：', firstLine.trim().slice(0, 20));
    if (name === null) return;
    const finalName = (name || '').trim() || firstLine.trim().slice(0, 20) || '未命名电路';
    const presets = loadSyntaxPresets();
    presets.push({ id: genPresetId(), name: finalName, code: txt });
    saveSyntaxPresets(presets);
    renderPresets();
    setMsg('✓ 已保存「' + finalName + '」', '#4ade80', 2000);
  };
  presetHead.appendChild(savePresetBtn);
  presetSection.appendChild(presetHead);

  const presetList = document.createElement('div');
  presetList.style.cssText = 'display:flex; flex-wrap:wrap; gap:8px; min-height:38px; align-items:flex-start;';
  presetSection.appendChild(presetList);

  body.appendChild(presetSection);

  /* ============================================================
   *  ★ Pointer Events 拖拽（不依赖 HTML5 drag API）
   * ============================================================ */
  let suppressClick = false;
  const __cspDrag = {
    active: false,
    pointerId: null,
    srcId: null,
    startX: 0, startY: 0,
    ghost: null,
    dropTarget: null
  };

  function bindPresetDrag(wrap, p) {
    wrap.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      if (e.target.closest('.__csp-badge')) return;

      __cspDrag.pointerId = e.pointerId;
      __cspDrag.startX = e.clientX;
      __cspDrag.startY = e.clientY;
      __cspDrag.active = false;
      __cspDrag.srcId = p.id;
      __cspDrag.dropTarget = null;
      try { wrap.setPointerCapture(e.pointerId); } catch (err) {}
    });

    wrap.addEventListener('pointermove', (e) => {
      if (e.pointerId !== __cspDrag.pointerId) return;
      const dx = e.clientX - __cspDrag.startX;
      const dy = e.clientY - __cspDrag.startY;

      /* 超过阈值才进入拖拽模式，避免影响点击 */
      if (!__cspDrag.active && Math.hypot(dx, dy) > 6) {
        __cspDrag.active = true;
        suppressClick = true;
        hidePreview();
        wrap.classList.add('__csp-dragging');

        /* 创建跟手的影子 */
        const g = document.createElement('div');
        g.textContent = p.name;
        g.style.cssText =
          'position:fixed; z-index:2147483646; pointer-events:none;' +
          'padding:8px 14px; background:linear-gradient(135deg,#22d3ee,#a855f7);' +
          'color:#fff; border-radius:8px; font-size:12px; font-weight:600;' +
          'box-shadow:0 10px 28px rgba(34,211,238,.6), 0 0 0 1px rgba(255,255,255,.25) inset;' +
          'transform:translate(-50%,-50%); opacity:.92; white-space:nowrap;';
        document.body.appendChild(g);
        __cspDrag.ghost = g;
      }
      if (!__cspDrag.active) return;
      e.preventDefault();

      __cspDrag.ghost.style.left = e.clientX + 'px';
      __cspDrag.ghost.style.top = e.clientY + 'px';

      /* 清掉上一帧的插入指示 */
      presetList.querySelectorAll('.__csp-wrap').forEach(el => {
        el.classList.remove('__csp-drop-left', '__csp-drop-right');
      });

      /* 找鼠标下的目标（影子隐藏后取 elementFromPoint） */
      __cspDrag.ghost.style.display = 'none';
      const el = document.elementFromPoint(e.clientX, e.clientY);
      __cspDrag.ghost.style.display = '';

      const target = el && el.closest && el.closest('.__csp-wrap');
      if (target && target !== wrap && presetList.contains(target)) {
        const rect = target.getBoundingClientRect();
        const isLeft = e.clientX < rect.left + rect.width / 2;
        target.classList.add(isLeft ? '__csp-drop-left' : '__csp-drop-right');
        __cspDrag.dropTarget = {
          id: target.dataset.presetId,
          side: isLeft ? 'left' : 'right'
        };
      } else {
        __cspDrag.dropTarget = null;
      }
    });

    const finishDrag = (cancelled) => {
      if (!__cspDrag.active) {
        __cspDrag.pointerId = null;
        __cspDrag.srcId = null;
        return;
      }

      /* 清理视觉状态 */
      if (__cspDrag.ghost) { __cspDrag.ghost.remove(); __cspDrag.ghost = null; }
      wrap.classList.remove('__csp-dragging');
      presetList.querySelectorAll('.__csp-wrap').forEach(el => {
        el.classList.remove('__csp-drop-left', '__csp-drop-right');
      });

      if (!cancelled && __cspDrag.dropTarget) {
        const srcId = __cspDrag.srcId;
        const dstId = __cspDrag.dropTarget.id;
        const side = __cspDrag.dropTarget.side;

        const list = loadSyntaxPresets();
        const srcIdx = list.findIndex(x => x.id === srcId);
        if (srcIdx >= 0) {
          const [moved] = list.splice(srcIdx, 1);
          const dstIdx = list.findIndex(x => x.id === dstId);
          if (dstIdx >= 0) {
            list.splice(side === 'right' ? dstIdx + 1 : dstIdx, 0, moved);
            saveSyntaxPresets(list);
          } else {
            list.splice(srcIdx, 0, moved);
          }
        }
        setTimeout(() => {
          renderPresets();
          setTimeout(() => { suppressClick = false; }, 100);
        }, 0);
      } else {
        setTimeout(() => { suppressClick = false; }, 50);
      }

      __cspDrag.active = false;
      __cspDrag.pointerId = null;
      __cspDrag.srcId = null;
      __cspDrag.dropTarget = null;
    };

    wrap.addEventListener('pointerup', (e) => {
      if (e.pointerId !== __cspDrag.pointerId) return;
      try { wrap.releasePointerCapture(e.pointerId); } catch (err) {}
      finishDrag(false);
    });
    wrap.addEventListener('pointercancel', (e) => {
      if (e.pointerId !== __cspDrag.pointerId) return;
      try { wrap.releasePointerCapture(e.pointerId); } catch (err) {}
      finishDrag(true);
    });
  }

  /* ============================================================
   *  渲染常用电路图列表
   * ============================================================ */
  function renderPresets() {
    /* 任何重渲染都先清空拖拽状态，避免残留 */
    __cspDrag.active = false;
    __cspDrag.pointerId = null;
    __cspDrag.srcId = null;
    __cspDrag.dropTarget = null;
    if (__cspDrag.ghost) { __cspDrag.ghost.remove(); __cspDrag.ghost = null; }

    presetList.innerHTML = '';
    const presets = loadSyntaxPresets();

    if (!presets.length) {
      const empty = document.createElement('div');
      empty.textContent = '（暂无常用电路图 · 点「+ 保存当前语法」添加）';
      empty.style.cssText = 'color:#6b7a90; font-size:11.5px; padding:8px 4px; font-style:italic;';
      presetList.appendChild(empty);
      return;
    }

    presets.forEach((p) => {
      const wrap = document.createElement('div');
      wrap.className = '__csp-wrap';
      wrap.dataset.presetId = p.id;

      const btn = document.createElement('div');
      btn.className = '__csp-btn';
      btn.textContent = p.name;
      btn.title = p.name;

      btn.onclick = () => {
        if (suppressClick) { suppressClick = false; return; }
        ta.value = p.code;
        ta.focus();
        try { ta.setSelectionRange(0, 0); ta.scrollTop = 0; } catch (err) {}
        setMsg('✓ 已复制「' + p.name + '」到编辑框', '#22d3ee', 2000);
      };

      const badge = document.createElement('button');
      badge.type = 'button';
      badge.className = '__csp-badge';
      badge.textContent = '×';
      badge.title = '删除此常用电路图';
      badge.addEventListener('pointerdown', (e) => e.stopPropagation());
      badge.addEventListener('mousedown', (e) => e.stopPropagation());
      badge.onclick = (e) => {
        e.stopPropagation();
        if (!confirm('删除常用电路图「' + p.name + '」？')) return;
        hidePreview();
        const list = loadSyntaxPresets().filter(x => x.id !== p.id);
        saveSyntaxPresets(list);
        renderPresets();
        setMsg('已删除「' + p.name + '」', '#fca5a5', 1500);
      };

      wrap.appendChild(btn);
      wrap.appendChild(badge);

      /* 悬停预览 */
      wrap.addEventListener('mouseenter', () => {
        if (__cspDrag.active) return;
        if (previewTimer) clearTimeout(previewTimer);
        previewTimer = setTimeout(() => {
          const rect = wrap.getBoundingClientRect();
          showPreview(p, rect);
        }, 400);
      });
      wrap.addEventListener('mouseleave', () => {
        hidePreview();
      });

      /* 拖拽排序（Pointer 模拟） */
      bindPresetDrag(wrap, p);

      presetList.appendChild(wrap);
    });
  }

  renderPresets();
  card.appendChild(body);

  /* 底部按钮 */
  const foot = document.createElement('div');
  foot.style.cssText = 'padding:12px 18px; border-top:1px solid rgba(120,180,255,.14); display:flex; justify-content:space-between; gap:10px; flex:none;';

  const leftBtns = document.createElement('div');
  leftBtns.style.cssText = 'display:flex; gap:8px;';
  const resetBtn = document.createElement('button');
  resetBtn.textContent = '恢复默认';
  resetBtn.style.cssText = 'height:36px; padding:0 14px; border-radius:8px; border:1px solid rgba(251,146,60,.35); background:rgba(251,146,60,.1); color:#fdba74; cursor:pointer; font-family:inherit; font-size:12.5px;';
  resetBtn.onclick = () => { ta.value = DEFAULT_SYNTAX; ta.focus(); };
  leftBtns.appendChild(resetBtn);
  foot.appendChild(leftBtns);

  const rightBtns = document.createElement('div');
  rightBtns.style.cssText = 'display:flex; gap:10px;';
  const cancelBtn = document.createElement('button');
  cancelBtn.textContent = '取消';
  cancelBtn.style.cssText = 'height:36px; padding:0 18px; border-radius:8px; border:1px solid rgba(120,180,255,.22); background:rgba(120,180,255,.08); color:#b8c7de; cursor:pointer; font-family:inherit; font-size:13px;';
  cancelBtn.onclick = () => { destroyPreview(); dlg.remove(); };
  rightBtns.appendChild(cancelBtn);

  const okBtn = document.createElement('button');
  okBtn.textContent = '生成电路';
  okBtn.style.cssText = 'height:36px; padding:0 22px; border-radius:8px; border:none; background:linear-gradient(135deg,#a855f7,#6366f1); color:#fff; cursor:pointer; font-family:inherit; font-size:13px; font-weight:600;';
  okBtn.onclick = () => {
    try {
      setMsg('', '#7dd3fc');
      generateFromSyntax(o, ta.value);
      saveLastSyntax(ta.value);
      destroyPreview();
      dlg.remove();
    } catch (e) {
      setMsg(e.message, '#fca5a5');
    }
  };
  rightBtns.appendChild(okBtn);
  foot.appendChild(rightBtns);
  card.appendChild(foot);

  dlg.appendChild(card);
  document.body.appendChild(dlg);
  setTimeout(() => { try { ta.focus(); } catch (e) {} }, 60);
}



/* ============================ 注册 ============================ */

shape({
  key: 'circuitBoard',
  cat: 'em',
  label: '电路板',
  geom: 'box',
  interactive: true,
  icon: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8" cy="12" r="1.8" fill="currentColor"/><path d="M9.8 12h4.4"/><circle cx="16" cy="12" r="1.8" fill="currentColor"/>',
  draw: drawCircuit,
  onClick: circuitClick,
  onDrag: circuitDrag,
  onDragEnd: circuitDragEnd
});

/* ★ v9：移除 selBar 电路按钮绑定（点击电路图自动打开） */

})();

/* ==================== 新增于 2026/11/13 21:40:33 ==================== */
/* ==========================================================
 * 水波干涉：S1、S2 相距 10 m，波长 1 m
 * 高亮以 S2 为圆心、半径 6 m 的圆周上的振动加强点
 * ========================================================== */
param('波纹强度',   { label: '波纹强度',   min: 0, max: 1, step: 0.05, def: 0.5 });
param('动画速度',   { label: '动画速度',   min: 0, max: 3, step: 0.1,  def: 1 });
param('显示加强线', { label: '显示加强线', min: 0, max: 1, step: 1,    def: 1 });
param('显示加强点', { label: '显示加强点', min: 0, max: 1, step: 1,    def: 1 });

shape({
  key: 'anim_waterInterference',
  cat: 'anim',
  geom: 'box',
  label: '水波干涉·加强点',
  icon: '<circle cx="5" cy="12" r="1.7" fill="currentColor"/>' +
        '<circle cx="19" cy="12" r="1.7" fill="currentColor"/>' +
        '<circle cx="5" cy="12" r="4.6" fill="none" stroke="currentColor" stroke-opacity=".55"/>' +
        '<circle cx="19" cy="12" r="4.6" fill="none" stroke="currentColor" stroke-opacity=".55"/>',
  animatable: true,
  params: ['波纹强度', '动画速度', '显示加强线', '显示加强点'],

  draw(c, o, U) {
    const b = U.bbox(o);
    if (b.w < 140 || b.h < 100) return;

    const AN = (window.PhysBoard && window.PhysBoard.animState) || { t: 0 };
    const t = AN.t || 0;

    const wA      = o['波纹强度']   ?? 0.5;
    const spd     = o['动画速度']   ?? 1;
    const showHyp = (o['显示加强线'] ?? 1) >= 0.5;
    const showDot = (o['显示加强点'] ?? 1) >= 0.5;

    /* 物理量（米） */
    const LAM = 1, D = 10, R = 6;
    const S1X = -5, S2X = 5;      // 世界坐标：S1(-5,0)  S2(5,0)
    const NMAX = 10;              // |Δ| 最大 = d = 10λ

    /* 世界窗口 → 画布 */
    const WX1 = -6.6, WX2 = 12.2, WY = 7.0;
    const scale = Math.min(b.w / (WX2 - WX1), (b.h - 26) / (2 * WY));
    if (scale < 6) return;
    const ox = b.x1 + b.w / 2 - ((WX1 + WX2) / 2) * scale;
    const oy = b.y1 + (b.h - 26) / 2;
    const X = wx => ox + wx * scale;
    const Y = wy => oy - wy * scale;

    c.save();
    c.beginPath();
    c.rect(b.x1, b.y1, b.w, b.h);
    c.clip();

    /* ---------- 背景 ---------- */
    const bg = c.createLinearGradient(0, b.y1, 0, b.y2);
    bg.addColorStop(0, 'rgba(232,244,255,0.85)');
    bg.addColorStop(1, 'rgba(248,252,255,0.85)');
    c.fillStyle = bg;
    c.fillRect(b.x1, b.y1, b.w, b.h);

    /* ---------- 水波涟漪 ---------- */
    if (wA > 0.01) {
      const phase  = ((t * spd * 0.55) % 1 + 1) % 1;
      const stepPx = LAM * scale;
      if (stepPx >= 4) {
        c.lineWidth = 1.2;
        const ripple = (srcX, color) => {
          const cx = X(srcX), cy = Y(0);
          const rMax = Math.hypot(Math.max(cx - b.x1, b.x2 - cx),
                                  Math.max(cy - b.y1, b.y2 - cy)) + stepPx;
          const K = Math.min(60, Math.ceil(rMax / stepPx));
          for (let k = 0; k < K; k++) {
            const rr = (k + phase) * stepPx;
            const fade = 1 - rr / rMax;
            if (fade <= 0) continue;
            c.beginPath();
            c.arc(cx, cy, rr, 0, Math.PI * 2);
            c.strokeStyle = U.alpha(color, 0.34 * fade * wA);
            c.stroke();
          }
        };
        ripple(S1X, '#3b82f6');
        ripple(S2X, '#3b82f6');
      }
    }

    /* ---------- r = 6 m 的圆周 ---------- */
    c.save();
    c.beginPath();
    c.arc(X(S2X), Y(0), R * scale, 0, Math.PI * 2);
    c.setLineDash([7, 5]);
    c.strokeStyle = 'rgba(225,75,55,0.85)';
    c.lineWidth = 1.8;
    c.stroke();
    c.restore();

    /* ---------- 振动加强线（双曲线族） ---------- */
    // 以 S2 为原点的极坐标：r = (D² - n²) / (2n - 2D·cosθ)
    const buildPath = (n) => {
      if (n === 0) {                       // 中垂线
        const yh = Math.sqrt(Math.max(0, R * R - (D / 2) * (D / 2)));
        return [[[0, -yh], [0, yh]]];
      }
      if (n >= D) {                        // 退化为射线
        return [[[S2X, 0], [S2X + R, 0]]];
      }
      const th0 = Math.acos(n / D);
      const M = 480;
      const out = [];
      let cur = null;
      for (let i = 0; i <= M; i++) {
        const th  = th0 + (2 * Math.PI - 2 * th0) * (i / M);
        const den = 2 * n - 2 * D * Math.cos(th);
        const r   = den > 1e-9 ? (D * D - n * n) / den : -1;
        if (!(r > 0) || r > R) {
          if (cur && cur.length > 1) out.push(cur);
          cur = null;
          continue;
        }
        if (!cur) cur = [];
        cur.push([S2X + r * Math.cos(th), r * Math.sin(th)]);
      }
      if (cur && cur.length > 1) out.push(cur);
      return out;
    };

    if (showHyp) {
      c.save();
      c.lineWidth  = Math.max(1.5, Math.min(2.6, scale * 0.1));
      c.lineCap    = 'round';
      c.lineJoin   = 'round';
      c.strokeStyle = 'rgba(238,150,40,0.78)';

      for (let n = 0; n <= NMAX; n++) {
        const groups = buildPath(n);
        const mirrors = (n === 0 || n >= D) ? [false] : [false, true];
        for (const g of groups) {
          for (const mir of mirrors) {
            c.beginPath();
            for (let i = 0; i < g.length; i++) {
              const wx = mir ? -g[i][0] : g[i][0];
              const px = X(wx), py = Y(g[i][1]);
              if (i === 0) c.moveTo(px, py);
              else         c.lineTo(px, py);
            }
            c.stroke();
          }
        }
      }
      c.restore();
    }

    /* ---------- 圆周上的加强点 ---------- */
    // 圆上 PS2 = R，波程差 PS1 - R = ±n
    //   PS1 = R + n  →  cosφ = (n² + 12n - 100) / 120
    //   PS1 = R - n  →  cosφ = (n² - 12n - 100) / 120   （仅 n ≤ 2）
    const dots = [];
    const pushByCos = (cv) => {
      if (cv < -1 || cv > 1) return;
      const ph = Math.acos(Math.max(-1, Math.min(1, cv)));
      dots.push([S2X + R * Math.cos(ph),  R * Math.sin(ph)]);
      if (ph > 1e-4 && ph < Math.PI - 1e-4) {
        dots.push([S2X + R * Math.cos(ph), -R * Math.sin(ph)]);
      }
    };
    for (let n = 0; n <= NMAX; n++) {
      pushByCos((n * n + 12 * n - 100) / 120);
      if (n >= 1 && n <= 2) pushByCos((n * n - 12 * n - 100) / 120);
    }

    if (showDot) {
      for (const d of dots) {
        c.beginPath();
        c.arc(X(d[0]), Y(d[1]), 3.6, 0, Math.PI * 2);
        c.fillStyle = '#e2452f';
        c.fill();
        c.strokeStyle = '#ffffff';
        c.lineWidth = 1.3;
        c.stroke();
      }
    }

    /* ---------- 波源 ---------- */
    c.save();
    c.setLineDash([]);
    c.strokeStyle = 'rgba(100,120,145,0.45)';
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(X(S1X), Y(0));
    c.lineTo(X(S2X), Y(0));
    c.stroke();
    c.restore();

    const fontB = 'bold 12px system-ui, "PingFang SC", "Microsoft YaHei", sans-serif';
    [[S1X, 'S₁'], [S2X, 'S₂']].forEach(([sx, lbl]) => {
      c.beginPath();
      c.arc(X(sx), Y(0), 5, 0, Math.PI * 2);
      c.fillStyle = '#2563eb';
      c.fill();
      c.strokeStyle = '#ffffff';
      c.lineWidth = 1.6;
      c.stroke();

      c.font = fontB;
      c.fillStyle = '#1e3a8a';
      c.textAlign = 'center';
      c.textBaseline = 'top';
      c.fillText(lbl, X(sx), Y(0) + 8);
    });

    /* ---------- 说明文字 ---------- */
    c.font = '11px system-ui, "PingFang SC", "Microsoft YaHei", sans-serif';
    c.fillStyle = 'rgba(30,30,30,0.62)';
    c.textAlign = 'center';
    c.textBaseline = 'bottom';
    c.fillText(
      'λ = 1 m ｜ S₁S₂ = 10 m ｜ r = 6 m 圆周上加强点：' + dots.length + ' 个',
      (b.x1 + b.x2) / 2,
      b.y2 - 5
    );

    c.restore();
  }
});




})();



