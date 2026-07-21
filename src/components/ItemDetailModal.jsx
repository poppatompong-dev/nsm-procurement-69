import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  CheckCircle, 
  AlertTriangle, 
  Info,
  Clock,
  User,
  History,
  Image as ImageIcon,
  Square,
  Upload,
  ArrowRight,
  ShieldAlert,
  Rotate3d,
  MousePointerClick,
  Plus,
  Trash2,
  CheckCircle2,
  FileText
} from 'lucide-react';
import { formatNumber } from '../utils/numberFormatter';
import { inspectionRepository } from '../utils/inspectionRepository';
import CategoryMockup from './CategoryMockup';

// Interactive 3D Wireframe Chassis Renderer using HTML5 Canvas
function Interactive3DViewer({ name, onHotspotClick }) {
  const canvasRef = useRef(null);
  const [rotation, setRotation] = useState({ y: 45, x: 15 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const [selectedHotspot, setSelectedHotspot] = useState(null);

  const vertices = [
    { x: -1.2, y: -2.0, z: -1.0 }, { x: 1.2, y: -2.0, z: -1.0 },
    { x: 1.2, y: 2.0, z: -1.0 }, { x: -1.2, y: 2.0, z: -1.0 },
    { x: -1.2, y: -2.0, z: 1.0 }, { x: 1.2, y: -2.0, z: 1.0 },
    { x: 1.2, y: 2.0, z: 1.0 }, { x: -1.2, y: 2.0, z: 1.0 }
  ];

  const edges = [
    [0, 1], [1, 2], [2, 3], [3, 0],
    [4, 5], [5, 6], [6, 7], [7, 4],
    [0, 4], [1, 5], [2, 6], [3, 7]
  ];

  const hotspots = [
    { id: 'sn', label: '🏷️ แผ่นป้ายเครื่อง Serial S/N (ด้านหลัง)', x: 0, y: -1.8, z: -1.0 },
    { id: 'asset', label: '🏛️ พื้นที่ติดบาร์โค้ดครุภัณฑ์หลวง', x: 0, y: 1.5, z: 1.0 },
    { id: 'ports', label: '🔌 แผงพอร์ตเชื่อมต่อ IO Ports', x: -1.0, y: 0, z: 1.0 }
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const scale = Math.min(canvas.width, canvas.height) * 0.18;

      const radY = (rotation.y * Math.PI) / 180;
      const radX = (rotation.x * Math.PI) / 180;

      const projected = vertices.map(v => {
        let x1 = v.x * Math.cos(radY) - v.z * Math.sin(radY);
        let z1 = v.z * Math.cos(radY) + v.x * Math.sin(radY);
        let y2 = v.y * Math.cos(radX) - z1 * Math.sin(radX);
        let z2 = z1 * Math.cos(radX) + v.y * Math.sin(radX);
        const depthScale = 3 / (3 + z2);
        return {
          x: cx + x1 * scale * depthScale,
          y: cy + y2 * scale * depthScale,
          z: z2
        };
      });

      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1.2;
      edges.forEach(([u, v]) => {
        ctx.beginPath();
        ctx.moveTo(projected[u].x, projected[u].y);
        ctx.lineTo(projected[v].x, projected[v].y);
        ctx.stroke();
      });

      hotspots.forEach(hs => {
        let x1 = hs.x * Math.cos(radY) - hs.z * Math.sin(radY);
        let z1 = hs.z * Math.cos(radY) + hs.x * Math.sin(radY);
        let y2 = hs.y * Math.cos(radX) - z1 * Math.sin(radX);
        let z2 = z1 * Math.cos(radX) + hs.y * Math.sin(radX);
        const depthScale = 3 / (3 + z2);
        const sx = cx + x1 * scale * depthScale;
        const sy = cy + y2 * scale * depthScale;

        hs.screenX = sx;
        hs.screenY = sy;

        ctx.beginPath();
        ctx.arc(sx, sy, 7, 0, 2 * Math.PI);
        ctx.fillStyle = selectedHotspot?.id === hs.id ? '#fbbf24' : '#1e3a8a';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, [rotation, selectedHotspot]);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    setRotation(prev => ({
      y: prev.y + dx * 0.5,
      x: Math.max(-45, Math.min(45, prev.x - dy * 0.5))
    }));
    dragStart.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const clickedHs = hotspots.find(hs => {
      if (hs.screenX === undefined || hs.screenY === undefined) return false;
      const dx = hs.screenX - clickX;
      const dy = hs.screenY - clickY;
      return Math.sqrt(dx*dx + dy*dy) < 14;
    });

    if (clickedHs) {
      setSelectedHotspot(clickedHs);
      onHotspotClick(clickedHs.id);
    } else {
      setSelectedHotspot(null);
    }
  };

  return (
    <div className="relative w-full h-full bg-slate-50 flex flex-col items-center select-none">
      <canvas 
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleCanvasClick}
        onTouchStart={(e) => {
          setIsDragging(true);
          dragStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }}
        onTouchMove={(e) => {
          if (!isDragging) return;
          const dx = e.touches[0].clientX - dragStart.current.x;
          const dy = e.touches[0].clientY - dragStart.current.y;
          setRotation(prev => ({
            y: prev.y + dx * 0.5,
            x: Math.max(-45, Math.min(45, prev.x - dy * 0.5))
          }));
          dragStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }}
        onTouchEnd={() => setIsDragging(false)}
        className="w-full h-full cursor-grab active:cursor-grabbing"
      />

      {selectedHotspot && (
        <div className="absolute top-4 left-4 right-4 bg-white/95 backdrop-blur-md p-3.5 rounded-2xl shadow-floating border border-gov-gold/30 text-xs text-neutral-charcoal space-y-1.5 animate-slide-up z-10">
          <div className="flex justify-between items-center">
            <span className="font-black text-gov-navy flex items-center gap-1">
              <MousePointerClick className="w-3.5 h-3.5 text-gov-gold" />
              {selectedHotspot.label}
            </span>
            <button 
              onClick={() => setSelectedHotspot(null)}
              className="text-slate-400 hover:text-slate-600 font-bold p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-[10px] text-neutral-slate leading-relaxed font-semibold">
            {selectedHotspot.id === 'sn' && '👉 ดึงข้อมูล S/N จากสติกเกอร์ที่เครื่องพัสดุ นำมาตรวจสอบเทียบใบประกันบริษัทคู่ค้า'}
            {selectedHotspot.id === 'asset' && '👉 โซนแผงหน้ากากที่ทำการติดป้ายสลักโค้ดรหัสพัสดุหลวงของเทศบาล'}
            {selectedHotspot.id === 'ports' && '👉 แผงควบคุมพอร์ตด้านหลังและจุดระบายอากาศสัญญาณความร้อน'}
          </p>
        </div>
      )}
    </div>
  );
}

export default function ItemDetailModal({ item, onSave, onClose }) {
  // Load dynamic templates configuration
  const projectConfig = inspectionRepository.getProjectConfig();
  const template = inspectionRepository.getTemplateById(projectConfig.templateId);
  const committee = inspectionRepository.getCommittee();

  const [inspectStatus, setInspectStatus] = useState(item.inspectStatus || 'pending');
  const [notes, setNotes] = useState(item.notes || '');

  // Dynamic Form Values State
  const [formValues, setFormValues] = useState(() => {
    const vals = {};
    template.fields.forEach(f => {
      vals[f.key] = item[f.key] !== undefined ? item[f.key] : '';
    });
    return vals;
  });

  // Dynamic Checklist State
  const [checklist, setChecklist] = useState(() => {
    const vals = {};
    template.checklist.forEach(chk => {
      vals[chk.id] = (item.checklist && item.checklist[chk.id] !== undefined) ? item.checklist[chk.id] : false;
    });
    return vals;
  });

  // Dynamic Evidence/Images State
  const [images, setImages] = useState(() => {
    const vals = {};
    template.evidence.forEach(e => {
      vals[e.key] = (item.images && item.images[e.key] !== undefined) ? item.images[e.key] : '';
    });
    return vals;
  });

  // Issues / Defect list state
  const [issues, setIssues] = useState(item.issues || []);
  const [showAddIssue, setShowAddIssue] = useState(false);
  const [issueTitle, setIssueTitle] = useState('');
  const [issueSeverity, setIssueSeverity] = useState('medium');
  const [issueDetails, setIssueDetails] = useState('');
  const [issueStatus, setIssueStatus] = useState('Open');

  // Dynamic Tabs definition
  const imageTabs = [
    ...(template.id === 'it-computer' ? [{ key: 'simulation', label: '🖥️ สำรวจ 3D' }] : []),
    ...(template.evidence || []).map(e => ({ key: e.key, label: e.label }))
  ];

  const [activeImgTab, setActiveImgTab] = useState(
    template.id === 'it-computer' ? 'simulation' : (template.evidence[0]?.key || '')
  );

  // Compute required checklists status in component scope
  const requiredCheckDefs = template.checklist.filter(c => c.required);
  const allRequiredChecked = requiredCheckDefs.every(c => checklist[c.id] === true);

  const handleChecklistChange = (id, checked) => {
    setChecklist(prev => ({ ...prev, [id]: checked }));
  };

  const handleImageUpload = (key, file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setImages(prev => ({ ...prev, [key]: e.target.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleHotspotClick = (hotspotId) => {
    if (hotspotId === 'sn') {
      setChecklist(prev => ({ ...prev, serial_recorded: true }));
    } else if (hotspotId === 'asset') {
      setChecklist(prev => ({ ...prev, brand_matches: true, model_matches: true }));
    }
  };

  // Add a new issue log entry
  const handleAddIssue = () => {
    if (!issueTitle.trim()) {
      alert('กรุณากรอกหัวข้อของข้อบกพร่อง');
      return;
    }
    const newIssue = {
      id: 'iss-' + Date.now(),
      title: issueTitle,
      severity: issueSeverity,
      details: issueDetails,
      status: issueStatus,
      logged_at: new Date().toISOString(),
      resolved_at: ''
    };
    setIssues([...issues, newIssue]);
    setIssueTitle('');
    setIssueDetails('');
    setIssueSeverity('medium');
    setShowAddIssue(false);
  };

  // Update status of an issue
  const handleUpdateIssueStatus = (issueId, nextStatus) => {
    setIssues(prev => prev.map(iss => {
      if (iss.id === issueId) {
        return { 
          ...iss, 
          status: nextStatus,
          resolved_at: ['Resolved', 'Closed'].includes(nextStatus) ? new Date().toISOString() : ''
        };
      }
      return iss;
    }));
  };

  // Delete an issue log
  const handleDeleteIssue = (issueId) => {
    if (confirm('คุณต้องการลบรายงานข้อบกพร่องนี้ใช่หรือไม่?')) {
      setIssues(prev => prev.filter(iss => iss.id !== issueId));
    }
  };

  const handleSave = () => {
    if (inspectStatus === 'passed' && !allRequiredChecked) {
      alert(`⚠️ ไม่สามารถให้ความเห็นผ่านตรวจรับพัสดุได้! คณะกรรมการต้องทำเครื่องหมายในเช็คลิสต์ที่จำเป็นครบก่อน`);
      return;
    }

    const history = [...(item.history || [])];
    const timestamp = new Date().toISOString();
    const currentUser = committee[1]?.name || 'กรรมการตรวจรับ';

    const logChange = (action, field, oldVal, newVal) => {
      if (oldVal !== newVal) {
        history.push({
          timestamp,
          user: currentUser,
          action,
          field,
          old_value: String(oldVal || ''),
          new_value: String(newVal || '')
        });
      }
    };

    logChange('เปลี่ยนสถานะตรวจรับ', 'inspectStatus', item.inspectStatus, inspectStatus);
    logChange('แก้ไขหมายเหตุ', 'notes', item.notes, notes);
    
    // Log dynamic fields changes
    template.fields.forEach(f => {
      logChange(`อัปเดต ${f.label}`, f.key, item[f.key], formValues[f.key]);
    });

    const timeline = { ...item.timeline };
    if (!timeline.started_at) {
      timeline.started_at = timestamp;
    }
    timeline.updated_at = timestamp;
    if (inspectStatus === 'passed' && item.inspectStatus !== 'passed') {
      timeline.completed_at = timestamp;
    }

    const updatedItem = {
      ...item,
      inspectStatus,
      notes,
      ...formValues,
      checklist,
      images,
      issues,
      timeline,
      history,
      version: (item.version || 1) + 1
    };

    onSave(updatedItem);
    onClose();
  };

  // Checklist counts
  const checkedCount = Object.values(checklist).filter(Boolean).length;
  const totalChecksCount = template.checklist.length;

  return (
    <div className="fixed inset-0 bg-gov-navy/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto print:hidden animate-fade-in">
      
      {/* Modal Container */}
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-modal overflow-hidden flex flex-col max-h-[90vh] border border-slate-100 animate-scale-in">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between relative shrink-0">
          <span className="absolute bottom-0 left-0 right-0 h-1 bg-gov-gold"></span>
          <div className="space-y-0.5">
            <span className="text-[9px] font-black text-gov-gold uppercase tracking-widest flex items-center gap-1.5">
              <Rotate3d className="w-3.5 h-3.5 text-gov-gold animate-spin" style={{ animationDuration: '4s' }} />
              Workspace ตรวจรับ • {template.name} ({template.version})
            </span>
            <h3 className="text-sm sm:text-base font-bold line-clamp-1 text-slate-100">{item.name}</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body (Scrollable) */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/50">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column: Media & Spec Preview (5 cols) */}
            <div className="lg:col-span-5 space-y-5">
              
              <div className="space-y-2.5">
                <span className="block text-[10px] font-bold text-neutral-slate uppercase tracking-wider">แผงสำรวจหลักฐานรูปถ่ายพัสดุ</span>
                
                <div className="aspect-square bg-slate-50 border border-slate-200/50 rounded-2xl flex items-center justify-center overflow-hidden relative shadow-inner">
                  {activeImgTab === 'simulation' ? (
                    <Interactive3DViewer 
                      name={item.name} 
                      onHotspotClick={handleHotspotClick}
                    />
                  ) : images[activeImgTab] ? (
                    <img 
                      src={images[activeImgTab].startsWith('data:') ? images[activeImgTab] : `./รูปภาพ/${images[activeImgTab]}`}
                      alt="Evidence Upload"
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.src = ''; }}
                    />
                  ) : (
                    <CategoryMockup category={item.category} size="large" />
                  )}
                  
                  {activeImgTab !== 'simulation' && (
                    <label className="absolute bottom-3 right-3 bg-gov-navy/90 hover:bg-gov-navy text-white px-3 py-1.5 rounded-xl cursor-pointer transition-all flex items-center gap-1 shadow-premium text-xs font-bold border border-gov-gold/20">
                      <Upload className="w-3.5 h-3.5 text-gov-gold" />
                      อัปโหลดรูป
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => handleImageUpload(activeImgTab, e.target.files[0])} 
                      />
                    </label>
                  )}
                </div>

                {/* Tabs bar */}
                <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
                  {imageTabs.map(t => (
                    <button
                      key={t.key}
                      onClick={() => setActiveImgTab(t.key)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold whitespace-nowrap transition-all border ${
                        activeImgTab === t.key 
                          ? 'bg-gov-blue border-gov-blue text-white shadow-sm' 
                          : 'bg-white border-slate-200/60 text-neutral-slate hover:bg-slate-50'
                      }`}
                    >
                      {t.key === 'simulation' ? '🖥️ สำรวจ 3D' : t.label.split(' ')[1] || t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Specification Details Box */}
              <div className="p-4.5 bg-white rounded-2xl border border-slate-100 shadow-premium space-y-2 relative overflow-hidden">
                <span className="absolute top-0 left-0 right-0 h-1 bg-gov-gold"></span>
                <span className="block text-[9px] font-bold text-gov-gold uppercase tracking-widest flex items-center gap-1">
                  <Info className="w-3.5 h-3.5" /> รายละเอียด Spec ตามสัญญา
                </span>
                <p className="text-xs text-neutral-charcoal leading-relaxed font-semibold whitespace-pre-line">{item.spec}</p>
              </div>

              {/* Budget Details */}
              <div className="p-4.5 bg-white rounded-2xl border border-slate-100 shadow-premium grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[9px] text-neutral-slate font-bold uppercase tracking-wider block">ราคาต่อหน่วย</span>
                  <span className="text-sm font-black text-gov-navy num-tabular">{formatNumber(item.unit_price)} บาท</span>
                </div>
                <div>
                  <span className="text-[9px] text-neutral-slate font-bold uppercase tracking-wider block">มูลค่าจัดซื้อรวม</span>
                  <span className="text-sm font-black text-gov-blue num-tabular">{formatNumber(item.qty * item.unit_price)} บาท</span>
                </div>
              </div>

            </div>

            {/* Right Column: Visual Steps, Form Fields and Status (7 cols) */}
            <div className="lg:col-span-7 space-y-5">
              
              {/* Dynamic Checklist */}
              <div className="space-y-2.5">
                <div className="flex justify-between items-center text-[10px] font-bold text-neutral-slate uppercase tracking-wider">
                  <span>ความก้าวหน้ารายการตรวจสอบ ({totalChecksCount} ขั้นตอน)</span>
                  <span className="text-status-passed font-bold">ดำเนินการสำเร็จ {checkedCount}/{totalChecksCount}</span>
                </div>
                
                <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-premium grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {template.checklist.map((check) => {
                    const isChecked = checklist[check.id];
                    return (
                      <button
                        key={check.id}
                        onClick={() => handleChecklistChange(check.id, !isChecked)}
                        className={`flex items-center gap-2.5 p-2.5 rounded-xl text-left transition-all border ${
                          isChecked 
                            ? 'bg-emerald-50/40 border-emerald-500/20 text-emerald-800 font-semibold shadow-inner scale-[0.98]' 
                            : 'bg-slate-50 border-slate-200/50 text-neutral-slate hover:bg-slate-100/50'
                        }`}
                      >
                        {isChecked ? (
                          <CheckCircle className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
                        ) : (
                          <Square className="w-4.5 h-4.5 text-slate-300 shrink-0" />
                        )}
                        <span className="text-xs leading-none">
                          {check.label} {check.required && <span className="text-red-500 font-bold">*</span>}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dynamic Form Fields */}
              <div className="space-y-2.5">
                <span className="block text-[10px] font-bold text-neutral-slate uppercase tracking-wider">ข้อมูลรายละเอียดพัสดุ (Dynamic Inputs)</span>
                
                <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-premium grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {template.fields.map((field) => (
                    <div key={field.key} className="space-y-1">
                      <label className="block text-[9px] font-bold text-neutral-slate">
                        {field.label} {field.required && <span className="text-red-500 font-bold">*</span>}
                      </label>
                      <input 
                        type={field.type || 'text'}
                        value={formValues[field.key] || ''}
                        onChange={(e) => setFormValues(prev => ({ ...prev, [field.key]: e.target.value }))}
                        placeholder={field.placeholder || ''}
                        className="w-full bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs font-semibold text-neutral-charcoal focus:outline-none focus:border-gov-gold transition-colors num-tabular"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Defect Management Section (Issues & Corrective Actions) */}
              <div className="space-y-2.5">
                <div className="flex justify-between items-center text-[10px] font-bold text-neutral-slate uppercase tracking-wider">
                  <span className="flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-gov-gold" />
                    รายงานข้อบกพร่อง ({issues.length} รายการ)
                  </span>
                  <button
                    onClick={() => setShowAddIssue(!showAddIssue)}
                    className="flex items-center gap-1 text-[10px] text-gov-navy bg-gov-gold/15 border border-gov-gold/20 hover:bg-gov-gold/30 px-2 py-1 rounded-lg transition-colors cursor-pointer"
                  >
                    <Plus className="w-3 h-3 text-gov-gold" />
                    แจ้งปัญหา
                  </button>
                </div>

                {/* Add Issue Sub-Form */}
                {showAddIssue && (
                  <div className="bg-amber-50/50 border border-gov-gold/20 p-4 rounded-2xl space-y-3 animate-slide-up">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="block text-[9px] font-bold text-neutral-slate">หัวข้อปัญหา</label>
                        <input
                          type="text"
                          value={issueTitle}
                          onChange={(e) => setIssueTitle(e.target.value)}
                          placeholder="ระบุชื่อหัวข้อปัญหาสั้นๆ"
                          className="w-full bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs font-semibold focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[9px] font-bold text-neutral-slate">ระดับความรุนแรง</label>
                        <select
                          value={issueSeverity}
                          onChange={(e) => setIssueSeverity(e.target.value)}
                          className="w-full bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs font-semibold focus:outline-none"
                        >
                          <option value="low">🟡 ต่ำ (Low)</option>
                          <option value="medium">🟠 ปานกลาง (Medium)</option>
                          <option value="high">🔴 สูง (High)</option>
                          <option value="critical">🚨 วิกฤต (Critical)</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[9px] font-bold text-neutral-slate">รายละเอียดข้อบกพร่อง</label>
                      <textarea
                        value={issueDetails}
                        onChange={(e) => setIssueDetails(e.target.value)}
                        placeholder="ระบุปัญหาทางสเปก ขีดข่วน หรือ TOR ไม่ครบ..."
                        rows={2}
                        className="w-full bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs font-semibold focus:outline-none"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setShowAddIssue(false)}
                        className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-neutral-charcoal text-[10px] font-bold rounded-lg"
                      >
                        ยกเลิก
                      </button>
                      <button
                        onClick={handleAddIssue}
                        className="px-3 py-1.5 bg-gov-navy text-white text-[10px] font-bold rounded-lg hover:bg-slate-800"
                      >
                        บันทึกรายงานปัญหา
                      </button>
                    </div>
                  </div>
                )}

                {/* Issues Listing */}
                <div className="space-y-2 max-h-[140px] overflow-y-auto">
                  {issues.length > 0 ? (
                    issues.map(iss => (
                      <div key={iss.id} className="bg-white p-3 rounded-2xl border border-slate-100 flex items-center justify-between gap-4 shadow-sm text-xs relative overflow-hidden">
                        <span className={`absolute left-0 top-0 bottom-0 w-1 ${
                          iss.severity === 'critical' ? 'bg-red-600' :
                          iss.severity === 'high' ? 'bg-orange-500' :
                          iss.severity === 'medium' ? 'bg-amber-400' : 'bg-blue-400'
                        }`}></span>
                        <div className="space-y-0.5 pl-2 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-gov-navy">{iss.title}</span>
                            <span className={`text-[8px] font-bold uppercase px-1.5 py-0.2 rounded border ${
                              iss.severity === 'critical' ? 'bg-red-50 border-red-200 text-red-700' :
                              iss.severity === 'high' ? 'bg-orange-50 border-orange-200 text-orange-700' : 'bg-slate-50 border-slate-200 text-slate-600'
                            }`}>
                              {iss.severity}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 leading-relaxed font-semibold">{iss.details}</p>
                          <div className="text-[8px] text-slate-400 font-bold">
                            แจ้งเมื่อ: {new Date(iss.logged_at).toLocaleDateString('th-TH')} • สถานะ: <span className="font-black text-gov-navy">{iss.status}</span>
                          </div>
                        </div>

                        {/* Issue Actions Toggles */}
                        <div className="flex items-center gap-1">
                          <select
                            value={iss.status}
                            onChange={(e) => handleUpdateIssueStatus(iss.id, e.target.value)}
                            className="bg-slate-50 border border-slate-200 text-[10px] font-bold rounded px-1.5 py-1 focus:outline-none"
                          >
                            <option value="Open">Open</option>
                            <option value="In Correction">In Correction</option>
                            <option value="Resolved">Resolved</option>
                            <option value="Closed">Closed</option>
                          </select>
                          <button
                            onClick={() => handleDeleteIssue(iss.id)}
                            className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                            title="ลบรายงานปัญหา"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 bg-white border border-slate-100 rounded-2xl text-xs text-slate-400 font-medium">
                      👍 ยังไม่พบบันทึกข้อบกพร่องสำหรับครุภัณฑ์ชิ้นนี้
                    </div>
                  )}
                </div>
              </div>

              {/* Note text field */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-neutral-slate uppercase tracking-wider">หมายเหตุความเห็นเพิ่มเติมของคณะกรรมการ</label>
                <textarea 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="ระบุตึก ชั้นที่จัดเก็บ หรือตำหนิความสมบูรณ์ที่พบในสนามจัดซื้อตรวจรับ..."
                  rows={2}
                  className="w-full bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs font-semibold text-neutral-charcoal focus:outline-none focus:border-gov-gold transition-colors"
                />
              </div>

              {/* Status Selector */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[10px] font-bold text-neutral-slate uppercase tracking-wider">
                  <span>ความเห็นสถานะการตรวจรับสุดท้าย</span>
                  {!allRequiredChecked && (
                    <span className="text-status-failed flex items-center gap-1 font-black">
                      <ShieldAlert className="w-3.5 h-3.5" /> ต้องผ่าน Checklist จำเป็นก่อนจึงบันทึกผ่านได้
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (!allRequiredChecked) {
                        alert(`⚠️ กรุณาเช็คลิสต์ตรวจรับรายการที่จำเป็นให้ผ่านครบก่อน จึงจะเปลี่ยนสถานะเป็นผ่านตรวจรับได้ครับ`);
                        return;
                      }
                      setInspectStatus('passed');
                    }}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                      !allRequiredChecked ? 'opacity-40 cursor-not-allowed bg-slate-50 border-slate-200 text-slate-300' :
                      inspectStatus === 'passed' 
                        ? 'bg-status-passed border-status-passed text-white shadow-sm font-black' 
                        : 'bg-white border-slate-200 text-neutral-slate hover:bg-slate-50'
                    }`}
                  >
                    🟢 {template.id === 'service-maintenance' ? 'ผ่านตรวจรับ SLA' : 'ตรวจผ่านแล้ว'}
                  </button>
                  <button
                    onClick={() => setInspectStatus('pending')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                      inspectStatus === 'pending' 
                        ? 'bg-status-pending border-status-pending text-white shadow-sm font-black' 
                        : 'bg-white border-slate-200 text-neutral-slate hover:bg-slate-50'
                    }`}
                  >
                    🟡 รอการเข้าตรวจ
                  </button>
                  <button
                    onClick={() => setInspectStatus('failed')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                      inspectStatus === 'failed' 
                        ? 'bg-status-failed border-status-failed text-white shadow-sm font-black' 
                        : 'bg-white border-slate-200 text-neutral-slate hover:bg-slate-50'
                    }`}
                  >
                    🔴 ชำรุด/ต้องแก้ไข
                  </button>
                </div>
              </div>

              {/* Audit Logs */}
              <div className="border-t border-slate-200/50 pt-4 space-y-2.5">
                <div className="flex justify-between items-center text-[10px] font-bold text-neutral-slate uppercase tracking-wider">
                  <span className="flex items-center gap-1">
                    <History className="w-3.5 h-3.5 text-gov-gold" /> ประวัติการอัปเดต (Audit Trail)
                  </span>
                  <span>Version: v{item.version || 1}</span>
                </div>
                
                <div className="max-h-[90px] overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                  {item.history && item.history.length > 0 ? (
                    item.history.slice().reverse().map((log, index) => (
                      <div key={index} className="bg-white p-2.5 rounded-xl border border-slate-100 flex justify-between gap-4 text-[10px] shadow-sm">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1 text-gov-navy font-bold">
                            <User className="w-2.5 h-2.5 text-gov-gold" />
                            {log.user}
                          </div>
                          <div className="text-neutral-slate">
                            {log.action} <span className="font-semibold text-neutral-charcoal">{log.field}</span>
                          </div>
                          <div className="flex items-center gap-1 text-slate-400 mt-0.5">
                            <span className="line-through text-[9px]">{log.old_value || 'ว่าง'}</span>
                            <ArrowRight className="w-2.5 h-2.5" />
                            <span className="font-bold text-neutral-charcoal text-[9px]">{log.new_value || 'ว่าง'}</span>
                          </div>
                        </div>
                        <span className="text-[8px] text-slate-400 font-bold self-start num-tabular">
                          {new Date(log.timestamp).toLocaleString('th-TH', { hour12: false })}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 text-center py-2 font-medium">ยังไม่มีประวัติการบันทึกแก้ไข</p>
                  )}
                </div>
              </div>

            </div>

          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-900 border-t border-slate-800 text-white flex items-center justify-between shrink-0">
          <div className="text-[10px] text-slate-400 font-bold num-tabular">
            อัปเดตล่าสุด: {item.timeline?.updated_at ? new Date(item.timeline.updated_at).toLocaleString() : 'ยังไม่มีประวัติการส่ง'}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-colors border border-slate-700 cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 bg-gov-gold hover:bg-gov-gold-hover text-gov-navy text-xs font-bold rounded-xl shadow-premium transition-colors cursor-pointer"
            >
              บันทึกผลตรวจรับ
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
