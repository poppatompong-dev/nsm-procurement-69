import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileSpreadsheet, 
  Image as ImageIcon, 
  FileText, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  Search, 
  Filter, 
  Download, 
  Printer, 
  UserCheck, 
  Edit3, 
  Save, 
  X,
  Layers,
  Check,
  RotateCcw,
  Share2,
  Info,
  DollarSign,
  Package
} from 'lucide-react';
import * as XLSX from 'xlsx';
import initialProcurementData from './data/procurementData.json';

// Define Color Palette for Custom Progress Charts
const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#3b82f6', '#64748b'];

// Safe number formatter helper
const formatNumber = (val) => {
  if (val === undefined || val === null) return '0';
  const num = Number(val);
  return isNaN(num) ? '0' : num.toLocaleString();
};

// Categories Mapping
const CATEGORY_NAMES = {
  "connectivity": "อุปกรณ์เชื่อมต่อและแปลงสัญญาณ",
  "storage": "อุปกรณ์จัดเก็บข้อมูล",
  "peripherals": "อุปกรณ์ต่อพ่วง",
  "electronics": "อุปกรณ์และบอร์ดอิเล็กทรอนิกส์",
  "tools": "เครื่องมือช่างและคอนโทรล",
  "organization": "อุปกรณ์จัดระเบียบและจ่ายไฟ",
  "toner": "หมึกพิมพ์",
  "consumables": "วัสดุสิ้นเปลืองอื่น ๆ"
};

// Help classify items based on name
const getCategory = (name) => {
  const n = name.toLowerCase();
  if (n.includes("hdmi") || n.includes("type-c") || n.includes("usb hub") || n.includes("converter") || n.includes("console cable") || n.includes("sfp") || n.includes("adapter") || n.includes("สายแปลง") || n.includes("หัวสัญญาณ")) {
    return "connectivity";
  } else if (n.includes("flash drive") || n.includes("sd card") || n.includes("hdd") || n.includes("ssd") || n.includes("จัดเก็บข้อมูล")) {
    return "storage";
  } else if (n.includes("mouse") || n.includes("keyboard") || n.includes("webcam") || n.includes("หูฟัง") || n.includes("กล้อง")) {
    return "peripherals";
  } else if (n.includes("raspberry") || n.includes("โมดูล") || n.includes("esp32") || n.includes("poe")) {
    return "electronics";
  } else if (n.includes("บัดกรี") || n.includes("ลวดซับ") || n.includes("น้ำยาประสาน") || n.includes("ดีบุก") || n.includes("รางปีกนก") || n.includes("สต๊อปเปอร์") || n.includes("คลิป") || n.includes("din rail")) {
    return "tools";
  } else if (n.includes("กระเป๋า") || n.includes("เป้") || n.includes("ปลั๊ก") || n.includes("รางปลั๊ก") || n.includes("โรลม้วน")) {
    return "organization";
  } else if (n.includes("หมึก") || n.includes("hp 230a") || n.includes("สีดำ") || n.includes("สีฟ้า") || n.includes("สีเหลือง") || n.includes("สีชมพู")) {
    return "toner";
  } else {
    return "consumables";
  }
};

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [items, setItems] = useState([]);
  
  // OCR verified committee list for Nakhon Sawan Municipality (คำสั่งที่ ๘๖๔/๒๕๖๙)
  const defaultCommittee = [
    { name: 'นายณัฏฐวุฒิ จีนมหันต์', position: 'ประธานกรรมการตรวจรับ (นักวิชาการคอมพิวเตอร์ชำนาญการพิเศษ)' },
    { name: 'นายปฐมพงษ์ หล้ามหศักดิ์', position: 'กรรมการตรวจรับ (นักวิชาการคอมพิวเตอร์ปฏิบัติการ)' },
    { name: 'นายประชารักษ์ ประทุมโทน', position: 'กรรมการตรวจรับ (นักประชาสัมพันธ์ปฏิบัติการ)' }
  ];

  const [committee, setCommittee] = useState(defaultCommittee);
  const [isEditingCommittee, setIsEditingCommittee] = useState(false);
  const [editedCommittee, setEditedCommittee] = useState([]);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDivision, setFilterDivision] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterImage, setFilterImage] = useState('all');
  const [filterRound, setFilterRound] = useState('all');

  // Selected Item for Detail Modal
  const [selectedItem, setSelectedItem] = useState(null);
  const [itemNotes, setItemNotes] = useState('');
  const [itemInspectStatus, setItemInspectStatus] = useState('');

  // Image Manager State
  const [isImagePickerOpen, setIsImagePickerOpen] = useState(false);
  const [pickerTargetItem, setPickerTargetItem] = useState(null);
  const [availableImages, setAvailableImages] = useState([]);

  // Share link feedback
  const [shareCopied, setShareCopied] = useState(false);

  // Parse state from URL Hash
  const parseUrlState = (currentItems) => {
    const hash = window.location.hash;
    if (hash && hash.startsWith('#state=')) {
      try {
        const base64 = hash.split('state=')[1];
        const json = decodeURIComponent(escape(atob(base64)));
        const decoded = JSON.parse(json);
        
        if (decoded.c) {
          if (Array.isArray(decoded.c) && decoded.c.length === 3) {
            setCommittee(decoded.c.map(m => ({ name: m.n || '', position: m.p || '' })));
          }
        }
        
        if (decoded.s && currentItems.length > 0) {
          const map = {};
          decoded.s.forEach(x => { map[x.id] = { st: x.st, nt: x.nt }; });
          const updated = currentItems.map(item => {
            if (map[item.id]) {
              return {
                ...item,
                inspectStatus: map[item.id].st,
                notes: map[item.id].nt
              };
            }
            return {
              ...item,
              inspectStatus: 'passed',
              notes: ''
            };
          });
          return updated;
        }
      } catch (e) {
        console.error('Failed to parse shareable link', e);
      }
    }
    return null;
  };

  // Load Initial Data
  useEffect(() => {
    // Enrich local data
    const enriched = initialProcurementData.map(item => ({
      ...item,
      category: getCategory(item.name),
      inspectStatus: 'passed',
      notes: '',
      round: 'งบ 69 (เสนอราคา)'
    }));

    // Check if there is state in the URL hash
    const urlItems = parseUrlState(enriched);
    
    if (urlItems) {
      setItems(urlItems);
      localStorage.setItem('procurement_items_v3', JSON.stringify(urlItems));
    } else {
      // Check localStorage
      try {
        const savedItems = localStorage.getItem('procurement_items_v3');
        if (savedItems) {
          setItems(JSON.parse(savedItems));
        } else {
          setItems(enriched);
          localStorage.setItem('procurement_items_v3', JSON.stringify(enriched));
        }
      } catch (e) {
        console.error('Failed to read items from localStorage', e);
        setItems(enriched);
      }
      
      try {
        const savedCommittee = localStorage.getItem('procurement_committee_v3');
        if (savedCommittee) {
          const parsed = JSON.parse(savedCommittee);
          if (Array.isArray(parsed) && parsed.length === 3 && parsed.every(p => p && typeof p === 'object' && p.name && p.position)) {
            setCommittee(parsed);
          } else {
            setCommittee(defaultCommittee);
            localStorage.setItem('procurement_committee_v3', JSON.stringify(defaultCommittee));
          }
        }
      } catch (e) {
        console.error('Failed to read committee from localStorage', e);
        setCommittee(defaultCommittee);
      }
    }

    // Extract list of all unique images defined in initial database
    const imgList = initialProcurementData.map(item => item.image).filter(Boolean);
    const uniqueImgs = Array.from(new Set(imgList));
    setAvailableImages(uniqueImgs);

    const handleHashChange = () => {
      const urlItemsUpdate = parseUrlState(enriched);
      if (urlItemsUpdate) {
        setItems(urlItemsUpdate);
        localStorage.setItem('procurement_items_v3', JSON.stringify(urlItemsUpdate));
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Save changes to localStorage
  const updateItemsInStateAndStorage = (newItems) => {
    setItems(newItems);
    try {
      localStorage.setItem('procurement_items_v3', JSON.stringify(newItems));
    } catch (e) {
      console.error('Failed to save items to localStorage', e);
    }
  };

  // Handle Committee Save
  const handleEditCommitteeStart = () => {
    setEditedCommittee([...committee]);
    setIsEditingCommittee(true);
  };

  const handleEditCommitteeChange = (index, field, value) => {
    const updated = [...editedCommittee];
    updated[index][field] = value;
    setEditedCommittee(updated);
  };

  const handleSaveCommittee = () => {
    setCommittee(editedCommittee);
    try {
      localStorage.setItem('procurement_committee_v3', JSON.stringify(editedCommittee));
    } catch (e) {
      console.error('Failed to save committee to localStorage', e);
    }
    setIsEditingCommittee(false);
  };

  // Handle Item Update from Modal
  const handleOpenItemDetails = (item) => {
    setSelectedItem(item);
    setItemNotes(item.notes || '');
    setItemInspectStatus(item.inspectStatus || 'passed');
  };

  const handleSaveItemDetails = () => {
    if (!selectedItem) return;
    const updated = items.map(item => {
      if (item.id === selectedItem.id) {
        return {
          ...item,
          inspectStatus: itemInspectStatus,
          notes: itemNotes
        };
      }
      return item;
    });
    updateItemsInStateAndStorage(updated);
    setSelectedItem(null);
  };

  // Image Mapping Handlers
  const handleOpenImagePicker = (item) => {
    setPickerTargetItem(item);
    setIsImagePickerOpen(true);
  };

  const handleSelectImageForItem = (imageName) => {
    if (!pickerTargetItem) return;
    const updated = items.map(item => {
      if (item.id === pickerTargetItem.id) {
        return { ...item, image: imageName };
      }
      return item;
    });
    updateItemsInStateAndStorage(updated);
    setIsImagePickerOpen(false);
    setPickerTargetItem(null);
  };

  const handleUnlinkImage = (item) => {
    const updated = items.map(i => {
      if (i.id === item.id) {
        return { ...i, image: '' };
      }
      return i;
    });
    updateItemsInStateAndStorage(updated);
  };

  // Generate Shareable Link
  const handleGenerateShareLink = () => {
    try {
      const state = {
        c: committee.map(m => ({ n: m.name, p: m.position })),
        s: items.map(i => ({ id: i.id, st: i.inspectStatus, nt: i.notes })).filter(x => x.st !== 'passed' || x.nt)
      };
      const json = JSON.stringify(state);
      const base64 = btoa(unescape(encodeURIComponent(json)));
      const shareLink = `${window.location.origin}${window.location.pathname}#state=${base64}`;

      navigator.clipboard.writeText(shareLink).then(() => {
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 3000);
      });
    } catch (e) {
      console.error('Failed to generate share link', e);
      alert('ไม่สามารถสร้างลิงก์แชร์ได้ในขณะนี้');
    }
  };

  // Reset Database to Initial
  const handleResetDatabase = () => {
    if (window.confirm('คุณต้องการรีเซ็ตข้อมูลทั้งหมดกลับเป็นค่าเริ่มต้นหรือไม่? (สถานะและโน้ตที่บันทึกไว้ทั้งหมดรวมถึง URL จะถูกรีเซ็ต)')) {
      const enriched = initialProcurementData.map(item => ({
        ...item,
        category: getCategory(item.name),
        inspectStatus: 'passed',
        notes: '',
        round: 'งบ 69 (เสนอราคา)'
      }));
      updateItemsInStateAndStorage(enriched);
      setCommittee(defaultCommittee);
      try {
        localStorage.setItem('procurement_committee_v3', JSON.stringify(defaultCommittee));
      } catch (e) {
        console.error('Failed to save committee to localStorage', e);
      }
      window.location.hash = '';
    }
  };

  // Filtered Items
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchQuery = 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (item.spec && item.spec.toLowerCase().includes(searchQuery.toLowerCase()));
      
      let matchDivision = filterDivision === 'all';
      if (!matchDivision) {
        if (filterDivision === 'ประชาสัมพันธ์') {
          matchDivision = item.division.includes('ประชาสัมพันธ์') || item.division.includes('ปชส.');
        } else {
          matchDivision = item.division.includes(filterDivision);
        }
      }
      
      const matchCategory = filterCategory === 'all' || item.category === filterCategory;
      const matchStatus = filterStatus === 'all' || item.inspectStatus === filterStatus;
      const matchImage = filterImage === 'all' || (filterImage === 'has_image' && item.image) || (filterImage === 'no_image' && !item.image);
      const matchRound = filterRound === 'all' || item.round === filterRound;

      return matchQuery && matchDivision && matchCategory && matchStatus && matchImage && matchRound;
    });
  }, [items, searchQuery, filterDivision, filterCategory, filterStatus, filterImage, filterRound]);

  // Statistics Computations
  const stats = useMemo(() => {
    const totalBudget = items.reduce((sum, item) => sum + item.total_price, 0);
    const totalItems = items.length;
    const passedCount = items.filter(item => item.inspectStatus === 'passed').length;
    const pendingCount = items.filter(item => item.inspectStatus === 'pending').length;
    const missingImageCount = items.filter(item => !item.image).length;
    
    // Division breakdown
    const divisionDataMap = {};
    items.forEach(item => {
      const parts = item.division.split('/');
      parts.forEach(part => {
        const cleanName = part.replace(/[0-9\s]/g, '').trim();
        if (cleanName) {
          divisionDataMap[cleanName] = (divisionDataMap[cleanName] || 0) + item.total_price;
        }
      });
    });
    
    const divisionData = Object.keys(divisionDataMap).map(key => ({
      name: key,
      value: divisionDataMap[key]
    })).sort((a, b) => b.value - a.value);

    // Category breakdown
    const categoryDataMap = {};
    items.forEach(item => {
      const catLabel = CATEGORY_NAMES[item.category] || "อื่น ๆ";
      categoryDataMap[catLabel] = (categoryDataMap[catLabel] || 0) + item.total_price;
    });
    const categoryData = Object.keys(categoryDataMap).map(key => ({
      name: key,
      value: categoryDataMap[key]
    })).sort((a, b) => b.value - a.value);

    return {
      totalBudget,
      totalItems,
      passedCount,
      pendingCount,
      missingImageCount,
      divisionData,
      categoryData
    };
  }, [items]);

  // Handle printing
  const handlePrint = () => {
    window.print();
  };

  // SheetJS Excel Export
  const handleExportToExcel = () => {
    const dataToExport = filteredItems.map((item, idx) => ({
      'ลำดับ': item.id,
      'รายการพัสดุ': item.name,
      'คุณลักษณะเฉพาะ': item.spec || 'ไม่ได้ระบุ',
      'จำนวน': item.qty,
      'หน่วยนับ': item.unit,
      'ราคาต่อหน่วย (บาท)': item.unit_price,
      'จำนวนเงินรวม (บาท)': item.total_price,
      'กลุ่มงานผู้เบิก': item.division,
      'สถานะการตรวจรับ': item.inspectStatus === 'passed' ? 'ผ่านการตรวจรับ' : 'อยู่ระหว่างตรวจสอบ',
      'สถานะรูปภาพ': item.image ? 'มีรูปภาพ' : 'ไม่มีรูปภาพ',
      'ชื่อไฟล์รูปภาพ': item.image || '-',
      'หมายเหตุ/โน้ตตรวจรับ': item.notes || '-'
    }));

    const totalSum = filteredItems.reduce((sum, item) => sum + item.total_price, 0);
    dataToExport.push({
      'ลำดับ': '',
      'รายการพัสดุ': 'รวมทั้งสิ้น',
      'คุณลักษณะเฉพาะ': '',
      'จำนวน': '',
      'หน่วยนับ': '',
      'ราคาต่อหน่วย (บาท)': '',
      'จำนวนเงินรวม (บาท)': totalSum,
      'กลุ่มงานผู้เบิก': '',
      'สถานะการตรวจรับ': '',
      'สถานะรูปภาพ': '',
      'ชื่อไฟล์รูปภาพ': '',
      'หมายเหตุ/โน้ตตรวจรับ': ''
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'รายงานวัสดุคอมพิวเตอร์');
    
    const max_lens = {};
    dataToExport.forEach(row => {
      Object.keys(row).forEach(key => {
        const val = row[key] ? row[key].toString() : '';
        max_lens[key] = Math.max(max_lens[key] || 10, val.length + 5);
      });
    });
    worksheet['!cols'] = Object.keys(max_lens).map(key => ({ wch: max_lens[key] }));

    let filename = 'รายงานพัสดุคอมพิวเตอร์_เทศบาลนครนครสวรรค์.xlsx';
    XLSX.writeFile(workbook, filename);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 print:bg-white print:text-black">
      
      {/* HEADER SECTION (HIDDEN ON PRINT) */}
      <header className="bg-slate-900 text-white shadow-md print:hidden">
        <div className="max-w-7xl mx-auto px-4 py-5 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="p-2 bg-indigo-600 rounded-lg text-white font-bold shadow-md">
                <FileSpreadsheet className="w-5 h-5 sm:w-6 sm:h-6" />
              </span>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">ระบบตรวจรับและรายงานพัสดุคอมพิวเตอร์</h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 font-medium">
              เทศบาลนครนครสวรรค์ • กองยุทธศาสตร์และงบประมาณ (จัดซื้อรวม 49 รายการ)
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full md:w-auto">
            <button
              onClick={handleGenerateShareLink}
              className={`flex items-center gap-2 text-xs font-bold px-3 py-2 rounded-lg transition-all border ${
                shareCopied 
                  ? 'bg-emerald-600 text-white border-emerald-500' 
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-500 shadow-sm'
              }`}
            >
              {shareCopied ? (
                <>
                  <Check className="w-4 h-4" />
                  คัดลอกลิงก์แชร์สำเร็จ!
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4" />
                  แชร์สถานะให้ผู้อื่น
                </>
              )}
            </button>

            <button 
              onClick={handleResetDatabase}
              title="รีเซ็ตข้อมูลทั้งหมดกลับเป็นค่าเริ่มต้น"
              className="p-2 text-slate-300 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors border border-slate-700 ml-auto md:ml-0"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* NAVIGATION TABS (HIDDEN ON PRINT) */}
      <nav className="bg-white border-b border-slate-200 shadow-sm print:hidden sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-6 sm:space-x-8 overflow-x-auto scrollbar-none">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-xs sm:text-sm transition-all whitespace-nowrap ${
                activeTab === 'dashboard'
                  ? 'border-indigo-600 text-indigo-600 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <Layers className="w-4 h-4" />
              แดชบอร์ดสรุปผล
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-xs sm:text-sm transition-all whitespace-nowrap ${
                activeTab === 'audit'
                  ? 'border-indigo-600 text-indigo-600 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              จับคู่รูปพัสดุ {stats.missingImageCount > 0 && (
                <span className="bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                  ขาด {stats.missingImageCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-xs sm:text-sm transition-all whitespace-nowrap ${
                activeTab === 'reports'
                  ? 'border-indigo-600 text-indigo-600 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <FileText className="w-4 h-4" />
              ระบบออกรายงาน
            </button>
          </div>
        </div>
      </nav>

      {/* MAIN CONTAINER */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 print:p-0">
        
        {/* ==================================== */}
        {/* 1. DASHBOARD TAB                     */}
        {/* ==================================== */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6 print:hidden">
            
            {/* Summary Statistics Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              
              <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-[10px] sm:text-sm font-medium text-slate-500">งบประมาณจัดซื้อ</p>
                  <p className="text-xl sm:text-3xl font-extrabold text-slate-900">
                    {formatNumber(stats.totalBudget)} <span className="text-xs sm:text-lg font-semibold text-slate-500">บาท</span>
                  </p>
                </div>
                <span className="p-2 sm:p-3.5 bg-indigo-50 rounded-xl sm:rounded-2xl text-indigo-600 hidden sm:block">
                  <DollarSign className="w-5 h-5 sm:w-6 sm:h-6" />
                </span>
              </div>

              <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-[10px] sm:text-sm font-medium text-slate-500">จำนวนพัสดุ</p>
                  <p className="text-xl sm:text-3xl font-extrabold text-slate-900">
                    {stats.totalItems} <span className="text-xs sm:text-lg font-semibold text-slate-500">รายการ</span>
                  </p>
                </div>
                <span className="p-2 sm:p-3.5 bg-sky-50 rounded-xl sm:rounded-2xl text-sky-600 hidden sm:block">
                  <Package className="w-5 h-5 sm:w-6 sm:h-6" />
                </span>
              </div>

              <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-[10px] sm:text-sm font-medium text-slate-500">ผ่านการตรวจรับ</p>
                  <p className="text-xl sm:text-3xl font-extrabold text-emerald-600">
                    {stats.passedCount} <span className="text-xs sm:text-lg font-semibold text-slate-500">รายการ</span>
                  </p>
                </div>
                <span className="p-2 sm:p-3.5 bg-emerald-50 rounded-xl sm:rounded-2xl text-emerald-600 hidden sm:block">
                  <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                </span>
              </div>

              <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-[10px] sm:text-sm font-medium text-slate-500">พัสดุไม่มีรูปภาพ</p>
                  <p className={`text-xl sm:text-3xl font-extrabold ${stats.missingImageCount > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
                    {stats.missingImageCount} <span className="text-xs sm:text-lg font-semibold text-slate-500">รายการ</span>
                  </p>
                </div>
                <span className={`p-2 sm:p-3.5 rounded-xl sm:rounded-2xl hidden sm:block ${stats.missingImageCount > 0 ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-500'}`}>
                  <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6" />
                </span>
              </div>
            </div>

            {/* Dashboard Visualizations Grid (Custom Lightweight HTML Charts) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Custom Chart: Budget by division */}
              <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-100 lg:col-span-2 space-y-4">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-indigo-600"></span>
                    งบประมาณการจัดซื้อแยกตามกลุ่มงาน
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">เรียงลำดับตามยอดเงินจัดสรร</p>
                </div>
                
                <div className="space-y-4 py-2">
                  {stats.divisionData.map((item, idx) => {
                    const maxVal = Math.max(...stats.divisionData.map(d => d.value)) || 1;
                    const pct = (item.value / maxVal) * 100;
                    return (
                      <div key={idx} className="space-y-1.5">
                        <div className="flex justify-between text-xs sm:text-sm">
                          <span className="font-semibold text-slate-700">{item.name}</span>
                          <span className="font-bold text-indigo-600">{formatNumber(item.value)} บาท</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full transition-all duration-700 ease-out" 
                            style={{ 
                              width: `${pct}%`,
                              backgroundColor: COLORS[idx % COLORS.length]
                            }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Custom Chart: Budget by Category */}
              <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-600"></span>
                    ยอดงบประมาณตามประเภทวัสดุ
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">สัดส่วนร้อยละของงบประมาณรวม</p>
                </div>
                
                <div className="space-y-3.5 py-1.5">
                  {stats.categoryData.slice(0, 6).map((item, idx) => {
                    const pct = (item.value / stats.totalBudget) * 100;
                    return (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-600 font-medium truncate max-w-[170px]">{item.name}</span>
                          <span className="font-bold text-slate-800">{pct.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full transition-all duration-500 ease-out" 
                            style={{ 
                              width: `${pct}%`,
                              backgroundColor: COLORS[idx % COLORS.length]
                            }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Committee Section */}
            <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-100">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-sm sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-indigo-600" />
                    คณะกรรมการตรวจรับพัสดุ (จริง)
                  </h3>
                  <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5">คณะกรรมการตรวจรับตามคำสั่งเทศบาลนครนครสวรรค์ ที่ ๘๖๔/๒๕๖๙ (ตรวจรับ 21 ก.ค. 2569)</p>
                </div>
                {!isEditingCommittee ? (
                  <button 
                    onClick={handleEditCommitteeStart}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors border border-indigo-100"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    แก้ไขรายชื่อ
                  </button>
                ) : (
                  <button 
                    onClick={handleSaveCommittee}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg shadow-sm transition-colors"
                  >
                    <Save className="w-3.5 h-3.5" />
                    บันทึกข้อมูล
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                {committee.map((member, index) => (
                  <div key={index} className="p-4 bg-slate-50 border border-slate-200/50 rounded-xl space-y-2 relative overflow-hidden">
                    <span className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-full translate-x-12 -translate-y-12 opacity-50 z-0"></span>
                    <div className="relative z-10">
                      {isEditingCommittee ? (
                        <div className="space-y-3">
                          <div>
                            <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">ชื่อ-นามสกุล</label>
                            <input 
                              type="text" 
                              value={editedCommittee[index]?.name || ''} 
                              onChange={(e) => handleEditCommitteeChange(index, 'name', e.target.value)}
                              className="w-full bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-xs focus:outline-none focus:border-indigo-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">ตำแหน่งในการตรวจรับ</label>
                            <input 
                              type="text" 
                              value={editedCommittee[index]?.position || ''} 
                              onChange={(e) => handleEditCommitteeChange(index, 'position', e.target.value)}
                              className="w-full bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-xs focus:outline-none focus:border-indigo-500"
                            />
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="text-[10px] font-bold text-indigo-600 tracking-wider">
                            {index === 0 ? 'ประธานกรรมการตรวจรับ' : 'กรรมการตรวจรับ'}
                          </p>
                          <p className="text-sm sm:text-base font-bold text-slate-900 mt-1">{member.name}</p>
                          <p className="text-xs text-slate-500 mt-1 leading-relaxed">{member.position}</p>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Audit Check List */}
            <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-100">
              <h3 className="text-sm sm:text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                <Info className="w-5 h-5 text-indigo-600" />
                คำแนะนำและข้อสังเกตในการตรวจรับออนไลน์
              </h3>
              <ul className="text-xs sm:text-sm text-slate-600 space-y-2 leading-relaxed">
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">1</span>
                  <span><strong>การแชร์สถานะการตรวจรับ:</strong> หากท่านตรวจพัสดุและเปลี่ยนสถานะหรือเขียนโน้ตเพิ่มเติมแล้ว ท่านสามารถกดปุ่ม <strong>"แชร์สถานะให้ผู้อื่น"</strong> ที่มุมขวาบนเพื่อส่งลิงก์สรุปงานให้ประธานกรรมการหรือกรรมการท่านอื่นเปิดดูข้อมูลล่าสุดแบบเดียวกับท่านได้ทันที</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">2</span>
                  <span><strong>การคัดลอกรูปภาพและจับคู่:</strong> รูปภาพพัสดุทั้ง 49 รายการได้รับการจับคู่ตรงรายการที่ถูกต้อง (พัสดุ 1-46 คู่กับรูปภาพ 87160-87205, พัสดุ 47 คู่กับ 336724, พัสดุ 48 คู่กับ 336725 และ พัสดุ 49 คู่กับ 8854E...)</span>
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* ==================================== */}
        {/* 2. IMAGE AUDIT & MATCHER TAB        */}
        {/* ==================================== */}
        {activeTab === 'audit' && (
          <div className="space-y-6 print:hidden">
            <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-100">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                  <h2 className="text-base sm:text-xl font-bold text-slate-900 flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-indigo-600" />
                    ระบบตรวจสอบและจับคู่รูปภาพพัสดุ
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">จับคู่รูปภาพและตรวจสอบความถูกต้องสำหรับรายการพัสดุคอมพิวเตอร์ทั้ง 49 รายการ</p>
                </div>
                <div className="w-full sm:w-auto">
                  <select 
                    value={filterImage}
                    onChange={(e) => setFilterImage(e.target.value)}
                    className="w-full sm:w-auto bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none"
                  >
                    <option value="all">แสดงภาพทั้งหมด</option>
                    <option value="has_image">เฉพาะรายการที่มีรูปภาพ</option>
                    <option value="no_image">เฉพาะรายการที่ไม่มีรูปภาพ ({stats.missingImageCount})</option>
                  </select>
                </div>
              </div>

              {/* Items Grid for Image Matching */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredItems.map((item) => (
                  <div key={item.id} className="bg-slate-50 border border-slate-200/60 rounded-xl overflow-hidden shadow-sm flex flex-col justify-between">
                    
                    {/* Image Area */}
                    <div className="relative aspect-video bg-slate-200 flex items-center justify-center overflow-hidden group">
                      {item.image ? (
                        <>
                          <img 
                            src={`/รูปภาพ/${item.image}`} 
                            alt={item.name} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              e.target.src = "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=500&auto=format&fit=crop";
                            }}
                          />
                          <div className="absolute top-2 right-2 bg-slate-900/80 backdrop-blur-sm text-white px-2 py-0.5 rounded text-[9px] font-mono tracking-wider">
                            {item.image}
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center gap-1.5 text-slate-400">
                          <AlertTriangle className="w-7 h-7 text-amber-500" />
                          <span className="text-[11px] font-bold">ไม่มีรูปภาพประกอบ</span>
                        </div>
                      )}
                    </div>

                    {/* Item Information */}
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                            {item.id}
                          </span>
                          <span className="text-[9px] font-bold bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded">
                            {CATEGORY_NAMES[item.category] || item.category}
                          </span>
                        </div>
                        <h4 className="font-bold text-slate-900 text-xs sm:text-sm mt-2 line-clamp-2" title={item.name}>
                          {item.name}
                        </h4>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                          {item.spec || 'ไม่ได้ระบุคุณลักษณะ'}
                        </p>
                      </div>

                      {/* Matching Action Buttons */}
                      <div className="flex items-center justify-between border-t border-slate-200 pt-3">
                        <span className="text-xs font-bold text-slate-600">
                          {item.qty} {item.unit}
                        </span>
                        <div className="flex gap-2">
                          {item.image && (
                            <button
                              onClick={() => handleUnlinkImage(item)}
                              className="text-[11px] font-bold px-2 py-1 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg transition-colors border border-rose-100"
                            >
                              ยกเลิกรูป
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenImagePicker(item)}
                            className="text-[11px] font-bold px-2.5 py-1 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors border border-indigo-100"
                          >
                            {item.image ? 'เปลี่ยนรูป' : 'จับคู่รูปภาพ'}
                          </button>
                        </div>
                      </div>
                    </div>

                  </div>
                ))}
              </div>

              {filteredItems.length === 0 && (
                <div className="text-center py-12 text-slate-400">
                  <Search className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                  <p className="text-xs font-semibold">ไม่พบข้อมูลตามเงื่อนไขที่คัดกรอง</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================================== */}
        {/* 3. REPORTS TAB (FILTERS & EXPORT)    */}
        {/* ==================================== */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            
            {/* Filters Area (Hidden on Print) */}
            <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4 print:hidden">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="text-sm sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Filter className="w-5 h-5 text-indigo-600" />
                  การคัดกรองข้อมูลขั้นสูงสำหรับการพิมพ์รายงาน
                </h3>
                <button
                  onClick={() => {
                    setFilterDivision('all');
                    setFilterCategory('all');
                    setFilterStatus('all');
                    setFilterImage('all');
                    setFilterRound('all');
                    setSearchQuery('');
                  }}
                  className="text-xs font-bold text-indigo-600 hover:underline"
                >
                  ล้างตัวกรองทั้งหมด
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                
                {/* Search query */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-500">ค้นหาพัสดุ/สเปก</label>
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input 
                      type="text" 
                      placeholder="ใส่คีย์เวิร์ดเพื่อค้นหา..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 pl-9 pr-3 py-1.5 rounded-lg text-xs focus:outline-none focus:bg-white focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* Division filter */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-500">กลุ่มงานที่เบิก</label>
                  <select
                    value={filterDivision}
                    onChange={(e) => setFilterDivision(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg text-xs focus:outline-none focus:bg-white"
                  >
                    <option value="all">ทั้งหมด</option>
                    <option value="สถิติ">งานส่งเสริมและบริการสถิติ (สถิติ)</option>
                    <option value="บริหาร">ฝ่ายบริหารทั่วไป (บริหาร)</option>
                    <option value="ประชาสัมพันธ์">งานผลิตเอกสารและเผยแพร่ (ประชาสัมพันธ์)</option>
                    <option value="วิเคราะห์">งานวิเคราะห์นโยบายและแผน (วิเคราะห์)</option>
                  </select>
                </div>

                {/* Category filter */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-500">หมวดหมู่ของวัสดุ</label>
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg text-xs focus:outline-none focus:bg-white"
                  >
                    <option value="all">ทั้งหมด</option>
                    {Object.keys(CATEGORY_NAMES).map(key => (
                      <option key={key} value={key}>{CATEGORY_NAMES[key]}</option>
                    ))}
                  </select>
                </div>

                {/* Inspect Status filter */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-500">สถานะการตรวจรับ</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg text-xs focus:outline-none focus:bg-white"
                  >
                    <option value="all">ทั้งหมด</option>
                    <option value="passed">ผ่านการตรวจรับ</option>
                    <option value="pending">อยู่ระหว่างตรวจสอบ</option>
                  </select>
                </div>

                {/* Image status filter */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-500">การมีรูปถ่ายพัสดุ</label>
                  <select
                    value={filterImage}
                    onChange={(e) => setFilterImage(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg text-xs focus:outline-none focus:bg-white"
                  >
                    <option value="all">ทั้งหมด</option>
                    <option value="has_image">มีรูปพัสดุประกอบ</option>
                    <option value="no_image">ไม่มีรูปพัสดุประกอบ ({stats.missingImageCount})</option>
                  </select>
                </div>

              </div>

              {/* Action Buttons for Export */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-t border-slate-100 pt-4">
                <span className="text-xs font-bold text-slate-500">
                  พบข้อมูลทั้งหมด {filteredItems.length} จาก 49 รายการ
                </span>
                <div className="flex gap-2 w-full sm:w-auto">
                  <button
                    onClick={handlePrint}
                    className="w-1/2 sm:w-auto flex items-center justify-center gap-1.5 text-xs font-bold px-4 py-2 bg-slate-800 text-white hover:bg-slate-700 rounded-lg shadow-sm transition-colors"
                  >
                    <Printer className="w-4 h-4" />
                    พิมพ์รายงาน (PDF)
                  </button>
                  <button
                    onClick={handleExportToExcel}
                    className="w-1/2 sm:w-auto flex items-center justify-center gap-1.5 text-xs font-bold px-4 py-2 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg shadow-sm transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    ดาวน์โหลดรายงาน Excel
                  </button>
                </div>
              </div>
            </div>

            {/* PREVIEW REPORT (RESPONSIVE TABLE FOR DESKTOP/MOBILE) */}
            <div className="bg-white p-4 sm:p-8 rounded-2xl shadow-sm border border-slate-100 print:border-none print:shadow-none print:p-0">
              
              {/* Header displayed only when printing */}
              <div className="hidden print:block text-center space-y-1.5 mb-6">
                <h1 className="text-lg font-bold">รายละเอียดแนบท้ายรายงานการตรวจรับพัสดุคอมพิวเตอร์ (จํานวน 49 รายการ)</h1>
                <p className="text-sm">เทศบาลนครนครสวรรค์ • กองยุทธศาสตร์และงบประมาณ</p>
                <p className="text-xs">ตรวจรับ ณ วันที่ 21 กรกฎาคม 2569</p>
              </div>

              {/* Committee information displayed on print */}
              <div className="hidden print:block border-t border-b border-slate-200 py-3 mb-6">
                <div className="grid grid-cols-3 text-[10px] gap-4">
                  <div>
                    <span className="font-bold text-slate-600">ประธานกรรมการ:</span> {committee[0]?.name}
                  </div>
                  <div>
                    <span className="font-bold text-slate-600">กรรมการ:</span> {committee[1]?.name}
                  </div>
                  <div>
                    <span className="font-bold text-slate-600">กรรมการ:</span> {committee[2]?.name}
                  </div>
                </div>
              </div>

              {/* Responsive Table Wrapper */}
              <div className="overflow-x-auto shadow-inner border border-slate-200 rounded-xl print:border-none print:shadow-none">
                <table className="min-w-full text-xs text-left border-collapse border border-slate-200 print:border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 print:bg-slate-100 print:text-black">
                      <th className="py-2.5 px-2 border border-slate-200 text-center w-10">ลำดับ</th>
                      <th className="py-2.5 px-3 border border-slate-200 min-w-[120px]">รายการวัสดุ</th>
                      <th className="py-2.5 px-3 border border-slate-200 hidden sm:table-cell w-[35%]">คุณลักษณะเฉพาะ</th>
                      <th className="py-2.5 px-2 border border-slate-200 text-center w-12">จำนวน</th>
                      <th className="py-2.5 px-2 border border-slate-200 text-center w-12">หน่วย</th>
                      <th className="py-2.5 px-3 border border-slate-200 text-right hidden sm:table-cell w-20">ต่อหน่วย</th>
                      <th className="py-2.5 px-3 border border-slate-200 text-right w-24">จำนวนเงิน</th>
                      <th className="py-2.5 px-2 border border-slate-200 text-center hidden md:table-cell w-20">กลุ่มงาน</th>
                      <th className="py-2.5 px-2 border border-slate-200 text-center w-16">ตรวจรับ</th>
                      <th className="py-2.5 px-2 border border-slate-200 text-center print:hidden w-16">รูป</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.map((item) => (
                      <tr 
                        key={item.id} 
                        onClick={() => handleOpenItemDetails(item)}
                        className="hover:bg-slate-50/80 cursor-pointer transition-colors border-b border-slate-100 print:hover:bg-transparent print:border-slate-200"
                      >
                        <td className="py-2 px-2 border border-slate-200 text-center font-semibold text-slate-700">
                          {item.id}
                        </td>
                        <td className="py-2 px-3 border border-slate-200 font-bold text-slate-900 print:text-black text-[11px] leading-snug">
                          {item.name}
                          <span className="block sm:hidden text-[10px] font-normal text-slate-500 mt-1 line-clamp-2">
                            {item.spec || '-'}
                          </span>
                        </td>
                        <td className="py-2 px-3 border border-slate-200 text-slate-500 whitespace-pre-line leading-relaxed hidden sm:table-cell print:text-slate-700">
                          {item.spec || '-'}
                        </td>
                        <td className="py-2 px-2 border border-slate-200 text-center font-medium">
                          {item.qty}
                        </td>
                        <td className="py-2 px-2 border border-slate-200 text-center text-slate-500">
                          {item.unit}
                        </td>
                        <td className="py-2 px-3 border border-slate-200 text-right font-medium hidden sm:table-cell">
                          {formatNumber(item.unit_price)}
                        </td>
                        <td className="py-2 px-3 border border-slate-200 text-right font-bold text-slate-900 print:text-black">
                          {formatNumber(item.total_price)}
                        </td>
                        <td className="py-2 px-2 border border-slate-200 text-center text-slate-500 hidden md:table-cell">
                          {item.division}
                        </td>
                        <td className="py-2 px-2 border border-slate-200 text-center">
                          <span className={`inline-flex items-center gap-1 font-bold text-[10px] ${
                            item.inspectStatus === 'passed' ? 'text-emerald-600' : 'text-amber-500'
                          }`}>
                            {item.inspectStatus === 'passed' ? 'ผ่าน' : 'ตรวจอยู่'}
                          </span>
                        </td>
                        <td className="py-2 px-2 border border-slate-200 text-center print:hidden">
                          <span className={`px-1 py-0.5 rounded text-[8px] sm:text-[9px] font-bold ${
                            item.image ? 'bg-indigo-50 text-indigo-700' : 'bg-rose-50 text-rose-700'
                          }`}>
                            {item.image ? 'มีรูป' : 'ขาด'}
                          </span>
                        </td>
                      </tr>
                    ))}

                    {/* Totals Row */}
                    <tr className="bg-slate-50/50 font-bold border-t border-slate-300 print:bg-slate-100">
                      <td colSpan="3" className="py-3 px-3 text-right border border-slate-200 hidden sm:table-cell">รวมเงินทั้งสิ้น</td>
                      <td colSpan="2" className="py-3 px-3 text-right border border-slate-200 sm:hidden">รวมเงินทั้งสิ้น</td>
                      <td className="py-3 px-2 border border-slate-200 text-center font-bold">
                        {formatNumber(filteredItems.reduce((sum, item) => sum + item.qty, 0))}
                      </td>
                      <td className="py-3 px-2 border border-slate-200"></td>
                      <td className="py-3 px-3 border border-slate-200 text-right hidden sm:table-cell font-bold"></td>
                      <td className="py-3 px-3 text-right text-indigo-700 border border-slate-200 print:text-black">
                        {formatNumber(filteredItems.reduce((sum, item) => sum + item.total_price, 0))}
                      </td>
                      <td className="py-3 px-2 border border-slate-200 hidden md:table-cell"></td>
                      <td className="py-3 px-2 border border-slate-200"></td>
                      <td className="py-3 px-2 border border-slate-200 print:hidden"></td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Signatures displayed only when printing */}
              <div className="hidden print:block mt-14 text-[10px]">
                <div className="grid grid-cols-3 text-center gap-12">
                  <div className="space-y-12">
                    <p>ลงชื่อ..............................................................</p>
                    <div>
                      <p className="font-bold">{committee[0]?.name}</p>
                      <p className="text-slate-500">{committee[0]?.position}</p>
                    </div>
                  </div>
                  <div className="space-y-12">
                    <p>ลงชื่อ..............................................................</p>
                    <div>
                      <p className="font-bold">{committee[1]?.name}</p>
                      <p className="text-slate-500">{committee[1]?.position}</p>
                    </div>
                  </div>
                  <div className="space-y-12">
                    <p>ลงชื่อ..............................................................</p>
                    <div>
                      <p className="font-bold">{committee[2]?.name}</p>
                      <p className="text-slate-500">{committee[2]?.position}</p>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

      </main>

      {/* ==================================== */}
      {/* 4. ITEM DETAILS MODAL (RESPONSIVE)   */}
      {/* ==================================== */}
      {selectedItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in print:hidden">
          <div className="bg-white w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh] sm:max-h-[85vh]">
            
            {/* Modal Image Area */}
            <div className="w-full md:w-1/2 bg-slate-100 relative min-h-[200px] md:min-h-0 flex items-center justify-center shrink-0">
              {selectedItem.image ? (
                <img 
                  src={`/รูปภาพ/${selectedItem.image}`} 
                  alt={selectedItem.name} 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=500&auto=format&fit=crop";
                  }}
                />
              ) : (
                <div className="flex flex-col items-center gap-1.5 text-slate-400">
                  <AlertTriangle className="w-10 h-10 text-amber-500 animate-pulse" />
                  <span className="font-bold text-xs">ไม่มีรูปถ่ายสินค้าประกอบ</span>
                </div>
              )}
              {selectedItem.image && (
                <div className="absolute bottom-3 left-3 bg-slate-900/85 backdrop-blur-sm text-white px-2 py-0.5 rounded text-[10px] font-mono">
                  {selectedItem.image}
                </div>
              )}
            </div>

            {/* Modal Content Area */}
            <div className="w-full md:w-1/2 p-5 flex flex-col justify-between overflow-y-auto">
              
              {/* Header */}
              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                      {selectedItem.id}
                    </span>
                    <span className="text-[9px] font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                      {CATEGORY_NAMES[selectedItem.category] || selectedItem.category}
                    </span>
                  </div>
                  <button 
                    onClick={() => setSelectedItem(null)}
                    className="p-1 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">{selectedItem.name}</h3>
                <div className="grid grid-cols-2 gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-[11px]">
                  <div>
                    <span className="block text-slate-400 font-medium">จำนวนจัดซื้อ</span>
                    <span className="font-bold text-slate-900">{selectedItem.qty} {selectedItem.unit}</span>
                  </div>
                  <div>
                    <span className="block text-slate-400 font-medium">ราคารวมพัสดุ</span>
                    <span className="font-bold text-indigo-600">{formatNumber(selectedItem.total_price)} บาท</span>
                  </div>
                </div>
              </div>

              {/* Specifications */}
              <div className="my-3">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">รายละเอียดคุณลักษณะ</h4>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs text-slate-600 max-h-[120px] overflow-y-auto leading-relaxed whitespace-pre-line">
                  {selectedItem.spec || 'ไม่มีรายละเอียดคุณลักษณะเฉพาะ'}
                </div>
              </div>

              {/* Form Controls */}
              <div className="space-y-3 border-t border-slate-100 pt-3">
                
                {/* Inspection Status Toggle */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500">ผลการตรวจรับพัสดุ</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setItemInspectStatus('passed')}
                      className={`flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                        itemInspectStatus === 'passed'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      ผ่านการตรวจรับ
                    </button>
                    <button
                      onClick={() => setItemInspectStatus('pending')}
                      className={`flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                        itemInspectStatus === 'pending'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      กำลังตรวจสอบ
                    </button>
                  </div>
                </div>

                {/* Notes Input */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500">โน้ตช่วยจำ / ข้อสังเกต</label>
                  <textarea 
                    value={itemNotes}
                    onChange={(e) => setItemNotes(e.target.value)}
                    placeholder="ระบุข้อสังเกตการตรวจรับ..."
                    className="w-full bg-white border border-slate-200 p-2.5 rounded-lg text-xs focus:outline-none focus:border-indigo-500 h-14 resize-none"
                  />
                </div>

              </div>

              {/* Actions Footer */}
              <div className="flex gap-2 border-t border-slate-100 pt-3.5 mt-2">
                <button
                  onClick={() => setSelectedItem(null)}
                  className="w-1/2 py-2 border border-slate-200 text-slate-600 font-bold rounded-lg text-xs hover:bg-slate-50 transition-colors"
                >
                  ปิดหน้าต่าง
                </button>
                <button
                  onClick={handleSaveItemDetails}
                  className="w-1/2 py-2 bg-indigo-600 text-white font-bold rounded-lg text-xs hover:bg-indigo-700 shadow-md transition-colors"
                >
                  บันทึกข้อมูล
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ==================================== */}
      {/* 5. IMAGE PICKER DIALOG (RESPONSIVE)  */}
      {/* ==================================== */}
      {isImagePickerOpen && pickerTargetItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in print:hidden">
          <div className="bg-white w-full max-w-xl rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[80vh]">
            
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">เลือกรูปภาพสินค้า</h3>
                <p className="text-[10px] text-slate-500">เชื่อมโยงรูปภาพกับพัสดุ: <strong>{pickerTargetItem.name}</strong></p>
              </div>
              <button 
                onClick={() => {
                  setIsImagePickerOpen(false);
                  setPickerTargetItem(null);
                }}
                className="p-1 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Images Grid */}
            <div className="flex-1 p-4 overflow-y-auto">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                
                <button
                  onClick={() => handleSelectImageForItem('')}
                  className="border-2 border-dashed border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/20 rounded-xl p-3 flex flex-col items-center justify-center gap-1.5 transition-all text-slate-500"
                >
                  <X className="w-5 h-5 text-rose-500" />
                  <span className="text-[10px] font-bold">ลบรูปภาพ</span>
                </button>

                {availableImages.map((imageName, idx) => {
                  const isCurrentlyMapped = items.some(i => i.image === imageName);
                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelectImageForItem(imageName)}
                      className={`border-2 rounded-xl p-1.5 flex flex-col justify-between items-center transition-all hover:scale-[1.02] ${
                        pickerTargetItem.image === imageName
                          ? 'border-indigo-600 bg-indigo-50/10'
                          : isCurrentlyMapped
                            ? 'border-slate-200 opacity-60 hover:opacity-100'
                            : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="aspect-square bg-slate-100 rounded-lg overflow-hidden w-full flex items-center justify-center">
                        <img 
                          src={`/รูปภาพ/${imageName}`} 
                          alt={imageName} 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=100&auto=format&fit=crop";
                          }}
                        />
                      </div>
                      <div className="mt-1.5 w-full text-center">
                        <p className="text-[8px] font-mono truncate tracking-wider text-slate-500">{imageName}</p>
                        {isCurrentlyMapped && (
                          <span className="text-[7px] bg-slate-100 text-slate-400 px-1 py-0.5 rounded font-bold uppercase">
                            in use
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-3 border-t border-slate-100 flex justify-end bg-slate-50">
              <button
                onClick={() => {
                  setIsImagePickerOpen(false);
                  setPickerTargetItem(null);
                }}
                className="px-4 py-1.5 border border-slate-200 text-slate-600 font-bold rounded-lg text-xs hover:bg-slate-100 transition-colors"
              >
                ยกเลิก
              </button>
            </div>

          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="bg-slate-900 text-slate-400 py-6 border-t border-slate-800 print:hidden mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-[10px] sm:text-xs space-y-1">
          <p>© 2569 เทศบาลนครนครสวรรค์. ระบบบริหารและตรวจรับพัสดุ กองยุทธศาสตร์และงบประมาณ</p>
          <p className="text-slate-600">ออกแบบและพัฒนาระบบเพื่อรองรับการเปิดใช้งานผ่านโทรศัพท์มือถือ แท็บเล็ต และส่งออกรายงาน</p>
        </div>
      </footer>

    </div>
  );
}
