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

export default function ItemCard({ item, onClick }) {
  // Safe image resolution
  const imageSrc = item.images?.product 
    ? `./รูปภาพ/${item.images.product}` 
    : null;

  // Render category badge with emoji
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
      className="bg-white rounded-2xl shadow-sm border border-slate-100 hover:border-blue-200 hover:shadow-md transition-all duration-300 cursor-pointer flex flex-col justify-between overflow-hidden relative group"
    >
      {/* Upper Color Strip for visual variety */}
      <span className={`h-1.5 w-full block ${
        item.inspectStatus === 'passed' ? 'bg-emerald-500' :
        item.inspectStatus === 'failed' ? 'bg-rose-500' : 'bg-amber-400'
      }`}></span>

      {/* Main card body */}
      <div className="p-4 sm:p-5 flex gap-4 items-start relative z-10 flex-1">
        
        {/* Left: Product Thumbnail */}
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 overflow-hidden relative group-hover:scale-105 transition-transform duration-300">
          {imageSrc ? (
            <img 
              src={imageSrc} 
              alt={item.name} 
              loading="lazy"
              className="w-full h-full object-cover"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          ) : (
            <div className="text-slate-300 flex flex-col items-center">
              <ImageIcon className="w-6 h-6 stroke-[1.5]" />
              <span className="text-[8px] font-semibold text-slate-400 mt-1 uppercase tracking-wider">No Photo</span>
            </div>
          )}
        </div>

        {/* Right: Product Details */}
        <div className="space-y-1.5 flex-1 min-w-0">
          
          {/* Header row: ID & Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-slate-100 text-slate-600 font-bold text-[10px] px-2 py-0.5 rounded-md">
              ID {item.id}
            </span>
            <span className="bg-blue-50 text-blue-700 font-bold text-[10px] px-2 py-0.5 rounded-md flex items-center gap-1">
              <Layers className="w-3 h-3" />
              {getCategoryLabel(item.category)}
            </span>
            <span className="bg-slate-50 border border-slate-200/50 text-slate-500 font-bold text-[10px] px-2 py-0.5 rounded-md flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {item.division}
            </span>
          </div>

          {/* Item Name */}
          <h4 className="text-xs sm:text-sm font-bold text-slate-800 line-clamp-2 leading-relaxed" title={item.name}>
            {item.name}
          </h4>

          {/* Price and Quantities */}
          <div className="flex items-baseline justify-between pt-1">
            <div>
              <span className="text-[10px] font-medium text-slate-400">ราคารวม: </span>
              <span className="text-xs sm:text-sm font-black text-slate-800">
                {formatNumber(item.qty * item.unit_price)} <span className="text-[10px] font-medium text-slate-400">บาท</span>
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-slate-600 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-md">
                {item.qty} {item.unit}
              </span>
            </div>
          </div>

        </div>

      </div>

      {/* Footer bar: Status & notes indicator */}
      <div className="px-4 sm:px-5 py-2.5 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
        
        {/* Status Badge */}
        <div className="flex items-center gap-1.5">
          {item.inspectStatus === 'passed' ? (
            <span className="text-emerald-600 flex items-center gap-1 text-[11px] font-bold">
              <CheckCircle2 className="w-3.5 h-3.5 fill-emerald-50" />
              ผ่านการตรวจรับ
            </span>
          ) : item.inspectStatus === 'failed' ? (
            <span className="text-rose-600 flex items-center gap-1 text-[11px] font-bold">
              <XCircle className="w-3.5 h-3.5 fill-rose-50" />
              ไม่ผ่านเกณฑ์
            </span>
          ) : (
            <span className="text-amber-500 flex items-center gap-1 text-[11px] font-bold">
              <Clock3 className="w-3.5 h-3.5 fill-amber-50" />
              อยู่ระหว่างตรวจ
            </span>
          )}
        </div>

        {/* Indicators on Notes & Serials */}
        <div className="flex items-center gap-2">
          {item.serial_number && (
            <span className="bg-slate-100 text-slate-500 font-bold text-[9px] px-1.5 py-0.5 rounded flex items-center gap-1" title="มีหมายเลขซีเรียล">
              <Tag className="w-2.5 h-2.5" />
              S/N
            </span>
          )}
          {item.notes && (
            <span className="text-slate-400 flex items-center gap-0.5 text-xs font-medium" title={item.notes}>
              <MessageSquareCode className="w-3.5 h-3.5" />
            </span>
          )}
        </div>

      </div>

    </div>
  );
}
