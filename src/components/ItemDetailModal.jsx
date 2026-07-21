import React, { useState, useEffect } from 'react';
import { 
  X, 
  CheckCircle, 
  AlertTriangle, 
  Info,
  Clock,
  User,
  History,
  Image as ImageIcon,
  CheckSquare,
  Square,
  QrCode,
  Tag,
  Upload,
  ArrowRight
} from 'lucide-react';
import { formatNumber } from '../utils/numberFormatter';

// Image categories/labels
const IMAGE_TYPES = [
  { key: 'product', label: '📸 รูปสินค้าจริง' },
  { key: 'serial', label: '🏷️ รูปหมายเลขเครื่อง (Serial)' },
  { key: 'asset_plate', label: '🏛️ รูปป้ายครุภัณฑ์' },
  { key: 'box', label: '📦 รูปกล่องบรรจุภัณฑ์' },
  { key: 'accessories', label: '🔌 รูปอุปกรณ์เสริม' }
];

// Checklist items labels
const CHECKLIST_ITEMS = [
  { key: 'qty_correct', label: 'จำนวนพัสดุถูกต้องครบถ้วน' },
  { key: 'model_matches', label: 'รุ่นตรงตามใบเสนอราคา/TOR' },
  { key: 'brand_matches', label: 'ยี่ห้อตรงตามใบเสนอราคา/TOR' },
  { key: 'serial_recorded', label: 'บันทึก S/N และหมายเลขเครื่องแล้ว' },
  { key: 'physical_condition', label: 'สภาพสมบูรณ์ภายนอก ไม่มีตำหนิเสียหาย' },
  { key: 'accessories_complete', label: 'อุปกรณ์เสริมในกล่องครบถ้วน' },
  { key: 'test_run', label: 'ผ่านการทดสอบเปิดเครื่อง/จ่ายไฟใช้งาน' },
  { key: 'warranty_checked', label: 'มีใบรับประกันหรือเอกสารคู่มือครบ' }
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
  
  // Checklist local state
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

  // Images state
  const [images, setImages] = useState({
    product: '',
    serial: '',
    asset_plate: '',
    box: '',
    accessories: '',
    ...item.images
  });

  // Selected image tab in Gallery
  const [activeImgTab, setActiveImgTab] = useState('product');
  const [showQR, setShowQR] = useState(false);

  // Auto pass when checklist is fully checked
  const handleChecklistChange = (key, checked) => {
    const updatedChecklist = { ...checklist, [key]: checked };
    setChecklist(updatedChecklist);
    
    // Check if all checked
    const allChecked = Object.values(updatedChecklist).every(val => val === true);
    if (allChecked) {
      setInspectStatus('passed');
    }
  };

  // Image Upload handler (Base64)
  const handleImageUpload = (key, file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setImages(prev => ({ ...prev, [key]: e.target.result }));
    };
    reader.readAsDataURL(file);
  };

  // Save changes
  const handleSave = () => {
    // Generate audit trails
    const history = [...(item.history || [])];
    const timestamp = new Date().toISOString();
    const currentUser = committee[1]?.name || 'กรรมการผู้ตรวจรับ'; // default to active user or generic

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

    // Timeline updates
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

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto print:hidden">
      
      {/* Modal Card */}
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-100 animate-in fade-in zoom-in duration-200">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200/60 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-blue-700 uppercase tracking-widest">
              รายละเอียดพัสดุชิ้นที่ {item.id} • หมวด{item.category}
            </span>
            <h3 className="text-sm sm:text-base font-black text-slate-800 line-clamp-1">{item.name}</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-slate-200 text-slate-400 hover:text-slate-700 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: specifications & Gallery (L: 5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Gallery Section */}
            <div className="space-y-3">
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">แกลเลอรีหลักฐานพัสดุ (Multi-image)</span>
              
              {/* Main Image View */}
              <div className="aspect-square bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center overflow-hidden relative">
                {images[activeImgTab] ? (
                  <img 
                    src={images[activeImgTab].startsWith('data:') ? images[activeImgTab] : `./รูปภาพ/${images[activeImgTab]}`}
                    alt="Inspection Evidence"
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.src = ''; }}
                  />
                ) : (
                  <div className="text-slate-300 flex flex-col items-center">
                    <ImageIcon className="w-10 h-10 stroke-[1.2]" />
                    <span className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest">ไม่มีภาพถ่าย</span>
                  </div>
                )}
                
                {/* Upload Button overlay */}
                <label className="absolute bottom-3 right-3 bg-slate-900/80 hover:bg-slate-900 text-white p-2 rounded-xl cursor-pointer transition-colors flex items-center gap-1 shadow-sm text-xs font-semibold">
                  <Upload className="w-3.5 h-3.5" />
                  อัปโหลดรูป
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={(e) => handleImageUpload(activeImgTab, e.target.files[0])}
                    className="hidden" 
                  />
                </label>
              </div>

              {/* Image category tabs */}
              <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-thin">
                {IMAGE_TYPES.map(t => (
                  <button
                    key={t.key}
                    onClick={() => setActiveImgTab(t.key)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold whitespace-nowrap transition-colors border ${
                      activeImgTab === t.key 
                        ? 'bg-blue-600 border-blue-600 text-white' 
                        : 'bg-slate-50 border-slate-200/60 text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    {t.key === 'product' && images.product ? '📸 สินค้า (มี)' :
                     t.key === 'serial' && images.serial ? '🏷️ Serial (มี)' :
                     t.key === 'asset_plate' && images.asset_plate ? '🏛️ ครุภัณฑ์ (มี)' :
                     t.key === 'box' && images.box ? '📦 กล่อง (มี)' :
                     t.key === 'accessories' && images.accessories ? '🔌 เสริม (มี)' : t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Specifications Card */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/50 space-y-2">
              <span className="block text-[10px] font-bold text-blue-700 uppercase tracking-widest flex items-center gap-1">
                <Info className="w-3.5 h-3.5" /> Spec ตามสัญญาจัดซื้อ
              </span>
              <p className="text-xs text-slate-600 leading-relaxed font-medium whitespace-pre-line">{item.spec}</p>
            </div>

            {/* Price Calculations */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/50 grid grid-cols-2 gap-4">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">ราคาต่อหน่วย</span>
                <span className="text-sm font-black text-slate-800">{formatNumber(item.unit_price)} บาท</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">มูลค่าจัดซื้อรวม</span>
                <span className="text-sm font-black text-blue-800">{formatNumber(item.qty * item.unit_price)} บาท</span>
              </div>
            </div>

          </div>

          {/* Right Column: Checklist, Serials, status & History (R: 7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Checklist Section */}
            <div className="space-y-3">
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">รายการตรวจสอบคุณภาพพัสดุ (Inspection Checklist)</span>
              
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/50 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {CHECKLIST_ITEMS.map((check) => {
                  const isChecked = checklist[check.key];
                  return (
                    <button
                      key={check.key}
                      onClick={() => handleChecklistChange(check.key, !isChecked)}
                      className={`flex items-center gap-2.5 p-2 rounded-xl text-left transition-all ${
                        isChecked 
                          ? 'bg-emerald-50/50 text-emerald-800 font-semibold' 
                          : 'bg-white text-slate-500 hover:bg-slate-100 border border-slate-200/60'
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

            {/* Asset Fields Section (Serial, MAC, Asset Plate) */}
            <div className="space-y-3">
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">บันทึกข้อมูลรหัสครุภัณฑ์ & Serial</span>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400">Serial Number</label>
                  <input 
                    type="text"
                    value={serialNumber}
                    onChange={(e) => setSerialNumber(e.target.value)}
                    placeholder="S/N: 247A9B..."
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white transition-colors"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400">MAC Address</label>
                  <input 
                    type="text"
                    value={macAddress}
                    onChange={(e) => setMacAddress(e.target.value)}
                    placeholder="FF:FF:FF:..."
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white transition-colors"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400">หมายเลขครุภัณฑ์หลวง</label>
                  <input 
                    type="text"
                    value={assetNumber}
                    onChange={(e) => setAssetNumber(e.target.value)}
                    placeholder="พัสดุ. 7440-..."
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Note Input */}
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">บันทึกข้อคิดเห็น/หมายเหตุการตรวจรับ</label>
              <textarea 
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="กรอกข้อมูลเพิ่มเติม เช่น อาคารจัดวาง ชั้นที่ติดตั้ง เลขที่พัสดุชั่วคราว หรือตำหนิสินค้าที่พบ..."
                rows={2}
                className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white transition-colors"
              />
            </div>

            {/* Selection on Status */}
            <div className="space-y-2">
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">ความเห็นสถานะการตรวจรับสุดท้าย</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setInspectStatus('passed')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all border ${
                    inspectStatus === 'passed' 
                      ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm' 
                      : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  🟢 ตรวจผ่านแล้ว (Passed)
                </button>
                <button
                  onClick={() => setInspectStatus('pending')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all border ${
                    inspectStatus === 'pending' 
                      ? 'bg-amber-400 border-amber-400 text-slate-900 shadow-sm' 
                      : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  🟡 รอตรวจสอบ (Pending)
                </button>
                <button
                  onClick={() => setInspectStatus('failed')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all border ${
                    inspectStatus === 'failed' 
                      ? 'bg-rose-600 border-rose-600 text-white shadow-sm' 
                      : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  🔴 ตรวจไม่ผ่าน (Failed)
                </button>
              </div>
            </div>

            {/* Audit Trail & Timeline */}
            <div className="border-t border-slate-200/60 pt-4 space-y-3">
              <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <span className="flex items-center gap-1">
                  <History className="w-3.5 h-3.5" /> ประวัติการตรวจรับ (Audit Trail)
                </span>
                <span>เวอร์ชันแก้ไข: v{item.version}</span>
              </div>
              
              {/* History logs rendering */}
              <div className="max-h-[110px] overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                {item.history && item.history.length > 0 ? (
                  item.history.slice().reverse().map((log, index) => (
                    <div key={index} className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex justify-between gap-4 text-[11px]">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 text-slate-700 font-bold">
                          <User className="w-3 h-3 text-blue-600" />
                          {log.user}
                        </div>
                        <div className="text-slate-500">
                          {log.action} <span className="font-semibold text-slate-600">{log.field}</span>
                        </div>
                        <div className="flex items-center gap-1 text-slate-400 mt-0.5">
                          <span className="line-through">{log.old_value || 'ว่าง'}</span>
                          <ArrowRight className="w-2.5 h-2.5" />
                          <span className="font-bold text-slate-700">{log.new_value || 'ว่าง'}</span>
                        </div>
                      </div>
                      <span className="text-[9px] text-slate-400 shrink-0 font-medium self-start">
                        {new Date(log.timestamp).toLocaleString('th-TH', { hour12: false })}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 text-center py-2 font-medium">ยังไม่มีบันทึกประวัติการปรับปรุงสำหรับพัสดุชิ้นนี้</p>
                )}
              </div>
            </div>

          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200/60 flex items-center justify-between">
          <div className="text-[10px] text-slate-400 font-medium">
            แก้ไขล่าสุด: {item.timeline?.updated_at ? new Date(item.timeline.updated_at).toLocaleString() : 'ไม่มีประวัติ'}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-800 text-xs font-bold rounded-xl transition-colors"
            >
              ยกเลิก
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-sm transition-colors"
            >
              บันทึกการตรวจรับ
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
