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
  Info,
  RotateCcw
} from 'lucide-react';
import { formatNumber } from '../utils/numberFormatter';

const COLORS = ['#1e3a8a', '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe', '#eff6ff'];

export default function Dashboard({ 
  stats, 
  committee, 
  isEditingCommittee, 
  editedCommittee, 
  handleEditCommitteeStart, 
  handleEditCommitteeChange, 
  handleSaveCommittee,
  handleResetDatabase
}) {
  const progressPct = stats.totalItems > 0 
    ? Math.round((stats.passedCount / stats.totalItems) * 100) 
    : 0;

  return (
    <div className="space-y-6 print:hidden">
      
      {/* 1. Summary Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        
        {/* Total Budget Card */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="space-y-1 relative z-10">
            <p className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider">งบประมาณจัดซื้อทั้งหมด</p>
            <p className="text-xl sm:text-2xl font-black text-slate-900">
              {formatNumber(stats.totalBudget)} <span className="text-xs sm:text-sm font-medium text-slate-400">บาท</span>
            </p>
            <div className="text-[9px] sm:text-[10px] text-slate-400 font-medium">
              คงเหลือที่ตรวจค้าง: <span className="font-bold text-blue-600">{formatNumber(stats.remainingBudget)} บาท</span>
            </div>
          </div>
          <span className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:scale-110 transition-transform">
            <DollarSign className="w-5 h-5" />
          </span>
        </div>

        {/* Total Items Card */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="space-y-1 relative z-10">
            <p className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider">จำนวนรายการทั้งหมด</p>
            <p className="text-xl sm:text-2xl font-black text-slate-900">
              {stats.totalItems} <span className="text-xs sm:text-sm font-medium text-slate-400">รายการ</span>
            </p>
            <div className="text-[9px] sm:text-[10px] text-slate-400 font-medium">
              มีหมายเหตุตรวจแก้: <span className="font-bold text-amber-600">{stats.hasNotesCount} รายการ</span>
            </div>
          </div>
          <span className="p-3 bg-slate-50 text-slate-600 rounded-xl group-hover:scale-110 transition-transform">
            <Package className="w-5 h-5" />
          </span>
        </div>

        {/* Passed Status Card */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="space-y-1 relative z-10">
            <p className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider">ตรวจผ่านแล้ว (Passed)</p>
            <p className="text-xl sm:text-2xl font-black text-emerald-600">
              {stats.passedCount} <span className="text-xs sm:text-sm font-medium text-emerald-500">รายการ</span>
            </p>
            <div className="text-[9px] sm:text-[10px] text-emerald-600/80 font-medium">
              คิดเป็นสัดส่วน: <span className="font-black">{progressPct}% ของทั้งหมด</span>
            </div>
          </div>
          <span className="p-3 bg-emerald-50 text-emerald-600 rounded-xl group-hover:scale-110 transition-transform">
            <CheckCircle className="w-5 h-5" />
          </span>
        </div>

        {/* Failed / Pending Card */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="space-y-1 relative z-10">
            <p className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider">อยู่ระหว่างตรวจ / ไม่ผ่าน</p>
            <p className={`text-xl sm:text-2xl font-black ${stats.pendingCount + stats.failedCount > 0 ? 'text-amber-500' : 'text-slate-900'}`}>
              {stats.pendingCount + stats.failedCount} <span className="text-xs sm:text-sm font-medium text-slate-400">รายการ</span>
            </p>
            <div className="text-[9px] sm:text-[10px] text-slate-400 font-medium">
              ไม่ผ่านเกณฑ์: <span className="font-bold text-rose-600">{stats.failedCount} รายการ</span>
            </div>
          </div>
          <span className={`p-3 rounded-xl group-hover:scale-110 transition-transform ${stats.pendingCount + stats.failedCount > 0 ? 'bg-amber-50 text-amber-500' : 'bg-slate-50 text-slate-400'}`}>
            <Clock className="w-5 h-5" />
          </span>
        </div>

      </div>

      {/* 2. Visual Progress Bar */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-100 space-y-3">
        <div className="flex justify-between items-center text-xs sm:text-sm">
          <span className="font-bold text-slate-700">ความก้าวหน้าในการตรวจรับรวมโครงการ</span>
          <span className="font-black text-blue-600">{progressPct}% ({stats.passedCount}/{stats.totalItems} รายการ)</span>
        </div>
        <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-700 to-blue-500 rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${progressPct}%` }}
          ></div>
        </div>
      </div>

      {/* 3. Charts & Distributions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Division Breakdown */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-100 lg:col-span-2 space-y-4">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-800 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-blue-700 rounded-full"></span>
              สัดส่วนงบประมาณจัดซื้อแยกตามกลุ่มงานเบิกใช้
            </h3>
            <p className="text-[10px] sm:text-xs text-slate-400 mt-1">แบ่งตามกลุ่มงานภายใต้กองยุทธศาสตร์และงบประมาณ</p>
          </div>
          
          <div className="space-y-4 py-2">
            {stats.divisionData.map((item, idx) => {
              const maxVal = Math.max(...stats.divisionData.map(d => d.value)) || 1;
              const pct = (item.value / maxVal) * 100;
              return (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="font-semibold text-slate-700">{item.name}</span>
                    <span className="font-bold text-blue-700">{formatNumber(item.value)} บาท</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-700 ease-out" 
                      style={{ 
                        width: `${pct}%`,
                        backgroundColor: COLORS[idx % COLORS.length]
                      }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-800 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-blue-700 rounded-full"></span>
              หมวดหมู่วัสดุจัดซื้อหลัก (งบประมาณ)
            </h3>
            <p className="text-[10px] sm:text-xs text-slate-400 mt-1">จำแนกตามประเภทพัสดุคอมพิวเตอร์</p>
          </div>

          <div className="space-y-4 overflow-y-auto max-h-[320px] pr-1">
            {stats.categoryData.map((item, idx) => {
              const maxVal = Math.max(...stats.categoryData.map(c => c.value)) || 1;
              const pct = (item.value / maxVal) * 100;
              return (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-slate-600 truncate max-w-[150px]" title={item.name}>{item.name}</span>
                    <span className="font-bold text-slate-800">{formatNumber(item.value)} บาท</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full bg-slate-400"
                      style={{ 
                        width: `${pct}%`,
                        backgroundColor: COLORS[(idx + 2) % COLORS.length]
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
      <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-800 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-blue-700" />
              คณะกรรมการตรวจรับพัสดุอย่างเป็นทางการ
            </h3>
            <p className="text-[10px] sm:text-xs text-slate-400 mt-1">ตามคำสั่งเทศบาลนครนครสวรรค์ ที่ ๘๖๔/๒๕๖๙ (ตรวจรับ 21 ก.ค. 2569)</p>
          </div>
          {!isEditingCommittee ? (
            <button 
              onClick={handleEditCommitteeStart}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg transition-colors border border-blue-100"
            >
              <Edit3 className="w-3.5 h-3.5" />
              แก้ไขรายชื่อ
            </button>
          ) : (
            <button 
              onClick={handleSaveCommittee}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg shadow-sm transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              บันทึกข้อมูล
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {committee.map((member, index) => (
            <div key={index} className="p-4 bg-slate-50 border border-slate-200/50 rounded-xl space-y-2 relative overflow-hidden">
              <span className="absolute top-0 right-0 w-20 h-20 bg-blue-50 rounded-full translate-x-10 -translate-y-10 opacity-60 z-0"></span>
              <div className="relative z-10">
                {isEditingCommittee ? (
                  <div className="space-y-2">
                    <div>
                      <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">ชื่อ-นามสกุล</label>
                      <input 
                        type="text" 
                        value={editedCommittee[index]?.name || ''} 
                        onChange={(e) => handleEditCommitteeChange(index, 'name', e.target.value)}
                        className="w-full bg-white border border-slate-200 px-2 py-1 rounded-lg text-xs focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">ตำแหน่งการตรวจรับ</label>
                      <input 
                        type="text" 
                        value={editedCommittee[index]?.position || ''} 
                        onChange={(e) => handleEditCommitteeChange(index, 'position', e.target.value)}
                        className="w-full bg-white border border-slate-200 px-2 py-1 rounded-lg text-xs focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-[9px] font-bold text-blue-600 tracking-wider">
                      {index === 0 ? 'ประธานกรรมการตรวจรับ' : 'กรรมการตรวจรับ'}
                    </p>
                    <p className="text-sm font-bold text-slate-800 mt-0.5">{member.name}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{member.position}</p>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Info Section */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-100">
        <h3 className="text-sm sm:text-base font-bold text-slate-800 mb-3 flex items-center gap-2">
          <Info className="w-5 h-5 text-blue-700" />
          คำแนะนำและข้อสังเกตในการใช้งานแพลตฟอร์มตรวจรับ
        </h3>
        <ul className="text-xs sm:text-sm text-slate-500 space-y-2 leading-relaxed">
          <li className="flex items-start gap-2">
            <span className="w-4 h-4 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">1</span>
            <span><strong>รายการตรวจสอบ (Checklist):</strong> เมื่อเปิดกล่องพัสดุ ให้ทำเครื่องหมายในรายการตรวจสอบย่อยให้ครบถ้วนทั้ง 8 ด้าน เมื่อเลือกครบระบบจะปรับเปลี่ยนสถานะการตรวจรับเป็น "ผ่านการตรวจรับ" ให้โดยอัตโนมัติ</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-4 h-4 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">2</span>
            <span><strong>การบันทึกภาพถ่ายหลายมิติ (Multi-image Evidence):</strong> คุณสามารถเชื่อมต่อภาพถ่ายพัสดุแยกตามประเภทเพื่อการบันทึกประวัติการตรวจสอบ เช่น รูปตัวสินค้า, รูปป้ายครุภัณฑ์หลวง, รูปป้าย Serial Number และรูปอุปกรณ์ในกล่อง</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-4 h-4 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">3</span>
            <span><strong>การแชร์สถานะการตรวจและพิมพ์:</strong> สามารถกดแชร์ลิงก์ Base64 ด้านบนส่งให้ผู้อื่น หรือเปิดแท็บ "ระบบออกรายงาน" เพื่อดาวน์โหลดไฟล์ Excel หรือพิมพ์เอกสารรายงานแบบทางการพร้อมตราครุฑได้ทันที</span>
          </li>
        </ul>
      </div>

    </div>
  );
}
