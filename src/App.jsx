import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, 
  PackageCheck, 
  FileText, 
  UploadCloud, 
  Share2, 
  RotateCcw,
  ShieldCheck
} from 'lucide-react';

// Import initial dataset
import initialProcurementData from './data/procurementData.json';

// Import components
import Dashboard from './components/Dashboard';
import Filters from './components/Filters';
import ItemCard from './components/ItemCard';
import ItemDetailModal from './components/ItemDetailModal';
import OfficialReport from './components/OfficialReport';
import ExcelImporter from './components/ExcelImporter';

// Import utilities
import { parseUrlState, generateShareLink } from './utils/stateCompressor';
import { formatNumber } from './utils/numberFormatter';

// Default Nakhon Sawan Municipality committee members
const DEFAULT_COMMITTEE = [
  { name: 'นายณัฏฐวุฒิ จีนมหันต์', position: 'ประธานกรรมการตรวจรับ (นักวิชาการคอมพิวเตอร์ชำนาญการพิเศษ)' },
  { name: 'นายปฐมพงษ์ หล้ามหศักดิ์', position: 'กรรมการตรวจรับ (นักวิชาการคอมพิวเตอร์ปฏิบัติการ)' },
  { name: 'นายประชารักษ์ ประทุมโทน', position: 'กรรมการตรวจรับ (นักประชาสัมพันธ์ปฏิบัติการ)' }
];

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [items, setItems] = useState([]);
  const [committee, setCommittee] = useState(DEFAULT_COMMITTEE);
  
  // Committee editing states
  const [isEditingCommittee, setIsEditingCommittee] = useState(false);
  const [editedCommittee, setEditedCommittee] = useState(DEFAULT_COMMITTEE);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [divisionFilter, setDivisionFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [hasNotesFilter, setHasNotesFilter] = useState('all');
  const [hasImageFilter, setHasImageFilter] = useState('all');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  // Selected item for detail modal
  const [selectedItem, setSelectedItem] = useState(null);
  const [shareLinkCopied, setShareLinkCopied] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Initial State Loading & URL State Parsing
  useEffect(() => {
    const cachedCommittee = localStorage.getItem('procurement_committee_v3');
    let currentCommittee = DEFAULT_COMMITTEE;
    if (cachedCommittee) {
      try {
        currentCommittee = JSON.parse(cachedCommittee);
      } catch (e) {
        console.error(e);
      }
    }

    const cachedItems = localStorage.getItem('procurement_items_v3');
    let currentItems = initialProcurementData;
    if (cachedItems) {
      try {
        currentItems = JSON.parse(cachedItems);
      } catch (e) {
        console.error(e);
      }
    }

    // Parse URL Hash state override
    const parsedState = parseUrlState(currentItems);
    if (parsedState) {
      if (parsedState.committee) {
        currentCommittee = parsedState.committee;
      }
      if (parsedState.items) {
        currentItems = parsedState.items;
      }
      showToast('🟢 โหลดสถานะการตรวจรับล่าสุดผ่านลิงก์แชร์เรียบร้อย');
    }

    setCommittee(currentCommittee);
    setEditedCommittee(currentCommittee);
    setItems(currentItems);
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Cache changes to localStorage
  useEffect(() => {
    if (items.length > 0) {
      localStorage.setItem('procurement_items_v3', JSON.stringify(items));
    }
  }, [items]);

  useEffect(() => {
    localStorage.setItem('procurement_committee_v3', JSON.stringify(committee));
  }, [committee]);

  // Statistics Calculations
  const stats = useMemo(() => {
    const totalItems = items.length;
    const passedCount = items.filter(i => i.inspectStatus === 'passed').length;
    const pendingCount = items.filter(i => i.inspectStatus === 'pending').length;
    const failedCount = items.filter(i => i.inspectStatus === 'failed').length;
    const hasNotesCount = items.filter(i => i.notes).length;

    let totalBudget = 0;
    let passedBudget = 0;
    let remainingBudget = 0;

    items.forEach(i => {
      const cost = i.qty * i.unit_price;
      totalBudget += cost;
      if (i.inspectStatus === 'passed') {
        passedBudget += cost;
      } else {
        remainingBudget += cost;
      }
    });

    const divMap = {};
    items.forEach(i => {
      let div = i.division || 'ทั่วไป';
      if (div === 'ปชส.' || div === 'ปชส. 3') div = 'ประชาสัมพันธ์';
      const cost = i.qty * i.unit_price;
      divMap[div] = (divMap[div] || 0) + cost;
    });
    const divisionData = Object.entries(divMap).map(([name, value]) => ({ name, value }));

    const catMap = {};
    items.forEach(i => {
      const cat = i.category || 'อื่นๆ';
      const cost = i.qty * i.unit_price;
      catMap[cat] = (catMap[cat] || 0) + cost;
    });
    
    const catLabels = {
      connectivity: '🔌 อุปกรณ์เชื่อมต่อ',
      storage: '💾 อุปกรณ์จัดเก็บ',
      peripherals: '🖱️ อุปกรณ์ต่อพ่วง',
      electronics: '🤖 อิเล็กทรอนิกส์',
      tools: '🛠️ เครื่องมือช่าง',
      organization: '📁 จัดระเบียบ',
      toner: '🖨️ หมึกพิมพ์',
      consumables: '🔋 วัสดุสิ้นเปลือง'
    };
    
    const categoryData = Object.entries(catMap).map(([key, value]) => ({
      name: catLabels[key] || key,
      value
    }));

    return {
      totalItems,
      passedCount,
      pendingCount,
      failedCount,
      hasNotesCount,
      totalBudget,
      passedBudget,
      remainingBudget,
      divisionData,
      categoryData
    };
  }, [items]);

  const categories = useMemo(() => ['connectivity', 'storage', 'peripherals', 'electronics', 'tools', 'organization', 'toner', 'consumables'], []);
  const divisions = useMemo(() => ['บริหาร', 'วิเคราะห์', 'ประชาสัมพันธ์', 'สถิติ'], []);

  // Filtering & Instant Search Logic
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const matchesName = (item.name || '').toLowerCase().includes(query);
        const matchesSpec = (item.spec || '').toLowerCase().includes(query);
        const matchesSerial = (item.serial_number || '').toLowerCase().includes(query);
        const matchesAsset = (item.asset_number || '').toLowerCase().includes(query);
        const matchesMac = (item.mac_address || '').toLowerCase().includes(query);
        const matchesDiv = (item.division || '').toLowerCase().includes(query);
        const matchesCat = (item.category || '').toLowerCase().includes(query);
        const matchesPrice = String(item.unit_price).includes(query);

        if (!matchesName && !matchesSpec && !matchesSerial && !matchesAsset && !matchesMac && !matchesDiv && !matchesCat && !matchesPrice) {
          return false;
        }
      }

      if (categoryFilter !== 'all' && item.category !== categoryFilter) {
        return false;
      }

      if (divisionFilter !== 'all') {
        let divClean = item.division || '';
        if (divClean === 'ปชส.' || divClean === 'ปชส. 3') divClean = 'ประชาสัมพันธ์';
        if (divClean !== divisionFilter) return false;
      }

      if (statusFilter !== 'all' && item.inspectStatus !== statusFilter) {
        return false;
      }

      if (hasNotesFilter === 'yes' && !item.notes) return false;
      if (hasNotesFilter === 'no' && item.notes) return false;

      const hasImg = Object.values(item.images || {}).some(img => img !== '');
      if (hasImageFilter === 'yes' && !hasImg) return false;
      if (hasImageFilter === 'no' && hasImg) return false;

      if (minPrice && item.unit_price < Number(minPrice)) return false;
      if (maxPrice && item.unit_price > Number(maxPrice)) return false;

      return true;
    });
  }, [items, searchQuery, categoryFilter, divisionFilter, statusFilter, hasNotesFilter, hasImageFilter, minPrice, maxPrice]);

  const handleEditCommitteeStart = () => {
    setEditedCommittee([...committee]);
    setIsEditingCommittee(true);
  };

  const handleEditCommitteeChange = (idx, field, val) => {
    const updated = editedCommittee.map((m, index) => {
      if (index === idx) return { ...m, [field]: val };
      return m;
    });
    setEditedCommittee(updated);
  };

  const handleSaveCommittee = () => {
    setCommittee(editedCommittee);
    setIsEditingCommittee(false);
    showToast('💾 อัปเดตรายชื่อคณะกรรมการผู้ตรวจรับสำเร็จ!');
  };

  const handleSaveItem = (updatedItem) => {
    const updatedItems = items.map(item => {
      if (item.id === updatedItem.id) return updatedItem;
      return item;
    });
    setItems(updatedItems);
    showToast(`📝 บันทึกผลการตรวจรับพัสดุชิ้นที่ ${updatedItem.id} แล้ว`);
  };

  const handleShareLink = () => {
    try {
      const link = generateShareLink(committee, items);
      navigator.clipboard.writeText(link);
      setShareLinkCopied(true);
      showToast('🔗 คัดลอกลิงก์แชร์ความก้าวหน้าล่าสุดแล้ว!');
      setTimeout(() => setShareLinkCopied(false), 2000);
    } catch (e) {
      console.error(e);
      showToast('❌ ไม่สามารถสร้างลิงก์แชร์ได้');
    }
  };

  const handleResetDatabase = () => {
    if (window.confirm('⚠️ คำเตือน! คุณต้องการรีเซ็ตข้อมูลและสถานะการตรวจสอบพัสดุทั้งหมดกลับเป็นค่าเริ่มต้นหรือไม่? (ประวัติการแก้ไขจะถูกล้างทิ้ง)')) {
      const freshItems = initialProcurementData.map(item => ({
        ...item,
        images: {
          product: item.image || "",
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
        timeline: { started_at: "", updated_at: "", completed_at: "" },
        history: [],
        version: 1,
        inspectStatus: "passed",
        notes: ""
      }));
      
      setItems(freshItems);
      setCommittee(DEFAULT_COMMITTEE);
      setEditedCommittee(DEFAULT_COMMITTEE);
      localStorage.removeItem('procurement_items_v3');
      localStorage.removeItem('procurement_committee_v3');
      window.location.hash = ''; // Clear hash URL
      showToast('🔄 รีเซ็ตฐานข้อมูลการตรวจรับกลับเป็นค่าเริ่มต้นเรียบร้อย');
    }
  };

  const handleImportExcel = (newItems) => {
    setItems(newItems);
    localStorage.setItem('procurement_items_v3', JSON.stringify(newItems));
    showToast(`🟢 นำเข้าสเปกพัสดุ ${newItems.length} รายการเรียบร้อย`);
    setActiveTab('items');
  };

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(items, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `procurement_audit_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleExportCSV = () => {
    let csv = "\uFEFFลำดับ,ชื่อรายการพัสดุ,จำนวน,หน่วยนับ,ราคาต่อหน่วย,ราคารวมเงิน,กลุ่มงาน,สถานะตรวจรับ,S/N,เลขครุภัณฑ์,หมายเหตุ\n";
    items.forEach(item => {
      const statusText = item.inspectStatus === 'passed' ? 'ผ่าน' : item.inspectStatus === 'failed' ? 'ไม่ผ่าน' : 'อยู่ระหว่างตรวจ';
      csv += `${item.id},"${item.name.replace(/"/g, '""')}",${item.qty},${item.unit},${item.unit_price},${item.qty * item.unit_price},"${item.division}","${statusText}","${item.serial_number || ''}","${item.asset_number || ''}","${(item.notes || '').replace(/\n/g, ' ')}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `procurement_audit_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportExcel = () => {
    handleExportCSV();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-neutral-warm flex flex-col lg:flex-row text-neutral-charcoal antialiased font-sans">
      
      {/* 1. Sidebar Navigation (Left) */}
      <aside className="w-full lg:w-64 bg-gov-navy text-slate-100 flex flex-col shrink-0 border-r border-slate-800 print:hidden z-30 relative">
        <span className="absolute top-0 bottom-0 right-0 w-0.5 bg-gov-gold"></span>
        
        {/* Sidebar Brand header */}
        <div className="p-5 bg-slate-950/40 flex items-center gap-3 border-b border-slate-800/40 relative">
          <div className="w-8 h-8 rounded-lg bg-gov-gold flex items-center justify-center font-black text-sm text-gov-navy shadow-md">
            กย.
          </div>
          <div>
            <h1 className="text-xs font-bold tracking-wider uppercase text-slate-100">เทศบาลนครนครสวรรค์</h1>
            <p className="text-[9px] text-gov-gold font-bold uppercase tracking-widest mt-0.5">ระบบดิจิทัลตรวจรับพัสดุ</p>
          </div>
        </div>

        {/* Sidebar Navigation Options */}
        <nav className="flex-1 p-4 space-y-1 pt-6">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs sm:text-sm font-bold tracking-wide transition-all duration-200 ${
              activeTab === 'dashboard' 
                ? 'bg-gov-gold text-gov-navy shadow-sm' 
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/40'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 shrink-0" />
            แผงควบคุมสรุปผล
          </button>
          
          <button
            onClick={() => setActiveTab('items')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs sm:text-sm font-bold tracking-wide transition-all duration-200 ${
              activeTab === 'items' 
                ? 'bg-gov-gold text-gov-navy shadow-sm' 
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/40'
            }`}
          >
            <PackageCheck className="w-4 h-4 shrink-0" />
            ตรวจรับพัสดุรายชิ้น
          </button>

          <button
            onClick={() => setActiveTab('report')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs sm:text-sm font-bold tracking-wide transition-all duration-200 ${
              activeTab === 'report' 
                ? 'bg-gov-gold text-gov-navy shadow-sm' 
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/40'
            }`}
          >
            <FileText className="w-4 h-4 shrink-0" />
            ระบบเอกสารพิมพ์งาน
          </button>

          <button
            onClick={() => setActiveTab('importer')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs sm:text-sm font-bold tracking-wide transition-all duration-200 ${
              activeTab === 'importer' 
                ? 'bg-gov-gold text-gov-navy shadow-sm' 
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/40'
            }`}
          >
            <UploadCloud className="w-4 h-4 shrink-0" />
            นำเข้าสเปกพัสดุ
          </button>
        </nav>

        {/* Sidebar Footer options */}
        <div className="p-4 bg-slate-950/20 border-t border-slate-800/40 space-y-3">
          <div className="text-[9px] text-slate-400 leading-relaxed font-bold">
            ระบบตรวจสอบสัญญางานจัดซื้อ 2569 คำสั่งเทศบาลที่ ๘๖๔/๒๕๖๙
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={handleShareLink}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[10px] font-bold transition-all border ${
                shareLinkCopied 
                  ? 'bg-emerald-700 border-emerald-700 text-white' 
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Share2 className="w-3 h-3 text-gov-gold" />
              แชร์ผลตรวจ
            </button>
            <button
              onClick={handleResetDatabase}
              className="px-3 py-2.5 bg-slate-800 border border-slate-700 hover:bg-rose-950 hover:border-rose-900 text-slate-300 hover:text-rose-100 rounded-xl text-[10px] font-bold transition-colors"
              title="รีเซ็ตฐานข้อมูล"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>
        </div>

      </aside>

      {/* 2. Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0">
        
        {/* Header Bar */}
        <header className="bg-white h-16 border-b border-slate-200/60 flex items-center justify-between px-6 shrink-0 print:hidden z-15">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4.5 h-4.5 text-gov-gold" />
            <h2 className="text-xs sm:text-sm font-black text-gov-navy tracking-wide">
              {activeTab === 'dashboard' && 'แดชบอร์ดติดตามความก้าวหน้าโครงการ'}
              {activeTab === 'items' && 'ระบบตรวจทานพัสดุและภาพถ่ายหลักฐาน'}
              {activeTab === 'report' && 'ระบบออกรายงานและหนังสือส่งมอบอย่างเป็นทางการ'}
              {activeTab === 'importer' && 'เครื่องมือนำเข้าใบเสนอราคาพลวัต (Excel Importer)'}
            </h2>
          </div>
          
          <div className="hidden sm:flex items-center gap-4 text-xs font-bold text-neutral-slate">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-status-passed"></span>
              ผ่านแล้ว: <span className="text-gov-navy num-tabular">{stats.passedCount}/{stats.totalItems}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-gov-gold"></span>
              งบรวม: <span className="text-gov-navy num-tabular">{formatNumber(stats.totalBudget)} บาท</span>
            </div>
          </div>
        </header>

        {/* Dynamic Page Container */}
        <div className="flex-1 p-6 overflow-y-auto print:p-0 print:overflow-visible">
          
          {/* Tab 1: Dashboard Panel */}
          {activeTab === 'dashboard' && (
            <Dashboard 
              stats={stats}
              committee={committee}
              isEditingCommittee={isEditingCommittee}
              editedCommittee={editedCommittee}
              handleEditCommitteeStart={handleEditCommitteeStart}
              handleEditCommitteeChange={handleEditCommitteeChange}
              handleSaveCommittee={handleSaveCommittee}
            />
          )}

          {/* Tab 2: Audit Checklist & Grid List */}
          {activeTab === 'items' && (
            <div className="space-y-6">
              
              {/* Dynamic Filter Section */}
              <Filters 
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                categoryFilter={categoryFilter}
                setCategoryFilter={setCategoryFilter}
                divisionFilter={divisionFilter}
                setDivisionFilter={setDivisionFilter}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                hasNotesFilter={hasNotesFilter}
                setHasNotesFilter={setHasNotesFilter}
                hasImageFilter={hasImageFilter}
                setHasImageFilter={setHasImageFilter}
                minPrice={minPrice}
                setMinPrice={setMinPrice}
                maxPrice={maxPrice}
                setMaxPrice={setMaxPrice}
                handleResetFilters={() => {
                  setSearchQuery('');
                  setCategoryFilter('all');
                  setDivisionFilter('all');
                  setStatusFilter('all');
                  setHasNotesFilter('all');
                  setHasImageFilter('all');
                  setMinPrice('');
                  setMaxPrice('');
                }}
                categories={categories}
                divisions={divisions}
              />

              {/* Items Card Grid */}
              {filteredItems.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredItems.map(item => (
                    <ItemCard 
                      key={item.id} 
                      item={item} 
                      onClick={() => setSelectedItem(item)} 
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-2xl p-16 text-center border border-slate-100 space-y-2 shadow-premium">
                  <div className="text-neutral-slate font-semibold text-xs">ไม่พบรายการพัสดุที่สอดคล้องกับการค้นหาของคุณ</div>
                  <button 
                    onClick={() => {
                      setSearchQuery('');
                      setCategoryFilter('all');
                      setDivisionFilter('all');
                      setStatusFilter('all');
                      setHasNotesFilter('all');
                      setHasImageFilter('all');
                      setMinPrice('');
                      setMaxPrice('');
                    }}
                    className="text-xs font-bold text-gov-gold hover:underline"
                  >
                    ล้างการตั้งค่าตัวกรองและดูรายการพัสดุทั้งหมด
                  </button>
                </div>
              )}

            </div>
          )}

          {/* Tab 3: Official Report Panel */}
          {activeTab === 'report' && (
            <OfficialReport 
              items={filteredItems}
              committee={committee}
              stats={stats}
              divisionFilter={divisionFilter}
              setDivisionFilter={setDivisionFilter}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              handlePrint={handlePrint}
              handleExportExcel={handleExportExcel}
              handleExportCSV={handleExportCSV}
              handleExportJSON={handleExportJSON}
              divisions={divisions}
            />
          )}

          {/* Tab 4: Excel Importer Panel */}
          {activeTab === 'importer' && (
            <ExcelImporter onImport={handleImportExcel} />
          )}

        </div>

      </main>

      {/* 3. Detail Popup Modal Overlay */}
      {selectedItem && (
        <ItemDetailModal 
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onSave={handleSaveItem}
          committee={committee}
        />
      )}

      {/* 4. Global Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-gov-navy text-slate-100 px-5 py-3 rounded-2xl shadow-floating z-50 text-xs sm:text-sm font-bold border border-slate-800 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <span className="w-2.5 h-2.5 bg-gov-gold rounded-full animate-ping"></span>
          {toastMessage}
        </div>
      )}

    </div>
  );
}
