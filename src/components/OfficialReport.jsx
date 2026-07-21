import React from 'react';
import { Printer, Download, FileJson, FileSpreadsheet, QrCode } from 'lucide-react';
import { formatNumber } from '../utils/numberFormatter';

const GarudaEmblem = () => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 100 100" 
    className="w-16 h-16 mx-auto fill-slate-800 print:fill-black print:text-black"
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
  
  const renderItemRows = () => {
    return items.map((item, idx) => (
      <tr key={item.id} className="border-b border-slate-300 print:border-black print-no-break">
        <td className="px-2.5 py-3.5 text-center font-bold text-slate-800 print:text-black num-tabular">{idx + 1}</td>
        <td className="px-3 py-3.5 text-left font-bold text-slate-800 print:text-black leading-relaxed">
          {item.name}
          <div className="text-[10px] font-normal text-slate-500 print:text-slate-700 mt-1 whitespace-pre-line leading-relaxed font-medium">
            {item.spec}
          </div>
          {item.serial_number && (
            <div className="text-[9px] font-bold text-gov-navy print:text-black mt-1 num-tabular">
              S/N: {item.serial_number} {item.mac_address && `| MAC: ${item.mac_address}`} {item.asset_number && `| รหัสครุภัณฑ์: ${item.asset_number}`}
            </div>
          )}
          {item.notes && (
            <div className="text-[10px] text-status-pending print:text-black bg-amber-50 print:bg-transparent px-2 py-1 mt-1.5 rounded border border-amber-100/50 print:border-none font-medium">
              ข้อคิดเห็นการตรวจรับ: {item.notes}
            </div>
          )}
        </td>
        <td className="px-2.5 py-3.5 text-center font-semibold text-slate-800 print:text-black num-tabular">{item.qty}</td>
        <td className="px-2.5 py-3.5 text-center font-semibold text-slate-800 print:text-black">{item.unit}</td>
        <td className="px-2.5 py-3.5 text-right font-semibold text-slate-800 print:text-black num-tabular">{formatNumber(item.unit_price)}</td>
        <td className="px-2.5 py-3.5 text-right font-black text-gov-navy print:text-black num-tabular">{formatNumber(item.qty * item.unit_price)}</td>
        <td className="px-2.5 py-3.5 text-center font-bold">
          {item.inspectStatus === 'passed' ? (
            <span className="text-status-passed print:text-black">ผ่าน</span>
          ) : item.inspectStatus === 'failed' ? (
            <span className="text-status-failed print:text-black">ไม่ผ่าน</span>
          ) : (
            <span className="text-status-pending print:text-black">รอตรวจ</span>
          )}
        </td>
      </tr>
    ));
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Print and Export Controls (Hidden on Print) */}
      <div className="bg-white p-5 rounded-2xl shadow-premium border border-slate-100 flex flex-col sm:flex-row gap-4 items-center justify-between print:hidden">
        
        {/* Left Side: Filters */}
        <div className="flex flex-wrap gap-3 items-center w-full sm:w-auto">
          <span className="text-xs font-bold text-neutral-slate uppercase tracking-wider">ตัวเลือกออกรายงาน:</span>
          <select 
            value={divisionFilter}
            onChange={(e) => setDivisionFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 px-3.5 py-1.5 rounded-xl text-xs font-bold focus:outline-none"
          >
            <option value="all">ทุกกลุ่มงาน</option>
            {divisions.map(d => (
              <option key={d} value={d}>กลุ่มงาน{d}</option>
            ))}
          </select>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 px-3.5 py-1.5 rounded-xl text-xs font-bold focus:outline-none"
          >
            <option value="all">ทุกสถานะ</option>
            <option value="passed">🟢 ผ่านการตรวจรับ</option>
            <option value="pending">🟡 อยู่ระหว่างตรวจ</option>
            <option value="failed">🔴 ตรวจไม่ผ่าน</option>
          </select>
        </div>

        {/* Right Side: Actions */}
        <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-end">
          <button 
            onClick={handlePrint}
            className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 bg-gov-blue hover:bg-gov-navy text-white rounded-xl shadow-premium transition-all duration-300 border border-gov-gold/15"
          >
            <Printer className="w-4 h-4 text-gov-gold" />
            พิมพ์รายงาน (PDF)
          </button>
          
          <button 
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-neutral-charcoal rounded-xl transition-all duration-300 border border-slate-200/50"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            Excel
          </button>
          
          <button 
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-neutral-charcoal rounded-xl transition-all duration-300 border border-slate-200/50"
          >
            <Download className="w-4 h-4 text-gov-blue" />
            CSV
          </button>

          <button 
            onClick={handleExportJSON}
            className="flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-neutral-charcoal rounded-xl transition-all duration-300 border border-slate-200/50"
          >
            <FileJson className="w-4 h-4 text-status-pending" />
            JSON
          </button>
        </div>

      </div>

      {/* 2. Official Document Preview Sheet */}
      <div className="bg-white p-8 sm:p-12 md:p-16 shadow-premium border border-slate-100 rounded-3xl mx-auto max-w-[900px] text-black font-serif print:shadow-none print:border-none print:p-0 print:m-0 print:max-w-none relative overflow-hidden">
        
        {/* Decorative Gold top border for preview mode */}
        <span className="absolute top-0 left-0 right-0 h-1.5 bg-gov-gold print:hidden"></span>

        {/* Official Header */}
        <div className="text-center space-y-4 pb-6 border-b-2 border-black">
          <GarudaEmblem />
          <h2 className="text-base sm:text-lg font-black tracking-wide">รายงานการตรวจรับพัสดุคอมพิวเตอร์</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-left max-w-[650px] mx-auto pt-2 leading-relaxed">
            <div>
              <strong>โครงการ:</strong> จัดซื้อวัสดุคอมพิวเตอร์ งบประมาณ พ.ศ. 2569 (กองยุทธศาสตร์และงบประมาณ)
            </div>
            <div>
              <strong>เลขที่สัญญา/คำสั่ง:</strong> คำสั่งเทศบาลนครนครสวรรค์ ที่ ๘๖๔/๒๕๖๙
            </div>
            <div>
              <strong>วันที่ตรวจตรวจรับพัสดุ:</strong> 21 กรกฎาคม 2569
            </div>
            <div>
              <strong>หน่วยงานผู้ดำเนินการ:</strong> เทศบาลนครนครสวรรค์
            </div>
          </div>
        </div>

        {/* Verification Status Banner */}
        <div className="py-4 flex justify-between items-center text-xs border-b border-black">
          <div>
            สถานะการตรวจรับงาน: <span className="font-bold">ผ่านเกณฑ์ทั้งสิ้น {stats.passedCount} จาก {stats.totalItems} รายการ</span>
          </div>
          <div>
            มูลค่าตรวจผ่านรวม: <span className="font-black text-gov-navy print:text-black num-tabular">{formatNumber(stats.passedBudget)} บาท</span>
          </div>
        </div>

        {/* Procurement Table */}
        <div className="overflow-x-auto pt-6">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-black text-center font-bold">
                <th className="px-2.5 py-2.5 w-12">ลำดับ</th>
                <th className="px-3 py-2.5 text-left">รายการและรายละเอียดคุณลักษณะ</th>
                <th className="px-2.5 py-2.5 w-16">จำนวน</th>
                <th className="px-2.5 py-2.5 w-16">หน่วย</th>
                <th className="px-2.5 py-2.5 w-24 text-right">ราคา/หน่วย</th>
                <th className="px-2.5 py-2.5 w-28 text-right">รวมเงิน (บาท)</th>
                <th className="px-2.5 py-2.5 w-16">ผลตรวจ</th>
              </tr>
            </thead>
            <tbody>
              {renderItemRows()}
              
              {/* Grand Total Row */}
              <tr className="border-t-2 border-black font-black">
                <td colSpan={2} className="px-3 py-4 text-right uppercase tracking-wider">รวมงบประมาณจัดซื้อสุทธิ:</td>
                <td colSpan={2} className="px-2.5 py-4 text-center">{stats.totalItems} รายการ</td>
                <td className="px-2.5 py-4"></td>
                <td className="px-2.5 py-4 text-right text-sm num-tabular">{formatNumber(stats.totalBudget)}</td>
                <td className="px-2.5 py-4"></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Verification Signatures (Always at the bottom, page-break-avoid) */}
        <div className="mt-12 pt-8 border-t border-black/20 print-no-break space-y-6">
          
          <div className="text-center text-xs leading-relaxed font-semibold">
            ขอรับรองว่าพัสดุตามรายการข้างต้น ได้รับการตรวจสอบคุณลักษณะเฉพาะและทดลองใช้งานแล้วเสร็จ ผลการตรวจรับเป็นไปตามเงื่อนไขสัญญาจัดซื้อทุกประการ
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8">
            {committee.map((member, index) => (
              <div key={index} className="text-center space-y-8 flex flex-col items-center">
                
                {/* Signature blank line */}
                <div className="w-48 border-b border-black/60 pt-6"></div>
                
                <div className="space-y-1">
                  <p className="text-xs font-bold">({member.name})</p>
                  <p className="text-[10px] text-slate-700 print:text-black leading-relaxed font-medium">{member.position}</p>
                </div>

              </div>
            ))}
          </div>

          {/* QR Verify Code Footer */}
          <div className="flex justify-between items-center text-[9px] text-slate-400 print:text-black pt-12">
            <div>
              ระบบตรวจสอบและรายงานพัสดุคอมพิวเตอร์ เทศบาลนครนครสวรรค์ (งบประมาณ 2569)
            </div>
            <div className="flex items-center gap-1.5">
              <QrCode className="w-4 h-4 text-slate-700" />
              <span>สแกนยืนยันรายงานหลักฐานในบราวเซอร์</span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
