import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

/**
 * Generic confirmation dialog for operations that change data for *every* device at
 * once (re-importing an item list, restoring a backup). Deliberately a real modal
 * rather than window.confirm so the consequences can be spelled out in full.
 */
export default function ConfirmActionModal({
  title,
  message,
  detail,
  confirmLabel = 'ยืนยัน',
  cancelLabel = 'ยกเลิก',
  tone = 'warning',
  isBusy = false,
  onConfirm,
  onClose
}) {
  const toneClasses = tone === 'danger'
    ? 'bg-rose-600 hover:bg-rose-500'
    : 'bg-amber-500 hover:bg-amber-400';

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4 print:hidden">
      <div className="bg-white w-full max-w-lg rounded-2xl border border-slate-200 shadow-2xl overflow-hidden">
        <div className="flex items-start justify-between gap-4 p-6 border-b border-slate-200">
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${tone === 'danger' ? 'bg-rose-50' : 'bg-amber-50'}`}>
              <AlertTriangle className={`w-5 h-5 ${tone === 'danger' ? 'text-rose-600' : 'text-amber-600'}`} />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">{title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{message}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        {detail && (
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 text-xs text-slate-700 leading-relaxed">
            {detail}
          </div>
        )}

        <div className="p-4 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isBusy}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={isBusy}
            className={`px-4 py-2.5 rounded-xl text-xs font-black text-white transition-colors cursor-pointer disabled:opacity-50 ${toneClasses}`}
          >
            {isBusy ? 'กำลังดำเนินการ...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
