import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  DollarSign, 
  Package, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  UserCheck, 
  Edit3, 
  Save, 
  Info,
  ShieldCheck,
  Zap,
  Boxes,
  Activity,
  AlertOctagon,
  ShieldAlert,
  CameraOff,
  KeyRound,
  TrendingUp,
  PieChart,
  Award,
  XCircle,
  HelpCircle,
  FileSpreadsheet
} from 'lucide-react';
import { formatNumber } from '../utils/numberFormatter';
import { generateInsightsAndRecommendations } from '../utils/InsightEngine';

const BAR_COLORS = ['#1c2541', '#2c3e6b', '#3d5a80', '#5c80a6', '#98c1d9', '#adc5d9', '#cbd5e1', '#e2e8f0'];

// 3D Node Ecosystem Topology Renderer using Canvas
function Ecosystem3DViewer() {
  const canvasRef = useRef(null);
  const [angle, setAngle] = useState(0);

  useEffect(() => {
    let animId;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    const render = () => {
      const width = canvas.width = canvas.offsetWidth || 280;
      const height = canvas.height = canvas.offsetHeight || 160;
      ctx.clearRect(0, 0, width, height);

      // Node coordinates in 3D
      const nodes = [
        { x: -0.8, y: -0.3, z: -0.4, label: '🔌 เชื่อมต่อ' },
        { x: 0.8, y: -0.3, z: -0.4, label: '💾 จัดเก็บ' },
        { x: 0.5, y: 0.5, z: -0.6, label: '🖱️ อุปกรณ์พ่วง' },
        { x: -0.5, y: 0.5, z: -0.6, label: '🤖 บอร์ดควบคุม' },
        { x: 0, y: -0.7, z: 0.8, label: '🖨️ หมึกพิมพ์' },
        { x: 0, y: 0.7, z: 0, label: '🛠️ ช่างคอม' }
      ];

      const rad = (angle * Math.PI) / 180;
      const projected = nodes.map(n => {
        const rx = n.x * Math.cos(rad) - n.z * Math.sin(rad);
        const rz = n.x * Math.sin(rad) + n.z * Math.cos(rad);
        
        const dist = 2.5;
        const fov = 1.6;
        const scale = Math.min(width, height) * 0.4;
        const scaleProj = fov / (dist - rz);

        return {
          x: width / 2 + rx * scale * scaleProj,
          y: height / 2 + n.y * scale * scaleProj,
          z: rz,
          label: n.label
        };
      });

      // Draw connection lines representing ecosystem data flow
      ctx.strokeStyle = 'rgba(197, 168, 128, 0.15)';
      ctx.lineWidth = 1;
      for (let i = 0; i < projected.length; i++) {
        for (let j = i + 1; j < projected.length; j++) {
          ctx.beginPath();
          ctx.moveTo(projected[i].x, projected[i].y);
          ctx.lineTo(projected[j].x, projected[j].y);
          ctx.stroke();
        }
      }

      const center = { x: width / 2, y: height / 2 };
      ctx.strokeStyle = 'rgba(28, 37, 65, 0.2)';
      projected.forEach(p => {
        ctx.beginPath();
        ctx.moveTo(center.x, center.y);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
      });

      projected.forEach((p, idx) => {
        const t = Date.now() * 0.003 + idx;
        const r = 5 + Math.sin(t) * 2;
        
        ctx.beginPath();
        ctx.arc(p.x, p.y, r + 4, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(197, 168, 128, 0.1)';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, 2 * Math.PI);
        ctx.fillStyle = idx % 2 === 0 ? '#1c2541' : '#c5a880';
        ctx.fill();
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = 'rgba(11, 19, 43, 0.7)';
        ctx.font = '8px sans-serif';
        ctx.fillText(p.label, p.x + 8, p.y + 3);
      });

      setAngle(prev => (prev + 0.3) % 360);
      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div className="w-full h-full min-h-[140px] flex items-center justify-center relative">
      <canvas ref={canvasRef} className="w-full h-full max-w-[280px] max-h-[160px]" />
    </div>
  );
}

// Custom SVG Donut Chart component with interactive legends
function SvgDonutChart({ data, onSelect }) {
  const total = data.reduce((acc, curr) => acc + curr.value, 0) || 1;
  let accumulatedAngle = 0;

  const donutSegments = data.map((item, idx) => {
    const percentage = item.value / total;
    const strokeDash = percentage * 282.6; // Circumference of r=45 circle is 2 * PI * 45 = 282.6
    const strokeOffset = 282.6 - strokeDash + accumulatedAngle;
    accumulatedAngle -= strokeDash;

    return {
      ...item,
      strokeDash,
      strokeOffset,
      color: BAR_COLORS[idx % BAR_COLORS.length]
    };
  });

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <div className="relative w-36 h-36 shrink-0">
        <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
          <circle cx="60" cy="60" r="45" fill="transparent" stroke="#f1f5f9" strokeWidth="16" />
          {donutSegments.map((seg, idx) => (
            <circle
              key={idx}
              cx="60"
              cy="60"
              r="45"
              fill="transparent"
              stroke={seg.color}
              strokeWidth="16"
              strokeDasharray="282.6"
              strokeDashoffset={seg.strokeOffset}
              strokeLinecap="round"
              onClick={() => onSelect && onSelect(seg.key)}
              className="transition-all duration-500 hover:scale-105 origin-center cursor-pointer"
              title={`${seg.name}: ${formatNumber(seg.value)} บาท (คลิกเพื่อจัดกรอง)`}
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-[10px] font-bold text-neutral-slate uppercase tracking-wider">งบประมาณ</span>
          <span className="text-xs font-black text-gov-navy num-tabular">{(total / 1000).toFixed(0)}k บาท</span>
        </div>
      </div>

      <div className="flex-1 w-full space-y-2 max-h-[160px] overflow-y-auto pr-1">
        {donutSegments.slice(0, 5).map((seg, idx) => (
          <div 
            key={idx} 
            onClick={() => onSelect && onSelect(seg.key)}
            className="flex items-center justify-between text-xs font-medium cursor-pointer hover:bg-slate-50 p-1 rounded transition-colors"
            title="คลิกเพื่อคัดกรองข้อมูลรายการตามหมวดหมู่นี้"
          >
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: seg.color }}></span>
              <span className="text-neutral-charcoal truncate max-w-[120px]">{seg.name}</span>
            </div>
            <span className="text-gov-blue font-bold num-tabular">{formatNumber(seg.value)} บาท</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Custom Area/Line Trend Chart mapping budget values
function SvgLineChart({ data, onSelect }) {
  const maxVal = Math.max(...data.map(d => d.value)) || 1;
  const width = 320;
  const height = 120;
  const padding = 20;

  const points = data.map((item, idx) => {
    const x = padding + (idx * (width - padding * 2)) / Math.max(data.length - 1, 1);
    const y = height - padding - (item.value * (height - padding * 2)) / maxVal;
    return { x, y, label: item.name, value: item.value };
  });

  const pathD = points.reduce((acc, p, idx) => {
    return acc + (idx === 0 ? `M ${p.x} ${p.y}` : ` L ${p.x} ${p.y}`);
  }, '');

  const areaD = points.length > 0 
    ? `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`
    : '';

  return (
    <div className="space-y-4">
      <div className="relative w-full h-[120px] bg-slate-50/50 rounded-xl border border-slate-100 p-2 overflow-hidden">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full" preserveAspectRatio="none">
          {/* Grid lines */}
          <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="#e2e8f0" strokeDasharray="3,3" />
          <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="#e2e8f0" strokeDasharray="3,3" />
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#cbd5e1" />

          {/* Area under the line */}
          {areaD && <path d={areaD} fill="rgba(28, 37, 65, 0.05)" />}

          {/* The line itself */}
          {pathD && (
            <path
              d={pathD}
              fill="none"
              stroke="#1c2541"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Points on hover */}
          {points.map((p, idx) => (
            <circle
              key={idx}
              cx={p.x}
              cy={p.y}
              r="4.5"
              fill="#c5a880"
              stroke="white"
              strokeWidth="1.5"
              onClick={() => onSelect && onSelect(p.label)}
              className="cursor-pointer hover:scale-125 transition-transform"
              title={`${p.label}: ${formatNumber(p.value)} บาท (คลิกเพื่อจัดกรอง)`}
            />
          ))}
        </svg>
      </div>

      <div className="grid grid-cols-4 gap-2 text-center">
        {data.slice(0, 4).map((d, idx) => (
          <div 
            key={idx} 
            onClick={() => onSelect && onSelect(d.name)}
            className="space-y-0.5 cursor-pointer hover:bg-slate-50 p-1 rounded transition-colors"
            title="คลิกเพื่อคัดกรองข้อมูลตามฝ่ายงานนี้"
          >
            <span className="text-[9px] text-neutral-slate block truncate font-bold">{d.name}</span>
            <span className="text-[10px] font-black text-gov-blue num-tabular">{(d.value / 1000).toFixed(0)}k</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Half-Circle Gauge indicating Risk Level
function RiskGauge({ failedCount, duplicateCount, pendingCount }) {
  const riskScore = (failedCount * 30) + (duplicateCount * 25) + (pendingCount > 10 ? 20 : 5);
  const scoreClamped = Math.min(riskScore, 100);

  let riskLevel = 'ต่ำ (Low)';
  let riskColor = 'text-emerald-600';
  let riskBg = 'bg-emerald-500';
  let riskBorder = 'border-emerald-200';

  if (scoreClamped >= 60) {
    riskLevel = 'สูง (High Risk)';
    riskColor = 'text-status-failed';
    riskBg = 'bg-status-failed';
    riskBorder = 'border-rose-200';
  } else if (scoreClamped >= 25) {
    riskLevel = 'ปานกลาง (Medium)';
    riskColor = 'text-status-pending';
    riskBg = 'bg-status-pending';
    riskBorder = 'border-amber-200';
  }

  const strokeOffset = 141.3 - (scoreClamped / 100) * 141.3;

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-100 flex flex-col items-center justify-center text-center space-y-4">
      <h4 className="text-[10px] font-bold text-neutral-slate uppercase tracking-wider">ดัชนีความเสี่ยงโครงการ (Risk Index)</h4>
      
      <div className="relative w-32 h-20 flex items-end justify-center overflow-hidden">
        <svg viewBox="0 0 100 60" className="w-full h-full">
          <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#f1f5f9" strokeWidth="8" strokeLinecap="round" />
          <path 
            d="M 10 50 A 40 40 0 0 1 90 50" 
            fill="none" 
            stroke={scoreClamped >= 60 ? '#991b1b' : scoreClamped >= 25 ? '#b45309' : '#065f46'} 
            strokeWidth="8" 
            strokeLinecap="round"
            strokeDasharray="125.6"
            strokeDashoffset={125.6 - (scoreClamped / 100) * 125.6}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute bottom-0 flex flex-col items-center">
          <span className="text-lg font-black text-gov-navy num-tabular">{scoreClamped}%</span>
          <span className={`text-[9px] font-bold ${riskColor}`}>{riskLevel}</span>
        </div>
      </div>

      <div className={`p-2.5 rounded-xl border ${riskBorder} bg-slate-50/50 text-[10px] text-neutral-slate leading-relaxed w-full`}>
        มีพัสดุตรวจไม่ผ่าน <strong className="text-gov-navy num-tabular">{failedCount}</strong> รายการ, หมายเลข S/N ซ้ำซ้อน <strong className="text-gov-navy num-tabular">{duplicateCount}</strong> เครื่อง
      </div>
    </div>
  );
}

export default function Dashboard({ 
  stats: parentStats, 
  committee, 
  isEditingCommittee, 
  editedCommittee, 
  handleEditCommitteeStart, 
  handleEditCommitteeChange, 
  handleSaveCommittee,
  items,
  onItemClick,
  onCategorySelect,
  onDivisionSelect
}) {
  // Recalculate stats dynamically based on the filtered items passed to represent PowerBI-style instant updates
  const dashboardStats = useMemo(() => {
    const totalItems = items.length;
    const passedCount = items.filter(i => i.inspectStatus === 'passed').length;
    const pendingCount = items.filter(i => i.inspectStatus === 'pending').length;
    const failedCount = items.filter(i => i.inspectStatus === 'failed').length;
    const hasNotesCount = items.filter(i => i.notes).length;

    let totalBudget = 0;
    let passedBudget = 0;
    let remainingBudget = 0;

    items.forEach(i => {
      const cost = i.qty * i.unit_price;
      totalBudget += cost;
      if (i.inspectStatus === 'passed') {
        passedBudget += cost;
      } else {
        remainingBudget += cost;
      }
    });

    const divMap = {};
    items.forEach(i => {
      let div = i.division || 'ทั่วไป';
      if (div === 'ปชส.' || div === 'ปชส. 3') div = 'ประชาสัมพันธ์';
      const cost = i.qty * i.unit_price;
      divMap[div] = (divMap[div] || 0) + cost;
    });
    const divisionData = Object.entries(divMap).map(([name, value]) => ({ name, value }));

    const catMap = {};
    items.forEach(i => {
      const cat = i.category || 'อื่นๆ';
      const cost = i.qty * i.unit_price;
      catMap[cat] = (catMap[cat] || 0) + cost;
    });
    
    const catLabels = {
      connectivity: '🔌 อุปกรณ์เชื่อมต่อ',
      storage: '💾 อุปกรณ์จัดเก็บ',
      peripherals: '🖱️ อุปกรณ์ต่อพ่วง',
      electronics: '🤖 อิเล็กทรอนิกส์',
      tools: '🛠️ เครื่องมือช่าง',
      organization: '📁 จัดระเบียบ',
      toner: '🖨️ หมึกพิมพ์',
      consumables: '🔋 วัสดุสิ้นเปลือง'
    };
    
    const categoryData = Object.entries(catMap).map(([key, value]) => ({
      key,
      name: catLabels[key] || key,
      value
    }));

    return {
      totalItems,
      passedCount,
      pendingCount,
      failedCount,
      hasNotesCount,
      totalBudget,
      passedBudget,
      remainingBudget,
      divisionData,
      categoryData
    };
  }, [items]);

  const progressPct = dashboardStats.totalItems > 0 
    ? Math.round((dashboardStats.passedCount / dashboardStats.totalItems) * 100) 
    : 0;

  // Retrieve insights & recommendations based on the active dataset
  const { insights, recommendations } = useMemo(() => {
    return generateInsightsAndRecommendations(items);
  }, [items]);

  // Find any duplicate serial count for risk gauge
  const serialMap = {};
  items.forEach(i => {
    const sn = (i.serial_number || '').trim().toUpperCase();
    if (sn && sn !== 'N/A' && sn !== '-') {
      serialMap[sn] = (serialMap[sn] || 0) + 1;
    }
  });
  const duplicateSerialCount = Object.values(serialMap).filter(v => v > 1).length;

  const priorityItems = items
    .slice()
    .sort((a, b) => {
      const statusWeight = { failed: 0, pending: 1, passed: 2 };
      if (statusWeight[a.inspectStatus] !== statusWeight[b.inspectStatus]) {
        return statusWeight[a.inspectStatus] - statusWeight[b.inspectStatus];
      }
      return (b.qty * b.unit_price) - (a.qty * a.unit_price);
    })
    .slice(0, 5);

  return (
    <div className="space-y-8 print:hidden animate-fade-in relative">
      
      {/* 3D mesh lines watermark layer */}
      <div className="absolute inset-0 bg-grid-mesh bg-watermark-vimana pointer-events-none z-0"></div>

      {/* Hero Header Banner */}
      <div className="relative bg-gradient-to-r from-gov-navy via-slate-900 to-gov-blue rounded-3xl p-6 sm:p-8 overflow-hidden border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6 shadow-floating z-10">
        <div className="absolute inset-0 bg-dots opacity-5 pointer-events-none z-0"></div>
        <span className="absolute bottom-0 left-0 right-0 h-1 bg-gov-gold"></span>

        <div className="space-y-4 max-w-xl relative z-10 text-white">
          <div className="flex items-center gap-2">
            <span className="bg-gov-gold/20 text-gov-gold text-[9px] font-black border border-gov-gold/30 px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
              <Zap className="w-3 h-3 text-gov-gold animate-bounce" />
              Executive Command Center
            </span>
            <span className="bg-emerald-500/20 text-emerald-400 text-[9px] font-black border border-emerald-500/30 px-2.5 py-1 rounded-full uppercase tracking-wider">
              DATA SYNCED
            </span>
          </div>

          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-black tracking-wide text-slate-100">ศูนย์วิเคราะห์ข้อมูลตรวจรับพัสดุอัจฉริยะ</h1>
            <p className="text-xs text-slate-400 leading-relaxed font-medium">
              ระบบวิเคราะห์งบประมาณ ตรวจสอบข้อแนะนำ และประมวลความเสี่ยงสัญญางาน เทศบาลนครนครสวรรค์
            </p>
          </div>

          <div className="flex flex-wrap gap-4 pt-1.5 text-xs text-slate-300">
            <div className="flex items-center gap-1.5">
              <Boxes className="w-4.5 h-4.5 text-gov-gold" />
              <span>โครงการจัดซื้อ: <strong className="text-white num-tabular">{dashboardStats.totalItems} รายการ</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4.5 h-4.5 text-emerald-400" />
              <span>ความก้าวหน้ารวม: <strong className="text-white num-tabular">{progressPct}%</strong></span>
            </div>
          </div>
        </div>

        <div className="w-full md:w-auto shrink-0 relative z-10">
          <div className="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-4 flex items-center justify-center relative shadow-inner">
            <Ecosystem3DViewer />
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
        <div className="bg-white p-5 rounded-2xl shadow-premium border border-slate-100 hover:border-gov-gold/30 hover:shadow-floating transition-all duration-300 flex items-center justify-between relative overflow-hidden group">
          <span className="absolute left-0 top-0 bottom-0 w-1.5 bg-gov-gold"></span>
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-neutral-slate uppercase tracking-wider block">งบจัดซื้อจัดจ้างรวม</span>
            <p className="text-lg sm:text-xl font-black text-gov-navy num-tabular">
              {formatNumber(dashboardStats.totalBudget)} <span className="text-[10px] font-medium text-neutral-slate">บาท</span>
            </p>
          </div>
          <span className="p-3 bg-gov-gold-light text-gov-gold rounded-xl group-hover:scale-105 transition-transform duration-300">
            <DollarSign className="w-4 h-4" />
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-premium border border-slate-100 hover:border-gov-gold/30 hover:shadow-floating transition-all duration-300 flex items-center justify-between relative overflow-hidden group">
          <span className="absolute left-0 top-0 bottom-0 w-1.5 bg-emerald-500"></span>
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-neutral-slate uppercase tracking-wider block">ตรวจผ่านเงินราชการ</span>
            <p className="text-lg sm:text-xl font-black text-status-passed num-tabular">
              {formatNumber(dashboardStats.passedBudget)} <span className="text-[10px] font-medium text-neutral-slate">บาท</span>
            </p>
          </div>
          <span className="p-3 bg-emerald-50 text-status-passed rounded-xl group-hover:scale-105 transition-transform duration-300">
            <CheckCircle className="w-4 h-4" />
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-premium border border-slate-100 hover:border-gov-gold/30 hover:shadow-floating transition-all duration-300 flex items-center justify-between relative overflow-hidden group">
          <span className="absolute left-0 top-0 bottom-0 w-1.5 bg-gov-blue"></span>
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-neutral-slate uppercase tracking-wider block">พัสดุผ่านเกณฑ์</span>
            <p className="text-lg sm:text-xl font-black text-gov-navy num-tabular">
              {dashboardStats.passedCount}/{dashboardStats.totalItems} <span className="text-[10px] font-medium text-neutral-slate">รายการ</span>
            </p>
          </div>
          <span className="p-3 bg-slate-50 text-gov-blue rounded-xl group-hover:scale-105 transition-transform duration-300">
            <Package className="w-4 h-4" />
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-premium border border-slate-100 hover:border-gov-gold/30 hover:shadow-floating transition-all duration-300 flex items-center justify-between relative overflow-hidden group">
          <span className="absolute left-0 top-0 bottom-0 w-1.5 bg-amber-400"></span>
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-neutral-slate uppercase tracking-wider block">รอการตรวจ / ไม่ผ่าน</span>
            <p className="text-lg sm:text-xl font-black text-status-pending num-tabular">
              {dashboardStats.pendingCount + dashboardStats.failedCount} <span className="text-[10px] font-medium text-neutral-slate">รายการ</span>
            </p>
          </div>
          <span className="p-3 bg-amber-50 text-status-pending rounded-xl group-hover:scale-105 transition-transform duration-300">
            <Clock className="w-4 h-4" />
          </span>
        </div>
      </div>

      {/* Progress Section */}
      <div className="bg-white p-6 rounded-2xl shadow-premium border border-slate-100 space-y-4 relative z-10">
        <div className="flex justify-between items-center text-xs sm:text-sm">
          <span className="font-bold text-gov-navy">ความก้าวหน้าการตรวจทานโครงการ</span>
          <span className="font-black text-gov-blue num-tabular">{progressPct}% ({dashboardStats.passedCount}/{dashboardStats.totalItems} รายการ)</span>
        </div>
        <div className="relative w-full bg-slate-100 h-3 rounded-full overflow-hidden border border-slate-200/50 shadow-inner">
          <div 
            className="h-full bg-gradient-to-r from-gov-navy via-gov-blue to-gov-gold rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${progressPct}%` }}
          ></div>
        </div>
      </div>

      {/* Executive Panel: Donut, Trend Line and Gauge */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
        
        {/* Category Budget Allocation (Donut Chart) */}
        <div className="bg-white p-6 rounded-2xl shadow-premium border border-slate-100 space-y-5">
          <h4 className="text-[10px] font-bold text-neutral-slate uppercase tracking-wider flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-gov-gold" />
            การกระจายงบประมาณตามหมวดพัสดุ (คลิกเพื่อเจาะลึกข้อมูล)
          </h4>
          <SvgDonutChart data={dashboardStats.categoryData} onSelect={onCategorySelect} />
        </div>

        {/* Division Progress Line Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-premium border border-slate-100 space-y-5">
          <h4 className="text-[10px] font-bold text-neutral-slate uppercase tracking-wider flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-gov-blue" />
            งบประมาณจัดซื้อแยกตามกลุ่มงาน (คลิกเพื่อเจาะลึกข้อมูล)
          </h4>
          <SvgLineChart data={dashboardStats.divisionData} onSelect={onDivisionSelect} />
        </div>

        {/* Risk Index Gauge */}
        <RiskGauge 
          failedCount={dashboardStats.failedCount} 
          duplicateCount={duplicateSerialCount} 
          pendingCount={dashboardStats.pendingCount}
        />

      </div>

      {/* Insight Engine Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
        
        {/* Left Side: Insight list */}
        <div className="bg-white p-6 rounded-2xl shadow-premium border border-slate-100 md:col-span-2 space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-xs sm:text-sm font-bold text-gov-navy flex items-center gap-2">
              <span className="w-1.5 h-4 bg-gov-gold rounded-full"></span>
              ระบบสรุปข้อวิเคราะห์อัตโนมัติ (Insight Engine)
            </h3>
          </div>

          <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
            {insights.length > 0 ? (
              insights.map((ins, idx) => (
                <div 
                  key={idx} 
                  className={`p-4 rounded-xl border flex gap-3 text-xs leading-relaxed transition-all ${
                    ins.type === 'critical' ? 'bg-rose-50 border-rose-100 text-rose-900' :
                    ins.type === 'warning' ? 'bg-amber-50 border-amber-100 text-amber-900' :
                    ins.type === 'info' ? 'bg-slate-50 border-slate-100 text-neutral-charcoal' : 'bg-emerald-50 border-emerald-100 text-emerald-900'
                  }`}
                >
                  <div className="shrink-0 mt-0.5">
                    {ins.type === 'critical' ? <AlertOctagon className="w-5 h-5 text-status-failed" /> :
                     ins.type === 'warning' ? <AlertTriangle className="w-5 h-5 text-status-pending" /> :
                     ins.type === 'info' ? <Info className="w-5 h-5 text-gov-blue" /> : <Award className="w-5 h-5 text-status-passed" />}
                  </div>
                  <div className="space-y-1">
                    <span className="font-bold block text-gov-navy">{ins.title}</span>
                    <p className="text-neutral-slate">{ins.message}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center p-8 text-neutral-slate font-medium text-xs">
                ไม่พบข้อสังเกตหรือสิ่งผิดปกติในโครงการตรวจรับ
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Recommendations Accordion/List */}
        <div className="bg-white p-6 rounded-2xl shadow-premium border border-slate-100 space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-xs sm:text-sm font-bold text-gov-navy flex items-center gap-2">
              <span className="w-1.5 h-4 bg-gov-gold rounded-full"></span>
              ข้อแนะนำลำดับความสำคัญ (Recommendations)
            </h3>
          </div>

          <div className="space-y-3.5 max-h-[350px] overflow-y-auto pr-1">
            {recommendations.length > 0 ? (
              recommendations.map((rec, idx) => (
                <div 
                  key={idx} 
                  className="p-3.5 bg-neutral-warm border border-slate-200/40 rounded-xl space-y-2 hover:border-gov-gold/30 transition-colors"
                >
                  <div className="flex justify-between items-start gap-2">
                    <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider ${
                      rec.type === 'critical-action' ? 'bg-rose-500 text-white' :
                      rec.type === 'high-priority' ? 'bg-amber-500 text-white' : 'bg-gov-blue text-white'
                    }`}>
                      {rec.type === 'critical-action' ? 'เร่งด่วนที่สุด' : rec.type === 'high-priority' ? 'สำคัญสูง' : 'คำแนะนำ'}
                    </span>
                    <button
                      onClick={() => {
                        const itemObj = items.find(i => i.id === rec.targetId);
                        if (itemObj) onItemClick(itemObj);
                      }}
                      className="text-[10px] font-bold text-gov-gold hover:underline cursor-pointer"
                    >
                      เปิดพัสดุ #{rec.targetId} →
                    </button>
                  </div>
                  <h5 className="text-xs font-bold text-gov-navy leading-tight">{rec.title}</h5>
                  <p className="text-[10px] text-neutral-slate leading-relaxed">{rec.description}</p>
                </div>
              ))
            ) : (
              <div className="text-center p-8 text-neutral-slate font-medium text-xs">
                ไม่มีข้อแนะนำค้างการดำเนินการ
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Priority Inspection Queue */}
      <div className="bg-white p-6 rounded-2xl shadow-premium border border-slate-100 space-y-4 relative z-10">
        <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
          <h3 className="text-xs sm:text-sm font-bold text-gov-navy flex items-center gap-2">
            <span className="w-1.5 h-4 bg-gov-gold rounded-full"></span>
            คิวงานตรวจสอบและเดินเผชิญสัญญาล่าสุด
          </h3>
          <span className="text-[10px] text-neutral-slate font-bold">จัดเรียงตามมูลค่างบจัดซื้อ</span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-neutral-slate font-bold">
                <th className="py-2.5 w-12 text-center">ID</th>
                <th className="py-2.5 text-left pl-2">รายการพัสดุคอมพิวเตอร์</th>
                <th className="py-2.5 w-24 text-center">กลุ่มงาน</th>
                <th className="py-2.5 w-32 text-right pr-2">งบประมาณจัดซื้อ</th>
                <th className="py-2.5 w-28 text-center">สถานะ</th>
              </tr>
            </thead>
            <tbody>
              {priorityItems.map(item => (
                <tr 
                  key={item.id}
                  onClick={() => onItemClick(item)}
                  className="border-b border-slate-50 hover:bg-slate-50/70 transition-all cursor-pointer font-medium"
                >
                  <td className="py-3 font-bold text-center text-gov-gold num-tabular">#{item.id}</td>
                  <td className="py-3 text-gov-navy font-bold pl-2 truncate max-w-[280px]" title={item.name}>{item.name}</td>
                  <td className="py-3 text-center text-neutral-slate">กลุ่มงาน{item.division}</td>
                  <td className="py-3 text-right font-black text-gov-blue pr-2 num-tabular">{formatNumber(item.qty * item.unit_price)} บาท</td>
                  <td className="py-3 text-center">
                    <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded border ${
                      item.inspectStatus === 'passed' ? 'bg-emerald-50 text-status-passed border-emerald-200/50' :
                      item.inspectStatus === 'failed' ? 'bg-rose-50 text-status-failed border-rose-200/50' : 'bg-amber-50 text-status-pending border-amber-200/50'
                    }`}>
                      {item.inspectStatus === 'passed' ? '🟢 ผ่านตรวจ' : item.inspectStatus === 'failed' ? '🔴 ไม่ผ่าน' : '🟡 รอตรวจ'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Committee Section */}
      <div className="bg-white p-6 rounded-2xl shadow-premium border border-slate-100 space-y-6 relative z-10">
        <div className="flex justify-between items-center border-b border-slate-100 pb-4">
          <div className="space-y-0.5">
            <h3 className="text-xs sm:text-sm font-bold text-gov-navy flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-gov-gold" />
              คณะกรรมการตรวจรับพัสดุตามคำสั่ง
            </h3>
            <p className="text-[10px] text-neutral-slate">คำสั่งเทศบาลนครนครสวรรค์ ที่ ๘๖๔/๒๕๖๙ (วันตรวจรับ 21 กรกฎาคม 2569)</p>
          </div>
          {!isEditingCommittee ? (
            <button 
              onClick={handleEditCommitteeStart}
              className="flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-gov-blue rounded-xl border border-slate-200/50 hover:border-slate-300 transition-all duration-300 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5 text-gov-gold" />
              แก้ไขรายชื่อ
            </button>
          ) : (
            <button 
              onClick={handleSaveCommittee}
              className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 bg-gov-blue hover:bg-gov-navy text-white rounded-xl shadow-sm transition-all duration-300 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              บันทึกข้อมูล
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {committee.map((member, index) => (
            <div key={index} className="p-5 bg-neutral-warm border border-slate-200/40 rounded-2xl relative overflow-hidden group hover:border-gov-gold/30 transition-colors duration-300">
              <span className="absolute top-0 right-0 w-24 h-24 bg-gov-gold-light rounded-full translate-x-12 -translate-y-12 z-0 opacity-40 group-hover:scale-110 transition-transform duration-500"></span>
              <div className="relative z-10 space-y-2.5">
                {isEditingCommittee ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[8px] font-bold text-neutral-slate uppercase tracking-wider mb-1">ชื่อ-นามสกุล</label>
                      <input 
                        type="text" 
                        value={editedCommittee[index]?.name || ''} 
                        onChange={(e) => handleEditCommitteeChange(index, 'name', e.target.value)}
                        className="w-full bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold text-neutral-charcoal focus:outline-none focus:border-gov-gold focus:ring-1 focus:ring-gov-gold"
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] font-bold text-neutral-slate uppercase tracking-wider mb-1">ตำแหน่งตรวจรับ</label>
                      <input 
                        type="text" 
                        value={editedCommittee[index]?.position || ''} 
                        onChange={(e) => handleEditCommitteeChange(index, 'position', e.target.value)}
                        className="w-full bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold text-neutral-charcoal focus:outline-none focus:border-gov-gold focus:ring-1 focus:ring-gov-gold"
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <span className="inline-block text-[9px] font-bold text-gov-gold bg-gov-gold-light border border-gov-gold/20 px-2 py-0.5 rounded">
                      {index === 0 ? 'ประธานกรรมการ' : 'กรรมการตรวจรับ'}
                    </span>
                    <p className="text-sm font-bold text-gov-navy mt-1">{member.name}</p>
                    <p className="text-xs text-neutral-slate leading-relaxed">{member.position}</p>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Info Section */}
      <div className="bg-white p-6 rounded-2xl shadow-premium border border-slate-100 space-y-4 relative z-10">
        <h3 className="text-xs sm:text-sm font-bold text-gov-navy flex items-center gap-2 border-b border-slate-100 pb-3">
          <Info className="w-4.5 h-4.5 text-gov-gold" />
          ข้อแนะนำเชิงสัญญาระเบียบจัดซื้อภาครัฐ
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-neutral-slate leading-relaxed">
          <div className="space-y-1.5">
            <span className="font-bold text-gov-navy block">1. ความสมบูรณ์ของภาพหลักฐาน</span>
            <p>กรุณาตรวจสอบว่ามีภาพถ่ายหลักฐานพัสดุครบทั้ง 5 มิติ (ตัวสินค้า, Serial, ป้ายครุภัณฑ์, กล่อง และใบส่งของ) เพื่อประกอบรายงานแนบท้ายการเบิกจ่ายตามระเบียบกระทรวงการคลัง</p>
          </div>
          <div className="space-y-1.5">
            <span className="font-bold text-gov-navy block">2. การตรวจสอบ Serial & MAC</span>
            <p>สำหรับอุปกรณ์อิเล็กทรอนิกส์และเน็ตเวิร์ก จะต้องกรอกหมายเลข Serial Number และ MAC Address ลงระบบเพื่อควบคุมและลงทะเบียนทรัพย์สินภาครัฐอย่างแม่นยำ</p>
          </div>
          <div className="space-y-1.5">
            <span className="font-bold text-gov-navy block">3. การลงนามแนบท้ายรายงาน</span>
            <p>รายงาน PDF ที่พิมพ์จากระบบจะจัดหน้าตามระเบียบงานสารบรรณ โดยกรรมการ 3 ท่านต้องลงชื่อด้วยตนเองหลังผ่านการตรวจรับพัสดุครบถ้วน</p>
          </div>
        </div>
      </div>

    </div>
  );
}
