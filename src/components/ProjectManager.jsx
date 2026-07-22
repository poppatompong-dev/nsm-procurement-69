import React, { useState } from 'react';
import {
  FolderKanban,
  Plus,
  Copy,
  Download,
  Upload,
  Trash2,
  CheckCircle2,
  X,
  ArrowRight,
  Building2,
  Calendar,
  FileText,
  Hash
} from 'lucide-react';
import { inspectionRepository } from '../utils/inspectionRepository';

const emptyForm = { name: '', contractNumber: '', vendor: '', budgetYear: '', inspectionRound: 1, templateId: 'it-computer' };

export default function ProjectManager({ activeProjectId, onSwitchProject, onProjectCreated }) {
  const [projects, setProjects] = useState(() => inspectionRepository.listProjects());
  const [view, setView] = useState('list'); // 'list' | 'create' | 'clone'
  const [sourceProject, setSourceProject] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const templates = inspectionRepository.getTemplates();

  const refresh = () => setProjects(inspectionRepository.listProjects());

  const updateForm = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const startCreate = () => {
    setForm(emptyForm);
    setView('create');
  };

  const startClone = (project) => {
    setSourceProject(project);
    setForm({
      name: `${project.name} (รอบใหม่)`,
      contractNumber: '',
      vendor: project.vendor || '',
      budgetYear: '',
      inspectionRound: (project.inspectionRound || 1) + 1,
      templateId: project.templateId
    });
    setView('clone');
  };

  const cancelForm = () => {
    setSourceProject(null);
    setForm(emptyForm);
    setView('list');
  };

  const handleCreateSubmit = () => {
    if (!form.name.trim()) {
      alert('กรุณากรอกชื่อโครงการ');
      return;
    }
    const meta = inspectionRepository.createProject({ ...form, activate: true });
    if (meta) {
      cancelForm();
      onProjectCreated?.(meta.id);
    }
  };

  const handleCloneSubmit = () => {
    if (!form.name.trim()) {
      alert('กรุณากรอกชื่อโครงการ');
      return;
    }
    const meta = inspectionRepository.cloneProject(sourceProject.id, { ...form, activate: true });
    if (meta) {
      cancelForm();
      onProjectCreated?.(meta.id);
    }
  };

  const handleSwitch = (id) => {
    if (id === activeProjectId) return;
    onSwitchProject?.(id);
  };

  const handleDelete = (project) => {
    if (projects.length <= 1) return;
    if (!window.confirm(`ต้องการลบโครงการ "${project.name}" ใช่หรือไม่? ข้อมูลรายการพัสดุ คณะกรรมการ และประวัติการตรวจทั้งหมดของโครงการนี้จะถูกลบถาวร`)) return;

    const result = inspectionRepository.deleteProject(project.id);
    if (result.success) {
      refresh();
      if (project.id === activeProjectId && result.newActiveProjectId) {
        onSwitchProject?.(result.newActiveProjectId);
      }
    }
  };

  const handleExport = (project) => {
    const bundle = inspectionRepository.exportProjectData(project.id);
    if (!bundle) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(bundle, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `project_${project.name}_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const bundle = JSON.parse(e.target.result);
        const meta = inspectionRepository.importProjectData(bundle);
        if (meta) {
          refresh();
          alert(`นำเข้าโครงการ "${meta.name}" สำเร็จเรียบร้อย! เลือก "สลับมาใช้งาน" เพื่อเริ่มทำงานที่โครงการนี้`);
        } else {
          alert('ไฟล์นี้ไม่ใช่ไฟล์ส่งออกโครงการที่ถูกต้อง');
        }
      } catch (err) {
        console.error(err);
        alert('ไม่สามารถอ่านไฟล์นี้ได้ กรุณาตรวจสอบว่าเป็นไฟล์ JSON ที่ส่งออกจากระบบ');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl relative overflow-hidden shadow-premium border border-slate-800">
        <span className="absolute top-0 bottom-0 right-0 w-1.5 bg-gov-gold"></span>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <FolderKanban className="w-6 h-6 text-gov-gold" />
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-wider uppercase">Project Manager</h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">จัดการหลายโครงการตรวจรับและโคลนสำหรับรอบถัดไป</p>
            </div>
          </div>

          {view === 'list' && (
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-[11px] font-bold cursor-pointer transition-colors">
                <Upload className="w-3.5 h-3.5 text-gov-gold" />
                นำเข้าโครงการ (JSON)
                <input type="file" accept=".json" className="hidden" onChange={(e) => handleImportFile(e.target.files[0])} />
              </label>
              <button
                onClick={startCreate}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-gov-gold text-gov-navy rounded-xl text-[11px] font-black cursor-pointer hover:brightness-95 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                สร้างโครงการใหม่
              </button>
            </div>
          )}
        </div>
      </div>

      {/* List view */}
      {view === 'list' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map(project => {
            const isActive = project.id === activeProjectId;
            const items = inspectionRepository.getItems(undefined, project.id);
            const template = inspectionRepository.getTemplateById(project.templateId);

            return (
              <div
                key={project.id}
                className={`bg-white p-5 rounded-2xl border shadow-premium space-y-4 transition-all duration-300 ${
                  isActive ? 'border-gov-gold shadow-floating' : 'border-slate-100 hover:border-gov-gold/30'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-xs sm:text-sm font-bold text-gov-navy leading-snug">{project.name}</h3>
                  {isActive && (
                    <span className="shrink-0 flex items-center gap-1 bg-gov-gold text-gov-navy text-[9px] font-black uppercase px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3" /> ใช้งานอยู่
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2.5 text-[10px] text-neutral-slate">
                  <div className="flex items-center gap-1.5"><FileText className="w-3 h-3 text-gov-gold shrink-0" /> {project.contractNumber || 'ไม่ระบุเลขที่สัญญา'}</div>
                  <div className="flex items-center gap-1.5"><Building2 className="w-3 h-3 text-gov-gold shrink-0" /> {project.vendor || 'ไม่ระบุผู้ขาย'}</div>
                  <div className="flex items-center gap-1.5"><Calendar className="w-3 h-3 text-gov-gold shrink-0" /> ปีงบ {project.budgetYear || '-'}</div>
                  <div className="flex items-center gap-1.5"><Hash className="w-3 h-3 text-gov-gold shrink-0" /> ครั้งที่ตรวจ {project.inspectionRound || 1}</div>
                </div>

                <div className="flex items-center justify-between text-[10px] bg-slate-50 rounded-xl p-2.5 border border-slate-100">
                  <span className="font-bold text-neutral-slate">{template?.name || project.templateId}</span>
                  <span className="font-black text-gov-navy num-tabular">{items.length} รายการ</span>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1 border-t border-slate-50">
                  <button
                    onClick={() => handleSwitch(project.id)}
                    disabled={isActive}
                    className={`flex-1 flex items-center justify-center gap-1 px-2 py-2 rounded-lg text-[10px] font-bold transition-colors ${
                      isActive ? 'bg-slate-50 text-slate-300 cursor-not-allowed' : 'bg-gov-navy text-white hover:bg-slate-800 cursor-pointer'
                    }`}
                  >
                    <ArrowRight className="w-3 h-3" /> สลับมาใช้งาน
                  </button>
                  <button
                    onClick={() => startClone(project)}
                    title="โคลนโครงการนี้สำหรับรอบตรวจถัดไป"
                    className="px-2.5 py-2 bg-slate-100 hover:bg-slate-200 text-gov-navy rounded-lg cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => handleExport(project)}
                    title="ส่งออกโครงการเป็นไฟล์ JSON"
                    className="px-2.5 py-2 bg-slate-100 hover:bg-slate-200 text-gov-navy rounded-lg cursor-pointer"
                  >
                    <Download className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => handleDelete(project)}
                    disabled={projects.length <= 1}
                    title={projects.length <= 1 ? 'ไม่สามารถลบโครงการสุดท้ายได้' : 'ลบโครงการนี้'}
                    className={`px-2.5 py-2 rounded-lg ${
                      projects.length <= 1 ? 'bg-slate-50 text-slate-300 cursor-not-allowed' : 'bg-rose-50 hover:bg-rose-100 text-status-failed cursor-pointer'
                    }`}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Clone form */}
      {(view === 'create' || view === 'clone') && (
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-premium space-y-6 max-w-2xl">
          <div className="flex items-center justify-between border-b pb-3">
            <h3 className="text-sm font-bold text-gov-navy uppercase tracking-wider flex items-center gap-1.5">
              {view === 'clone' ? <><Copy className="w-5 h-5 text-gov-gold" /> โคลนโครงการ: {sourceProject?.name}</> : <><Plus className="w-5 h-5 text-gov-gold" /> สร้างโครงการใหม่</>}
            </h3>
            <button onClick={cancelForm} className="text-slate-400 hover:text-slate-700 cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>

          {view === 'clone' && (
            <div className="p-3.5 bg-slate-50 border border-slate-200/50 rounded-xl text-[11px] text-neutral-slate leading-relaxed">
              ระบบจะคัดลอก <strong className="text-gov-navy">แม่แบบตรวจรับ</strong> และ <strong className="text-gov-navy">รายชื่อคณะกรรมการ</strong> จากโครงการเดิมให้อัตโนมัติ
              รายการพัสดุจะเริ่มต้นว่างเปล่า — หลังบันทึกให้ไปที่เมนู <strong className="text-gov-navy">"นำเข้าสเปกพัสดุ"</strong> เพื่ออัปโหลดใบเสนอราคาของรอบใหม่
              <div className="flex flex-wrap gap-1.5 mt-2">
                <span className="bg-white border border-slate-200 px-2 py-1 rounded-lg font-bold">แม่แบบ: {inspectionRepository.getTemplateById(sourceProject?.templateId)?.name}</span>
                <span className="bg-white border border-slate-200 px-2 py-1 rounded-lg font-bold">คณะกรรมการ: {inspectionRepository.getCommittee(sourceProject?.id).length} ท่าน</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1 md:col-span-2">
              <label className="block font-bold text-neutral-slate">ชื่อโครงการ</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => updateForm('name', e.target.value)}
                placeholder="เช่น ตรวจรับครุภัณฑ์คอมพิวเตอร์ ปีงบ 2570"
                className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-semibold focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="block font-bold text-neutral-slate">เลขที่สัญญา</label>
              <input
                type="text"
                value={form.contractNumber}
                onChange={(e) => updateForm('contractNumber', e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-semibold focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="block font-bold text-neutral-slate">ผู้ขาย/คู่สัญญา</label>
              <input
                type="text"
                value={form.vendor}
                onChange={(e) => updateForm('vendor', e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-semibold focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="block font-bold text-neutral-slate">ปีงบประมาณ</label>
              <input
                type="text"
                value={form.budgetYear}
                onChange={(e) => updateForm('budgetYear', e.target.value)}
                placeholder="เช่น 2570"
                className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-semibold focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="block font-bold text-neutral-slate">ครั้งที่ตรวจรับ</label>
              <input
                type="number"
                min="1"
                value={form.inspectionRound}
                onChange={(e) => updateForm('inspectionRound', Number(e.target.value) || 1)}
                className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-semibold focus:outline-none"
              />
            </div>

            {view === 'create' && (
              <div className="space-y-1 md:col-span-2">
                <label className="block font-bold text-neutral-slate">แม่แบบการตรวจรับ</label>
                <select
                  value={form.templateId}
                  onChange={(e) => updateForm('templateId', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-semibold focus:outline-none cursor-pointer"
                >
                  {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <button onClick={cancelForm} className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-neutral-slate rounded-xl text-xs font-bold cursor-pointer">
              ยกเลิก
            </button>
            <button
              onClick={view === 'clone' ? handleCloneSubmit : handleCreateSubmit}
              className="px-6 py-2.5 bg-gov-navy hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-premium cursor-pointer"
            >
              {view === 'clone' ? 'โคลนและเริ่มโครงการใหม่' : 'สร้างโครงการ'}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
