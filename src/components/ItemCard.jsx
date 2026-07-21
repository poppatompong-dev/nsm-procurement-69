import React from 'react';
import { 
  CheckCircle2, 
  Clock3, 
  XCircle, 
  MessageSquareCode, 
  MapPin, 
  Layers,
  Image as ImageIcon,
  Tag
} from 'lucide-react';
import { formatNumber } from '../utils/numberFormatter';
import CategoryMockup from './CategoryMockup';

export default function ItemCard({ item, onClick }) {
  const imageSrc = item.images?.product 
    ? (item.images.product.startsWith('data:') ? item.images.product : `./รูปภาพ/${item.images.product}`)
    : null;

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
      default: return c;
    }
  };

  return (
    <div 
      onClick={onClick}
      className="premium-3d-card bg-white rounded-2xl shadow-premium border border-slate-100 cursor-pointer flex flex-col justify-between overflow-hidden relative group"
    >
      {/* Visual indicator left strip */}
      <span className={`absolute left-0 top-0 bottom-0 w-1.5 ${
        item.inspectStatus === 'passed' ? 'bg-[#065f46]' :
        item.inspectStatus === 'failed' ? 'bg-[#991b1b]' : 'bg-amber-400'
      }`}></span>

      {/* Card Content Body */}
      <div className="p-5 flex gap-4 items-start pl-6 premium-3d-card-inner">
        
        {/* Left Thumbnail with high-end glass style */}
        <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 overflow-hidden relative group-hover:scale-[1.02] transition-transform duration-300 shadow-inner">
          {imageSrc ? (
            <img 
              src={imageSrc} 
              alt={item.name} 
              loading="lazy"
              className="w-full h-full object-cover"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          ) : (
            <CategoryMockup category={item.category} size="medium" />
          )}
        </div>

        {/* Right Info Section */}
        <div className="space-y-2 flex-1 min-w-0">
          
          {/* Badge Rows */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="bg-gov-gold-light text-gov-gold font-bold text-[9px] px-2 py-0.5 rounded border border-gov-gold/15">
              ID {item.id}
            </span>
            <span className="bg-slate-50 border border-slate-200/50 text-neutral-slate font-bold text-[9px] px-2 py-0.5 rounded flex items-center gap-1">
              <Layers className="w-2.5 h-2.5 text-gov-gold" />
              {getCategoryLabel(item.category)}
            </span>
            <span className="bg-slate-50 border border-slate-200/50 text-neutral-slate font-bold text-[9px] px-2 py-0.5 rounded flex items-center gap-1">
              <MapPin className="w-2.5 h-2.5 text-gov-blue" />
              {item.division}
            </span>
          </div>

          {/* Item Name */}
          <h4 className="text-xs sm:text-sm font-bold text-gov-navy line-clamp-2 leading-relaxed" title={item.name}>
            {item.name}
          </h4>

          {/* Price details */}
          <div className="flex items-baseline justify-between pt-1">
            <div>
              <span className="text-[9px] font-bold text-neutral-slate uppercase tracking-wider">มูลค่าจัดซื้อ: </span>
              <span className="text-xs sm:text-sm font-black text-gov-navy num-tabular">
                {formatNumber(item.qty * item.unit_price)} <span className="text-[10px] font-medium text-neutral-slate">บาท</span>
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-neutral-charcoal bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-lg">
                {item.qty} {item.unit}
              </span>
            </div>
          </div>

        </div>

      </div>

      {/* Footer status bar */}
      <div className="px-5 py-3 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between pl-6">
        
        {/* Status badges */}
        <div className="flex items-center gap-1.5">
          {item.inspectStatus === 'passed' ? (
            <span className="text-status-passed flex items-center gap-1 text-[11px] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-status-passed"></span>
              ผ่านการตรวจรับ
            </span>
          ) : item.inspectStatus === 'failed' ? (
            <span className="text-status-failed flex items-center gap-1 text-[11px] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-status-failed"></span>
              ไม่ผ่านเกณฑ์
            </span>
          ) : (
            <span className="text-status-pending flex items-center gap-1 text-[11px] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
              อยู่ระหว่างตรวจ
            </span>
          )}
        </div>

        {/* Note indicators */}
        <div className="flex items-center gap-2">
          {item.serial_number && (
            <span className="bg-slate-100 text-slate-500 font-bold text-[8px] px-1.5 py-0.5 rounded border border-slate-200/40 flex items-center gap-0.5">
              <Tag className="w-2.5 h-2.5 text-gov-gold" />
              S/N
            </span>
          )}
          {item.notes && (
            <span className="text-neutral-slate hover:text-gov-navy transition-colors flex items-center" title={item.notes}>
              <MessageSquareCode className="w-4 h-4 text-gov-gold" />
            </span>
          )}
        </div>

      </div>

    </div>
  );
}
