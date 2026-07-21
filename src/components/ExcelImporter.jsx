import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { Upload, FileSpreadsheet, Check, AlertCircle } from 'lucide-react';

export default function ExcelImporter({ onImport }) {
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState({ type: 'idle', message: '' });

  const processFile = (file) => {
    if (!file) return;
    setStatus({ type: 'loading', message: 'กำลังประมวลผลไฟล์สเปก Excel...' });

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        const sheetName = workbook.SheetNames.find(n => n.includes('ร้านค้า') || n.includes('ราคา') || n.includes('งบ')) || workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rawRows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        
        const parsedItems = [];
        
        rawRows.forEach((row) => {
          if (!row || row.length === 0) return;
          
          const firstCell = String(row[0] || '').trim();
          const idNum = Number(firstCell);
          
          if (!isNaN(idNum) && idNum > 0 && row[1]) {
            const name = String(row[1] || '').trim();
            const qty = Number(row[2]) || 1;
            const unit = String(row[3] || 'หน่วย').trim();
            const unit_price = Number(row[4]) || 0;
            const total_price = Number(row[5]) || (qty * unit_price);
            const division = String(row[6] || 'สถิติ').trim();
            
            // Guess category
            let category = 'connectivity';
            const nameLower = name.toLowerCase();
            if (nameLower.includes('flash') || nameLower.includes('sd card') || nameLower.includes('hdd') || nameLower.includes('ssd') || nameLower.includes('จัดเก็บ')) {
              category = 'storage';
            } else if (nameLower.includes('mouse') || nameLower.includes('keyboard') || nameLower.includes('webcam') || nameLower.includes('กล้อง') || nameLower.includes('หูฟัง')) {
              category = 'peripherals';
            } else if (nameLower.includes('raspberry') || nameLower.includes('โมดูล') || nameLower.includes('esp32') || nameLower.includes('poe')) {
              category = 'electronics';
            } else if (nameLower.includes('บัดกรี') || nameLower.includes('ลวดซับ') || nameLower.includes('น้ำยา') || nameLower.includes('ดีบุก') || nameLower.includes('ราง') || nameLower.includes('stopper') || nameLower.includes('คลิป') || nameLower.includes('din rail')) {
              category = 'tools';
            } else if (nameLower.includes('กระเป๋า') || nameLower.includes('เป้') || nameLower.includes('ปลั๊ก') || nameLower.includes('โรล')) {
              category = 'organization';
            } else if (nameLower.includes('หมึก') || nameLower.includes('hp 230a') || nameLower.includes('สีดำ') || nameLower.includes('สีฟ้า')) {
              category = 'toner';
            } else if (nameLower.includes('ถ่าน')) {
              category = 'consumables';
            }

            parsedItems.push({
              id: idNum,
              name,
              spec: name,
              qty,
              unit,
              unit_price,
              total_price,
              division,
              category,
              images: {
                product: "",
                serial: "",
                asset_plate: "",
                box: "",
                accessories: ""
              },
              serial_number: "",
              mac_address: "",
              asset_number: "",
              checklist: {
                qty_correct: true,
                model_matches: true,
                brand_matches: true,
                serial_recorded: false,
                physical_condition: true,
                accessories_complete: true,
                test_run: true,
                warranty_checked: true
              },
              inspectStatus: 'passed',
              notes: '',
              timeline: {
                started_at: "",
                updated_at: "",
                completed_at: ""
              },
              history: [],
              version: 1
            });
          }
        });

        if (parsedItems.length > 0) {
          onImport(parsedItems);
          setStatus({ 
            type: 'success', 
            message: `นำเข้าพัสดุสำเร็จ ${parsedItems.length} รายการ จากชีต "${sheetName}"` 
          });
        } else {
          setStatus({ 
            type: 'error', 
            message: 'ไม่พบรายการที่ถูกต้องในไฟล์ Excel (คอลัมน์แรกสุดต้องเป็นตัวเลขรหัสพัสดุ)' 
          });
        }
      } catch (err) {
        console.error(err);
        setStatus({ type: 'error', message: 'เกิดข้อผิดพลาดในการแปลข้อมูลไฟล์ Excel' });
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    processFile(file);
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-premium border border-slate-100 space-y-6 print:hidden animate-fade-in">
      <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
        <h3 className="text-xs sm:text-sm font-bold text-gov-navy flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5 text-gov-gold" />
          นำเข้าสเปกด้วย Excel (Excel Importer)
        </h3>
        <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 rounded text-neutral-slate">Universal Engine</span>
      </div>

      {/* Drag Zone Area */}
      <div 
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all duration-300 ${
          isDragging 
            ? 'border-gov-gold bg-gov-gold-light/40' 
            : 'border-slate-200 bg-neutral-warm hover:bg-slate-100/30'
        }`}
      >
        <label className="cursor-pointer block space-y-3">
          <Upload className="w-10 h-10 text-gov-gold mx-auto" />
          <div className="text-xs sm:text-sm font-bold text-gov-navy">
            ลากไฟล์สัญญาจัดซื้อ Excel มาวางที่นี่ หรือคลิกเพื่อเลือกไฟล์
          </div>
          <div className="text-[10px] text-neutral-slate leading-relaxed">
            รองรับไฟล์นามสกุล .xlsx หรือ .xls (โดยตรรกะแรกของตารางแถวต้องขึ้นต้นด้วยรหัสพัสดุเสมอ)
          </div>
          <input 
            type="file" 
            accept=".xlsx, .xls"
            onChange={(e) => processFile(e.target.files[0])}
            className="hidden" 
          />
        </label>
      </div>

      {/* Status Bar */}
      {status.type !== 'idle' && (
        <div className={`p-4 rounded-xl flex items-center gap-2.5 text-xs font-bold ${
          status.type === 'loading' ? 'bg-blue-50 text-gov-blue border border-blue-100/30' :
          status.type === 'success' ? 'bg-emerald-50 text-status-passed border border-emerald-100/30' : 'bg-rose-50 text-status-failed border border-rose-100/30'
        }`}>
          {status.type === 'success' ? (
            <Check className="w-4 h-4 text-status-passed shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{status.message}</span>
        </div>
      )}

      {/* Guidelines Card */}
      <div className="p-4 bg-slate-50 border border-slate-200/50 rounded-2xl text-xs text-neutral-slate space-y-2">
        <span className="font-bold text-gov-navy block">ข้อกำหนดคอลัมน์ของตาราง Excel:</span>
        <ul className="list-disc pl-5 space-y-1">
          <li>คอลัมน์ A (ลำดับ): หมายเลขพัสดุ (ID) เรียงลำดับจาก 1 ขึ้นไป</li>
          <li>คอลัมน์ B (รายการ): รายละเอียดและสเปกของพัสดุตามสัญญาจัดซื้อ</li>
          <li>คอลัมน์ C (จำนวน): จำนวนจัดซื้อ (ตัวเลขจำนวนเต็ม)</li>
          <li>คอลัมน์ D (หน่วย): หน่วยนับพัสดุ (เช่น อัน, ชุด, เส้น, เครื่อง)</li>
          <li>คอลัมน์ E (ราคาต่อหน่วย): ราคากลางต่อหน่วยอุปกรณ์</li>
        </ul>
      </div>

    </div>
  );
}
