import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  PackageCheck,
  FileText,
  Settings,
  Share2,
  RotateCcw,
  Undo2,
  ShieldAlert,
  CheckCircle2,
  Menu,
  X,
  Layers,
  Upload,
  User,
  Plus,
  Trash2,
  Check,
  Building,
  Calendar,
  FileSpreadsheet,
  Cloud,
  CloudOff,
  CloudUpload,
  CloudDownload,
  RefreshCw,
  AlertTriangle,
  History,
  FolderKanban
} from 'lucide-react';
import { inspectionRepository } from './utils/inspectionRepository';
import { cloudSync } from './utils/cloudSync';

// Import initial dataset
import initialProcurementData from './data/procurementData.json';

// Import components
import Filters from './components/Filters';
import ItemCard from './components/ItemCard';
import ItemDetailModal from './components/ItemDetailModal';
import OfficialReport from './components/OfficialReport';
import ExcelImporter from './components/ExcelImporter';
import ShareModal from './components/ShareModal';
import ImageMappingManager from './components/ImageMappingManager';
import ResetConfirmModal from './components/ResetConfirmModal';
import ConfirmActionModal from './components/ConfirmActionModal';
import ProjectManager from './components/ProjectManager';

// Import utilities
import { parseUrlState, generateShareLink } from './utils/stateCompressor';
import { formatNumber } from './utils/numberFormatter';

const DEFAULT_COMMITTEE = [
  { name: 'นายณัฏฐวุฒิ จีนมหันต์', position: 'ประธานกรรมการตรวจรับ (นักวิชาการคอมพิวเตอร์ชำนาญการพิเศษ)' },
  { name: 'นายปฐมพงษ์ หล้ามหศักดิ์', position: 'กรรมการตรวจรับ (นักวิชาการคอมพิวเตอร์ปฏิบัติการ)' },
  { name: 'นายประชารักษ์ ประทุมโทน', position: 'กรรมการตรวจรับ (นักประชาสัมพันธ์ปฏิบัติการ)' }
];

const SYNC_VIEW = {
  idle: { label: 'กำลังเริ่มระบบซิงก์...', className: 'bg-slate-100 text-slate-600 border-slate-200', Icon: RefreshCw },
  connecting: { label: 'กำลังเชื่อมต่อคลาวด์...', className: 'bg-sky-50 text-sky-700 border-sky-200', Icon: RefreshCw },
  saving: { label: 'กำลังบันทึกขึ้นคลาวด์...', className: 'bg-amber-50 text-amber-700 border-amber-200', Icon: CloudUpload },
  synced: { label: 'ซิงก์ข้อมูลกับคลาวด์แล้ว', className: 'bg-emerald-50 text-emerald-700 border-emerald-200', Icon: Cloud },
  offline: { label: 'ออฟไลน์ — บันทึกไว้ในเครื่องก่อน', className: 'bg-slate-100 text-slate-600 border-slate-300', Icon: CloudOff },
  error: { label: 'ซิงก์คลาวด์ผิดพลาด', className: 'bg-rose-50 text-rose-700 border-rose-200', Icon: AlertTriangle }
};

const formatBackupTime = (iso) => {
  if (!iso) return 'ไม่ทราบเวลา';
  try {
    return new Date(iso).toLocaleString('th-TH', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  } catch {
    return iso;
  }
};

const formatSyncTime = (iso) => {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return null;
  }
};

export default function App() {
  const [activeTab, setActiveTab] = useState('inspection'); // 'inspection' | 'report' | 'settings' | 'projects'
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
  const [pageSize, setPageSize] = useState(12);

  // Selected item for detail modal
  const [selectedItem, setSelectedItem] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [toastAction, setToastAction] = useState(null);

  // Modals
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isImageMapperOpen, setIsImageMapperOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [hasResetBackup, setHasResetBackup] = useState(false);

  // Active project & template state
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [projectConfig, setProjectConfig] = useState(null);

  // Cloud sync state
  const [syncStatus, setSyncStatus] = useState('idle');
  const [lastSyncAt, setLastSyncAt] = useState(null);
  const [isSyncBusy, setIsSyncBusy] = useState(false);
  const [cloudBackups, setCloudBackups] = useState([]);

  // Operations that rewrite the item list for every device at once are gated behind
  // an explicit confirmation instead of happening the instant a file is dropped.
  const [pendingImport, setPendingImport] = useState(null);
  const [pendingRestore, setPendingRestore] = useState(null);

  // Remote committee updates must not yank the form out from under someone who is
  // mid-edit, so the listener reads the live editing flag through a ref.
  const isEditingCommitteeRef = useRef(false);
  useEffect(() => { isEditingCommitteeRef.current = isEditingCommittee; }, [isEditingCommittee]);

  // Boot Effect
  useEffect(() => {
    inspectionRepository.migrateToMultiProject();
    const pid = inspectionRepository.getActiveProjectId();
    setActiveProjectId(pid);
    setProjectConfig(inspectionRepository.getProjectConfig(pid));

    let currentCommittee = inspectionRepository.getCommittee(pid);
    let currentItems = inspectionRepository.getItems(initialProcurementData, pid);

    // Parse URL Hash state override
    const parsedState = parseUrlState(currentItems);
    if (parsedState) {
      if (parsedState.committee) currentCommittee = parsedState.committee;
      if (parsedState.items) currentItems = parsedState.items;

      if (parsedState.activeTab) {
        const tab = parsedState.activeTab === 'items' || parsedState.activeTab === 'dashboard' ? 'inspection' : parsedState.activeTab;
        setTimeout(() => setActiveTab(tab), 50);
      }
      if (parsedState.viewMode) setViewMode(parsedState.viewMode);
      if (parsedState.sortBy) setSortBy(parsedState.sortBy);
      if (parsedState.searchQuery) setSearchQuery(parsedState.searchQuery);
      if (parsedState.categoryFilter) setCategoryFilter(parsedState.categoryFilter);
      if (parsedState.divisionFilter) setDivisionFilter(parsedState.divisionFilter);
      if (parsedState.statusFilter) setStatusFilter(parsedState.statusFilter);
      if (parsedState.currentPage) setCurrentPage(parsedState.currentPage);
      if (parsedState.pageSize) setPageSize(parsedState.pageSize);
    }

    setCommittee(currentCommittee);
    setEditedCommittee(currentCommittee);
    setItems(currentItems);
    setHasResetBackup(inspectionRepository.hasResetBackup(pid));

    // Connect to this project's cloud workspace. Until the first server snapshot lands,
    // cloudSync ignores outgoing writes, so this device's (possibly stale) local copy
    // can never overwrite what other devices already saved.
    cloudSync.start({
      projectId: inspectionRepository.getCloudProjectId(pid),
      items: currentItems,
      committee: currentCommittee,
      config: inspectionRepository.getProjectConfig(pid),
      onItems: (remoteItems) => setItems(remoteItems),
      onMeta: ({ committee: remoteCommittee, config: remoteConfig }) => {
        if (Array.isArray(remoteCommittee) && remoteCommittee.length > 0) {
          setCommittee(remoteCommittee);
          if (!isEditingCommitteeRef.current) setEditedCommittee(remoteCommittee);
          inspectionRepository.saveCommittee(remoteCommittee, pid);
        }
        if (remoteConfig && typeof remoteConfig === 'object') {
          setProjectConfig(remoteConfig);
          inspectionRepository.saveProjectConfig(remoteConfig, pid);
        }
      },
      onStatus: (status, syncedAt) => {
        setSyncStatus(status);
        if (syncedAt) setLastSyncAt(syncedAt);
      },
      onNotice: (kind, count) => {
        if (kind === 'seeded') {
          showToast(`☁️ อัปโหลดข้อมูล ${count} รายการจากเครื่องนี้ขึ้นคลาวด์เป็นชุดตั้งต้นแล้ว`);
        } else if (kind === 'adopted') {
          showToast(`☁️ ดึงข้อมูลล่าสุดจากคลาวด์ ${count} รายการมาแสดงแล้ว (ข้อมูลเดิมในเครื่องถูกสำรองไว้)`);
        }
      },
      // A photo too large for one Firestore document (~1 MB) never got synced -- warn
      // instead of letting it silently vanish on the next reload/other device.
      onItemError: (item) => {
        showToast(`⚠️ รูปภาพของรายการ #${item?.id ?? '?'} มีขนาดใหญ่เกินไป ระบบไม่สามารถอัปโหลดขึ้นคลาวด์ได้ กรุณาถ่ายรูปใหม่หรือเลือกไฟล์ที่มีขนาดเล็กลงแล้วอัปโหลดอีกครั้ง`);
      }
    });
  }, []);

  const showToast = (msg, action = null) => {
    setToastMessage(msg);
    setToastAction(action);
    setTimeout(() => {
      setToastMessage(null);
      setToastAction(null);
    }, action ? 8000 : 4000);
  };

  // Cache changes to repository
  useEffect(() => {
    if (activeProjectId && items.length > 0) {
      inspectionRepository.saveItems(items, activeProjectId);
    }
  }, [items, activeProjectId]);

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, categoryFilter, divisionFilter, statusFilter, hasNotesFilter, hasImageFilter, minPrice, maxPrice, sortBy, pageSize]);

  // Statistics Calculations
  const stats = useMemo(() => {
    const totalItems = items.length;
    const passedCount = items.filter(i => i.inspectStatus === 'passed').length;
    const pendingCount = items.filter(i => i.inspectStatus === 'pending' || !i.inspectStatus).length;
    const failedCount = items.filter(i => i.inspectStatus === 'failed').length;

    let totalBudget = 0;
    let passedBudget = 0;

    items.forEach(i => {
      const cost = i.qty * i.unit_price;
      totalBudget += cost;
      if (i.inspectStatus === 'passed') {
        passedBudget += cost;
      }
    });

    return {
      totalItems,
      passedCount,
      pendingCount,
      failedCount,
      totalBudget,
      passedBudget,
      progressPercent: totalItems > 0 ? Math.round((passedCount / totalItems) * 100) : 0
    };
  }, [items]);

  // MAPPING_FIXES / auto-match is a verified table for the original 49-item project only.
  const isLegacyProject = useMemo(
    () => inspectionRepository.isLegacyProject(activeProjectId),
    [activeProjectId]
  );

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

  // Filtering & Sorting
  const filteredItems = useMemo(() => {
    const res = items.filter(item => {
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const matchesName = (item.name || '').toLowerCase().includes(query);
        const matchesSpec = (item.spec || '').toLowerCase().includes(query);
        const matchesDiv = (item.division || '').toLowerCase().includes(query);
        const matchesCat = (item.category || '').toLowerCase().includes(query);
        if (!matchesName && !matchesSpec && !matchesDiv && !matchesCat) return false;
      }

      if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;
      if (divisionFilter !== 'all') {
        let divClean = item.division || '';
        if (divClean === 'ปชส.' || divClean === 'ปชส. 3') divClean = 'ประชาสัมพันธ์';
        if (divClean !== divisionFilter) return false;
      }

      if (statusFilter !== 'all') {
        if (statusFilter === 'pending' && (!item.inspectStatus || item.inspectStatus === 'pending')) {
          // match pending
        } else if (item.inspectStatus !== statusFilter) {
          return false;
        }
      }

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
  }, [items, searchQuery, categoryFilter, divisionFilter, statusFilter, sortBy]);

  // Pagination
  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredItems.slice(startIndex, startIndex + pageSize);
  }, [filteredItems, currentPage, pageSize]);

  const totalPages = Math.max(Math.ceil(filteredItems.length / pageSize), 1);

  // Status Change Handler (Quick 1-Click)
  const handleQuickStatusChange = (itemId, newStatus) => {
    const updated = items.map(item => {
      if (item.id === itemId) {
        return { ...item, inspectStatus: newStatus };
      }
      return item;
    });
    setItems(updated);
    const label = newStatus === 'passed' ? '🟢 ผ่านการตรวจรับ' : newStatus === 'failed' ? '🔴 ไม่ผ่านเกณฑ์' : '🟡 อยู่ระหว่างตรวจ';
    showToast(`ปรับสถานะรายการที่ #${itemId} เป็น ${label}`);
  };

  const handleSaveItem = (updatedItem) => {
    const updatedItems = items.map(item => {
      if (item.id === updatedItem.id) return updatedItem;
      return item;
    });
    setItems(updatedItems);
    showToast(`📝 บันทึกผลการตรวจรับรายการที่ #${updatedItem.id} เรียบร้อย`);
  };

  // Switching or creating a project reloads the page rather than hot-swapping the
  // Firestore listeners mid-session -- simpler and safer for something that only
  // happens a few times a month, not a hot path worth the added complexity.
  const handleSwitchProject = (id) => {
    inspectionRepository.setActiveProjectId(id);
    window.location.reload();
  };

  const handleProjectCreated = () => {
    window.location.reload();
  };

  const handleSaveCommittee = () => {
    setCommittee(editedCommittee);
    inspectionRepository.saveCommittee(editedCommittee, activeProjectId);
    setIsEditingCommittee(false);
    showToast('💾 บันทึกรายชื่อคณะกรรมการเรียบร้อย');
  };

  const confirmResetDatabase = async () => {
    // Snapshot the shared workspace to the cloud first: a reset here wipes the record
    // on every device, not just this one.
    try {
      await cloudSync.backupWorkspace('ก่อนรีเซ็ตข้อมูลโครงการ');
    } catch (e) {
      console.error('Pre-reset cloud backup failed', e);
    }
    const ok = inspectionRepository.resetAll(activeProjectId);
    if (ok) {
      setItems(initialProcurementData);
      setIsResetConfirmOpen(false);
      setHasResetBackup(true);
      showToast('🔄 รีเซ็ตข้อมูลกลับเป็นค่าเริ่มต้นเรียบร้อย (กู้คืนได้ที่หน้าตั้งค่า)', {
        label: 'เลิกทำ (Undo)',
        onClick: handleUndoReset
      });
    }
  };

  const handleUndoReset = () => {
    const ok = inspectionRepository.undoLastReset(activeProjectId);
    if (!ok) return;
    setItems(inspectionRepository.getItems(initialProcurementData, activeProjectId));
    const restoredCommittee = inspectionRepository.getCommittee(activeProjectId);
    setCommittee(restoredCommittee);
    setEditedCommittee(restoredCommittee);
    setProjectConfig(inspectionRepository.getProjectConfig(activeProjectId));
    setHasResetBackup(false);
    setToastMessage(null);
    setToastAction(null);
    showToast('↩️ เรียกคืนข้อมูลก่อนการรีเซ็ตเรียบร้อยแล้ว');
  };

  // Recovery escape hatches for the rare case the two copies diverge (e.g. a device
  // that was edited while offline). Deliberately manual -- automatic merging of two
  // divergent inspection records is not something to guess at.
  const handleForcePushToCloud = async () => {
    setIsSyncBusy(true);
    try {
      await cloudSync.forcePush({
        items,
        committee,
        config: projectConfig || inspectionRepository.getProjectConfig(activeProjectId)
      });
      showToast('☁️ อัปโหลดข้อมูลจากเครื่องนี้ทับข้อมูลบนคลาวด์เรียบร้อยแล้ว');
    } catch (e) {
      console.error('Force push failed', e);
      showToast(`⚠️ อัปโหลดขึ้นคลาวด์ไม่สำเร็จ: ${e?.message || 'ไม่ทราบสาเหตุ'}`);
    } finally {
      setIsSyncBusy(false);
    }
  };

  const handleForcePullFromCloud = async () => {
    setIsSyncBusy(true);
    try {
      const remote = await cloudSync.forcePull();
      if (Array.isArray(remote.items)) {
        setItems(remote.items);
        inspectionRepository.saveItems(remote.items, activeProjectId);
      }
      if (Array.isArray(remote.committee) && remote.committee.length > 0) {
        setCommittee(remote.committee);
        setEditedCommittee(remote.committee);
        inspectionRepository.saveCommittee(remote.committee, activeProjectId);
      }
      if (remote.config) {
        setProjectConfig(remote.config);
        inspectionRepository.saveProjectConfig(remote.config, activeProjectId);
      }
      showToast(`☁️ ดึงข้อมูลล่าสุดจากคลาวด์ ${remote.items?.length || 0} รายการเรียบร้อยแล้ว`);
    } catch (e) {
      console.error('Force pull failed', e);
      showToast(`⚠️ ดึงข้อมูลจากคลาวด์ไม่สำเร็จ: ${e?.message || 'ไม่ทราบสาเหตุ'}`);
    } finally {
      setIsSyncBusy(false);
    }
  };

  const refreshCloudBackups = async () => {
    try {
      setCloudBackups(await cloudSync.listBackups());
    } catch (e) {
      console.error('Failed to list cloud backups', e);
    }
  };

  // Load the backup list whenever the settings tab is opened on a synced connection.
  useEffect(() => {
    if (activeTab === 'settings' && (syncStatus === 'synced' || syncStatus === 'saving')) {
      refreshCloudBackups();
    }
  }, [activeTab, syncStatus]);

  // An Excel import replaces the whole item list -- on every device at once. Never
  // apply it straight from the file drop; stage it and make the cost explicit first.
  const handleImportExcel = (newItems) => {
    if (items.length === 0) {
      applyImportedItems(newItems);
      return;
    }
    setPendingImport(newItems);
  };

  const applyImportedItems = async (newItems) => {
    setIsSyncBusy(true);
    try {
      await cloudSync.backupWorkspace(`ก่อนนำเข้า Excel (${newItems.length} รายการ)`);
    } catch (e) {
      console.error('Pre-import cloud backup failed', e);
    }
    setItems(newItems);
    inspectionRepository.saveItems(newItems, activeProjectId);
    setPendingImport(null);
    setIsSyncBusy(false);
    showToast(`🟢 นำเข้าพัสดุใหม่ ${newItems.length} รายการสำเร็จ (สำรองข้อมูลเดิมไว้บนคลาวด์แล้ว)`);
    setActiveTab('inspection');
    refreshCloudBackups();
  };

  const applyRestoreBackup = async (backup) => {
    setIsSyncBusy(true);
    try {
      const restored = await cloudSync.restoreBackup(backup.id);
      if (Array.isArray(restored.items)) {
        setItems(restored.items);
        inspectionRepository.saveItems(restored.items, activeProjectId);
      }
      if (Array.isArray(restored.committee) && restored.committee.length > 0) {
        setCommittee(restored.committee);
        setEditedCommittee(restored.committee);
        inspectionRepository.saveCommittee(restored.committee, activeProjectId);
      }
      showToast(`↩️ กู้คืนข้อมูลสำรอง ${restored.items?.length || 0} รายการเรียบร้อย (ทุกเครื่องจะอัปเดตทันที)`);
      refreshCloudBackups();
    } catch (e) {
      console.error('Restore failed', e);
      showToast(`⚠️ กู้คืนข้อมูลสำรองไม่สำเร็จ: ${e?.message || 'ไม่ทราบสาเหตุ'}`);
    } finally {
      setPendingRestore(null);
      setIsSyncBusy(false);
    }
  };

  const handleExportCSV = () => {
    let csv = "\uFEFFลำดับ,ชื่อรายการพัสดุ,จำนวน,หน่วยนับ,ราคาต่อหน่วย,ราคารวมเงิน,กลุ่มงาน,สถานะตรวจรับ,S/N,หมายเหตุ\n";
    items.forEach(item => {
      const statusText = item.inspectStatus === 'passed' ? 'ผ่าน' : item.inspectStatus === 'failed' ? 'ไม่ผ่าน' : 'อยู่ระหว่างตรวจ';
      csv += `${item.id},"${(item.name || '').replace(/"/g, '""')}",${item.qty},${item.unit},${item.unit_price},${item.qty * item.unit_price},"${item.division}","${statusText}","${item.serial_number || ''}","${(item.notes || '').replace(/\n/g, ' ')}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `procurement_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(items, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `procurement_data_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col lg:flex-row text-slate-900 font-sans">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl border border-slate-700 text-sm font-bold animate-fade-in flex items-center gap-3">
          <span>{toastMessage}</span>
          {toastAction && (
            <button
              onClick={() => {
                toastAction.onClick();
              }}
              className="shrink-0 px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-lg text-xs font-black cursor-pointer"
            >
              {toastAction.label}
            </button>
          )}
        </div>
      )}

      {/* 1. Sidebar Navigation (Left) */}
      <aside className="w-full lg:w-72 bg-slate-900 text-white flex flex-col shrink-0 border-r border-slate-800 print:hidden z-30">
        
        {/* Brand Header */}
        <div className="p-6 bg-slate-950 flex flex-row lg:flex-col items-center justify-between lg:justify-center text-center gap-4 border-b border-slate-800">
          <div className="flex items-center gap-3.5 lg:flex-col">
            <div className="w-12 h-12 lg:w-16 lg:h-16 rounded-2xl bg-white/10 flex items-center justify-center p-2 border border-slate-700 shadow">
              <img src="/logo.png" alt="Municipality Logo" className="w-full h-full object-contain" />
            </div>
            <div className="text-left lg:text-center space-y-1">
              <h1 className="text-sm lg:text-base font-bold text-white tracking-wide">เทศบาลนครนครสวรรค์</h1>
              <p className="text-xs text-amber-400 font-medium">ระบบตรวจรับพัสดุคอมพิวเตอร์</p>
            </div>
          </div>
          
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 text-slate-400 hover:text-white"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Core 3 Main Tabs Navigation */}
        <nav className={`p-4 space-y-2 lg:block ${isMobileMenuOpen ? 'block' : 'hidden'}`}>
          
          <button
            onClick={() => { setActiveTab('inspection'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'inspection' 
                ? 'bg-amber-400 text-slate-950 shadow-md font-black' 
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <PackageCheck className="w-5 h-5 shrink-0" />
            <span>📋 บันทึกตรวจรับพัสดุ</span>
          </button>
          
          <button
            onClick={() => { setActiveTab('report'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'report' 
                ? 'bg-amber-400 text-slate-950 shadow-md font-black' 
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <FileText className="w-5 h-5 shrink-0" />
            <span>📄 ออกรายงาน & พิมพ์ PDF</span>
          </button>

          <button
            onClick={() => { setActiveTab('settings'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'settings' 
                ? 'bg-amber-400 text-slate-950 shadow-md font-black' 
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Settings className="w-5 h-5 shrink-0" />
            <span>⚙️ ตั้งค่าโครงการ & กรรมการ</span>
          </button>

          <button
            onClick={() => { setActiveTab('projects'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'projects'
                ? 'bg-amber-400 text-slate-950 shadow-md font-black'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <FolderKanban className="w-5 h-5 shrink-0" />
            <span className="truncate">🗂️ {projectConfig?.projectTitle || 'จัดการโครงการ (Portal)'}</span>
          </button>

        </nav>

        {/* Quick Tools & Share */}
        <div className={`p-4 mt-auto bg-slate-950/40 border-t border-slate-800 space-y-3 lg:block ${isMobileMenuOpen ? 'block' : 'hidden'}`}>
          <button
            onClick={() => { setIsImageMapperOpen(true); setIsMobileMenuOpen(false); }}
            className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isLegacyProject ? 'จับคู่รูปภาพอัตโนมัติ (49 ภาพ)' : 'จัดการรูปภาพพัสดุ'}</span>
          </button>

          <button
            onClick={() => setIsShareModalOpen(true)}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold cursor-pointer"
          >
            <Share2 className="w-4 h-4 text-amber-400" />
            <span>แชร์ลิงก์</span>
          </button>
        </div>

      </aside>

      {/* 2. Main Work Area */}
      <main className="flex-1 flex flex-col min-w-0">
        
        {/* Top App Header */}
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex flex-wrap items-center justify-between gap-4 print:hidden">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {activeTab === 'inspection' && '📋 ระบบบันทึกการตรวจรับพัสดุคอมพิวเตอร์'}
              {activeTab === 'report' && '📄 ระบบออกรายงานสรุปพร้อมรูปภาพหลักฐานการตรวจรับ'}
              {activeTab === 'settings' && '⚙️ ตั้งค่าข้อมูลโครงการ คณะกรรมการ และการนำเข้าพัสดุ'}
              {activeTab === 'projects' && '🗂️ Portal งานตรวจรับ — สลับ/สร้าง/โคลนโครงการ'}
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              คำสั่งเทศบาลนครนครสวรรค์ ที่ ๘๖๔/๒๕๖๙ (งบประมาณ พ.ศ. 2569)
            </p>
          </div>

          {/* Cloud Sync Status */}
          {(() => {
            const view = SYNC_VIEW[syncStatus] || SYNC_VIEW.idle;
            const SyncIcon = view.Icon;
            const time = formatSyncTime(lastSyncAt);
            return (
              <div
                className={`flex items-center gap-2 px-3 py-2 rounded-2xl border text-xs font-bold ${view.className}`}
                title={time ? `ซิงก์ล่าสุดเมื่อ ${time} น.` : 'ยังไม่มีการซิงก์'}
              >
                <SyncIcon className={`w-4 h-4 shrink-0 ${syncStatus === 'connecting' || syncStatus === 'idle' ? 'animate-spin' : ''}`} />
                <span>{view.label}</span>
                {time && syncStatus === 'synced' && <span className="font-medium opacity-70">({time} น.)</span>}
              </div>
            );
          })()}

          {/* Quick Progress Indicator */}
          <div className="flex items-center gap-6 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-200">
            <div className="text-center">
              <span className="text-xs text-slate-500 font-medium block">ผ่านการตรวจรับ</span>
              <span className="text-sm font-black text-emerald-700">{stats.passedCount} / {stats.totalItems} รายการ</span>
            </div>
            <div className="h-8 w-px bg-slate-200"></div>
            <div className="text-center">
              <span className="text-xs text-slate-500 font-medium block">งบประมาณรวม</span>
              <span className="text-sm font-black text-slate-900 num-tabular">{formatNumber(stats.totalBudget)} บาท</span>
            </div>
          </div>
        </header>

        {/* Dynamic View Tab Body */}
        <div className="flex-1 p-6 overflow-y-auto print:p-0 print:overflow-visible">
          
          {/* TAB 1: INSPECTION LIST */}
          {activeTab === 'inspection' && (
            <div className="space-y-6 max-w-7xl mx-auto">
              
              {/* Filter Component */}
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
                  setSortBy('id-asc');
                }}
                categories={categories}
                divisions={divisions}
                sortBy={sortBy}
                setSortBy={setSortBy}
                viewMode={viewMode}
                setViewMode={setViewMode}
              />

              {/* Items Counter Bar */}
              <div className="flex items-center justify-between text-sm font-bold text-slate-700 bg-white p-4 rounded-xl border border-slate-200">
                <div>
                  ค้นพบพัสดุ <span className="text-slate-900 font-black">{filteredItems.length}</span> รายการ
                </div>
                <div className="flex items-center gap-2">
                  <span>แสดงหน้าละ:</span>
                  <select 
                    value={pageSize}
                    onChange={(e) => setPageSize(Number(e.target.value))}
                    className="bg-slate-50 border border-slate-300 px-3 py-1 rounded-lg text-sm font-bold text-slate-900 focus:outline-none"
                  >
                    <option value={6}>6 รายการ</option>
                    <option value={12}>12 รายการ</option>
                    <option value={24}>24 รายการ</option>
                    <option value={49}>49 รายการทั้งหมด</option>
                  </select>
                </div>
              </div>

              {/* Item Cards Grid */}
              {filteredItems.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {paginatedItems.map(item => (
                    <ItemCard 
                      key={item.id} 
                      item={item} 
                      onClick={() => setSelectedItem(item)}
                      onStatusChange={handleQuickStatusChange}
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 space-y-3">
                  <p className="text-slate-600 font-bold text-base">ไม่พบรายการพัสดุที่ตรงกับเงื่อนไขการค้นหา</p>
                  <button 
                    onClick={() => {
                      setSearchQuery('');
                      setCategoryFilter('all');
                      setDivisionFilter('all');
                      setStatusFilter('all');
                    }}
                    className="text-sm font-bold text-slate-900 hover:underline"
                  >
                    ล้างตัวกรองเพื่อแสดงพัสดุทั้งหมด
                  </button>
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-4">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-10 h-10 rounded-xl font-bold text-sm transition-colors ${
                        currentPage === page
                          ? 'bg-slate-900 text-white'
                          : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
              )}

            </div>
          )}

          {/* TAB 2: OFFICIAL REPORT */}
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
              handleExportExcel={handleExportCSV}
              handleExportCSV={handleExportCSV}
              handleExportJSON={handleExportJSON}
              divisions={divisions}
            />
          )}

          {/* TAB 3: SETTINGS & COMMITTEE */}
          {activeTab === 'settings' && (
            <div className="max-w-4xl mx-auto space-y-8">
              
              {/* Committee Management Card */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-6">
                <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                  <div className="flex items-center gap-2">
                    <User className="w-5 h-5 text-slate-700" />
                    <h3 className="text-lg font-bold text-slate-900">รายชื่อคณะกรรมการตรวจรับพัสดุ</h3>
                  </div>
                  {!isEditingCommittee ? (
                    <button
                      onClick={() => setIsEditingCommittee(true)}
                      className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors"
                    >
                      แก้ไขรายชื่อกรรมการ
                    </button>
                  ) : (
                    <button
                      onClick={handleSaveCommittee}
                      className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-500 transition-colors flex items-center gap-1.5"
                    >
                      <Check className="w-4 h-4" />
                      บันทึกรายชื่อ
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                  {editedCommittee.map((member, idx) => (
                    <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                      <span className="text-xs font-bold text-slate-500 block">กรรมการลำดับที่ {idx + 1}</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-bold text-slate-700 block mb-1">ชื่อ-นามสกุล:</label>
                          <input 
                            type="text"
                            disabled={!isEditingCommittee}
                            value={member.name}
                            onChange={(e) => {
                              const updated = [...editedCommittee];
                              updated[idx].name = e.target.value;
                              setEditedCommittee(updated);
                            }}
                            className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm font-medium text-slate-900 disabled:opacity-70"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-700 block mb-1">ตำแหน่งในกรรมการ:</label>
                          <input 
                            type="text"
                            disabled={!isEditingCommittee}
                            value={member.position}
                            onChange={(e) => {
                              const updated = [...editedCommittee];
                              updated[idx].position = e.target.value;
                              setEditedCommittee(updated);
                            }}
                            className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm font-medium text-slate-900 disabled:opacity-70"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Image Mapper & Excel Importer Tools */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Upload className="w-5 h-5 text-slate-700" />
                  เครื่องมือจัดการพัสดุและรูปภาพ
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <button
                    onClick={() => setIsImageMapperOpen(true)}
                    className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-left hover:bg-emerald-100 transition-colors cursor-pointer space-y-2"
                  >
                    <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                    <h4 className="font-bold text-base text-emerald-950">เปิดระบบจัดจับคู่รูปภาพอัตโนมัติ</h4>
                    <p className="text-xs text-emerald-800 leading-relaxed font-normal">
                      {isLegacyProject
                        ? 'ตรวจทานการจับคู่รูปภาพพัสดุจริง 49 รายการ และจัดสรรอัตโนมัติให้ตรงกับสเปก'
                        : 'ตรวจทานรูปภาพพัสดุของโครงการนี้ ค้นหา ทำเครื่องหมายรายการที่ไม่มีรูป และส่งออกข้อมูลรูปภาพ'}
                    </p>
                  </button>

                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-2">
                    <FileSpreadsheet className="w-6 h-6 text-slate-700" />
                    <h4 className="font-bold text-base text-slate-900">นำเข้าสเปกพัสดุจากไฟล์ Excel</h4>
                    <ExcelImporter onImport={handleImportExcel} />
                  </div>
                </div>
              </div>

              {/* Cloud Sync Card */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                  <div className="flex items-center gap-2">
                    <Cloud className="w-5 h-5 text-slate-700" />
                    <h3 className="text-lg font-bold text-slate-900">การซิงก์ข้อมูลข้ามเครื่อง (Cloud Sync)</h3>
                  </div>
                  {(() => {
                    const view = SYNC_VIEW[syncStatus] || SYNC_VIEW.idle;
                    return (
                      <span className={`px-3 py-1.5 rounded-xl border text-xs font-bold ${view.className}`}>
                        {view.label}
                      </span>
                    );
                  })()}
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  ข้อมูลการตรวจรับทั้งหมดถูกบันทึกไว้บนฐานข้อมูลกลาง (Cloud Firestore) และซิงก์อัตโนมัติแบบเรียลไทม์
                  ทุกเครื่องที่เปิดลิงก์เดียวกันจะเห็นข้อมูลชุดเดียวกันทันที หากออฟไลน์ ระบบจะบันทึกในเครื่องไว้ก่อนแล้วส่งขึ้นคลาวด์ให้เมื่อกลับมาออนไลน์
                  {lastSyncAt && <> — ซิงก์ล่าสุดเมื่อเวลา <span className="font-bold">{formatSyncTime(lastSyncAt)} น.</span></>}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <button
                    onClick={handleForcePushToCloud}
                    disabled={isSyncBusy || syncStatus === 'offline'}
                    className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <CloudUpload className="w-6 h-6 text-slate-700 shrink-0" />
                    <span>
                      <span className="block font-bold text-sm text-slate-900">อัปโหลดข้อมูลเครื่องนี้ทับคลาวด์</span>
                      <span className="block text-xs text-slate-600 mt-0.5">ใช้เมื่อเครื่องนี้มีข้อมูลที่ถูกต้องล่าสุด</span>
                    </span>
                  </button>

                  <button
                    onClick={handleForcePullFromCloud}
                    disabled={isSyncBusy}
                    className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <CloudDownload className="w-6 h-6 text-slate-700 shrink-0" />
                    <span>
                      <span className="block font-bold text-sm text-slate-900">ดึงข้อมูลล่าสุดจากคลาวด์</span>
                      <span className="block text-xs text-slate-600 mt-0.5">ใช้เมื่อสงสัยว่าหน้าจอนี้แสดงข้อมูลเก่า</span>
                    </span>
                  </button>
                </div>
              </div>

              {/* Cloud Backup & Restore */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                  <div className="flex items-center gap-2">
                    <History className="w-5 h-5 text-slate-700" />
                    <h3 className="text-lg font-bold text-slate-900">ข้อมูลสำรองบนคลาวด์ (กู้คืนย้อนหลังได้)</h3>
                  </div>
                  <button
                    onClick={refreshCloudBackups}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition-colors cursor-pointer"
                  >
                    รีเฟรชรายการ
                  </button>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  ระบบจะสำรองข้อมูลทั้งชุดขึ้นคลาวด์ให้อัตโนมัติ<span className="font-bold">ก่อน</span>ทุกครั้งที่มีการนำเข้า Excel ใหม่ รีเซ็ตข้อมูล หรืออัปโหลดทับ
                  จึงกู้คืนได้จากทุกเครื่อง แม้คนที่ทำข้อมูลหายจะใช้อีกเครื่องหนึ่งก็ตาม (เก็บย้อนหลัง 10 ชุดล่าสุด)
                </p>

                {cloudBackups.length === 0 ? (
                  <p className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-xl p-4">
                    ยังไม่มีข้อมูลสำรอง — ระบบจะสร้างให้เองอัตโนมัติเมื่อมีการดำเนินการที่เสี่ยงต่อข้อมูลเดิม
                  </p>
                ) : (
                  <div className="space-y-2">
                    {cloudBackups.map(backup => (
                      <div key={backup.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-900 truncate">{backup.label}</p>
                          <p className="text-xs text-slate-500">
                            {formatBackupTime(backup.createdAtIso)} — {backup.itemCount} รายการ
                          </p>
                        </div>
                        <button
                          onClick={() => setPendingRestore(backup)}
                          disabled={isSyncBusy}
                          className="shrink-0 flex items-center gap-1.5 px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-900 hover:text-white hover:border-slate-900 text-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                        >
                          <Undo2 className="w-4 h-4" />
                          กู้คืนชุดนี้
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Danger Zone: Reset */}
              <div className="bg-rose-50/60 p-6 rounded-2xl border-2 border-rose-200 space-y-4">
                <h3 className="text-lg font-bold text-rose-800 flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-rose-600" />
                  โซนอันตราย
                </h3>

                {hasResetBackup && (
                  <div className="p-4 bg-white rounded-xl border border-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-slate-900">มีข้อมูลก่อนการรีเซ็ตล่าสุดที่ยังกู้คืนได้</p>
                      <p className="text-xs text-slate-500">กู้คืนได้ 1 ครั้ง — หากรีเซ็ตซ้ำอีก ข้อมูลชุดนี้จะถูกเขียนทับ</p>
                    </div>
                    <button
                      onClick={handleUndoReset}
                      className="shrink-0 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl text-xs font-black transition-colors cursor-pointer"
                    >
                      <Undo2 className="w-4 h-4" />
                      กู้คืนข้อมูลก่อนรีเซ็ต
                    </button>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <p className="text-xs text-rose-700 leading-relaxed max-w-md">
                    รีเซ็ตรายการตรวจรับ รูปภาพหลักฐาน และรายชื่อคณะกรรมการของโครงการนี้กลับเป็นค่าเริ่มต้นทั้งหมด
                    ต้องพิมพ์ชื่อโครงการยืนยันก่อนจึงจะรีเซ็ตได้
                  </p>
                  <button
                    onClick={() => setIsResetConfirmOpen(true)}
                    className="shrink-0 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white border-2 border-rose-300 hover:bg-rose-600 hover:border-rose-600 hover:text-white text-rose-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    รีเซ็ตข้อมูลโครงการนี้
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* TAB 4: PROJECT PORTAL */}
          {activeTab === 'projects' && (
            <div className="max-w-6xl mx-auto">
              <ProjectManager
                activeProjectId={activeProjectId}
                onSwitchProject={handleSwitchProject}
                onProjectCreated={handleProjectCreated}
              />
            </div>
          )}

        </div>

      </main>

      {/* Modals */}
      {selectedItem && (
        <ItemDetailModal 
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onSave={handleSaveItem}
        />
      )}

      {isImageMapperOpen && (
        <ImageMappingManager
          items={items}
          isLegacyProject={isLegacyProject}
          onClose={() => setIsImageMapperOpen(false)}
          onSaveAll={(updatedData) => {
            setItems(updatedData);
            inspectionRepository.saveItems(updatedData, activeProjectId);
            showToast('💾 จับคู่และบันทึกรูปภาพครบถ้วน 49 รายการแล้ว');
          }}
        />
      )}

      {isShareModalOpen && (
        <ShareModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          generateLink={() => generateShareLink(committee, items, {}, { id: activeProjectId })}
        />
      )}

      {pendingImport && (
        <ConfirmActionModal
          title="ยืนยันการนำเข้ารายการพัสดุชุดใหม่"
          message={`ไฟล์นี้จะแทนที่รายการพัสดุเดิมทั้งหมด ${items.length} รายการ ด้วยรายการใหม่ ${pendingImport.length} รายการ`}
          detail="⚠️ ข้อมูลนี้ใช้ร่วมกันทุกเครื่อง — ผลการตรวจรับ รูปภาพหลักฐาน และหมายเหตุของรายการเดิมจะหายไปจากหน้าจอของกรรมการทุกท่านพร้อมกัน ระบบจะสำรองข้อมูลชุดเดิมขึ้นคลาวด์ให้ก่อนโดยอัตโนมัติ และกู้คืนได้ที่หัวข้อ 'ข้อมูลสำรองบนคลาวด์' ในหน้าตั้งค่า"
          confirmLabel={`นำเข้าทับ ${pendingImport.length} รายการ`}
          tone="danger"
          isBusy={isSyncBusy}
          onConfirm={() => applyImportedItems(pendingImport)}
          onClose={() => setPendingImport(null)}
        />
      )}

      {pendingRestore && (
        <ConfirmActionModal
          title="ยืนยันการกู้คืนข้อมูลสำรอง"
          message={`กู้คืนข้อมูลชุด "${pendingRestore.label}" (${pendingRestore.itemCount} รายการ) เมื่อ ${formatBackupTime(pendingRestore.createdAtIso)}`}
          detail="ข้อมูลปัจจุบันจะถูกสำรองไว้อีกชุดหนึ่งก่อนกู้คืน จึงย้อนกลับมาได้เสมอ — และเมื่อกู้คืนแล้ว หน้าจอของทุกเครื่องจะอัปเดตตามทันที"
          confirmLabel="กู้คืนข้อมูลชุดนี้"
          isBusy={isSyncBusy}
          onConfirm={() => applyRestoreBackup(pendingRestore)}
          onClose={() => setPendingRestore(null)}
        />
      )}

      {isResetConfirmOpen && (
        <ResetConfirmModal
          projectName={projectConfig?.projectTitle || ''}
          onClose={() => setIsResetConfirmOpen(false)}
          onConfirm={confirmResetDatabase}
        />
      )}

    </div>
  );
}
