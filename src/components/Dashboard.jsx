import React from 'react';
import { 
  DollarSign, 
  Package, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  UserCheck, 
  Edit3, 
  Save, 
  Info
} from 'lucide-react';
import { formatNumber } from '../utils/numberFormatter';

const BAR_COLORS = ['#1c2541', '#2c3e6b', '#3d5a80', '#5c80a6', '#98c1d9', '#adc5d9', '#cbd5e1', '#e2e8f0'];

export default function Dashboard({ 
  stats, 
  committee, 
  isEditingCommittee, 
  editedCommittee, 
  handleEditCommitteeStart, 
  handleEditCommitteeChange, 
  handleSaveCommittee
}) {
  const progressPct = stats.totalItems > 0 
    ? Math.round((stats.passedCount / stats.totalItems) * 100) 
    : 0;

  return (
    <div className="space-y-8 print:hidden animate-fade-in">
      
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

      {/* 2. Visual Progress Bar */}
      <div className="bg-white p-6 rounded-2xl shadow-premium border border-slate-100 space-y-4">
        <div className="flex justify-between items-center text-xs sm:text-sm">
          <span className="font-bold text-gov-navy">ความก้าวหน้าการตรวจสอบรวมโครงการ</span>
          <span className="font-black text-gov-blue num-tabular">{progressPct}% ({stats.passedCount}/{stats.totalItems} รายการ)</span>
        </div>
        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-gov-navy via-gov-blue to-gov-gold rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${progressPct}%` }}
          ></div>
        </div>
      </div>

      {/* 3. Charts & Distributions */}
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

      {/* 4. Committee Section */}
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

      {/* 5. Info Section */}
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
