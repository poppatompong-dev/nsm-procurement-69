import React from 'react';
import { Search, Filter, RotateCcw, HelpCircle } from 'lucide-react';

export default function Filters({ 
  searchQuery, 
  setSearchQuery, 
  categoryFilter, 
  setCategoryFilter, 
  divisionFilter, 
  setDivisionFilter, 
  statusFilter, 
  setStatusFilter,
  hasNotesFilter,
  setHasNotesFilter,
  hasImageFilter,
  setHasImageFilter,
  minPrice,
  setMinPrice,
  maxPrice,
  setMaxPrice,
  handleResetFilters,
  categories,
  divisions
}) {
  return (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-4 print:hidden">
      
      {/* Search Input */}
      <div className="relative">
        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
          <Search className="w-4 h-4" />
        </span>
        <input 
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="ค้นหาตามชื่อพัสดุ, ยี่ห้อ, รุ่น, Serial Number, เลขครุภัณฑ์, หมวดหมู่, หรือกลุ่มงาน..."
          className="w-full bg-slate-50 border border-slate-200 pl-10 pr-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 transition-all placeholder-slate-400 text-slate-800"
        />
      </div>

      {/* Advanced Filters */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
        
        {/* Category Dropdown */}
        <div className="space-y-1">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">หมวดหมู่หลัก</label>
          <select 
            value={categoryFilter} 
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-600 transition-colors text-slate-700"
          >
            <option value="all">ทั้งหมด (ทุกหมวด)</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c === 'connectivity' ? '🔌 อุปกรณ์เชื่อมต่อ' :
                 c === 'storage' ? '💾 อุปกรณ์จัดเก็บ' :
                 c === 'peripherals' ? '🖱️ อุปกรณ์ต่อพ่วง' :
                 c === 'electronics' ? '🤖 อิเล็กทรอนิกส์' :
                 c === 'tools' ? '🛠️ เครื่องมือช่าง' :
                 c === 'organization' ? '📁 จัดระเบียบ' :
                 c === 'toner' ? '🖨️ หมึกพิมพ์' :
                 c === 'consumables' ? '🔋 วัสดุสิ้นเปลือง' : c}
              </option>
            ))}
          </select>
        </div>

        {/* Division Dropdown */}
        <div className="space-y-1">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">กลุ่มงานผู้เบิก</label>
          <select 
            value={divisionFilter} 
            onChange={(e) => setDivisionFilter(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-600 transition-colors text-slate-700"
          >
            <option value="all">ทั้งหมด (ทุกกลุ่มงาน)</option>
            {divisions.map((d) => (
              <option key={d} value={d}>📂 กลุ่มงาน{d}</option>
            ))}
          </select>
        </div>

        {/* Status Dropdown */}
        <div className="space-y-1">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">สถานะการตรวจรับ</label>
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-600 transition-colors text-slate-700"
          >
            <option value="all">ทั้งหมด (ทุกสถานะ)</option>
            <option value="passed">🟢 ผ่านการตรวจรับ (Passed)</option>
            <option value="pending">🟡 อยู่ระหว่างตรวจ (Pending)</option>
            <option value="failed">🔴 ไม่ผ่านเกณฑ์ (Failed)</option>
          </select>
        </div>

        {/* Image Attachment Dropdown */}
        <div className="space-y-1">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">ภาพถ่ายหลักฐาน</label>
          <select 
            value={hasImageFilter} 
            onChange={(e) => setHasImageFilter(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-600 transition-colors text-slate-700"
          >
            <option value="all">ทั้งหมด</option>
            <option value="yes">📸 มีรูปพัสดุประกอบ</option>
            <option value="no">❌ ยังไม่มีรูปพัสดุ</option>
          </select>
        </div>

        {/* Notes Dropdown */}
        <div className="space-y-1 col-span-2 md:col-span-1">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">หมายเหตุความเห็น</label>
          <select 
            value={hasNotesFilter} 
            onChange={(e) => setHasNotesFilter(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-600 transition-colors text-slate-700"
          >
            <option value="all">ทั้งหมด</option>
            <option value="yes">📝 มีบันทึกหมายเหตุ</option>
            <option value="no">❌ ไม่มีหมายเหตุ</option>
          </select>
        </div>

      </div>

      {/* Pricing Range Slider & Reset Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between pt-1 border-t border-slate-100">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">ช่วงราคาต่อหน่วย (บาท):</span>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <input 
              type="number"
              placeholder="Min"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="w-20 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg text-xs font-semibold focus:outline-none text-slate-700 focus:border-blue-600"
            />
            <span className="text-slate-400 text-xs">-</span>
            <input 
              type="number"
              placeholder="Max"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="w-24 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg text-xs font-semibold focus:outline-none text-slate-700 focus:border-blue-600"
            />
          </div>
        </div>

        <button 
          onClick={handleResetFilters}
          className="w-full sm:w-auto flex items-center justify-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 font-semibold px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100/80 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          ล้างตัวกรองทั้งหมด
        </button>
      </div>

    </div>
  );
}
