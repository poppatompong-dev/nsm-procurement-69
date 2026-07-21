import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { Upload, FileSpreadsheet, Check, AlertCircle } from 'lucide-react';

export default function ExcelImporter({ onImport }) {
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState({ type: 'idle', message: '' });

  const processFile = (file) => {
    if (!file) return;
    setStatus({ type: 'loading', message: 'กำลังอ่านและประมวลผลไฟล์ Excel...' });

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Find best sheet (default to 'ร้านค้า' or first sheet)
        const sheetName = workbook.SheetNames.find(n => n.includes('ร้านค้า') || n.includes('ราคา') || n.includes('งบ')) || workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        
        // Convert to array of raw rows
        const rawRows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        
        // Find header row or items rows
        const parsedItems = [];
        let startParsing = false;
        
        rawRows.forEach((row) => {
          if (!row || row.length === 0) return;
          
          const firstCell = String(row[0] || '').trim();
          const idNum = Number(firstCell);
          
          // Row starts with number ID
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
            message: 'ไม่พบรายการพัสดุในรูปแบบที่ถูกต้องในไฟล์ Excel (แถวต้องเริ่มด้วยรหัส ID ในคอลัมน์แรก)' 
          });
        }
      } catch (err) {
        console.error(err);
        setStatus({ type: 'error', message: 'เกิดข้อผิดพลาดในการแกะรหัสข้อมูลไฟล์ Excel' });
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
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-4 print:hidden">
      <div>
        <h3 className="text-sm sm:text-base font-bold text-slate-800 flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
          นำเข้าใบเสนอราคาพัสดุด้วย Excel (Excel Importer)
        </h3>
        <p className="text-[10px] sm:text-xs text-slate-400 mt-1">
          ใช้สำหรับอัปโหลดใบเสนอราคาใหม่เพื่อรีเซ็ตและสร้างฐานข้อมูลการตรวจรับใหม่โดยอัตโนมัติ
        </p>
      </div>

      {/* Drop Zone Area */}
      <div 
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
          isDragging 
            ? 'border-blue-600 bg-blue-50/50' 
            : 'border-slate-200 bg-slate-50 hover:bg-slate-100/50'
        }`}
      >
        <label className="cursor-pointer block space-y-2">
          <Upload className="w-8 h-8 text-slate-400 mx-auto" />
          <div className="text-xs sm:text-sm font-semibold text-slate-700">
            ลากและวางไฟล์ Excel หรือคลิกเพื่อค้นหาในเครื่อง
          </div>
          <div className="text-[10px] text-slate-400">
            รองรับไฟล์นามสกุล .xlsx หรือ .xls (โดยคอลัมน์แรกสุดต้องเป็นเลขลำดับ ID เสมอ)
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
        <div className={`p-3.5 rounded-xl flex items-center gap-2.5 text-xs font-semibold ${
          status.type === 'loading' ? 'bg-blue-50 text-blue-700' :
          status.type === 'success' ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'
        }`}>
          {status.type === 'success' ? (
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{status.message}</span>
        </div>
      )}

    </div>
  );
}
