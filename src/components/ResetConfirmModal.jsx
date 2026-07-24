import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';

export default function ResetConfirmModal({ projectName, onConfirm, onClose }) {
  const [typedName, setTypedName] = useState('');
  const isMatch = typedName.trim() === (projectName || '').trim();

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden border border-slate-100 shadow-floating relative flex flex-col">
        <span className="h-1.5 w-full bg-rose-600"></span>

        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-50 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
            </div>
            <h3 className="text-sm sm:text-base font-black text-rose-700">ยืนยันการรีเซ็ตข้อมูลโครงการ</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-50 text-slate-400 hover:text-slate-600 rounded-xl transition-colors cursor-pointer"
            title="ยกเลิก"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            การรีเซ็ตจะลบรายการตรวจรับ รูปภาพหลักฐาน และรายชื่อคณะกรรมการของโครงการ
            <span className="font-bold text-slate-900"> "{projectName}" </span>
            กลับเป็นค่าเริ่มต้นทั้งหมด ระบบจะสำรองข้อมูลชุดปัจจุบันไว้ให้กู้คืนได้ 1 ครั้งที่หน้าตั้งค่า
            แต่หากรีเซ็ตซ้ำอีกครั้งข้อมูลที่สำรองไว้ก่อนหน้าจะถูกเขียนทับ
          </p>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-neutral-slate uppercase tracking-wider">
              พิมพ์ชื่อโครงการ "{projectName}" เพื่อยืนยัน
            </label>
            <input
              type="text"
              autoFocus
              value={typedName}
              onChange={(e) => setTypedName(e.target.value)}
              placeholder={projectName}
              className="w-full bg-slate-50 border border-slate-200 focus:border-rose-400 px-3.5 py-2.5 rounded-xl text-sm text-neutral-charcoal focus:outline-none"
            />
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-2.5">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            ยกเลิก
          </button>
          <button
            onClick={onConfirm}
            disabled={!isMatch}
            className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            รีเซ็ตข้อมูลถาวร
          </button>
        </div>
      </div>
    </div>
  );
}
