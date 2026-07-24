import React, { useState, useMemo } from 'react';
import { Activity, User, Package2, FolderKanban } from 'lucide-react';
import { inspectionRepository } from '../utils/inspectionRepository';

const TYPE_LABELS = {
  create: 'สร้างโครงการ',
  clone: 'โคลนโครงการ',
  import: 'นำเข้าโครงการ',
  delete: 'ลบโครงการ',
  excel_import: 'นำเข้าสเปกพัสดุ',
  reset: 'รีเซ็ตฐานข้อมูล',
  undo_reset: 'เรียกคืนข้อมูลก่อนรีเซ็ต',
  print: 'พิมพ์รายงาน',
  switch: 'สลับโครงการ',
  template_change: 'เปลี่ยนแม่แบบ',
  committee_update: 'แก้ไขคณะกรรมการ',
  custom_template: 'สร้างแม่แบบใหม่'
};

export default function ActivityLog({ activeProjectId }) {
  const [scopeFilter, setScopeFilter] = useState('all'); // 'all' | 'project' | 'item'
  const [actorInput, setActorInput] = useState(() => inspectionRepository.getCurrentActor(activeProjectId));

  const committee = inspectionRepository.getCommittee(activeProjectId);
  const items = inspectionRepository.getItems(undefined, activeProjectId);
  const projectEvents = inspectionRepository.getProjectEvents(activeProjectId);

  const timeline = useMemo(() => {
    const projectEntries = projectEvents.map(ev => ({
      timestamp: ev.timestamp,
      actor: ev.actor,
      scope: 'project',
      label: TYPE_LABELS[ev.type] || ev.type,
      description: ev.message
    }));

    const itemEntries = items.flatMap(item =>
      (item.history || []).map(log => ({
        timestamp: log.timestamp,
        actor: log.user,
        scope: 'item',
        itemName: item.name,
        itemId: item.id,
        label: log.action,
        description: `${log.field}: ${log.old_value || 'ว่าง'} → ${log.new_value || 'ว่าง'}`
      }))
    );

    return [...projectEntries, ...itemEntries].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }, [projectEvents, items]);

  const filtered = scopeFilter === 'all' ? timeline : timeline.filter(t => t.scope === scopeFilter);

  const handleActorChange = (name) => {
    setActorInput(name);
    inspectionRepository.setCurrentActor(name, activeProjectId);
  };

  return (
    <div className="space-y-6">

      <div className="bg-slate-900 text-white p-6 rounded-2xl relative overflow-hidden shadow-premium border border-slate-800">
        <span className="absolute top-0 bottom-0 right-0 w-1.5 bg-gov-gold"></span>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Activity className="w-6 h-6 text-gov-gold" />
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-wider uppercase">Activity Log</h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">ประวัติกิจกรรมทั้งหมดของโครงการ (Project &amp; Item Events)</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400 font-bold uppercase">คุณคือใคร:</span>
            <select
              value={actorInput}
              onChange={(e) => handleActorChange(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-white text-xs font-bold px-2.5 py-1.5 rounded-lg focus:outline-none cursor-pointer"
            >
              {committee.map(m => <option key={m.name} value={m.name}>{m.name}</option>)}
              {!committee.some(m => m.name === actorInput) && actorInput && (
                <option value={actorInput}>{actorInput}</option>
              )}
            </select>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {[
          { key: 'all', label: 'ทั้งหมด' },
          { key: 'project', label: 'ระดับโครงการ' },
          { key: 'item', label: 'ระดับรายการพัสดุ' }
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setScopeFilter(f.key)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              scopeFilter === f.key ? 'bg-gov-navy text-white shadow-sm' : 'bg-white border border-slate-200 text-neutral-slate hover:bg-slate-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-premium p-2 space-y-1.5 max-h-[600px] overflow-y-auto">
        {filtered.length > 0 ? (
          filtered.map((entry, idx) => (
            <div key={idx} className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50/70 transition-colors border-b border-slate-50 last:border-b-0">
              <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                entry.scope === 'project' ? 'bg-gov-gold-light text-gov-gold' : 'bg-blue-50 text-gov-blue'
              }`}>
                {entry.scope === 'project' ? <FolderKanban className="w-4 h-4" /> : <Package2 className="w-4 h-4" />}
              </div>
              <div className="flex-1 min-w-0 space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap text-xs">
                  <span className="font-bold text-gov-navy">{entry.label}</span>
                  {entry.scope === 'item' && (
                    <span className="text-[9px] font-bold bg-slate-100 text-neutral-slate px-1.5 py-0.5 rounded">
                      #{entry.itemId} {entry.itemName}
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-neutral-slate flex items-center gap-1">
                  {entry.description}
                </div>
                <div className="flex items-center gap-1 text-[10px] text-slate-400 font-semibold">
                  <User className="w-2.5 h-2.5" /> {entry.actor}
                  <span className="mx-1">•</span>
                  <span className="num-tabular">{new Date(entry.timestamp).toLocaleString('th-TH', { hour12: false })}</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-16 text-xs text-slate-400 font-medium">
            ยังไม่มีประวัติกิจกรรมสำหรับโครงการนี้
          </div>
        )}
      </div>

    </div>
  );
}
