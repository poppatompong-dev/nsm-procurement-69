import React, { useState, useEffect } from 'react';
import { 
  X, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  MessageSquare, 
  Tag, 
  Upload, 
  MapPin, 
  Layers,
  Save,
  Check
} from 'lucide-react';
import { formatNumber } from '../utils/numberFormatter';
import CategoryMockup from './CategoryMockup';

export default function ItemDetailModal({ item, onClose, onSave }) {
  const [inspectStatus, setInspectStatus] = useState(item?.inspectStatus || 'pending');
  const [notes, setNotes] = useState(item?.notes || '');
  const [serialNumber, setSerialNumber] = useState(item?.serial_number || '');
  const [customImage, setCustomImage] = useState(item?.images?.product || item?.image || '');
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (item) {
      setInspectStatus(item.inspectStatus || 'pending');
      setNotes(item.notes || '');
      setSerialNumber(item.serial_number || '');
      setCustomImage(item.images?.product || item.image || '');
      setIsSaved(false);
    }
  }, [item]);

  if (!item) return null;

  const imageSrc = customImage
    ? (customImage.startsWith('data:') ? customImage : (customImage.startsWith('/') ? customImage : `./รูปภาพ/${customImage}`))
    : null;

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCustomImage(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const updatedItem = {
      ...item,
      inspectStatus,
      notes,
      serial_number: serialNumber,
      image: customImage,
      images: {
        ...item.images,
        product: customImage
      }
    };
    onSave(updatedItem);
    setIsSaved(true);
    setTimeout(() => {
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden my-8 animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="bg-amber-400 text-slate-950 font-black text-sm px-2.5 py-0.5 rounded-lg">
              รายการที่ #{item.id}
            </span>
            <h2 className="text-lg font-bold text-white truncate max-w-md">
              บันทึกผลการตรวจรับพัสดุ
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          
          {/* Main Top Section: Image & Key Details */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            
            {/* Left: Photo Container (5 cols) */}
            <div className="md:col-span-5 space-y-3">
              <div className="w-full h-64 bg-slate-100 rounded-2xl border border-slate-200 overflow-hidden relative flex items-center justify-center group shadow-inner">
                {imageSrc ? (
                  <img 
                    src={imageSrc} 
                    alt={item.name} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <CategoryMockup category={item.category} size="large" />
                )}
                
                {/* Upload Image Overlay */}
                <label className="absolute inset-0 bg-slate-900/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white cursor-pointer p-4 text-center">
                  <Upload className="w-8 h-8 mb-2 text-amber-400" />
                  <span className="text-xs font-bold">คลิกเพื่อเปลี่ยนรูปภาพหลักฐาน</span>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="text-center">
                <label className="text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer inline-flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
                  <Upload className="w-3.5 h-3.5" />
                  <span>เปลี่ยนรูปภาพถ่ายพัสดุจริง</span>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Right: Item Info (7 cols) */}
            <div className="md:col-span-7 space-y-4">
              
              <div className="flex flex-wrap gap-2">
                <span className="bg-slate-100 text-slate-700 font-bold text-xs px-2.5 py-1 rounded-lg border border-slate-200 flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-slate-500" />
                  หมวดหมู่: {item.category}
                </span>
                <span className="bg-slate-100 text-slate-700 font-bold text-xs px-2.5 py-1 rounded-lg border border-slate-200 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  กลุ่มงาน {item.division}
                </span>
              </div>

              <h3 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
                {item.name}
              </h3>

              {item.spec && (
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">คุณลักษณะเฉพาะ (Spec):</span>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal whitespace-pre-line">
                    {item.spec}
                  </p>
                </div>
              )}

              {/* Quantity & Budget info */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="bg-slate-100 p-3 rounded-xl border border-slate-200 text-center">
                  <span className="text-xs text-slate-500 block">จำนวนจัดซื้อ</span>
                  <span className="text-lg font-bold text-slate-900">{item.qty} {item.unit}</span>
                </div>
                <div className="bg-slate-100 p-3 rounded-xl border border-slate-200 text-center">
                  <span className="text-xs text-slate-500 block">งบประมาณรวม</span>
                  <span className="text-lg font-black text-slate-900 num-tabular">
                    {formatNumber(item.qty * item.unit_price)} <span className="text-xs font-normal text-slate-500">บาท</span>
                  </span>
                </div>
              </div>

            </div>

          </div>

          <hr className="border-slate-200" />

          {/* Inspection Decision Section */}
          <div className="space-y-4">
            
            <label className="text-sm font-bold text-slate-900 block">
              ผลการตรวจรับพัสดุรายการนี้:
            </label>

            {/* Status Option Cards */}
            <div className="grid grid-cols-3 gap-3">
              
              <button
                type="button"
                onClick={() => setInspectStatus('passed')}
                className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all cursor-pointer ${
                  inspectStatus === 'passed'
                    ? 'bg-emerald-600 text-white border-emerald-700 font-bold shadow-md scale-102'
                    : 'bg-white text-emerald-800 border-emerald-200 hover:bg-emerald-50'
                }`}
              >
                <CheckCircle2 className="w-7 h-7" />
                <span className="text-sm sm:text-base font-bold">🟢 ผ่านการตรวจรับ</span>
              </button>

              <button
                type="button"
                onClick={() => setInspectStatus('failed')}
                className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all cursor-pointer ${
                  inspectStatus === 'failed'
                    ? 'bg-rose-600 text-white border-rose-700 font-bold shadow-md scale-102'
                    : 'bg-white text-rose-800 border-rose-200 hover:bg-rose-50'
                }`}
              >
                <XCircle className="w-7 h-7" />
                <span className="text-sm sm:text-base font-bold">🔴 ตรวจไม่ผ่าน</span>
              </button>

              <button
                type="button"
                onClick={() => setInspectStatus('pending')}
                className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all cursor-pointer ${
                  inspectStatus === 'pending'
                    ? 'bg-amber-500 text-white border-amber-600 font-bold shadow-md scale-102'
                    : 'bg-white text-amber-800 border-amber-200 hover:bg-amber-50'
                }`}
              >
                <Clock className="w-7 h-7" />
                <span className="text-sm sm:text-base font-bold">🟡 อยู่ระหว่างตรวจ</span>
              </button>

            </div>

            {/* Serial Number Input */}
            <div>
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-1.5">
                <Tag className="w-4 h-4 text-slate-500" />
                หมายเลขพัสดุ / Serial Number (S/N):
              </label>
              <input 
                type="text"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                placeholder="เช่น SN-2026-88941..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            {/* Inspection Notes Input */}
            <div>
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-1.5">
                <MessageSquare className="w-4 h-4 text-slate-500" />
                ข้อคิดเห็น / หมายเหตุการตรวจรับ:
              </label>
              <textarea 
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="ระบุรายละเอียดเพิ่มเติม หรือข้อสังเกตของคณะกรรมการ..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3.5 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              ></textarea>
            </div>

          </div>

          {/* Footer Submit Buttons */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              {isSaved ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>บันทึกสำเร็จแล้ว</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 text-amber-400" />
                  <span>บันทึกผลการตรวจรับ</span>
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
