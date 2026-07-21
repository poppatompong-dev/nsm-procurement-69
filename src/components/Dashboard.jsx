import React, { useState, useEffect, useRef } from 'react';
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
  Boxes
} from 'lucide-react';
import { formatNumber } from '../utils/numberFormatter';

const BAR_COLORS = ['#1c2541', '#2c3e6b', '#3d5a80', '#5c80a6', '#98c1d9', '#adc5d9', '#cbd5e1', '#e2e8f0'];

// 3D Procurement Ecosystem Topology Renderer using Canvas
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
      const height = canvas.height = canvas.offsetHeight || 180;
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
        // Rotate around Y axis
        const rx = n.x * Math.cos(rad) - n.z * Math.sin(rad);
        const rz = n.x * Math.sin(rad) + n.z * Math.cos(rad);
        
        // Perspective projection
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

      // Draw glowing lines to center hub node
      const center = { x: width / 2, y: height / 2 };
      ctx.strokeStyle = 'rgba(28, 37, 65, 0.2)';
      projected.forEach(p => {
        ctx.beginPath();
        ctx.moveTo(center.x, center.y);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
      });

      // Draw projected nodes
      projected.forEach((p, idx) => {
        // Draw pulse ring
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

        // Node Label tags
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
      <canvas ref={canvasRef} className="w-full h-full max-w-[280px] max-h-[180px]" />
    </div>
  );
}

export default function Dashboard({ 
  stats, 
  committee, 
  isEditingCommittee, 
  editedCommittee, 
  handleEditCommitteeStart, 
  handleEditCommitteeChange, 
  handleSaveCommittee,
  items,
  onItemClick
}) {
  const progressPct = stats.totalItems > 0 
    ? Math.round((stats.passedCount / stats.totalItems) * 100) 
    : 0;

  // Filter top 6 items with highest values or pending statuses for quick triage
  const priorityItems = items
    .slice()
    .sort((a, b) => {
      // Prioritize failed, then pending, then passed
      const statusWeight = { failed: 0, pending: 1, passed: 2 };
      if (statusWeight[a.inspectStatus] !== statusWeight[b.inspectStatus]) {
        return statusWeight[a.inspectStatus] - statusWeight[b.inspectStatus];
      }
      // Then prioritize highest cost
      return (b.qty * b.unit_price) - (a.qty * a.unit_price);
    })
    .slice(0, 6);

  return (
    <div className="space-y-8 print:hidden animate-fade-in">
      
      {/* Immersive Landing Command Center Hero Banner */}
      <div className="relative bg-gradient-to-r from-gov-navy via-slate-900 to-gov-blue rounded-3xl p-6 sm:p-8 overflow-hidden border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6 shadow-floating">
        
        {/* Parallax ecosystem background dots */}
        <div className="absolute inset-0 bg-dots opacity-5 pointer-events-none z-0"></div>
        <span className="absolute bottom-0 left-0 right-0 h-1 bg-gov-gold"></span>

        {/* Left Side: Command center info details */}
        <div className="space-y-4 max-w-xl relative z-10 text-white">
          <div className="flex items-center gap-2">
            <span className="bg-gov-gold/20 text-gov-gold text-[9px] font-black border border-gov-gold/30 px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
              <Zap className="w-3 h-3 text-gov-gold animate-bounce" />
              Digital Command Center
            </span>
            <span className="bg-emerald-500/20 text-emerald-400 text-[9px] font-black border border-emerald-500/30 px-2.5 py-1 rounded-full uppercase tracking-wider">
              ONLINE
            </span>
          </div>

          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-black tracking-wide text-slate-100">ระบบตรวจสอบพัสดุภาครัฐอัจฉริยะ</h1>
            <p className="text-xs text-slate-400 leading-relaxed font-medium">
              ศูนย์ปฏิบัติการตรวจรับวัสดุคอมพิวเตอร์ งบประมาณ พ.ศ. 2569 กองยุทธศาสตร์และงบประมาณ เทศบาลนครนครสวรรค์
            </p>
          </div>

          <div className="flex flex-wrap gap-4 pt-1.5 text-xs text-slate-300">
            <div className="flex items-center gap-1.5">
              <Boxes className="w-4.5 h-4.5 text-gov-gold" />
              <span>พัสดุจัดซื้อ: <strong className="text-white num-tabular">{stats.totalItems} รายการ</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4.5 h-4.5 text-emerald-400" />
              <span>ตรวจเสร็จแล้ว: <strong className="text-white num-tabular">{progressPct}%</strong></span>
            </div>
          </div>
        </div>

        {/* Right Side: Interactive 3D Topology Node */}
        <div className="w-full md:w-auto shrink-0 relative z-10">
          <div className="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-4 flex items-center justify-center relative shadow-inner">
            <Ecosystem3DViewer />
          </div>
        </div>

      </div>

      {/* 1. Summary Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Total Budget Card */}
        <div className="bg-white p-6 rounded-2xl shadow-premium border border-slate-100 hover:border-gov-gold/30 hover:shadow-floating transition-all duration-300 flex items-center justify-between relative overflow-hidden group">
          <span className="absolute left-0 top-0 bottom-0 w-1 bg-gov-gold"></span>
          <div className="space-y-2 relative z-10">
            <p className="text-[10px] sm:text-xs font-bold text-neutral-slate uppercase tracking-wider">งบประมาณจัดซื้อทั้งหมด</p>
            <p className="text-xl sm:text-2xl font-black text-gov-navy num-tabular">
              {formatNumber(stats.totalBudget)} <span className="text-xs sm:text-sm font-medium text-neutral-slate">บาท</span>
            </p>
            <div className="text-[10px] text-neutral-slate font-medium">
              คงค้าง: <span className="font-bold text-gov-blue num-tabular">{formatNumber(stats.remainingBudget)} บาท</span>
            </div>
          </div>
          <span className="p-3.5 bg-gov-gold-light text-gov-gold rounded-xl group-hover:scale-105 transition-transform duration-300">
            <DollarSign className="w-5 h-5" />
          </span>
        </div>

        {/* Total Items Card */}
        <div className="bg-white p-6 rounded-2xl shadow-premium border border-slate-100 hover:border-gov-gold/30 hover:shadow-floating transition-all duration-300 flex items-center justify-between relative overflow-hidden group">
          <span className="absolute left-0 top-0 bottom-0 w-1 bg-gov-blue"></span>
          <div className="space-y-2 relative z-10">
            <p className="text-[10px] sm:text-xs font-bold text-neutral-slate uppercase tracking-wider">จำนวนรายการทั้งหมด</p>
            <p className="text-xl sm:text-2xl font-black text-gov-navy num-tabular">
              {stats.totalItems} <span className="text-xs sm:text-sm font-medium text-neutral-slate">รายการ</span>
            </p>
            <div className="text-[10px] text-neutral-slate font-medium">
              มีโน้ตหมายเหตุ: <span className="font-bold text-status-pending num-tabular">{stats.hasNotesCount} รายการ</span>
            </div>
          </div>
          <span className="p-3.5 bg-slate-50 text-gov-blue rounded-xl group-hover:scale-105 transition-transform duration-300">
            <Package className="w-5 h-5" />
          </span>
        </div>

        {/* Passed Status Card */}
        <div className="bg-white p-6 rounded-2xl shadow-premium border border-slate-100 hover:border-gov-gold/30 hover:shadow-floating transition-all duration-300 flex items-center justify-between relative overflow-hidden group">
          <span className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500"></span>
          <div className="space-y-2 relative z-10">
            <p className="text-[10px] sm:text-xs font-bold text-neutral-slate uppercase tracking-wider">ตรวจผ่านแล้ว (Passed)</p>
            <p className="text-xl sm:text-2xl font-black text-status-passed num-tabular">
              {stats.passedCount} <span className="text-xs sm:text-sm font-medium text-emerald-600/70">รายการ</span>
            </p>
            <div className="text-[10px] text-emerald-600 font-bold num-tabular">
              สำเร็จ {progressPct}% ของทั้งหมด
            </div>
          </div>
          <span className="p-3.5 bg-emerald-50 text-status-passed rounded-xl group-hover:scale-105 transition-transform duration-300">
            <CheckCircle className="w-5 h-5" />
          </span>
        </div>

        {/* Failed / Pending Card */}
        <div className="bg-white p-6 rounded-2xl shadow-premium border border-slate-100 hover:border-gov-gold/30 hover:shadow-floating transition-all duration-300 flex items-center justify-between relative overflow-hidden group">
          <span className="absolute left-0 top-0 bottom-0 w-1 bg-amber-400"></span>
          <div className="space-y-2 relative z-10">
            <p className="text-[10px] sm:text-xs font-bold text-neutral-slate uppercase tracking-wider">อยู่ระหว่างตรวจ / ไม่ผ่าน</p>
            <p className={`text-xl sm:text-2xl font-black num-tabular ${stats.pendingCount + stats.failedCount > 0 ? 'text-status-pending' : 'text-gov-navy'}`}>
              {stats.pendingCount + stats.failedCount} <span className="text-xs sm:text-sm font-medium text-neutral-slate">รายการ</span>
            </p>
            <div className="text-[10px] text-neutral-slate font-medium">
              ไม่ผ่านเกณฑ์: <span className="font-bold text-status-failed num-tabular">{stats.failedCount} รายการ</span>
            </div>
          </div>
          <span className={`p-3.5 rounded-xl group-hover:scale-105 transition-transform duration-300 ${stats.pendingCount + stats.failedCount > 0 ? 'bg-amber-50 text-status-pending' : 'bg-slate-50 text-slate-400'}`}>
            <Clock className="w-5 h-5" />
          </span>
        </div>

      </div>

      {/* 2. Visual Progress Bar with glowing orb effects */}
      <div className="bg-white p-6 rounded-2xl shadow-premium border border-slate-100 space-y-4">
        <div className="flex justify-between items-center text-xs sm:text-sm">
          <span className="font-bold text-gov-navy">ความก้าวหน้าการตรวจสอบรวมโครงการ</span>
          <span className="font-black text-gov-blue num-tabular">{progressPct}% ({stats.passedCount}/{stats.totalItems} รายการ)</span>
        </div>
        <div className="relative w-full bg-slate-100 h-3.5 rounded-full overflow-hidden border border-slate-200/50 shadow-inner">
          <div 
            className="h-full bg-gradient-to-r from-gov-navy via-gov-blue to-gov-gold rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${progressPct}%` }}
          ></div>
        </div>
      </div>

      {/* 3. Priority Work Queue (Interactive List with Detail Modal clicks) */}
      <div className="bg-white p-6 rounded-2xl shadow-premium border border-slate-100 space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h3 className="text-xs sm:text-sm font-bold text-gov-navy flex items-center gap-2">
            <span className="w-1.5 h-4 bg-gov-gold rounded-full"></span>
            คิวงานตรวจสอบด่วน (คลิกรายการพัสดุเพื่อเปิดหน้าต่างตรวจสอบทันที)
          </h3>
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

      {/* 4. Charts & Distributions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Division Breakdown */}
        <div className="bg-white p-6 rounded-2xl shadow-premium border border-slate-100 lg:col-span-2 space-y-5">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <h3 className="text-xs sm:text-sm font-bold text-gov-navy flex items-center gap-2">
              <span className="w-1.5 h-4 bg-gov-gold rounded-full"></span>
              งบประมาณจัดซื้อแยกตามกลุ่มงานผู้เบิกใช้
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 rounded text-neutral-slate">จำแนกตามพัสดุ</span>
          </div>
          
          <div className="space-y-4">
            {stats.divisionData.map((item, idx) => {
              const maxVal = Math.max(...stats.divisionData.map(d => d.value)) || 1;
              const pct = (item.value / maxVal) * 100;
              return (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-neutral-charcoal">ฝ่ายงาน{item.name}</span>
                    <span className="font-bold text-gov-blue num-tabular">{formatNumber(item.value)} บาท</span>
                  </div>
                  <div className="w-full bg-slate-50 h-2 rounded-full overflow-hidden border border-slate-100">
                    <div 
                      className="h-full rounded-full transition-all duration-700 ease-out" 
                      style={{ 
                        width: `${pct}%`,
                        backgroundColor: BAR_COLORS[idx % BAR_COLORS.length]
                      }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white p-6 rounded-2xl shadow-premium border border-slate-100 space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-xs sm:text-sm font-bold text-gov-navy flex items-center gap-2">
              <span className="w-1.5 h-4 bg-gov-gold rounded-full"></span>
              หมวดหมู่วัสดุจัดซื้อหลัก (งบประมาณ)
            </h3>
          </div>

          <div className="space-y-4 overflow-y-auto max-h-[300px] pr-1">
            {stats.categoryData.map((item, idx) => {
              const maxVal = Math.max(...stats.categoryData.map(c => c.value)) || 1;
              const pct = (item.value / maxVal) * 100;
              return (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-neutral-slate truncate max-w-[150px]" title={item.name}>{item.name}</span>
                    <span className="font-bold text-gov-navy num-tabular">{formatNumber(item.value)} บาท</span>
                  </div>
                  <div className="w-full bg-slate-50 h-1.5 rounded-full overflow-hidden border border-slate-100">
                    <div 
                      className="h-full rounded-full bg-slate-400"
                      style={{ 
                        width: `${pct}%`,
                        backgroundColor: BAR_COLORS[(idx + 2) % BAR_COLORS.length]
                      }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* 5. Committee Section */}
      <div className="bg-white p-6 rounded-2xl shadow-premium border border-slate-100 space-y-6">
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
              className="flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-gov-blue rounded-xl border border-slate-200/50 hover:border-slate-300 transition-all duration-300"
            >
              <Edit3 className="w-3.5 h-3.5 text-gov-gold" />
              แก้ไขรายชื่อ
            </button>
          ) : (
            <button 
              onClick={handleSaveCommittee}
              className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 bg-gov-blue hover:bg-gov-navy text-white rounded-xl shadow-sm transition-all duration-300"
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

      {/* 6. Info Section */}
      <div className="bg-white p-6 rounded-2xl shadow-premium border border-slate-100 space-y-4">
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
