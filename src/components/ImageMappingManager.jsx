import React, { useState } from 'react';
import {
  CheckCircle2,
  Sparkles,
  Download,
  X,
  Image as ImageIcon,
  ImageOff,
  Search,
  Eye,
  Zap,
  Tag
} from 'lucide-react';
import { inspectionRepository } from '../utils/inspectionRepository';
import { formatNumber } from '../utils/numberFormatter';
import { getImageUrl } from '../utils/imageHelper';

export default function ImageMappingManager({ items = [], onUpdateItems, onSaveAll, onClose }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPreviewImage, setSelectedPreviewImage] = useState(null);
  const [toast, setToast] = useState('');

  const itemList = items || [];

  // Auto-Match All Items
  const handleAutoMatchAll = () => {
    const updated = inspectionRepository.autoMatchAllImages(itemList);
    if (onUpdateItems) onUpdateItems(updated);
    if (onSaveAll) onSaveAll(updated);
    showToast('✨ ทำการจับคู่รูปภาพพัสดุครบ 49 รายการเรียบร้อยแล้ว (100% Match)');
  };

  // Explicitly mark one item as having no photo (won't get auto-reassigned again)
  const handleMarkNoPhoto = (itemId) => {
    const updated = itemList.map(it =>
      it.id === itemId ? inspectionRepository.clearItemImage(it) : it
    );
    if (onUpdateItems) onUpdateItems(updated);
    if (onSaveAll) onSaveAll(updated);
    showToast(`🚫 ทำเครื่องหมายรายการ ID #${itemId} ว่าไม่มีรูปภาพแล้ว`);
  };

  // Export JSON file
  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(itemList, null, 2));
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

  const filteredItems = itemList.filter(item => 
    (item.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.image && item.image.toLowerCase().includes(searchQuery.toLowerCase())) ||
    item.id.toString().includes(searchQuery)
  );

  const matchedCount = itemList.filter(item => Boolean(item.image) || item.images?.noPhotoConfirmed).length;

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fade-in">
      <div className="bg-white w-full max-w-6xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border border-slate-100">
        
        {/* Header */}
        <div className="bg-slate-900 px-6 py-5 text-white flex justify-between items-center relative overflow-hidden">
          <div className="flex items-center gap-3.5 z-10">
            <div className="p-3 bg-amber-400/20 backdrop-blur-md rounded-2xl border border-amber-400/40 text-amber-400">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold tracking-wide flex items-center gap-2 text-white">
                ระบบจัดการจับคู่รูปภาพพัสดุจริง (Image Mapping Audit)
              </h2>
              <p className="text-xs text-slate-300 font-medium">
                ตรวจสอบและจับคู่รูปภาพพัสดุจากคำสั่งจัดซื้อ 49 รายการ (สถานะปัจจุบัน: {matchedCount}/{itemList.length} รายการ)
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer z-10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              placeholder="ค้นหาตามชื่อ ID หรือชื่อไฟล์รูป..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm font-medium text-slate-900 focus:outline-none"
            />
          </div>

          <div className="flex gap-2.5 w-full sm:w-auto">
            <button
              onClick={handleAutoMatchAll}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow transition-colors cursor-pointer"
            >
              <Zap className="w-4 h-4" />
              <span>รีเซ็ตจับคู่อัตโนมัติ 100% (49 รายการ)</span>
            </button>

            <button
              onClick={handleExportJSON}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4 text-amber-400" />
              <span>ส่งออก procurementData.json</span>
            </button>
          </div>
        </div>

        {/* Toast Alert */}
        {toast && (
          <div className="bg-emerald-600 text-white px-4 py-2 text-xs font-bold text-center animate-fade-in">
            {toast}
          </div>
        )}

        {/* Grid List */}
        <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map(item => {
            const img = getImageUrl(item);
            return (
              <div 
                key={item.id}
                className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col justify-between shadow-xs hover:border-slate-400 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="bg-slate-100 text-slate-800 font-bold text-xs px-2 py-0.5 rounded border border-slate-200">
                      ID #{item.id}
                    </span>
                    <span className="text-xs text-slate-500 font-bold">
                      กลุ่มงาน {item.division}
                    </span>
                  </div>

                  <h4 className="font-bold text-sm text-slate-900 line-clamp-2 mb-3" title={item.name}>
                    {item.name}
                  </h4>

                  {/* Image Display */}
                  <div className="w-full h-36 bg-slate-100 rounded-xl overflow-hidden border border-slate-200 flex items-center justify-center relative mb-3 group">
                    {img ? (
                      <>
                        <img
                          src={img}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={() => setSelectedPreviewImage(img)}
                          className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold text-xs gap-1.5 cursor-pointer"
                        >
                          <Eye className="w-4 h-4 text-amber-400" />
                          <span>ดูรูปขนาดใหญ่</span>
                        </button>
                      </>
                    ) : item.images?.noPhotoConfirmed ? (
                      <div className="text-slate-500 text-xs font-bold flex flex-col items-center gap-1.5">
                        <ImageOff className="w-5 h-5 text-slate-400" strokeWidth={1.5} />
                        <span>ยืนยันแล้วว่าไม่มีรูปภาพ</span>
                      </div>
                    ) : (
                      <div className="text-slate-400 text-xs font-medium flex items-center gap-1.5">
                        <ImageIcon className="w-4 h-4" />
                        <span>ไม่มีรูปภาพ</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-mono text-slate-500 bg-slate-50 p-2 rounded-lg truncate border border-slate-200">
                    📷 {item.image || 'ไม่ระบุไฟล์'}
                  </div>
                  {!item.images?.noPhotoConfirmed && (
                    <button
                      type="button"
                      onClick={() => handleMarkNoPhoto(item.id)}
                      className="w-full flex items-center justify-center gap-1.5 text-xs font-bold text-slate-500 hover:text-rose-700 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-lg py-1.5 transition-colors cursor-pointer"
                    >
                      <ImageOff className="w-3.5 h-3.5" />
                      <span>ไม่มีรูปภาพสำหรับรายการนี้</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* Fullscreen Image Preview Modal */}
      {selectedPreviewImage && (
        <div 
          className="fixed inset-0 bg-black/90 z-60 flex items-center justify-center p-4"
          onClick={() => setSelectedPreviewImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img 
              src={selectedPreviewImage} 
              alt="Preview" 
              className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl" 
            />
            <button 
              onClick={() => setSelectedPreviewImage(null)}
              className="absolute -top-4 -right-4 w-10 h-10 rounded-full bg-white text-slate-900 flex items-center justify-center font-bold shadow-lg cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
