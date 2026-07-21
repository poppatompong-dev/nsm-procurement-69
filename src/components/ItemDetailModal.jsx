import React, { useState } from 'react';
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
  ShieldAlert
} from 'lucide-react';
import { formatNumber } from '../utils/numberFormatter';

const IMAGE_TYPES = [
  { key: 'product', label: '📸 รูปสินค้าจริง' },
  { key: 'serial', label: '🏷️ หมายเลข S/N' },
  { key: 'asset_plate', label: '🏛️ ป้ายครุภัณฑ์' },
  { key: 'box', label: '📦 กล่องบรรจุ' },
  { key: 'accessories', label: '🔌 อุปกรณ์เสริม' }
];

const CHECKLIST_ITEMS = [
  { key: 'qty_correct', label: 'จำนวนพัสดุถูกต้องครบถ้วน' },
  { key: 'model_matches', label: 'รุ่นตรงตามสัญญา/TOR' },
  { key: 'brand_matches', label: 'ยี่ห้อตรงตามสัญญา/TOR' },
  { key: 'serial_recorded', label: 'บันทึก S/N และเครื่องแล้ว' },
  { key: 'physical_condition', label: 'สภาพภายนอกสมบูรณ์' },
  { key: 'accessories_complete', label: 'อุปกรณ์เสริมในกล่องครบ' },
  { key: 'test_run', label: 'ทดลองเปิดใช้งานแล้ว' },
  { key: 'warranty_checked', label: 'มีใบรับประกัน/คู่มือครบ' }
];

export default function ItemDetailModal({ 
  item, 
  onClose, 
  onSave, 
  committee
}) {
  const [inspectStatus, setInspectStatus] = useState(item.inspectStatus);
  const [notes, setNotes] = useState(item.notes || '');
  const [serialNumber, setSerialNumber] = useState(item.serial_number || '');
  const [macAddress, setMacAddress] = useState(item.mac_address || '');
  const [assetNumber, setAssetNumber] = useState(item.asset_number || '');
  
  const [checklist, setChecklist] = useState({
    qty_correct: true,
    model_matches: true,
    brand_matches: true,
    serial_recorded: false,
    physical_condition: true,
    accessories_complete: true,
    test_run: true,
    warranty_checked: true,
    ...item.checklist
  });

  const [images, setImages] = useState({
    product: '',
    serial: '',
    asset_plate: '',
    box: '',
    accessories: '',
    ...item.images
  });

  const [activeImgTab, setActiveImgTab] = useState('product');

  const handleChecklistChange = (key, checked) => {
    const updatedChecklist = { ...checklist, [key]: checked };
    setChecklist(updatedChecklist);
    
    // Automatically switch main status to passed if all are checked
    const allChecked = Object.values(updatedChecklist).every(val => val === true);
    if (allChecked) {
      setInspectStatus('passed');
    }
  };

  const handleImageUpload = (key, file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setImages(prev => ({ ...prev, [key]: e.target.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
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
          old_value: String(oldVal),
          new_value: String(newVal)
        });
      }
    };

    logChange('เปลี่ยนสถานะตรวจรับ', 'inspectStatus', item.inspectStatus, inspectStatus);
    logChange('แก้ไขหมายเหตุ', 'notes', item.notes, notes);
    logChange('อัปเดต Serial Number', 'serial_number', item.serial_number, serialNumber);
    logChange('อัปเดต MAC Address', 'mac_address', item.mac_address, macAddress);
    logChange('อัปเดตเลขครุภัณฑ์', 'asset_number', item.asset_number, assetNumber);

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
      serial_number: serialNumber,
      mac_address: macAddress,
      asset_number: assetNumber,
      checklist,
      images,
      timeline,
      history,
      version: item.version + 1
    };

    onSave(updatedItem);
    onClose();
  };

  // Checklist completion count
  const checkedCount = Object.values(checklist).filter(Boolean).length;

  return (
    <div className="fixed inset-0 bg-gov-navy/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto print:hidden animate-fade-in">
      
      {/* Modal Container */}
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-modal overflow-hidden flex flex-col max-h-[90vh] border border-slate-100 animate-scale-in">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between relative">
          <span className="absolute bottom-0 left-0 right-0 h-1 bg-gov-gold"></span>
          <div className="space-y-0.5">
            <span className="text-[9px] font-black text-gov-gold uppercase tracking-widest">
              Inspection Workspace • พัสดุชิ้นที่ {item.id}
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

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 bg-neutral-warm">
          
          {/* Left Column: Spec and Gallery (5 cols) */}
          <div className="lg:col-span-5 space-y-5">
            
            {/* Gallery View */}
            <div className="space-y-2.5">
              <span className="block text-[10px] font-bold text-neutral-slate uppercase tracking-wider">แกลเลอรีภาพถ่ายหลักฐานพัสดุ</span>
              
              <div className="aspect-square bg-slate-50 border border-slate-200/50 rounded-2xl flex items-center justify-center overflow-hidden relative shadow-inner">
                {images[activeImgTab] ? (
                  <img 
                    src={images[activeImgTab].startsWith('data:') ? images[activeImgTab] : `./รูปภาพ/${images[activeImgTab]}`}
                    alt="Inspection Evidence"
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.src = ''; }}
                  />
                ) : (
                  <div className="text-slate-300 flex flex-col items-center">
                    <ImageIcon className="w-8 h-8 stroke-[1.2] text-slate-300" />
                    <span className="text-[9px] font-bold text-slate-400 mt-2 uppercase tracking-widest">ไม่มีภาพถ่ายสำหรับแท็บนี้</span>
                  </div>
                )}
                
                <label className="absolute bottom-3 right-3 bg-gov-navy/90 hover:bg-gov-navy text-white px-3 py-1.5 rounded-xl cursor-pointer transition-all flex items-center gap-1 shadow-premium text-xs font-bold border border-gov-gold/20">
                  <Upload className="w-3.5 h-3.5 text-gov-gold" />
                  อัปโหลดรูป
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={(e) => handleImageUpload(activeImgTab, e.target.files[0])}
                    className="hidden" 
                  />
                </label>
              </div>

              {/* Gallery category buttons */}
              <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
                {IMAGE_TYPES.map(t => (
                  <button
                    key={t.key}
                    onClick={() => setActiveImgTab(t.key)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold whitespace-nowrap transition-all border ${
                      activeImgTab === t.key 
                        ? 'bg-gov-blue border-gov-blue text-white shadow-sm' 
                        : 'bg-white border-slate-200/60 text-neutral-slate hover:bg-slate-50'
                    }`}
                  >
                    {t.key === 'product' && images.product ? '📸 สินค้า' :
                     t.key === 'serial' && images.serial ? '🏷️ S/N' :
                     t.key === 'asset_plate' && images.asset_plate ? '🏛️ ครุภัณฑ์' :
                     t.key === 'box' && images.box ? '📦 กล่อง' :
                     t.key === 'accessories' && images.accessories ? '🔌 อุปกรณ์' : t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Spec Card */}
            <div className="p-4.5 bg-white rounded-2xl border border-slate-100 shadow-premium space-y-2 relative overflow-hidden">
              <span className="absolute top-0 left-0 right-0 h-1 bg-gov-gold"></span>
              <span className="block text-[9px] font-bold text-gov-gold uppercase tracking-widest flex items-center gap-1">
                <Info className="w-3.5 h-3.5" /> รายละเอียด Spec ตามสัญญาจัดซื้อ
              </span>
              <p className="text-xs text-neutral-charcoal leading-relaxed font-semibold whitespace-pre-line">{item.spec}</p>
            </div>

            {/* Pricing details */}
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

          {/* Right Column: Checklist, forms, status (7 cols) */}
          <div className="lg:col-span-7 space-y-5">
            
            {/* Checklist items */}
            <div className="space-y-2.5">
              <div className="flex justify-between items-center text-[10px] font-bold text-neutral-slate uppercase tracking-wider">
                <span>รายการตรวจสอบตามระเบียบพัสดุ (Inspection Checklist)</span>
                <span className="text-gov-blue font-bold">ผ่านแล้ว {checkedCount}/8 รายการ</span>
              </div>
              
              <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-premium grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {CHECKLIST_ITEMS.map((check) => {
                  const isChecked = checklist[check.key];
                  return (
                    <button
                      key={check.key}
                      onClick={() => handleChecklistChange(check.key, !isChecked)}
                      className={`flex items-center gap-2.5 p-2.5 rounded-xl text-left transition-all border ${
                        isChecked 
                          ? 'bg-emerald-50/40 border-emerald-500/20 text-emerald-800 font-semibold shadow-inner' 
                          : 'bg-slate-50 border-slate-200/50 text-neutral-slate hover:bg-slate-100/50'
                      }`}
                    >
                      {isChecked ? (
                        <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-300 shrink-0" />
                      )}
                      <span className="text-xs leading-none">{check.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Asset IDs inputs */}
            <div className="space-y-2.5">
              <span className="block text-[10px] font-bold text-neutral-slate uppercase tracking-wider">ข้อมูลประจำผลิตภัณฑ์ (Serials & Assets)</span>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="block text-[9px] font-bold text-neutral-slate">Serial Number</label>
                  <input 
                    type="text"
                    value={serialNumber}
                    onChange={(e) => setSerialNumber(e.target.value)}
                    placeholder="S/N: E.g., SG24..."
                    className="w-full bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs font-semibold text-neutral-charcoal focus:outline-none focus:border-gov-gold transition-colors num-tabular"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[9px] font-bold text-neutral-slate">MAC Address</label>
                  <input 
                    type="text"
                    value={macAddress}
                    onChange={(e) => setMacAddress(e.target.value)}
                    placeholder="E.g., 00:1A:..."
                    className="w-full bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs font-semibold text-neutral-charcoal focus:outline-none focus:border-gov-gold transition-colors num-tabular"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[9px] font-bold text-neutral-slate">หมายเลขครุภัณฑ์หลวง</label>
                  <input 
                    type="text"
                    value={assetNumber}
                    onChange={(e) => setAssetNumber(e.target.value)}
                    placeholder="7440-xxx-xxxx"
                    className="w-full bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs font-semibold text-neutral-charcoal focus:outline-none focus:border-gov-gold transition-colors num-tabular"
                  />
                </div>
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
              <span className="block text-[10px] font-bold text-neutral-slate uppercase tracking-wider">ความเห็นสถานะการตรวจรับสุดท้าย</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setInspectStatus('passed')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all border ${
                    inspectStatus === 'passed' 
                      ? 'bg-status-passed border-status-passed text-white shadow-sm' 
                      : 'bg-white border-slate-200 text-neutral-slate hover:bg-slate-50'
                  }`}
                >
                  🟢 ตรวจผ่านแล้ว
                </button>
                <button
                  onClick={() => setInspectStatus('pending')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all border ${
                    inspectStatus === 'pending' 
                      ? 'bg-status-pending border-status-pending text-white shadow-sm' 
                      : 'bg-white border-slate-200 text-neutral-slate hover:bg-slate-50'
                  }`}
                >
                  🟡 รอตรวจสอบ
                </button>
                <button
                  onClick={() => setInspectStatus('failed')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all border ${
                    inspectStatus === 'failed' 
                      ? 'bg-status-failed border-status-failed text-white shadow-sm' 
                      : 'bg-white border-slate-200 text-neutral-slate hover:bg-slate-50'
                  }`}
                >
                  🔴 ตรวจไม่ผ่าน
                </button>
              </div>
            </div>

            {/* Audit Logs */}
            <div className="border-t border-slate-200/50 pt-4 space-y-2.5">
              <div className="flex justify-between items-center text-[10px] font-bold text-neutral-slate uppercase tracking-wider">
                <span className="flex items-center gap-1">
                  <History className="w-3.5 h-3.5 text-gov-gold" /> ประวัติการตรวจสอบ (Audit Trail)
                </span>
                <span>Version: v{item.version}</span>
              </div>
              
              <div className="max-h-[100px] overflow-y-auto space-y-2 pr-1 scrollbar-thin">
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
                          <span className="line-through">{log.old_value || 'ว่าง'}</span>
                          <ArrowRight className="w-2.5 h-2.5" />
                          <span className="font-bold text-neutral-charcoal">{log.new_value || 'ว่าง'}</span>
                        </div>
                      </div>
                      <span className="text-[8px] text-slate-400 font-bold self-start num-tabular">
                        {new Date(log.timestamp).toLocaleString('th-TH', { hour12: false })}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 text-center py-2 font-medium">ยังไม่มีประวัติการปรับปรุงสเปก</p>
                )}
              </div>
            </div>

          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-900 border-t border-slate-800 text-white flex items-center justify-between">
          <div className="text-[10px] text-slate-400 font-bold num-tabular">
            อัปเดตล่าสุด: {item.timeline?.updated_at ? new Date(item.timeline.updated_at).toLocaleString() : 'ไม่มีประวัติ'}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-colors border border-slate-700"
            >
              ยกเลิก
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 bg-gov-gold hover:bg-gov-gold-hover text-gov-navy text-xs font-bold rounded-xl shadow-premium transition-colors"
            >
              บันทึกผลตรวจรับ
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
