import React from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  MessageSquare, 
  MapPin, 
  Layers
} from 'lucide-react';
import { formatNumber } from '../utils/numberFormatter';
import CategoryMockup from './CategoryMockup';

export default function ItemCard({ item, onClick, onStatusChange }) {
  const imageSrc = item.images?.product 
    ? (item.images.product.startsWith('data:') ? item.images.product : `./รูปภาพ/${item.images.product}`)
    : (item.image ? (item.image.startsWith('data:') ? item.image : (item.image.startsWith('/') ? item.image : `./${item.image}`)) : null);

  const getCategoryLabel = (c) => {
    switch (c) {
      case 'connectivity': return '🔌 เชื่อมต่อ';
      case 'storage': return '💾 จัดเก็บ';
      case 'peripherals': return '🖱️ อุปกรณ์พ่วง';
      case 'electronics': return '🤖 บอร์ดควบคุม';
      case 'tools': return '🛠️ เครื่องมือช่าง';
      case 'organization': return '📁 จัดระเบียบ';
      case 'toner': return '🖨️ หมึกพิมพ์';
      case 'consumables': return '🔋 อะไหล่สิ้นเปลือง';
      default: return c || 'ทั่วไป';
    }
  };

  const handleStatusClick = (e, newStatus) => {
    e.stopPropagation(); // Prevent opening modal when clicking quick status toggle
    if (onStatusChange) {
      onStatusChange(item.id, newStatus);
    }
  };

  return (
    <div 
      className={`bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 border ${
        item.inspectStatus === 'passed' ? 'border-emerald-200' :
        item.inspectStatus === 'failed' ? 'border-rose-200' : 'border-slate-200'
      } flex flex-col justify-between overflow-hidden relative group`}
    >
      {/* Status top indicator accent */}
      <div className={`h-1.5 w-full ${
        item.inspectStatus === 'passed' ? 'bg-emerald-600' :
        item.inspectStatus === 'failed' ? 'bg-rose-600' : 'bg-amber-400'
      }`}></div>

      {/* Main Content Area */}
      <div 
        onClick={onClick}
        className="p-5 flex flex-col sm:flex-row gap-4 items-start cursor-pointer hover:bg-slate-50/50 transition-colors"
      >
        
        {/* Large Item Photo Thumbnail */}
        <div className="w-full sm:w-28 h-32 sm:h-28 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden relative group-hover:scale-[1.02] transition-transform duration-300 shadow-inner">
          {imageSrc ? (
            <img 
              src={imageSrc} 
              alt={item.name} 
              loading="lazy"
              className="w-full h-full object-cover"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          ) : (
            <CategoryMockup category={item.category} size="large" />
          )}
          <span className="absolute bottom-1.5 left-1.5 bg-black/70 text-white font-bold text-xs px-2 py-0.5 rounded backdrop-blur-xs">
            #{item.id}
          </span>
        </div>

        {/* Info & Spec Section */}
        <div className="space-y-2 flex-1 min-w-0 w-full">
          
          {/* Badge Row */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-slate-100 text-slate-700 font-bold text-xs px-2.5 py-1 rounded-lg border border-slate-200 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-slate-500" />
              {getCategoryLabel(item.category)}
            </span>
            <span className="bg-slate-100 text-slate-700 font-bold text-xs px-2.5 py-1 rounded-lg border border-slate-200 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-500" />
              กลุ่มงาน {item.division}
            </span>
          </div>

          {/* Item Name */}
          <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug line-clamp-2" title={item.name}>
            {item.name}
          </h3>

          {/* Spec snippet */}
          {item.spec && (
            <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 leading-relaxed font-normal">
              {item.spec}
            </p>
          )}

          {/* Quantity & Pricing */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-900 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">
                จำนวน {item.qty} {item.unit}
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-500 block">มูลค่ารวม</span>
              <span className="text-base sm:text-lg font-black text-slate-900 num-tabular">
                {formatNumber(item.qty * item.unit_price)} <span className="text-xs font-normal text-slate-500">บาท</span>
              </span>
            </div>
          </div>

        </div>

      </div>

      {/* Quick Status Action Bar */}
      <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
        
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          ผลการตรวจรับ:
        </span>

        {/* 1-Click Pass / Fail / Pending Toggles */}
        <div className="flex items-center gap-1.5">
          
          <button
            type="button"
            onClick={(e) => handleStatusClick(e, 'passed')}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 flex items-center gap-1.5 border ${
              item.inspectStatus === 'passed'
                ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm font-black scale-105'
                : 'bg-white text-emerald-700 border-emerald-300 hover:bg-emerald-50'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            ผ่าน
          </button>

          <button
            type="button"
            onClick={(e) => handleStatusClick(e, 'failed')}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 flex items-center gap-1.5 border ${
              item.inspectStatus === 'failed'
                ? 'bg-rose-600 text-white border-rose-700 shadow-sm font-black scale-105'
                : 'bg-white text-rose-700 border-rose-300 hover:bg-rose-50'
            }`}
          >
            <XCircle className="w-4 h-4" />
            ไม่ผ่าน
          </button>

          <button
            type="button"
            onClick={(e) => handleStatusClick(e, 'pending')}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 flex items-center gap-1.5 border ${
              item.inspectStatus === 'pending' || !item.inspectStatus
                ? 'bg-amber-500 text-white border-amber-600 shadow-sm font-black scale-105'
                : 'bg-white text-amber-700 border-amber-300 hover:bg-amber-50'
            }`}
          >
            <Clock className="w-4 h-4" />
            รอตรวจ
          </button>

        </div>

      </div>

      {/* Inspection Note Bar (If notes exist) */}
      {item.notes && (
        <div 
          onClick={onClick}
          className="px-5 py-2.5 bg-amber-50 border-t border-amber-200/60 text-xs sm:text-sm text-amber-900 font-medium flex items-center gap-2 cursor-pointer hover:bg-amber-100/60 transition-colors"
        >
          <MessageSquare className="w-4 h-4 text-amber-600 shrink-0" />
          <span className="truncate"><strong>หมายเหตุ:</strong> {item.notes}</span>
        </div>
      )}

    </div>
  );
}
