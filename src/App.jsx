import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, 
  PackageCheck, 
  FileText, 
  UploadCloud, 
  Share2, 
  RotateCcw,
  ShieldCheck,
  ArrowRight,
  BookOpen,
  HelpCircle,
  CheckCircle2,
  FileSpreadsheet,
  Download,
  Printer,
  AlertTriangle,
  Menu,
  X,
  Settings
} from 'lucide-react';
import { inspectionRepository } from './utils/inspectionRepository';
import TemplateSettings from './components/TemplateSettings';

// Import initial dataset
import initialProcurementData from './data/procurementData.json';

// Import components
import Dashboard from './components/Dashboard';
import Filters from './components/Filters';
import ItemCard from './components/ItemCard';
import ItemDetailModal from './components/ItemDetailModal';
import OfficialReport from './components/OfficialReport';
import ExcelImporter from './components/ExcelImporter';
import ShareModal from './components/ShareModal';

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
  
  // Sorting & View Modes
  const [sortBy, setSortBy] = useState('id-asc');
  const [viewMode, setViewMode] = useState('grid');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(9); // Default 9 items per page

  // Selected item for detail modal
  const [selectedItem, setSelectedItem] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  
  // Share modal state
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Mobile menu drawer state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Project template configuration state
  const [projectConfig, setProjectConfig] = useState(() => inspectionRepository.getProjectConfig());

  // Initial State Loading & URL State Parsing
  useEffect(() => {
    // 1. Migration from V3 to V4 Adapter
    const cachedV3Committee = localStorage.getItem('procurement_committee_v3');
    const cachedV3Items = localStorage.getItem('procurement_items_v3');
    const cachedV4Items = localStorage.getItem('procurement_items_v4');

    if (!cachedV4Items && (cachedV3Items || cachedV3Committee)) {
      // Migrate V3 localStorage into V4 Repository
      if (cachedV3Items) {
        try {
          inspectionRepository.saveItems(JSON.parse(cachedV3Items));
        } catch (e) { console.error('Migration failed for items', e); }
      }
      if (cachedV3Committee) {
        try {
          inspectionRepository.saveCommittee(JSON.parse(cachedV3Committee));
        } catch (e) { console.error('Migration failed for committee', e); }
      }
    }

    let currentCommittee = inspectionRepository.getCommittee();
    let currentItems = inspectionRepository.getItems();

    // Parse URL Hash state override
    const parsedState = parseUrlState(currentItems);
    if (parsedState) {
      if (parsedState.committee) {
        currentCommittee = parsedState.committee;
      }
      if (parsedState.items) {
        currentItems = parsedState.items;
      }
      
      // Restore UI states
      if (parsedState.activeTab) {
        setTimeout(() => setActiveTab(parsedState.activeTab), 50);
      }
      if (parsedState.viewMode) setViewMode(parsedState.viewMode);
      if (parsedState.sortBy) setSortBy(parsedState.sortBy);
      if (parsedState.searchQuery) setSearchQuery(parsedState.searchQuery);
      if (parsedState.categoryFilter) setCategoryFilter(parsedState.categoryFilter);
      if (parsedState.divisionFilter) setDivisionFilter(parsedState.divisionFilter);
      if (parsedState.statusFilter) setStatusFilter(parsedState.statusFilter);
      if (parsedState.hasNotesFilter) setHasNotesFilter(parsedState.hasNotesFilter);
      if (parsedState.hasImageFilter) setHasImageFilter(parsedState.hasImageFilter);
      if (parsedState.minPrice) setMinPrice(parsedState.minPrice);
      if (parsedState.maxPrice) setMaxPrice(parsedState.maxPrice);
      if (parsedState.currentPage) setCurrentPage(parsedState.currentPage);
      if (parsedState.pageSize) setPageSize(parsedState.pageSize);
      
      if (parsedState.selectedItemId) {
        const found = currentItems.find(i => i.id === parsedState.selectedItemId);
        if (found) {
          setTimeout(() => setSelectedItem(found), 100);
        }
      }
      showToast('🟢 โหลดผลการตรวจและตัวกรองล่าสุดเรียบร้อย');
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

  // Cache changes to repository
  useEffect(() => {
    if (items.length > 0) {
      inspectionRepository.saveItems(items);
    }
  }, [items]);

  useEffect(() => {
    inspectionRepository.saveCommittee(committee);
  }, [committee]);

  // Reset pagination to first page when any filters or sorting change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, categoryFilter, divisionFilter, statusFilter, hasNotesFilter, hasImageFilter, minPrice, maxPrice, sortBy, pageSize]);

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

  const categories = useMemo(() => {
    const set = new Set();
    items.forEach(item => {
      if (item.category) set.add(item.category);
    });
    return Array.from(set);
  }, [items]);

  const divisions = useMemo(() => {
    const set = new Set();
    items.forEach(item => {
      if (item.division) {
        let divClean = item.division.trim();
        if (divClean === 'ปชส.' || divClean === 'ปชส. 3') divClean = 'ประชาสัมพันธ์';
        set.add(divClean);
      }
    });
    return Array.from(set);
  }, [items]);

  // Filtering, Instant Search & Sorting Logic
  const filteredItems = useMemo(() => {
    const res = items.filter(item => {
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

    const sorted = [...res];
    if (sortBy === 'id-asc') {
      sorted.sort((a, b) => a.id - b.id);
    } else if (sortBy === 'id-desc') {
      sorted.sort((a, b) => b.id - a.id);
    } else if (sortBy === 'price-desc') {
      sorted.sort((a, b) => (b.qty * b.unit_price) - (a.qty * a.unit_price));
    } else if (sortBy === 'price-asc') {
      sorted.sort((a, b) => (a.qty * a.unit_price) - (b.qty * b.unit_price));
    } else if (sortBy === 'name-asc') {
      sorted.sort((a, b) => a.name.localeCompare(b.name, 'th'));
    }

    return sorted;
  }, [items, searchQuery, categoryFilter, divisionFilter, statusFilter, hasNotesFilter, hasImageFilter, minPrice, maxPrice, sortBy]);

  // Sliced paginated items
  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredItems.slice(startIndex, startIndex + pageSize);
  }, [filteredItems, currentPage, pageSize]);

  const totalPages = Math.max(Math.ceil(filteredItems.length / pageSize), 1);

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
      const uiState = {
        activeTab,
        viewMode,
        sortBy,
        searchQuery,
        categoryFilter,
        divisionFilter,
        statusFilter,
        hasNotesFilter,
        hasImageFilter,
        minPrice,
        maxPrice,
        currentPage,
        pageSize,
        selectedItemId: selectedItem ? selectedItem.id : null
      };
      const link = generateShareLink(committee, items, uiState);
      return link;
    } catch (e) {
      console.error(e);
      showToast('❌ ไม่สามารถสร้างลิงก์แชร์ได้');
      return '';
    }
  };

  const handleResetDatabase = () => {
    if (window.confirm('🚨 คำเตือน! คุณต้องการรีเซ็ตข้อมูลผลตรวจรับทั้งหมดกลับเป็นค่าเริ่มต้นตามสัญญาเดิมใช่หรือไม่? ข้อมูลประวัติและรูปภาพทั้งหมดจะถูกลบ')) {
      inspectionRepository.resetAll();
      setItems(initialProcurementData);
      window.location.hash = ''; // Clear hash URL
      showToast('🔄 รีเซ็ตฐานข้อมูลการตรวจรับกลับเป็นค่าเริ่มต้นเรียบร้อย');
    }
  };

  const handleImportExcel = (newItems) => {
    setItems(newItems);
    inspectionRepository.saveItems(newItems);
    showToast(`🟢 นำเข้าสเปกพัสดุ ${newItems.length} รายการเรียบร้อย`);
    setActiveTab('items');
  };

  const handleProjectConfigChange = (newConfig) => {
    setProjectConfig(newConfig);
    // Reload items dynamically based on the newly saved states in repository
    setItems(inspectionRepository.getItems());
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
      <aside className="w-full lg:w-64 bg-gov-navy text-slate-100 flex flex-col shrink-0 border-r border-slate-800 print:hidden z-30 relative animate-fade-in">
        <span className="absolute top-0 bottom-0 right-0 w-0.5 bg-gov-gold"></span>
        
        {/* Sidebar Brand header */}
        <div className="p-4 lg:p-6 bg-slate-950/40 flex flex-row lg:flex-col items-center justify-between lg:justify-center text-center gap-3.5 border-b border-slate-800/40 relative">
          <div className="flex items-center gap-3 lg:flex-col lg:gap-3.5">
            <div className="w-10 h-10 lg:w-18 lg:h-18 rounded-xl lg:rounded-2xl bg-white/5 flex items-center justify-center overflow-hidden shrink-0 shadow-floating border border-gov-gold/30 p-1 lg:p-2.5 transition-all duration-300 hover:border-gov-gold">
              <img src="/logo.png" alt="Municipality Logo" className="w-full h-full object-contain" />
            </div>
            <div className="space-y-0.5 lg:space-y-1 text-left lg:text-center">
              <h1 className="text-xs sm:text-sm font-black tracking-wider lg:tracking-widest uppercase text-slate-100">เทศบาลนครนครสวรรค์</h1>
              <p className="text-[9px] text-gov-gold font-bold uppercase tracking-widest">ระบบดิจิทัลตรวจรับพัสดุ</p>
            </div>
          </div>
          
          {/* Mobile menu hamburger toggle button */}
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 text-slate-400 hover:text-white focus:outline-none cursor-pointer"
            title="เปิด/ปิด เมนูนำทาง"
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Sidebar Navigation Options */}
        <nav className={`flex-1 p-4 space-y-1 lg:block ${isMobileMenuOpen ? 'block' : 'hidden'}`}>
          <button
            onClick={() => { setActiveTab('dashboard'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs sm:text-sm font-bold tracking-wide transition-all duration-200 cursor-pointer ${
              activeTab === 'dashboard' 
                ? 'bg-gov-gold text-gov-navy shadow-sm' 
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/40'
            }`}
            title="ดูสถิติงบประมาณ ความก้าวหน้าตรวจรับ และคิวตรวจสอบด่วน"
          >
            <LayoutDashboard className="w-4 h-4 shrink-0" />
            แผงควบคุมสรุปผล
          </button>
          
          <button
            onClick={() => { setActiveTab('items'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs sm:text-sm font-bold tracking-wide transition-all duration-200 cursor-pointer ${
              activeTab === 'items' 
                ? 'bg-gov-gold text-gov-navy shadow-sm' 
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/40'
            }`}
            title="เดินตรวจสเปกครุภัณฑ์ บันทึก S/N และแนบรูปถ่ายหลักฐานทีละชิ้น"
          >
            <PackageCheck className="w-4 h-4 shrink-0" />
            ตรวจรับพัสดุรายชิ้น
          </button>

          <button
            onClick={() => { setActiveTab('report'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs sm:text-sm font-bold tracking-wide transition-all duration-200 cursor-pointer ${
              activeTab === 'report' 
                ? 'bg-gov-gold text-gov-navy shadow-sm' 
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/40'
            }`}
            title="ดูตัวอย่างเอกสารรายงานพิมพ์แนบท้ายมีตราครุฑ และดาวน์โหลดข้อมูลเป็นตาราง"
          >
            <FileText className="w-4 h-4 shrink-0" />
            ระบบเอกสารพิมพ์งาน
          </button>

          <button
            onClick={() => { setActiveTab('importer'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs sm:text-sm font-bold tracking-wide transition-all duration-200 cursor-pointer ${
              activeTab === 'importer' 
                ? 'bg-gov-gold text-gov-navy shadow-sm' 
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/40'
            }`}
            title="อัปโหลดตารางรายการจัดซื้อ Excel เพื่อเปลี่ยนฐานข้อมูลตรวจพัสดุโครงการใหม่"
          >
            <UploadCloud className="w-4 h-4 shrink-0" />
            นำเข้าสเปกพัสดุ
          </button>

          <button
            onClick={() => { setActiveTab('manual'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs sm:text-sm font-bold tracking-wide transition-all duration-200 cursor-pointer ${
              activeTab === 'manual' 
                ? 'bg-gov-gold text-gov-navy shadow-sm' 
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/40'
            }`}
            title="เปิดคู่มือสอนการใช้งานระบบแบบทีละขั้นตอนและข้อเสนอแนะจัดซื้อ"
          >
            <BookOpen className="w-4 h-4 shrink-0 text-gov-gold" />
            คู่มือแนะนำการใช้งาน
          </button>

          <button
            onClick={() => { setActiveTab('settings'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs sm:text-sm font-bold tracking-wide transition-all duration-200 cursor-pointer ${
              activeTab === 'settings' 
                ? 'bg-gov-gold text-gov-navy shadow-sm' 
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/40'
            }`}
            title="ตั้งค่าแบบตรวจรับพัสดุและออกแบบแม่แบบแบบตรวจรับอื่นๆ"
          >
            <Settings className="w-4 h-4 shrink-0" />
            ตั้งค่าแบบตรวจรับ
          </button>
        </nav>

        {/* Sidebar Footer options */}
        <div className={`p-4 bg-slate-950/20 border-t border-slate-800/40 space-y-3 lg:block ${isMobileMenuOpen ? 'block' : 'hidden'}`}>
          <div className="text-[9px] text-slate-400 leading-relaxed font-bold">
            ระบบตรวจสอบสัญญางานจัดซื้อ 2569 คำสั่งเทศบาลที่ ๘๖๔/๒๕๖๙
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => { setIsShareModalOpen(true); setIsMobileMenuOpen(false); }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[10px] font-bold transition-all border cursor-pointer bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
              title="เปิดช่องทางแชร์สถานะ คัดลอกคิวอาร์โค้ด และสั่งพิมพ์รายงานสรุป"
            >
              <Share2 className="w-3 h-3 text-gov-gold" />
              แชร์โครงการ
            </button>
            <button
              onClick={handleResetDatabase}
              className="px-3 py-2.5 bg-slate-800 border border-slate-700 hover:bg-rose-950 hover:border-rose-900 text-slate-300 hover:text-rose-100 rounded-xl text-[10px] font-bold transition-colors cursor-pointer"
              title="รีเซ็ตผลตรวจสอบและประวัติทั้งหมดกลับเป็นค่าเริ่มต้นสัญญา"
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
              {activeTab === 'manual' && '📖 คู่มือแนะแนวการใช้งานสำหรับเจ้าหน้าที่จัดซื้อตรวจรับ'}
              {activeTab === 'settings' && '⚙️ ตั้งค่าแม่แบบและกฎการตรวจรับพัสดุ'}
            </h2>
          </div>
          
          <div className="hidden sm:flex items-center gap-4 text-xs font-bold text-neutral-slate">
            <div className="flex items-center gap-1.5" title="จำนวนพัสดุตรวจผ่านแล้ว">
              <span className="w-2 h-2 rounded-full bg-status-passed"></span>
              ผ่านแล้ว: <span className="text-gov-navy num-tabular">{stats.passedCount}/{stats.totalItems}</span>
            </div>
            <div className="flex items-center gap-1.5" title="งบประมาณจัดซื้อจัดจ้างโครงการ">
              <span className="w-2 h-2 rounded-full bg-gov-gold"></span>
              งบรวม: <span className="text-gov-navy num-tabular">{formatNumber(stats.totalBudget)} บาท</span>
            </div>
          </div>
        </header>

        {/* Dynamic Page Container */}
        <div className="flex-1 p-6 overflow-y-auto print:p-0 print:overflow-visible bg-dots/25 relative">
          
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
              items={filteredItems}
              onItemClick={(item) => setSelectedItem(item)}
              onCategorySelect={(cat) => {
                setCategoryFilter(cat);
                setActiveTab('items');
                showToast(`🔌 คัดกรองรายการแสดงเฉพาะหมวดพัสดุเรียบร้อย`);
              }}
              onDivisionSelect={(div) => {
                setDivisionFilter(div);
                setActiveTab('items');
                showToast(`📂 คัดกรองรายการแสดงเฉพาะกลุ่มงาน${div}เรียบร้อย`);
              }}
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
                  setSortBy('id-asc');
                  setViewMode('grid');
                }}
                categories={categories}
                divisions={divisions}
                sortBy={sortBy}
                setSortBy={setSortBy}
                viewMode={viewMode}
                setViewMode={setViewMode}
              />

              {/* Dynamic Items Info Label / Page Size Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs font-bold text-neutral-slate bg-white p-4.5 rounded-2xl border border-slate-100/60 shadow-premium">
                <div className="flex items-center gap-2">
                  <span className="bg-gov-gold-light text-gov-gold px-2.5 py-1 rounded-lg border border-gov-gold/20 font-black">
                    🔍 ค้นพบพัสดุ
                  </span>
                  <span>
                    พบพัสดุคุณลักษณะตรงตามตัวกรอง <strong className="text-gov-navy num-tabular">{filteredItems.length}</strong> รายการ 
                    {filteredItems.length > 0 && (
                      <>
                        {" "}(แสดงรายการที่ <strong className="text-gov-navy num-tabular">{(currentPage - 1) * pageSize + 1}</strong> ถึง <strong className="text-gov-navy num-tabular">{Math.min(currentPage * pageSize, filteredItems.length)}</strong>)
                      </>
                    )}
                  </span>
                </div>
                
                <div className="flex items-center gap-2 shrink-0">
                  <span>แสดงหน้าละ:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(Number(e.target.value))}
                    className="bg-slate-50 border border-slate-200 px-2 py-1 rounded-lg text-xs font-bold text-gov-navy focus:outline-none focus:border-gov-gold focus:ring-1 focus:ring-gov-gold cursor-pointer"
                  >
                    <option value={6}>6 รายการ</option>
                    <option value={9}>9 รายการ</option>
                    <option value={12}>12 รายการ</option>
                    <option value={24}>24 รายการ</option>
                    <option value={48}>48 รายการ</option>
                  </select>
                </div>
              </div>

              {/* Items Rendered by chosen ViewMode */}
              {filteredItems.length > 0 ? (
                <>
                  {/* GRID VIEW */}
                  {viewMode === 'grid' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-slide-up">
                      {paginatedItems.map(item => (
                        <ItemCard 
                          key={item.id} 
                          item={item} 
                          onClick={() => setSelectedItem(item)} 
                        />
                      ))}
                    </div>
                  )}

                  {/* LIST VIEW (Compact Stack Cards) */}
                  {viewMode === 'list' && (
                    <div className="space-y-4 animate-slide-up">
                      {paginatedItems.map(item => (
                        <div 
                          key={item.id}
                          onClick={() => setSelectedItem(item)}
                          className="bg-white p-4.5 rounded-2xl shadow-premium border border-slate-100 hover:border-gov-gold/30 hover:shadow-floating hover:-translate-y-0.5 transition-all duration-300 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                        >
                          <div className="flex items-center gap-3">
                            <span className="bg-gov-gold-light text-gov-gold font-bold text-[10px] px-2 py-0.5 rounded border border-gov-gold/15 shrink-0 num-tabular">
                              ID {item.id}
                            </span>
                            <div>
                              <h4 className="text-xs sm:text-sm font-bold text-gov-navy line-clamp-1">{item.name}</h4>
                              <p className="text-[10px] text-neutral-slate mt-0.5">กลุ่มงาน{item.division} | {item.qty} {item.unit}</p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 border-slate-50 pt-2.5 sm:pt-0 shrink-0">
                            <div className="text-right">
                              <span className="text-[9px] text-neutral-slate font-bold block uppercase tracking-wider">มูลค่าจัดซื้อ</span>
                              <span className="text-xs sm:text-sm font-black text-gov-navy num-tabular">{formatNumber(item.qty * item.unit_price)} บาท</span>
                            </div>
                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border shrink-0 ${
                              item.inspectStatus === 'passed' ? 'bg-emerald-50 text-status-passed border-emerald-200/50' :
                              item.inspectStatus === 'failed' ? 'bg-rose-50 text-status-failed border-rose-200/50' : 'bg-amber-50 text-status-pending border-amber-200/50'
                            }`}>
                              {item.inspectStatus === 'passed' ? '🟢 ตรวจผ่าน' : item.inspectStatus === 'failed' ? '🔴 ไม่ผ่าน' : '🟡 รอตรวจ'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* TABLE VIEW (Dense Data Grid Layout) */}
                  {viewMode === 'table' && (
                    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-premium animate-slide-up">
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-900 text-white font-bold">
                              <th className="p-3 w-14 text-center">ID</th>
                              <th className="p-3 pl-2">รายการพัสดุคุณลักษณะเฉพาะ</th>
                              <th className="p-3 w-28 text-center">กลุ่มงาน</th>
                              <th className="p-3 w-16 text-center">จำนวน</th>
                              <th className="p-3 w-24 text-right">ราคา/หน่วย</th>
                              <th className="p-3 w-28 text-right">งบประมาณจัดซื้อ</th>
                              <th className="p-3 w-28 text-center">สถานะ</th>
                              <th className="p-3 w-16 text-center">ตรวจ</th>
                            </tr>
                          </thead>
                          <tbody>
                            {paginatedItems.map(item => (
                              <tr 
                                key={item.id} 
                                onClick={() => setSelectedItem(item)}
                                className="border-b border-slate-100 hover:bg-slate-50 transition-colors font-medium cursor-pointer"
                              >
                                <td className="p-3 font-bold text-center text-gov-gold num-tabular">#{item.id}</td>
                                <td className="p-3 text-gov-navy font-bold pl-2 truncate max-w-[320px]" title={item.name}>{item.name}</td>
                                <td className="p-3 text-center text-neutral-slate">กลุ่มงาน{item.division}</td>
                                <td className="p-3 text-center num-tabular">{item.qty} {item.unit}</td>
                                <td className="p-3 text-right num-tabular">{formatNumber(item.unit_price)}</td>
                                <td className="p-3 text-right font-black text-gov-blue num-tabular">{formatNumber(item.qty * item.unit_price)}</td>
                                <td className="p-3 text-center">
                                  <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded border ${
                                    item.inspectStatus === 'passed' ? 'bg-emerald-50 text-status-passed border-emerald-200/50' :
                                    item.inspectStatus === 'failed' ? 'bg-rose-50 text-status-failed border-rose-200/50' : 'bg-amber-50 text-status-pending border-amber-200/50'
                                  }`}>
                                    {item.inspectStatus === 'passed' ? 'ผ่านตรวจ' : item.inspectStatus === 'failed' ? 'ไม่ผ่าน' : 'รอตรวจ'}
                                  </span>
                                </td>
                                <td className="p-3 text-center">
                                  <button 
                                    onClick={() => setSelectedItem(item)}
                                    className="px-2.5 py-1 bg-gov-blue hover:bg-gov-navy text-white text-[10px] font-bold rounded-lg transition-colors cursor-pointer"
                                    title="เปิดพื้นที่ตรวจรับพัสดุและแนบหลักฐานสำหรับสินค้าชิ้นนี้"
                                  >
                                    เปิด
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* PAGINATION CONTROLS */}
                  {totalPages > 1 && (
                    <div className="flex flex-wrap items-center justify-center gap-1.5 pt-4 text-xs font-bold print:hidden">
                      <button
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage === 1}
                        className={`px-3 py-2 rounded-xl border transition-all ${
                          currentPage === 1 
                            ? 'bg-slate-50 border-slate-200 text-slate-300 cursor-not-allowed' 
                            : 'bg-white border-slate-200 text-gov-navy hover:bg-slate-50 cursor-pointer'
                        }`}
                      >
                        หน้าแรก
                      </button>
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className={`px-3 py-2 rounded-xl border transition-all ${
                          currentPage === 1 
                            ? 'bg-slate-50 border-slate-200 text-slate-300 cursor-not-allowed' 
                            : 'bg-white border-slate-200 text-gov-navy hover:bg-slate-50 cursor-pointer'
                        }`}
                      >
                        ก่อนหน้า
                      </button>

                      {/* Page Numbers */}
                      {Array.from({ length: totalPages }, (_, idx) => idx + 1)
                        .filter(page => {
                          return Math.abs(page - currentPage) <= 2 || page === 1 || page === totalPages;
                        })
                        .map((page, idx, arr) => {
                          const prevPage = arr[idx - 1];
                          const showEllipsis = prevPage && page - prevPage > 1;

                          return (
                            <React.Fragment key={page}>
                              {showEllipsis && <span className="px-2 text-neutral-slate">...</span>}
                              <button
                                onClick={() => setCurrentPage(page)}
                                className={`w-9 h-9 rounded-xl border font-bold transition-all ${
                                  currentPage === page 
                                    ? 'bg-gov-gold border-gov-gold text-gov-navy shadow-sm' 
                                    : 'bg-white border-slate-200 text-gov-navy hover:bg-slate-50 cursor-pointer'
                                }`}
                              >
                                {page}
                              </button>
                            </React.Fragment>
                          );
                        })}

                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className={`px-3 py-2 rounded-xl border transition-all ${
                          currentPage === totalPages 
                            ? 'bg-slate-50 border-slate-200 text-slate-300 cursor-not-allowed' 
                            : 'bg-white border-slate-200 text-gov-navy hover:bg-slate-50 cursor-pointer'
                        }`}
                      >
                        ถัดไป
                      </button>
                      <button
                        onClick={() => setCurrentPage(totalPages)}
                        disabled={currentPage === totalPages}
                        className={`px-3 py-2 rounded-xl border transition-all ${
                          currentPage === totalPages 
                            ? 'bg-slate-50 border-slate-200 text-slate-300 cursor-not-allowed' 
                            : 'bg-white border-slate-200 text-gov-navy hover:bg-slate-50 cursor-pointer'
                        }`}
                      >
                        หน้าสุดท้าย
                      </button>
                    </div>
                  )}
                </>
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
                      setSortBy('id-asc');
                      setViewMode('grid');
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

          {/* Tab 5: Built-in User Manual */}
          {activeTab === 'manual' && (
            <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
              
              {/* Manual Hero Banner */}
              <div className="relative bg-gradient-to-r from-gov-navy to-gov-blue rounded-3xl p-6 text-white border border-slate-800 shadow-premium overflow-hidden">
                <span className="absolute top-0 right-0 w-32 h-32 bg-gov-gold-light rounded-full opacity-5 translate-x-12 -translate-y-12"></span>
                <span className="absolute bottom-0 left-0 right-0 h-1.5 bg-gov-gold"></span>
                <div className="space-y-2 relative z-10">
                  <h3 className="text-base sm:text-lg font-black flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-gov-gold" />
                    คู่มือแนะนำความรู้และวิธีปฏิบัติระบบตรวจรับพัสดุ
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed font-medium">
                    ระบบสารสนเทศนี้พัฒนาขึ้นภายใต้ พ.ร.บ. การจัดซื้อจัดจ้างและการบริหารพัสดุภาครัฐ เพื่อช่วยอำนวยความสะดวกในการจัดหมวดหมู่ ลงชื่อ และเก็บรูปถ่ายหลักฐานพัสดุครุภัณฑ์คอมพิวเตอร์ กองยุทธศาสตร์และงบประมาณ เทศบาลนครนครสวรรค์
                  </p>
                </div>
              </div>

              {/* Step by Step Manual Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Section 1: Excel Importer Guide */}
                <div className="bg-white p-6 rounded-3xl shadow-premium border border-slate-100 space-y-3 hover:border-gov-gold/30 transition-all duration-300 relative group">
                  <span className="absolute top-4 right-4 w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-gov-gold group-hover:bg-gov-gold-light transition-colors">1</span>
                  <h4 className="text-xs sm:text-sm font-bold text-gov-navy flex items-center gap-1.5">
                    <FileSpreadsheet className="w-4.5 h-4.5 text-emerald-600" />
                    การอัปโหลดใบเสนอราคา (Excel)
                  </h4>
                  <p className="text-xs text-neutral-slate leading-relaxed">
                    หากคุณต้องการสลับไปตรวจรายการพัสดุสำหรับโครงการอื่นของเทศบาล สามารถจัดเตรียมตาราง Excel (คอลัมน์แรกระบุรหัสพัสดุ ลำดับถัดไปคือสเปกสินค้า จำนวน หน่วยนับ ราคาต่อหน่วย และฝ่ายผู้เบิก) นำมาวางในโมดูล **"นำเข้าสเปกพัสดุ"** ระบบจะทำการแปลงตัวเลข ประมวลผล Checklist และสร้างแดชบอร์ดงบประมาณใหม่ให้ทันทีใน 2 วินาที
                  </p>
                </div>

                {/* Section 2: Visual Inspection & 3D Viewer */}
                <div className="bg-white p-6 rounded-3xl shadow-premium border border-slate-100 space-y-3 hover:border-gov-gold/30 transition-all duration-300 relative group">
                  <span className="absolute top-4 right-4 w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-gov-gold group-hover:bg-gov-gold-light transition-colors">2</span>
                  <h4 className="text-xs sm:text-sm font-bold text-gov-navy flex items-center gap-1.5">
                    <RotateCcw className="w-4.5 h-4.5 text-gov-gold" />
                    การสำรวจพัสดุและการใช้นิ้วปัดหมุน 3D
                  </h4>
                  <p className="text-xs text-neutral-slate leading-relaxed">
                    ในแท็บตรวจรับรายชิ้น ให้กดปุ่ม **"เปิด"** บนพัสดุรายการที่ต้องการ เพื่อเข้าสู่หน้าต่างปฏิบัติงาน (Inspection Workspace) คณะกรรมการสามารถกวาดนิ้วเพื่อหมุนดูอุปกรณ์คอมพิวเตอร์/เน็ตเวิร์กจำลองได้ 360° และคลิกที่มาร์กเกอร์ (Hotspots) เพื่อให้ระบบทำการติ๊ก Checklist ตรรกะส่วนควบอุปกรณ์ที่กำหนดไว้ตามสัญญาให้อัตโนมัติ
                  </p>
                </div>

                {/* Section 3: Serial No, MAC and Multi-images */}
                <div className="bg-white p-6 rounded-3xl shadow-premium border border-slate-100 space-y-3 hover:border-gov-gold/30 transition-all duration-300 relative group">
                  <span className="absolute top-4 right-4 w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-gov-gold group-hover:bg-gov-gold-light transition-colors">3</span>
                  <h4 className="text-xs sm:text-sm font-bold text-gov-navy flex items-center gap-1.5">
                    <CheckCircle2 className="w-4.5 h-4.5 text-status-passed" />
                    การกรอกประวัติเครื่องและภาพถ่าย 5 ด้าน
                  </h4>
                  <p className="text-xs text-neutral-slate leading-relaxed">
                    สำหรับพัสดุประเภทอิเล็กทรอนิกส์ คณะกรรมการต้องระบุหมายเลข Serial Number และ MAC Address ของอุปกรณ์ พร้อมกดอัปโหลดรูปถ่ายหลักฐานพัสดุจริง แยกตามคุณลักษณะ: **ภาพสินค้าจริง, ป้าย Serial, ป้ายสติกเกอร์ครุภัณฑ์หลวง, กล่องพัสดุ และอุปกรณ์คู่มือ** เพื่อเป็นหลักฐานให้แก่คณะกรรมการตรวจสอบระบบภายนอก
                  </p>
                </div>

                {/* Section 4: Share state URL Hash for collaboration */}
                <div className="bg-white p-6 rounded-3xl shadow-premium border border-slate-100 space-y-3 hover:border-gov-gold/30 transition-all duration-300 relative group">
                  <span className="absolute top-4 right-4 w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-gov-gold group-hover:bg-gov-gold-light transition-colors">4</span>
                  <h4 className="text-xs sm:text-sm font-bold text-gov-navy flex items-center gap-1.5">
                    <Share2 className="w-4.5 h-4.5 text-gov-blue" />
                    การแชร์ลิงก์และตรวจสอบความโปร่งใส
                  </h4>
                  <p className="text-xs text-neutral-slate leading-relaxed">
                    ระบบพัฒนาขึ้นภายใต้สถาปัตยกรรมไร้ฐานข้อมูลกึ่งกลาง เมื่อกรรมการท่านหนึ่งตรวจรับพัสดุเสร็จแล้ว ให้คลิกปุ่ม **"แชร์ผลตรวจ"** ที่แถบเมนูด้านซ้ายล่าง ลิงก์ที่คัดลอกจะเข้ารหัสความก้าวหน้าไว้ใน URL เมื่อส่งต่อให้กรรมการท่านอื่นเปิดลิงก์ บราวเซอร์ปลายทางจะอัปเดตสถานะและข้อมูลรูปภาพทั้งหมดตรงกันทันที ทำให้อุปกรณ์อื่นๆ สามารถทำการค้นหาตัวกรอง ค้นสเปก และดาวน์โหลดรายงานต่อได้โดยตรง
                  </p>
                </div>

              </div>

              {/* Regulatory warning banner */}
              <div className="p-5 bg-amber-50 border border-amber-200/60 rounded-2xl flex gap-3 text-xs leading-relaxed text-amber-800">
                <AlertTriangle className="w-6 h-6 text-status-pending shrink-0" />
                <div className="space-y-1">
                  <span className="font-bold text-gov-navy">กฎเกณฑ์การผ่านรับมอบสัญญาระเบียบจัดซื้อภาครัฐ:</span>
                  <p>
                    ปุ่มเปลี่ยนความเห็นตรวจพัสดุผ่านสุดท้าย (Passed) จะถูกปิดกั้นการกดยืนยันหากคณะกรรมการยังตรวจและทำเครื่องหมาย Checklist ย่อยไม่ครบทั้ง 8 ข้อ การตรวจผ่านต้องเป็นความเห็นชอบเอกฉันท์ร่วมกันของคณะกรรมการตามคำสั่งที่ได้รับมอบหมาย
                  </p>
                </div>
              </div>

            </div>
          )}

          {/* Tab 6: Template Settings Panel */}
          {activeTab === 'settings' && (
            <TemplateSettings onConfigChange={handleProjectConfigChange} />
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

      {/* 4. Share Options Overlay */}
      {isShareModalOpen && (
        <ShareModal 
          onClose={() => setIsShareModalOpen(false)}
          shareUrl={handleShareLink()}
          onExportExcel={handleExportExcel}
          onExportJSON={handleExportJSON}
          onPrint={handlePrint}
        />
      )}

      {/* 5. Global Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-gov-navy text-slate-100 px-5 py-3 rounded-2xl shadow-floating z-50 text-xs sm:text-sm font-bold border border-slate-800 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <span className="w-2.5 h-2.5 bg-gov-gold rounded-full animate-ping"></span>
          {toastMessage}
        </div>
      )}

    </div>
  );
}
