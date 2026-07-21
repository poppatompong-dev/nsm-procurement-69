import React, { useState } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  Send, 
  Mail, 
  Download, 
  FileText, 
  QrCode, 
  Link2,
  FileSpreadsheet
} from 'lucide-react';

export default function ShareModal({ 
  onClose, 
  shareUrl, 
  onExportExcel, 
  onExportJSON, 
  onPrint 
}) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('link');

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lineShareUrl = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(shareUrl)}`;
  const emailShareUrl = `mailto:?subject=${encodeURIComponent('ระบบรายงานการตรวจรับพัสดุ เทศบาลนครนครสวรรค์')}&body=${encodeURIComponent(`โปรดคลิกลิงก์ด้านล่างเพื่อตรวจสอบความก้าวหน้า รายละเอียดสเปก และผลการตรวจรับพัสดุ:\n\n${shareUrl}`)}`;
  
  // High-performance QR Code API load link
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(shareUrl)}`;

  const handleDownloadQR = async () => {
    try {
      const response = await fetch(qrImageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `procurement_audit_qr_${new Date().toISOString().split('T')[0]}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e) {
      console.error(e);
      alert('ไม่สามารถดาวน์โหลด QR Code ได้ในขณะนี้');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
      
      {/* Modal Card wrapper */}
      <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden border border-slate-100 shadow-floating relative flex flex-col max-h-[90vh]">
        
        {/* Glowing border top */}
        <span className="h-1.5 w-full bg-gradient-to-r from-gov-navy via-gov-blue to-gov-gold"></span>

        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm sm:text-base font-black text-gov-navy">ระบบส่งต่อและแชร์ความก้าวหน้าโครงการ</h3>
            <p className="text-[10px] text-neutral-slate mt-0.5">แชร์ข้อมูลสถานะและคิวงานตรวจรับล่าสุดให้เจ้าหน้าที่ท่านอื่น</p>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-slate-50 text-slate-400 hover:text-slate-600 rounded-xl transition-colors cursor-pointer"
            title="ปิดหน้าต่างแชร์ข้อมูล"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sharing Tab Buttons */}
        <div className="flex border-b border-slate-100 bg-slate-50/50 p-1.5 gap-1">
          <button
            onClick={() => setActiveTab('link')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'link' ? 'bg-white text-gov-navy shadow-sm' : 'text-neutral-slate hover:text-gov-navy'
            }`}
          >
            <Link2 className="w-3.5 h-3.5" />
            ลิงก์แชร์ URL
          </button>
          <button
            onClick={() => setActiveTab('qr')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'qr' ? 'bg-white text-gov-navy shadow-sm' : 'text-neutral-slate hover:text-gov-navy'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            คิวอาร์โค้ด
          </button>
          <button
            onClick={() => setActiveTab('export')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'export' ? 'bg-white text-gov-navy shadow-sm' : 'text-neutral-slate hover:text-gov-navy'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            พิมพ์ / ส่งออก
          </button>
        </div>

        {/* Modal Tab Content Area */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          
          {/* TAB 1: Link & Social Sharing */}
          {activeTab === 'link' && (
            <div className="space-y-4 animate-fade-in">
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-neutral-slate uppercase tracking-wider">แชร์ URL สถานะล่าสุด</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    readOnly 
                    value={shareUrl}
                    className="flex-1 bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs text-neutral-charcoal focus:outline-none select-all font-mono"
                  />
                  <button
                    onClick={handleCopy}
                    className={`px-4 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
                      copied ? 'bg-emerald-600 text-white' : 'bg-gov-blue hover:bg-gov-navy text-white shadow-sm'
                    }`}
                    title="คัดลอกลิงก์ไปยังคลิปบอร์ด"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'คัดลอกแล้ว' : 'คัดลอก'}
                  </button>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4 space-y-3">
                <span className="block text-[9px] font-bold text-neutral-slate uppercase tracking-wider text-center">แชร์ไปยังช่องทางสังคมออนไลน์</span>
                <div className="grid grid-cols-2 gap-3">
                  <a
                    href={lineShareUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 p-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
                  >
                    <Send className="w-4 h-4" />
                    ส่งเข้ากลุ่ม LINE
                  </a>
                  <a
                    href={emailShareUrl}
                    className="flex items-center justify-center gap-2 p-3 bg-slate-800 hover:bg-slate-900 text-slate-100 rounded-xl text-xs font-bold shadow-sm transition-all"
                  >
                    <Mail className="w-4 h-4" />
                    ส่งอีเมลราชการ
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: QR Code */}
          {activeTab === 'qr' && (
            <div className="flex flex-col items-center justify-center space-y-4 py-2 animate-fade-in">
              <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-inner relative group">
                <img 
                  src={qrImageUrl} 
                  alt="Inspection QR Code" 
                  className="w-48 h-48 sm:w-56 sm:h-56 object-contain"
                />
              </div>

              <div className="text-center space-y-1 max-w-xs">
                <p className="text-xs font-bold text-gov-navy">สแกนเพื่อเปิดบนสมาร์ทโฟน/แท็บเล็ต</p>
                <p className="text-[10px] text-neutral-slate leading-relaxed">
                  สแกนคิวอาร์โค้ดนี้เพื่อแชร์หน้าจอ คีย์งาน และผลการตรวจรับพัสดุโครงการนี้ให้คณะกรรมการและเจ้าหน้าที่ในที่ประชุม
                </p>
              </div>

              <button
                onClick={handleDownloadQR}
                className="flex items-center gap-2 px-5 py-2.5 bg-gov-blue hover:bg-gov-navy text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                ดาวน์โหลดภาพ QR Code (PNG)
              </button>
            </div>
          )}

          {/* TAB 3: Report & Data Exports */}
          {activeTab === 'export' && (
            <div className="space-y-4 animate-fade-in">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Print PDF Document */}
                <div className="p-4 bg-slate-50 border border-slate-200/40 rounded-2xl space-y-3 hover:border-gov-gold/30 transition-colors">
                  <h4 className="text-xs font-bold text-gov-navy flex items-center gap-1.5">
                    <FileText className="w-4.5 h-4.5 text-gov-gold" />
                    รายงานผู้ส่งมอบอย่างเป็นทางการ
                  </h4>
                  <p className="text-[10px] text-neutral-slate leading-relaxed">
                    จัดพิมพ์เอกสารแนบท้ายการตรวจรับพัสดุ ตกแต่งจัดหน้าตามระเบียบงานสารบรรณภาครัฐ พร้อมตราครุฑและช่องลงลายมือชื่อคณะกรรมการ
                  </p>
                  <button
                    onClick={onPrint}
                    className="w-full py-2 bg-gov-navy hover:bg-slate-900 text-white text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
                  >
                    สั่งพิมพ์รายงาน (PDF)
                  </button>
                </div>

                {/* Excel Export */}
                <div className="p-4 bg-slate-50 border border-slate-200/40 rounded-2xl space-y-3 hover:border-gov-gold/30 transition-colors">
                  <h4 className="text-xs font-bold text-gov-navy flex items-center gap-1.5">
                    <FileSpreadsheet className="w-4.5 h-4.5 text-emerald-600" />
                    ไฟล์ตารางบัญชีพัสดุ (Excel)
                  </h4>
                  <p className="text-[10px] text-neutral-slate leading-relaxed">
                    ส่งออกรายการผลการตรวจรับพัสดุพร้อมรายละเอียด Serial Number, MAC Address และพิกัดงานเบิกจ่ายเป็นตารางสเปรดชีต Excel
                  </p>
                  <button
                    onClick={onExportExcel}
                    className="w-full py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
                  >
                    ส่งออกตารางพัสดุ (Excel)
                  </button>
                </div>

              </div>

              {/* JSON export option */}
              <div className="p-4 bg-slate-50 border border-slate-200/40 rounded-2xl flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-gov-navy">สำรองข้อมูลดิบระดับฐานข้อมูล (JSON Snapshot)</h4>
                  <p className="text-[10px] text-neutral-slate">สำรองไฟล์บันทึกสถานะโครงการแบบละเอียดเก็บไว้ใช้งานภายในฝ่ายสารสนเทศ</p>
                </div>
                <button
                  onClick={onExportJSON}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-800 text-slate-100 text-[10px] font-bold rounded-lg transition-colors cursor-pointer"
                >
                  ดาวน์โหลด JSON
                </button>
              </div>

            </div>
          )}

        </div>

        {/* Modal Footer warning info */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
          <p className="text-[9px] text-neutral-slate leading-relaxed">
            * สถาปัตยกรรม URL State Compression บันทึกสถานะโดยการเข้ารหัสข้อมูล หากมีการแก้ไขข้อมูลพัสดุเพิ่มเติม ควรทำการกดปุ่มแชร์และสร้างลิงก์/คิวอาร์โค้ดใหม่ทุกครั้งเพื่อความสมบูรณ์ของรายงานปลายทาง
          </p>
        </div>

      </div>

    </div>
  );
}
