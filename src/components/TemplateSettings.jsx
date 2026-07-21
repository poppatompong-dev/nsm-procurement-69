import React, { useState } from 'react';
import { 
  Settings, 
  Layers, 
  Plus, 
  Trash2, 
  CheckCircle, 
  Sliders, 
  FileText, 
  UserCheck, 
  ArrowRight,
  Eye
} from 'lucide-react';
import { inspectionRepository } from '../utils/inspectionRepository';

export default function TemplateSettings({ onConfigChange }) {
  const templates = inspectionRepository.getTemplates();
  const currentConfig = inspectionRepository.getProjectConfig();
  const activeTemplate = inspectionRepository.getTemplateById(currentConfig.templateId);
  const currentCommittee = inspectionRepository.getCommittee();

  // Selected Active Template state
  const [selectedTemplateId, setSelectedTemplateId] = useState(currentConfig.templateId);

  // Committee Editor state
  const [committee, setCommittee] = useState(currentCommittee);

  // Custom Template Builder states
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateDesc, setNewTemplateDesc] = useState('');
  const [newTemplateId, setNewTemplateId] = useState('');
  
  const [customFields, setCustomFields] = useState([
    { key: 'serial_number', label: 'หมายเลขเครื่อง (Serial)', type: 'text', required: true }
  ]);
  const [customChecklist, setCustomChecklist] = useState([
    { id: 'qty_ok', label: 'จำนวนสินค้าตรงตามใบตรวจนับ', required: true }
  ]);
  const [customEvidence, setCustomEvidence] = useState([
    { key: 'product_photo', label: '📸 ภาพถ่ายสินค้าจริง' }
  ]);

  const [activeTab, setActiveTab] = useState('active-template'); // 'active-template', 'builder', 'committee'

  // Change active template
  const handleActiveTemplateChange = (id) => {
    setSelectedTemplateId(id);
    const selectedTemplate = templates.find(t => t.id === id);
    const newConfig = {
      ...currentConfig,
      templateId: id,
      projectTitle: `ระบบตรวจรับ${selectedTemplate ? selectedTemplate.name : 'พัสดุ'}อัจฉริยะ`
    };
    inspectionRepository.saveProjectConfig(newConfig);
    
    // Adapt database to include new checklist fields if missing
    const items = inspectionRepository.getItems();
    const adaptedItems = items.map(item => {
      const checklist = { ...item.checklist };
      selectedTemplate.checklist.forEach(chk => {
        if (checklist[chk.id] === undefined) {
          checklist[chk.id] = false;
        }
      });
      const images = { ...item.images };
      selectedTemplate.evidence.forEach(ev => {
        if (images[ev.key] === undefined) {
          images[ev.key] = '';
        }
      });
      return {
        ...item,
        checklist,
        images
      };
    });
    inspectionRepository.saveItems(adaptedItems);

    onConfigChange(newConfig);
    alert(`เปลี่ยนหัวข้อโครงการตรวจรับเป็น: "ระบบตรวจรับ${selectedTemplate?.name}" สำเร็จเรียบร้อย! ระบบจะปรับฟอร์มและรายงานอัตโนมัติ`);
  };

  // Add field to builder
  const addField = () => {
    setCustomFields([...customFields, { key: 'field_' + Date.now(), label: 'ฟิลด์ใหม่', type: 'text', required: false }]);
  };

  const removeField = (index) => {
    setCustomFields(customFields.filter((_, i) => i !== index));
  };

  const updateField = (index, key, val) => {
    setCustomFields(customFields.map((f, i) => i === index ? { ...f, [key]: val } : f));
  };

  // Add checklist item to builder
  const addChecklist = () => {
    setCustomChecklist([...customChecklist, { id: 'chk_' + Date.now(), label: 'หัวข้อการตรวจสอบใหม่', required: true }]);
  };

  const removeChecklist = (index) => {
    setCustomChecklist(customChecklist.filter((_, i) => i !== index));
  };

  const updateChecklist = (index, key, val) => {
    setCustomChecklist(customChecklist.map((c, i) => i === index ? { ...c, [key]: val } : c));
  };

  // Add evidence type to builder
  const addEvidence = () => {
    setCustomEvidence([...customEvidence, { key: 'ev_' + Date.now(), label: '📸 หลักฐานใหม่' }]);
  };

  const removeEvidence = (index) => {
    setCustomEvidence(customEvidence.filter((_, i) => i !== index));
  };

  const updateEvidence = (index, key, val) => {
    setCustomEvidence(customEvidence.map((e, i) => i === index ? { ...e, [key]: val } : e));
  };

  // Build custom template
  const handleSaveTemplate = () => {
    if (!newTemplateName || !newTemplateId) {
      alert('กรุณากรอกชื่อและรหัสแม่แบบที่จะสร้าง');
      return;
    }

    const newTemplate = {
      id: newTemplateId.trim().toLowerCase(),
      name: newTemplateName.trim(),
      description: newTemplateDesc.trim(),
      version: '1.0',
      fields: customFields.map(f => ({ ...f, key: f.key.trim() })),
      checklist: customChecklist.map(c => ({ ...c, id: c.id.trim() })),
      evidence: customEvidence.map(e => ({ ...e, key: e.key.trim() })),
      rules: []
    };

    inspectionRepository.saveCustomTemplate(newTemplate);
    alert(`สร้างแบบตรวจรับแม่แบบใหม่ "${newTemplate.name}" สำเร็จเรียบร้อย! สามารถเลือกสลับใช้งานได้ทันที`);
    
    // Reset builder states
    setNewTemplateName('');
    setNewTemplateDesc('');
    setNewTemplateId('');
    setActiveTab('active-template');
  };

  // Save committee edits
  const handleSaveCommittee = () => {
    inspectionRepository.saveCommittee(committee);
    alert('บันทึกรายชื่อคณะกรรมการตรวจรับใหม่ลงแบบฟอร์มการรายงานแล้ว');
  };

  const handleCommitteeChange = (index, key, value) => {
    setCommittee(committee.map((c, i) => i === index ? { ...c, [key]: value } : c));
  };

  return (
    <div className="space-y-6">
      
      {/* Settings Header Title */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl relative overflow-hidden shadow-premium border border-slate-800">
        <span className="absolute top-0 bottom-0 right-0 w-1.5 bg-gov-gold"></span>
        <div className="flex items-center gap-3">
          <Settings className="w-6 h-6 text-gov-gold animate-spin-slow" />
          <div>
            <h2 className="text-base sm:text-lg font-black tracking-wider uppercase">Configurator & Schema Manager</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">ส่วนควบคุมแบบตรวจรับและผู้มีอำนาจเซ็นอนุมัติของเทศบาล</p>
          </div>
        </div>
      </div>

      {/* Settings Navigation Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-px">
        <button
          onClick={() => setActiveTab('active-template')}
          className={`px-4 py-2.5 text-xs font-bold transition-colors cursor-pointer border-b-2 -mb-px ${
            activeTab === 'active-template' 
              ? 'border-gov-gold text-gov-navy font-black' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          ⚙️ สลับแบบตรวจโครงการ
        </button>
        <button
          onClick={() => setActiveTab('builder')}
          className={`px-4 py-2.5 text-xs font-bold transition-colors cursor-pointer border-b-2 -mb-px ${
            activeTab === 'builder' 
              ? 'border-gov-gold text-gov-navy font-black' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          🛠️ ออกแบบแม่แบบใหม่ (Form Builder)
        </button>
        <button
          onClick={() => setActiveTab('committee')}
          className={`px-4 py-2.5 text-xs font-bold transition-colors cursor-pointer border-b-2 -mb-px ${
            activeTab === 'committee' 
              ? 'border-gov-gold text-gov-navy font-black' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          👥 แก้ไขคณะกรรมการ
        </button>
      </div>

      {/* Tab 1: Template Selection */}
      {activeTab === 'active-template' && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* Left panel: Active Selection Dropdown */}
          <div className="md:col-span-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-premium space-y-4">
            <h3 className="text-xs font-bold text-gov-navy uppercase tracking-wider flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-gov-gold" /> เลือกสลับแม่แบบการตรวจรับ
            </h3>
            
            <div className="space-y-3">
              {templates.map(t => (
                <button
                  key={t.id}
                  onClick={() => handleActiveTemplateChange(t.id)}
                  className={`w-full text-left p-3.5 rounded-xl border text-xs transition-all flex justify-between items-start cursor-pointer ${
                    selectedTemplateId === t.id 
                      ? 'bg-gov-navy text-white border-gov-navy shadow-floating scale-[1.01]' 
                      : 'bg-slate-50 border-slate-200 text-neutral-slate hover:bg-slate-100/50'
                  }`}
                >
                  <div className="space-y-1">
                    <span className="font-bold block">{t.name}</span>
                    <span className={`text-[9px] block ${selectedTemplateId === t.id ? 'text-gov-gold' : 'text-slate-400'}`}>
                      {t.description || 'ไม่มีคำอธิบาย'}
                    </span>
                  </div>
                  <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${
                    selectedTemplateId === t.id ? 'bg-gov-gold text-gov-navy' : 'bg-slate-200 text-neutral-slate'
                  }`}>
                    v{t.version}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Right panel: Active Template Live Schema Preview */}
          <div className="md:col-span-8 bg-white p-5 rounded-2xl border border-slate-100 shadow-premium space-y-4">
            <h3 className="text-xs font-bold text-gov-navy uppercase tracking-wider flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-gov-gold" /> พรีวิวข้อกำหนดโครงการที่ใช้งานอยู่ (Active Schema Detail)
            </h3>
            
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/50">
                <div>
                  <span className="text-[9px] text-slate-400 block font-bold">ชื่อแม่แบบ</span>
                  <span className="font-bold text-gov-navy">{activeTemplate.name}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 block font-bold">รหัส ID ระบบ</span>
                  <span className="font-bold text-neutral-charcoal">{activeTemplate.id}</span>
                </div>
              </div>

              {/* Dynamic inputs preview */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-neutral-slate block uppercase tracking-wider">ฟิลด์ข้อกำหนดข้อมูล (Form Fields)</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {activeTemplate.fields.map(f => (
                    <div key={f.key} className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-center justify-between">
                      <span className="font-semibold text-neutral-charcoal">{f.label}</span>
                      <span className="text-[8px] font-bold bg-slate-200 px-1.5 py-0.5 rounded text-neutral-slate uppercase">
                        {f.type} {f.required && '*'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Checklists preview */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-neutral-slate block uppercase tracking-wider">เกณฑ์ตรวจเช็คความถูกต้อง (Checklist)</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {activeTemplate.checklist.map(c => (
                    <div key={c.id} className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                      <span className="font-semibold text-neutral-charcoal">{c.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Evidence tabs preview */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-neutral-slate block uppercase tracking-wider">ภาพและเอกสารพยานหลักฐาน (Evidence Attachments)</span>
                <div className="flex flex-wrap gap-1.5">
                  {activeTemplate.evidence.map(e => (
                    <span key={e.key} className="bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg font-semibold text-neutral-slate text-[10px]">
                      {e.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* Tab 2: Custom Template Builder */}
      {activeTab === 'builder' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-premium space-y-6">
          <h3 className="text-sm font-bold text-gov-navy uppercase tracking-wider flex items-center gap-1.5 border-b pb-3">
            <Plus className="w-5 h-5 text-gov-gold" /> ออกแบบสร้างแม่แบบแบบตรวจรับใหม่ (Interactive Form Builder)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="space-y-1">
              <label className="block font-bold text-neutral-slate">ชื่อแม่แบบตรวจรับ</label>
              <input
                type="text"
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
                placeholder="เช่น ตรวจรับระบบกล้องวงจรปิด CCTV"
                className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-semibold focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="block font-bold text-neutral-slate">รหัส ID แม่แบบ (ห้ามเว้นวรรค)</label>
              <input
                type="text"
                value={newTemplateId}
                onChange={(e) => setNewTemplateId(e.target.value)}
                placeholder="เช่น cctv-audit"
                className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-semibold focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="block font-bold text-neutral-slate">คำอธิบายย่อย</label>
              <input
                type="text"
                value={newTemplateDesc}
                onChange={(e) => setNewTemplateDesc(e.target.value)}
                placeholder="คำอธิบายขอบข่ายการตรวจรับย่อย"
                className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-semibold focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs pt-4">
            
            {/* Column 1: Input Fields Builder */}
            <div className="space-y-3 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
              <div className="flex justify-between items-center border-b pb-2">
                <span className="font-bold text-gov-navy uppercase tracking-wider">1. ฟิลด์กรอกข้อมูลหลัก</span>
                <button 
                  onClick={addField}
                  className="bg-gov-gold/20 hover:bg-gov-gold/30 text-gov-navy font-bold px-2 py-1 rounded text-[10px] cursor-pointer"
                >
                  + เพิ่มฟิลด์
                </button>
              </div>

              <div className="space-y-2.5 max-h-[250px] overflow-y-auto">
                {customFields.map((field, index) => (
                  <div key={index} className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={field.label}
                        onChange={(e) => updateField(index, 'label', e.target.value)}
                        placeholder="ชื่อฟิลด์"
                        className="flex-1 border-b border-slate-200 focus:outline-none font-bold"
                      />
                      <button onClick={() => removeField(index)} className="text-red-500 hover:text-red-700 cursor-pointer">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <select
                        value={field.type}
                        onChange={(e) => updateField(index, 'type', e.target.value)}
                        className="border rounded px-1 py-0.5 focus:outline-none font-bold"
                      >
                        <option value="text">ตัวอักษร (Text)</option>
                        <option value="number">ตัวเลข (Number)</option>
                        <option value="date">วันที่ (Date)</option>
                      </select>
                      <label className="flex items-center gap-1 font-bold text-neutral-slate">
                        <input
                          type="checkbox"
                          checked={field.required}
                          onChange={(e) => updateField(index, 'required', e.target.checked)}
                        />
                        จำเป็นต้องกรอก
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Column 2: Checklist Builder */}
            <div className="space-y-3 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
              <div className="flex justify-between items-center border-b pb-2">
                <span className="font-bold text-gov-navy uppercase tracking-wider">2. เช็คลิสต์ตรวจสอบ</span>
                <button 
                  onClick={addChecklist}
                  className="bg-gov-gold/20 hover:bg-gov-gold/30 text-gov-navy font-bold px-2 py-1 rounded text-[10px] cursor-pointer"
                >
                  + เพิ่มเช็คลิสต์
                </button>
              </div>

              <div className="space-y-2.5 max-h-[250px] overflow-y-auto">
                {customChecklist.map((check, index) => (
                  <div key={index} className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={check.label}
                        onChange={(e) => updateChecklist(index, 'label', e.target.value)}
                        placeholder="ข้อความเช็คลิสต์"
                        className="flex-1 border-b border-slate-200 focus:outline-none font-bold"
                      />
                      <button onClick={() => removeChecklist(index)} className="text-red-500 hover:text-red-700 cursor-pointer">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Column 3: Evidence/Images Builder */}
            <div className="space-y-3 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
              <div className="flex justify-between items-center border-b pb-2">
                <span className="font-bold text-gov-navy uppercase tracking-wider">3. พยานหลักฐานรูปถ่าย</span>
                <button 
                  onClick={addEvidence}
                  className="bg-gov-gold/20 hover:bg-gov-gold/30 text-gov-navy font-bold px-2 py-1 rounded text-[10px] cursor-pointer"
                >
                  + เพิ่มรูปพยาน
                </button>
              </div>

              <div className="space-y-2.5 max-h-[250px] overflow-y-auto">
                {customEvidence.map((ev, index) => (
                  <div key={index} className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={ev.label}
                        onChange={(e) => updateEvidence(index, 'label', e.target.value)}
                        placeholder="ป้ายชื่อรูป เช่น ภาพถ่ายป้าย S/N"
                        className="flex-1 border-b border-slate-200 focus:outline-none font-bold"
                      />
                      <button onClick={() => removeEvidence(index)} className="text-red-500 hover:text-red-700 cursor-pointer">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          <div className="flex justify-end pt-4 border-t">
            <button
              onClick={handleSaveTemplate}
              className="px-6 py-2.5 bg-gov-navy hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-premium cursor-pointer"
            >
              บันทึกสร้างและเปิดใช้เดี๋ยวนี้
            </button>
          </div>
        </div>
      )}

      {/* Tab 3: Committee Management */}
      {activeTab === 'committee' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-premium space-y-6">
          <h3 className="text-sm font-bold text-gov-navy uppercase tracking-wider flex items-center gap-1.5 border-b pb-3">
            <UserCheck className="w-5 h-5 text-gov-gold" /> คณะกรรมการผู้ตรวจรับตามคำสั่งเทศบาล
          </h3>

          <div className="space-y-4">
            {committee.map((member, index) => (
              <div key={index} className="bg-slate-50 p-4 rounded-xl border border-slate-200/50 flex flex-col sm:flex-row gap-4 items-center">
                <div className="w-10 h-10 rounded-full bg-gov-navy/10 flex items-center justify-center font-bold text-gov-navy text-sm shrink-0">
                  {index + 1}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1 text-xs w-full">
                  <div className="space-y-1">
                    <label className="block font-bold text-neutral-slate">ชื่อ-นามสกุลกรรมการ</label>
                    <input
                      type="text"
                      value={member.name}
                      onChange={(e) => handleCommitteeChange(index, 'name', e.target.value)}
                      className="w-full bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs font-semibold focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block font-bold text-neutral-slate">ตำแหน่งและหน้าที่ในการตรวจรับ</label>
                    <input
                      type="text"
                      value={member.position}
                      onChange={(e) => handleCommitteeChange(index, 'position', e.target.value)}
                      className="w-full bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs font-semibold focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-4 border-t">
            <button
              onClick={handleSaveCommittee}
              className="px-6 py-2.5 bg-gov-navy hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-premium cursor-pointer"
            >
              บันทึกรายชื่อประธานและกรรมการ
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
