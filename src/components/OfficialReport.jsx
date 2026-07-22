import React, { useState } from 'react';
import { Printer, Download, FileJson, FileSpreadsheet, Image as ImageIcon, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { formatNumber } from '../utils/numberFormatter';
import { inspectionRepository } from '../utils/inspectionRepository';

const GarudaEmblem = () => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 100 100" 
    className="w-20 h-20 mx-auto fill-slate-800 print:fill-black"
  >
    <path d="M50 5C53.4 9.1 56 12 56 16C56 18.5 53.6 20.3 50.5 20.3C47.4 20.3 45 18.5 45 16C45 12 47.6 9.1 50 5ZM50 21C55 21 59 23.5 61.2 27.5C62.5 26.5 64 26 65.5 26C68.5 26 71 28.5 71 31.5C71 33.2 70.2 34.8 69 35.8C73.5 39 77.2 43.5 79.5 49C77 48.5 74.5 48.2 72 48.2C68 48.2 64.5 49.5 61.5 51.5C63 53.5 64 56 64 58.5C64 64 58.5 69.5 50.5 69.5C42.5 69.5 37 64 37 58.5C37 56 38 53.5 39.5 51.5C36.5 49.5 33 48.2 29 48.2C26.5 48.2 24 48.5 21.5 49C23.8 43.5 27.5 39 32 35.8C30.8 34.8 30 33.2 30 31.5C30 28.5 32.5 26 35.5 26C37 26 38.5 26.5 39.8 27.5C42 23.5 46 21 50 21ZM50.5 70.5C57.5 70.5 63 75.5 63.5 81.5C61.5 81 59.2 80.5 56.5 80.5C53.5 80.5 51.2 81.5 50.5 82.5C49.8 81.5 47.5 80.5 44.5 80.5C41.8 80.5 39.5 81 37.5 81.5C38 75.5 43.5 70.5 50.5 70.5ZM50.5 83.5C53 83.5 54.5 84 55.5 84.5C53 86.5 51.5 88.5 50.5 91C49.5 88.5 48 86.5 45.5 84.5C46.5 84 48 83.5 50.5 83.5Z" />
    <path d="M50 30C52.5 30 54.5 32 54.5 34.5C54.5 37 52.5 39 50 39C47.5 39 45.5 37 45.5 34.5C45.5 32 47.5 30 50 30Z" />
  </svg>
);

export default function OfficialReport({ 
  items, 
  committee, 
  stats,
  divisionFilter,
  setDivisionFilter,
  statusFilter,
  setStatusFilter,
  handlePrint,
  handleExportExcel,
  handleExportCSV,
  handleExportJSON,
  divisions
}) {
  const [includePhotos, setIncludePhotos] = useState(true);

  const getItemImageSrc = (item) => {
    return item.images?.product 
      ? (item.images.product.startsWith('data:') ? item.images.product : `./รูปภาพ/${item.images.product}`)
      : (item.image ? (item.image.startsWith('data:') ? item.image : (item.image.startsWith('/') ? item.image : `./${item.image}`)) : null);
  };

  const renderItemRows = () => {
    return items.map((item, idx) => (
      <tr key={item.id} className="border-b border-slate-300 print:border-slate-400 print-no-break">
        <td className="px-3 py-3 text-center font-bold text-slate-800 print:text-black num-tabular text-sm">{idx + 1}</td>
        <td className="px-3.5 py-3 text-left font-bold text-slate-900 print:text-black leading-normal text-sm">
          {item.name}
          {item.spec && (
            <div className="text-xs font-normal text-slate-600 print:text-slate-700 mt-1 whitespace-pre-line leading-relaxed font-sans">
              {item.spec}
            </div>
          )}
          {item.notes && (
            <div className="text-xs font-medium text-amber-900 bg-amber-50 print:bg-transparent px-2.5 py-1 mt-1.5 rounded border border-amber-200 print:border-none">
              ข้อคิดเห็นการตรวจรับ: {item.notes}
            </div>
          )}
        </td>
        <td className="px-3 py-3 text-center font-bold text-slate-800 print:text-black num-tabular text-sm">{item.qty}</td>
        <td className="px-3 py-3 text-center font-medium text-slate-800 print:text-black text-sm">{item.unit}</td>
        <td className="px-3 py-3 text-right font-medium text-slate-800 print:text-black num-tabular text-sm">{formatNumber(item.unit_price)}</td>
        <td className="px-3 py-3 text-right font-bold text-slate-900 print:text-black num-tabular text-sm">{formatNumber(item.qty * item.unit_price)}</td>
        <td className="px-3 py-3 text-center font-bold text-sm">
          {item.inspectStatus === 'passed' ? (
            <span className="text-emerald-700 print:text-black">ผ่าน</span>
          ) : item.inspectStatus === 'failed' ? (
            <span className="text-rose-700 print:text-black">ไม่ผ่าน</span>
          ) : (
            <span className="text-amber-600 print:text-black">รอตรวจ</span>
          )}
        </td>
      </tr>
    ));
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      
      {/* 1. Control Toolbar (Hidden on Print) */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 items-center justify-between print:hidden">
        
        {/* Filter Controls */}
        <div className="flex flex-wrap gap-3 items-center w-full md:w-auto">
          <span className="text-sm font-bold text-slate-700">ตัวเลือกรายงาน:</span>
          
          <select 
            value={divisionFilter}
            onChange={(e) => setDivisionFilter(e.target.value)}
            className="bg-slate-50 border border-slate-300 px-3.5 py-2 rounded-xl text-sm font-bold text-slate-800 focus:outline-none"
          >
            <option value="all">ทุกกลุ่มงาน</option>
            {divisions.map(d => (
              <option key={d} value={d}>กลุ่มงาน {d}</option>
            ))}
          </select>

          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-300 px-3.5 py-2 rounded-xl text-sm font-bold text-slate-800 focus:outline-none"
          >
            <option value="all">ทุกสถานะ</option>
            <option value="passed">🟢 ผ่านการตรวจรับ</option>
            <option value="pending">🟡 อยู่ระหว่างตรวจ</option>
            <option value="failed">🔴 ตรวจไม่ผ่าน</option>
          </select>

          {/* Attach Evidence Photos Toggle */}
          <label className="flex items-center gap-2 cursor-pointer bg-slate-50 border border-slate-300 px-3.5 py-2 rounded-xl text-sm font-bold text-slate-800 hover:bg-slate-100 transition-colors">
            <input 
              type="checkbox"
              checked={includePhotos}
              onChange={(e) => setIncludePhotos(e.target.checked)}
              className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
            />
            <ImageIcon className="w-4 h-4 text-slate-600" />
            <span>แนบรูปภาพหลักฐานพัสดุประกอบรายงาน</span>
          </label>
        </div>

        {/* Export Buttons */}
        <div className="flex flex-wrap gap-2 w-full md:w-auto justify-end">
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 text-sm font-bold px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow transition-all duration-200 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            พิมพ์รายงาน / บันทึก PDF
          </button>
          
          <button 
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 text-sm font-bold px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl transition-all duration-200 border border-slate-300 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            Excel
          </button>
          
          <button 
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 text-sm font-bold px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl transition-all duration-200 border border-slate-300 cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-600" />
            CSV
          </button>

          <button 
            onClick={handleExportJSON}
            className="flex items-center gap-1.5 text-sm font-bold px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl transition-all duration-200 border border-slate-300 cursor-pointer"
          >
            <FileJson className="w-4 h-4 text-amber-600" />
            JSON
          </button>
        </div>

      </div>

      {/* 2. Main Official Document Container */}
      <div className="bg-white p-8 sm:p-12 md:p-16 shadow-lg border border-slate-200 rounded-2xl mx-auto text-slate-900 print:shadow-none print:border-none print:p-0 print:m-0 print:max-w-none">
        
        {/* Document Official Header */}
        <div className="text-center space-y-4 pb-6 border-b-2 border-slate-900">
          <GarudaEmblem />
          <h1 className="text-xl sm:text-2xl font-bold tracking-wide">รายงานการตรวจรับพัสดุคอมพิวเตอร์</h1>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-left max-w-2xl mx-auto pt-3 leading-relaxed font-sans">
            <div>
              <strong>โครงการ:</strong> จัดซื้อวัสดุคอมพิวเตอร์ งบประมาณ พ.ศ. 2569
            </div>
            <div>
              <strong>เลขที่คำสั่ง:</strong> คำสั่งเทศบาลนครนครสวรรค์ ที่ ๘๖๔/๒๕๖๙
            </div>
            <div>
              <strong>วันที่ตรวจรับ:</strong> 21 กรกฎาคม 2569
            </div>
            <div>
              <strong>หน่วยงาน:</strong> เทศบาลนครนครสวรรค์ (กองยุทธศาสตร์และงบประมาณ)
            </div>
          </div>
        </div>

        {/* Verification Summary Bar */}
        <div className="py-4 flex flex-col sm:flex-row justify-between items-center text-sm border-b border-slate-300 gap-2">
          <div>
            <strong>สรุปผลการตรวจรับ:</strong> ผ่านเกณฑ์ {stats.passedCount} จาก {stats.totalItems} รายการ
          </div>
          <div>
            <strong>มูลค่าจัดซื้อรวม:</strong> <span className="font-bold text-base num-tabular">{formatNumber(stats.totalBudget)} บาท</span>
          </div>
        </div>

        {/* Summary Table */}
        <div className="overflow-x-auto pt-6">
          <table className="w-full text-sm text-left border-collapse font-sans">
            <thead>
              <tr className="border-b-2 border-slate-900 text-center font-bold bg-slate-50 print:bg-transparent">
                <th className="px-3 py-3 w-12">ลำดับ</th>
                <th className="px-3.5 py-3 text-left">รายการพัสดุและรายละเอียดคุณลักษณะ</th>
                <th className="px-3 py-3 w-16">จำนวน</th>
                <th className="px-3 py-3 w-16">หน่วย</th>
                <th className="px-3 py-3 w-28 text-right">ราคา/หน่วย</th>
                <th className="px-3 py-3 w-32 text-right">รวมเงิน (บาท)</th>
                <th className="px-3 py-3 w-20">ผลตรวจ</th>
              </tr>
            </thead>
            <tbody>
              {renderItemRows()}
              
              {/* Grand Total Row */}
              <tr className="border-t-2 border-slate-900 font-bold bg-slate-50 print:bg-transparent text-base">
                <td colSpan={2} className="px-3.5 py-4 text-right">รวมงบประมาณจัดซื้อทั้งสิ้น:</td>
                <td colSpan={2} className="px-3 py-4 text-center">{stats.totalItems} รายการ</td>
                <td className="px-3 py-4"></td>
                <td className="px-3 py-4 text-right num-tabular font-black">{formatNumber(stats.totalBudget)}</td>
                <td className="px-3 py-4"></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Signatures Section */}
        <div className="mt-12 pt-8 border-t border-slate-300 print-no-break space-y-8 font-sans">
          
          <div className="text-center text-sm leading-relaxed font-medium max-w-2xl mx-auto">
            ขอรับรองว่าพัสดุตามรายการข้างต้น ได้รับการตรวจสอบคุณลักษณะเฉพาะและทดลองใช้งานแล้วเสร็จ ผลการตรวจรับเป็นไปตามเงื่อนไขสัญญาจัดซื้อทุกประการ
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 pt-6">
            {committee.map((member, index) => (
              <div key={index} className="text-center space-y-6 flex flex-col items-center">
                <div className="w-56 border-b border-slate-900 pt-8"></div>
                <div className="space-y-1">
                  <p className="text-sm font-bold">({member.name})</p>
                  <p className="text-xs text-slate-700 print:text-black leading-relaxed font-medium">{member.position}</p>
                </div>
              </div>
            ))}
          </div>

        </div>

        {/* 3. Photo Evidence Annex Section (If Enabled) */}
        {includePhotos && (
          <div className="mt-16 pt-10 border-t-2 border-slate-900 font-sans print:break-before-page">
            
            {/* Annex Header */}
            <div className="text-center space-y-2 pb-6 border-b border-slate-300">
              <h2 className="text-lg sm:text-xl font-bold tracking-wide text-slate-900">
                ภาคผนวก: ภาพถ่ายหลักฐานพัสดุจริงจากการตรวจรับ
              </h2>
              <p className="text-xs text-slate-600 print:text-slate-700">
                คำสั่งเทศบาลนครนครสวรรค์ ที่ ๘๖๔/๒๕๖๙ (จำนวนพัสดุทั้งสิ้น {items.length} รายการ)
              </p>
            </div>

            {/* Photo Grid (2-Column Grid Optimized for A4 Print) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6">
              {items.map((item, idx) => {
                const img = getItemImageSrc(item);
                return (
                  <div 
                    key={item.id}
                    className="border border-slate-300 rounded-xl p-4 bg-slate-50/50 print:bg-transparent print-no-break flex flex-col justify-between"
                  >
                    <div>
                      {/* Item Title & Badge */}
                      <div className="flex items-start justify-between gap-2 mb-2 pb-2 border-b border-slate-200">
                        <div>
                          <span className="font-bold text-xs text-slate-500 block">ลำดับที่ {idx + 1} (ID #{item.id})</span>
                          <h4 className="font-bold text-sm text-slate-900 line-clamp-2">{item.name}</h4>
                        </div>
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold shrink-0 ${
                          item.inspectStatus === 'passed' ? 'bg-emerald-100 text-emerald-800' :
                          item.inspectStatus === 'failed' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {item.inspectStatus === 'passed' ? 'ผ่าน' : item.inspectStatus === 'failed' ? 'ไม่ผ่าน' : 'รอตรวจ'}
                        </span>
                      </div>

                      {/* Photo Container */}
                      <div className="w-full h-48 bg-slate-200/80 rounded-lg overflow-hidden border border-slate-300 flex items-center justify-center relative mb-3">
                        {img ? (
                          <img 
                            src={img} 
                            alt={item.name}
                            className="w-full h-full object-cover"
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        ) : (
                          <div className="text-slate-400 text-xs font-medium">ไม่มีรูปภาพพัสดุ</div>
                        )}
                      </div>

                      {/* Spec summary */}
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-2 font-normal">
                        {item.spec}
                      </p>
                    </div>

                    {/* Footer info */}
                    <div className="text-xs font-bold text-slate-800 pt-2 border-t border-slate-200 flex justify-between items-center">
                      <span>จำนวน {item.qty} {item.unit}</span>
                      <span>รวม {formatNumber(item.qty * item.unit_price)} บาท</span>
                    </div>

                  </div>
                );
              })}
            </div>

          </div>
        )}

      </div>

    </div>
  );
}
