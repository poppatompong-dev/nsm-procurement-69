import React, { useState } from 'react';
import { Printer, Download, FileJson, FileSpreadsheet, Image as ImageIcon, ImageOff, CheckCircle2, XCircle, Clock, Columns3, ChevronDown } from 'lucide-react';
import { formatNumber } from '../utils/numberFormatter';
import { getImageUrl } from '../utils/imageHelper';

const REPORT_COLUMNS = [
  { key: 'no', label: 'ลำดับ', thClass: 'w-12' },
  { key: 'name', label: 'รายการพัสดุและรายละเอียดคุณลักษณะ', thClass: 'text-left' },
  { key: 'qty', label: 'จำนวน', thClass: 'w-16' },
  { key: 'unit', label: 'หน่วย', thClass: 'w-16' },
  { key: 'unitPrice', label: 'ราคา/หน่วย', thClass: 'w-28 text-right' },
  { key: 'total', label: 'รวมเงิน (บาท)', thClass: 'w-32 text-right' },
  { key: 'status', label: 'ผลตรวจ', thClass: 'w-20' },
];

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
  const [visibleColumns, setVisibleColumns] = useState(() =>
    Object.fromEntries(REPORT_COLUMNS.map(c => [c.key, true]))
  );
  const [showColumnPicker, setShowColumnPicker] = useState(false);

  const activeColumns = REPORT_COLUMNS.filter(c => visibleColumns[c.key]);

  const toggleColumn = (key) => {
    setVisibleColumns(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const renderCell = (key, item, idx) => {
    switch (key) {
      case 'no':
        return <td key={key} className="px-3 py-3 text-center font-bold text-slate-800 print:text-black num-tabular text-sm">{idx + 1}</td>;
      case 'name':
        return (
          <td key={key} className="px-3.5 py-3 text-left font-bold text-slate-900 print:text-black leading-normal text-sm">
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
        );
      case 'qty':
        return <td key={key} className="px-3 py-3 text-center font-bold text-slate-800 print:text-black num-tabular text-sm">{item.qty}</td>;
      case 'unit':
        return <td key={key} className="px-3 py-3 text-center font-medium text-slate-800 print:text-black text-sm">{item.unit}</td>;
      case 'unitPrice':
        return <td key={key} className="px-3 py-3 text-right font-medium text-slate-800 print:text-black num-tabular text-sm">{formatNumber(item.unit_price)}</td>;
      case 'total':
        return <td key={key} className="px-3 py-3 text-right font-bold text-slate-900 print:text-black num-tabular text-sm">{formatNumber(item.qty * item.unit_price)}</td>;
      case 'status':
        return (
          <td key={key} className="px-3 py-3 text-center font-bold text-sm">
            {item.inspectStatus === 'passed' ? (
              <span className="text-emerald-700 print:text-black">ผ่าน</span>
            ) : item.inspectStatus === 'failed' ? (
              <span className="text-rose-700 print:text-black">ไม่ผ่าน</span>
            ) : (
              <span className="text-amber-600 print:text-black">รอตรวจ</span>
            )}
          </td>
        );
      default:
        return null;
    }
  };

  const renderItemRows = () => {
    return items.map((item, idx) => (
      <tr key={item.id} className="border-b border-slate-300 print:border-slate-400 print-no-break">
        {activeColumns.map(col => renderCell(col.key, item, idx))}
      </tr>
    ));
  };

  const renderGrandTotalRow = () => {
    const totalIdx = activeColumns.findIndex(c => c.key === 'total');
    const labelSpan = totalIdx === -1 ? activeColumns.length : totalIdx;
    const cells = [
      <td key="label" colSpan={labelSpan} className="px-3.5 py-4 text-right">
        รวมงบประมาณจัดซื้อทั้งสิ้น: {stats.totalItems} รายการ
        {totalIdx === -1 && <span className="ml-2">({formatNumber(stats.totalBudget)} บาท)</span>}
      </td>
    ];
    if (totalIdx !== -1) {
      cells.push(
        <td key="total" className="px-3 py-4 text-right num-tabular font-black">{formatNumber(stats.totalBudget)}</td>
      );
      for (let i = totalIdx + 1; i < activeColumns.length; i++) {
        cells.push(<td key={activeColumns[i].key} className="px-3 py-4"></td>);
      }
    }
    return cells;
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

          {/* Column Visibility Picker */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowColumnPicker(v => !v)}
              className="flex items-center gap-2 bg-slate-50 border border-slate-300 px-3.5 py-2 rounded-xl text-sm font-bold text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <Columns3 className="w-4 h-4 text-slate-600" />
              <span>คอลัมน์ที่พิมพ์ ({activeColumns.length}/{REPORT_COLUMNS.length})</span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform ${showColumnPicker ? 'rotate-180' : ''}`} />
            </button>

            {showColumnPicker && (
              <div className="absolute z-20 top-full mt-2 left-0 bg-white border border-slate-200 rounded-xl shadow-lg p-2 w-64">
                {REPORT_COLUMNS.map(col => (
                  <label
                    key={col.key}
                    className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm font-medium text-slate-800 hover:bg-slate-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={visibleColumns[col.key]}
                      onChange={() => toggleColumn(col.key)}
                      className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                    />
                    <span>{col.label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
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
                {activeColumns.length === 0 ? (
                  <th className="px-3 py-3">ไม่ได้เลือกคอลัมน์ที่จะแสดง</th>
                ) : (
                  activeColumns.map(col => (
                    <th key={col.key} className={`px-3 py-3 ${col.thClass || ''}`}>{col.label}</th>
                  ))
                )}
              </tr>
            </thead>
            <tbody>
              {activeColumns.length === 0 ? (
                <tr>
                  <td className="px-3 py-6 text-center text-slate-500 text-sm">
                    กรุณาเลือกอย่างน้อย 1 คอลัมน์จากปุ่ม "คอลัมน์ที่พิมพ์" ด้านบน
                  </td>
                </tr>
              ) : (
                renderItemRows()
              )}
              
              {/* Grand Total Row */}
              {activeColumns.length > 0 && (
                <tr className="border-t-2 border-slate-900 font-bold bg-slate-50 print:bg-transparent text-base">
                  {renderGrandTotalRow()}
                </tr>
              )}
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
                const img = getImageUrl(item);
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
                      <div className={`w-full h-48 rounded-lg overflow-hidden flex items-center justify-center relative mb-3 ${
                        img
                          ? 'border border-slate-300 bg-slate-100'
                          : 'border-2 border-dashed border-slate-300 print:border-slate-500 bg-slate-50 print:bg-transparent'
                      }`}>
                        {img ? (
                          <img
                            src={img}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center gap-2 text-center px-4">
                            <ImageOff className="w-7 h-7 text-slate-400 print:text-slate-600" strokeWidth={1.5} />
                            <span className="text-xs font-bold text-slate-500 print:text-slate-700 tracking-wide">ไม่มีภาพถ่ายประกอบ</span>
                          </div>
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
