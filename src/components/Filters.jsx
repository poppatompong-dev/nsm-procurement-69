import React from 'react';
import { Search, Filter, RotateCcw, LayoutGrid, List, Table2 } from 'lucide-react';

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
  divisions,
  sortBy,
  setSortBy,
  viewMode,
  setViewMode
}) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-premium border border-slate-100 space-y-5 print:hidden">
      
      {/* Search Input */}
      <div className="relative">
        <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
          <Search className="w-4 h-4 text-gov-gold" />
        </span>
        <input 
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="ค้นหาวัสดุคอมพิวเตอร์ตามชื่อสเปก, Serial, เลขครุภัณฑ์, หมวดหมู่, หรือฝ่ายเบิก..."
          className="w-full bg-slate-50 border border-slate-200 pl-11 pr-4 py-3 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:bg-white focus:ring-2 focus:ring-gov-gold/15 focus:border-gov-gold transition-all text-neutral-charcoal placeholder-slate-400"
        />
      </div>

      {/* Advanced Filters Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        
        {/* Category Dropdown */}
        <div className="space-y-1.5">
          <label className="block text-[9px] font-bold text-neutral-slate uppercase tracking-wider">หมวดหมู่จัดซื้อ</label>
          <select 
            value={categoryFilter} 
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-semibold focus:outline-none focus:border-gov-gold focus:bg-white transition-all text-neutral-charcoal"
          >
            <option value="all">ทั้งหมด (ทุกหมวด)</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c === 'connectivity' ? '🔌 เชื่อมต่อ' :
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
        <div className="space-y-1.5">
          <label className="block text-[9px] font-bold text-neutral-slate uppercase tracking-wider">กลุ่มงานผู้เบิก</label>
          <select 
            value={divisionFilter} 
            onChange={(e) => setDivisionFilter(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-semibold focus:outline-none focus:border-gov-gold focus:bg-white transition-all text-neutral-charcoal"
          >
            <option value="all">ทั้งหมด (ทุกกลุ่มงาน)</option>
            {divisions.map((d) => (
              <option key={d} value={d}>📂 กลุ่มงาน{d}</option>
            ))}
          </select>
        </div>

        {/* Status Dropdown */}
        <div className="space-y-1.5">
          <label className="block text-[9px] font-bold text-neutral-slate uppercase tracking-wider">สถานะการตรวจสอบ</label>
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-semibold focus:outline-none focus:border-gov-gold focus:bg-white transition-all text-neutral-charcoal"
          >
            <option value="all">ทั้งหมด (ทุกสถานะ)</option>
            <option value="passed">🟢 ผ่านการตรวจรับ</option>
            <option value="pending">🟡 รอตรวจสอบ</option>
            <option value="failed">🔴 ไม่ผ่านเกณฑ์</option>
          </select>
        </div>

        {/* Image Attachment Dropdown */}
        <div className="space-y-1.5">
          <label className="block text-[9px] font-bold text-neutral-slate uppercase tracking-wider">เอกสารภาพถ่าย</label>
          <select 
            value={hasImageFilter} 
            onChange={(e) => setHasImageFilter(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-semibold focus:outline-none focus:border-gov-gold focus:bg-white transition-all text-neutral-charcoal"
          >
            <option value="all">ทั้งหมด</option>
            <option value="yes">📸 มีรูปภาพหลักฐาน</option>
            <option value="no">❌ ยังไม่มีภาพถ่าย</option>
          </select>
        </div>

        {/* Notes Dropdown */}
        <div className="space-y-1.5 col-span-2 lg:col-span-1">
          <label className="block text-[9px] font-bold text-neutral-slate uppercase tracking-wider">หมายเหตุกรรมการ</label>
          <select 
            value={hasNotesFilter} 
            onChange={(e) => setHasNotesFilter(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-semibold focus:outline-none focus:border-gov-gold focus:bg-white transition-all text-neutral-charcoal"
          >
            <option value="all">ทั้งหมด</option>
            <option value="yes">📝 มีข้อสังเกต</option>
            <option value="no">❌ ไม่มีหมายเหตุ</option>
          </select>
        </div>

      </div>

      {/* Pricing Range Slider & Sorting & View Mode */}
      <div className="flex flex-col lg:flex-row gap-4 items-center justify-between pt-4 border-t border-slate-100">
        
        {/* Price Slider */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <span className="text-[10px] font-bold text-neutral-slate uppercase tracking-wider whitespace-nowrap">ช่วงราคาต่อหน่วย (บาท):</span>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <input 
              type="number"
              placeholder="ราคาต่ำสุด"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="w-24 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold focus:outline-none focus:border-gov-gold focus:bg-white text-neutral-charcoal transition-colors num-tabular"
            />
            <span className="text-slate-400 text-xs">-</span>
            <input 
              type="number"
              placeholder="ราคาสูงสุด"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="w-28 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold focus:outline-none focus:border-gov-gold focus:bg-white text-neutral-charcoal transition-colors num-tabular"
            />
          </div>
        </div>

        {/* Sorting & Views */}
        <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto justify-end">
          
          {/* Sorting Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-neutral-slate uppercase tracking-wider">จัดเรียง:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-slate-50 border border-slate-200 px-3.5 py-1.5 rounded-xl text-xs font-bold focus:outline-none focus:border-gov-gold focus:bg-white text-neutral-charcoal"
            >
              <option value="id-asc">ลำดับ (น้อย ไป มาก)</option>
              <option value="id-desc">ลำดับ (มาก ไป น้อย)</option>
              <option value="price-desc">งบจัดซื้อ (สูง ไป ต่ำ)</option>
              <option value="price-asc">งบจัดซื้อ (ต่ำ ไป สูง)</option>
              <option value="name-asc">ชื่อพัสดุ (ก - ฮ)</option>
            </select>
          </div>

          {/* View Modes Toggle */}
          <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200/50">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${viewMode === 'grid' ? 'bg-gov-blue text-white shadow-sm font-bold' : 'text-neutral-slate hover:text-gov-navy'}`}
              title="มุมมองแบบการ์ด (Grid)"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${viewMode === 'list' ? 'bg-gov-blue text-white shadow-sm font-bold' : 'text-neutral-slate hover:text-gov-navy'}`}
              title="มุมมองแบบย่อ (List)"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${viewMode === 'table' ? 'bg-gov-blue text-white shadow-sm font-bold' : 'text-neutral-slate hover:text-gov-navy'}`}
              title="มุมมองตารางหนาแน่น (Table)"
            >
              <Table2 className="w-4 h-4" />
            </button>
          </div>

          {/* Reset Filters */}
          <button 
            onClick={handleResetFilters}
            className="flex items-center justify-center gap-1.5 text-xs text-neutral-slate hover:text-gov-navy font-bold px-3.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200/50 hover:bg-slate-100 hover:border-slate-300 transition-all duration-300"
          >
            <RotateCcw className="w-3.5 h-3.5 text-gov-gold" />
            ล้างตัวกรอง
          </button>
        </div>

      </div>

    </div>
  );
}
