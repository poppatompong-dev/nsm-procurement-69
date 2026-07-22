import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Sparkles, 
  Download, 
  X, 
  Image as ImageIcon, 
  Search, 
  Eye, 
  Zap,
  Tag
} from 'lucide-react';
import { inspectionRepository } from '../utils/inspectionRepository';
import { formatNumber } from '../utils/numberFormatter';

export default function ImageMappingManager({ items, onUpdateItems, onClose }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPreviewImage, setSelectedPreviewImage] = useState(null);
  const [toast, setToast] = useState('');

  // Auto-Match All Items
  const handleAutoMatchAll = () => {
    const updated = inspectionRepository.autoMatchAllImages(items);
    onUpdateItems(updated);
    showToast('✨ ทำการจับคู่รูปภาพพัสดุครบ 49 รายการเรียบร้อยแล้ว (100% Match)');
  };

  // Export JSON file
  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(items, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "procurementData.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('💾 ดาวน์โหลดไฟล์ procurementData.json สำเร็จ!');
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.image && item.image.toLowerCase().includes(searchQuery.toLowerCase())) ||
    item.id.toString().includes(searchQuery)
  );

  const matchedCount = items.filter(item => Boolean(item.image)).length;

  return (
    <div className="fixed inset-0 bg-gov-navy/70 backdrop-blur-md z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fade-in">
      <div className="bg-white w-full max-w-6xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border border-slate-100">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-gov-navy via-slate-900 to-indigo-950 px-6 py-5 text-white flex justify-between items-center relative overflow-hidden">
          <div className="flex items-center gap-3.5 z-10">
            <div className="p-3 bg-gov-gold/20 backdrop-blur-md rounded-2xl border border-gov-gold/40 text-gov-gold">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                ระบบจัดจับคู่รูปภาพพัสดุอัตโนมัติ (Automated Photo Mapper)
              </h2>
              <p className="text-xs text-slate-300 font-medium mt-0.5">
                เชื่อมโยงหลักฐานรูปภาพพัสดุจริงเข้ากับรายการพัสดุจัดซื้อ 49 รายการของเทศบาลนครนครสวรรค์
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-2 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition-colors z-10"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Action Toolbar */}
        <div className="bg-slate-50 border-b border-slate-200/80 px-6 py-4 flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-emerald-50 border border-emerald-200/80 px-4 py-2 rounded-2xl flex items-center gap-2 text-emerald-800 font-bold text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>สถานะการจับคู่รูปภาพ: {matchedCount} / {items.length} รายการ ({(matchedCount / items.length * 100).toFixed(0)}%)</span>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text"
                placeholder="ค้นหาชื่อพัสดุ หรือชื่อไฟล์..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 w-64 focus:outline-none focus:ring-2 focus:ring-gov-navy/20 focus:border-gov-navy font-medium"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleAutoMatchAll}
              className="px-4 py-2.5 bg-gradient-to-r from-gov-gold via-amber-500 to-gov-gold text-slate-900 font-extrabold text-xs rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 active:scale-95"
            >
              <Zap className="w-4 h-4" />
              <span>สแกนแมปรูปภาพใหม่อัตโนมัติ</span>
            </button>

            <button
              onClick={handleExportJSON}
              className="px-4 py-2.5 bg-gov-navy hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 active:scale-95"
            >
              <Download className="w-4 h-4 text-gov-gold" />
              <span>ส่งออก procurementData.json</span>
            </button>
          </div>
        </div>

        {/* Toast Notification */}
        {toast && (
          <div className="bg-emerald-600 text-white text-xs font-bold px-6 py-2.5 text-center animate-fade-in flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            {toast}
          </div>
        )}

        {/* Main Grid View */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-100/50">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map((item) => (
              <div 
                key={item.id} 
                className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-2 gap-2">
                    <span className="text-[11px] font-black px-2.5 py-0.5 bg-gov-navy text-white rounded-lg">
                      ลำดับ #{item.id}
                    </span>
                    <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg flex items-center gap-1">
                      <Tag className="w-3 h-3 text-slate-400" />
                      {item.division}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-slate-800 line-clamp-2 mb-3 leading-snug">
                    {item.name}
                  </h3>

                  {/* Image Preview Box */}
                  <div className="relative aspect-video bg-slate-100 rounded-xl overflow-hidden border border-slate-200 mb-3 flex items-center justify-center group">
                    {item.image ? (
                      <>
                        <img 
                          src={`/รูปภาพ/${item.image}`} 
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                        <div className="hidden absolute inset-0 bg-slate-100 flex-col items-center justify-center text-slate-400 p-2 text-center">
                          <ImageIcon className="w-8 h-8 mb-1 text-slate-300" />
                          <span className="text-[10px]">ไม่พบไฟล์รูป ({item.image})</span>
                        </div>
                        <button 
                          onClick={() => setSelectedPreviewImage(`/รูปภาพ/${item.image}`)}
                          className="absolute inset-0 bg-gov-navy/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1.5 backdrop-blur-[2px]"
                        >
                          <Eye className="w-4 h-4" />
                          <span>ดูรูปขนาดเต็ม</span>
                        </button>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-400 p-4 text-center">
                        <ImageIcon className="w-8 h-8 mb-1 text-slate-300" />
                        <span className="text-xs font-semibold text-slate-500">ยังไม่ได้จับคู่รูปภาพ</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Info */}
                <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs">
                  <div className="font-semibold text-slate-500">
                    จำนวน: <span className="font-bold text-slate-800">{formatNumber(item.qty)} {item.unit}</span>
                  </div>
                  <div className="font-mono text-[11px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md">
                    {item.image || 'ไม่มีรูปภาพ'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Image Lightbox Modal */}
        {selectedPreviewImage && (
          <div 
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in"
            onClick={() => setSelectedPreviewImage(null)}
          >
            <div className="relative max-w-4xl max-h-[90vh] bg-slate-900 p-2 rounded-2xl overflow-hidden shadow-2xl">
              <img 
                src={selectedPreviewImage} 
                alt="Full Preview" 
                className="w-full h-full object-contain rounded-xl max-h-[85vh]"
              />
              <button 
                onClick={() => setSelectedPreviewImage(null)}
                className="absolute top-4 right-4 p-2 bg-black/60 text-white rounded-full hover:bg-black"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
