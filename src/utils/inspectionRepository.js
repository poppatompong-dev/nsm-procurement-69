import defaultTemplates from '../data/inspectionTemplates.json';
import initialProcurementData from '../data/procurementData.json';

const STORAGE_KEYS = {
  ITEMS: 'procurement_items_v4',
  COMMITTEE: 'procurement_committee_v4',
  CONFIG: 'procurement_config_v4',
  TEMPLATES: 'procurement_custom_templates_v4',
  REGISTRY: 'procurement_projects_registry_v1'
};

const DEFAULT_COMMITTEE = [
  { name: 'นายณัฏฐวุฒิ จีนมหันต์', position: 'ประธานกรรมการตรวจรับ (นักวิชาการคอมพิวเตอร์ชำนาญการพิเศษ)' },
  { name: 'นายปฐมพงษ์ หล้ามหศักดิ์', position: 'กรรมการตรวจรับ (นักวิชาการคอมพิวเตอร์ปฏิบัติการ)' },
  { name: 'นายประชารักษ์ ประทุมโทน', position: 'กรรมการตรวจรับ (นักประชาสัมพันธ์ปฏิบัติการ)' }
];

const DEFAULT_PROJECT_CONFIG = {
  templateId: 'it-computer',
  projectTitle: 'ระบบตรวจรับครุภัณฑ์คอมพิวเตอร์อัจฉริยะ',
  inspectionRound: 1,
  workflowState: 'inspecting'
};

export const MAPPING_FIXES = {
  1: "87202_0.jpg",
  2: "87201_0.jpg",
  3: "87200_0.jpg",
  4: "87199_0.jpg",
  5: "87198_0.jpg",
  6: "87196_0.jpg",
  7: "87195_0.jpg",
  8: "87194_0.jpg",
  9: "87193_0.jpg",
  10: "87192_0.jpg",
  11: "87191_0.jpg",
  12: "87190_0.jpg",
  13: "87189_0.jpg",
  14: "87188_0.jpg",
  15: "87187_0.jpg",
  16: "87200_0.jpg",
  17: "87186_0.jpg",
  18: "87185_0.jpg",
  19: "87183_0.jpg",
  20: "87184_0.jpg",
  21: "87182_0.jpg",
  22: "87181_0.jpg",
  23: "87180_0.jpg",
  24: "87179_0.jpg",
  25: "87178_0.jpg",
  26: "87177_0.jpg",
  27: "87176_0.jpg",
  28: "87175_0.jpg",
  29: "87174_0.jpg",
  30: "87173_0.jpg",
  31: "87172_0.jpg",
  32: "87171_0.jpg",
  33: "87170_0.jpg",
  34: "87169_0.jpg",
  35: "87168_0.jpg",
  36: "87167_0.jpg",
  37: "87166_0.jpg",
  38: "87165_0.jpg",
  39: "87164_0.jpg",
  40: "87163_0.jpg",
  41: "87163_0.jpg",
  42: "87165_0.jpg",
  43: "8854E90E-F50F-4925-B7F3-58786B02BFEB.jpg",
  44: "87161_0.jpg",
  45: "87162_0.jpg",
  46: "336724_0.jpg",
  47: "336724_0.jpg",
  48: "336724_0.jpg",
  49: "87203_0.jpg"
};

// Per-project storage keys are namespaced off the existing v4 keys so a single project's
// data shape stays identical to before -- only the wrapper (which project it belongs to) is new.
const projectItemsKey = (id) => `${STORAGE_KEYS.ITEMS}__${id}`;
const projectCommitteeKey = (id) => `${STORAGE_KEYS.COMMITTEE}__${id}`;
const projectConfigKey = (id) => `${STORAGE_KEYS.CONFIG}__${id}`;
const projectEventsKey = (id) => `procurement_events_v1__${id}`;
const projectActorKey = (id) => `procurement_actor_v1__${id}`;
const projectResetBackupKey = (id) => `procurement_reset_backup_v1__${id}`;

const generateProjectId = () => `proj_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

const readRegistry = () => {
  try {
    const json = localStorage.getItem(STORAGE_KEYS.REGISTRY);
    if (json) return JSON.parse(json);
  } catch (e) {
    console.error('Failed to parse projects registry', e);
  }
  return null;
};

const writeRegistry = (registry) => {
  try {
    localStorage.setItem(STORAGE_KEYS.REGISTRY, JSON.stringify(registry));
    return true;
  } catch (e) {
    console.error('Failed to save projects registry', e);
    return false;
  }
};

export const inspectionRepository = {
  /**
   * Get all available templates (both default and custom saved ones)
   */
  getTemplates: () => {
    try {
      const customTemplatesJson = localStorage.getItem(STORAGE_KEYS.TEMPLATES);
      const customTemplates = customTemplatesJson ? JSON.parse(customTemplatesJson) : [];
      return [...defaultTemplates.templates, ...customTemplates];
    } catch (e) {
      console.error('Failed to load templates from localStorage, falling back to defaults', e);
      return defaultTemplates.templates;
    }
  },

  /**
   * Get template configuration by ID
   */
  getTemplateById: (id) => {
    const templates = inspectionRepository.getTemplates();
    return templates.find(t => t.id === id) || templates[0];
  },

  /**
   * Add a new custom template
   */
  saveCustomTemplate: (template) => {
    try {
      const customTemplatesJson = localStorage.getItem(STORAGE_KEYS.TEMPLATES);
      const customTemplates = customTemplatesJson ? JSON.parse(customTemplatesJson) : [];

      // Prevent duplicates, update existing one if same id
      const filtered = customTemplates.filter(t => t.id !== template.id);
      const updated = [...filtered, template];

      localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(updated));
      return true;
    } catch (e) {
      console.error('Failed to save custom template', e);
      return false;
    }
  },

  /**
   * One-time, idempotent upgrade from the single-global-dataset schema (v4) to the
   * multi-project registry (v1). Only ever READS the legacy v4 keys and WRITES new
   * namespaced keys + the registry -- the legacy keys are never deleted, so existing
   * production data always stays manually recoverable even if this has a bug.
   * No-op if a registry already exists.
   */
  migrateToMultiProject: () => {
    if (localStorage.getItem(STORAGE_KEYS.REGISTRY)) return false;

    try {
      let items = initialProcurementData;
      let committee = DEFAULT_COMMITTEE;
      let config = DEFAULT_PROJECT_CONFIG;

      const legacyItemsJson = localStorage.getItem(STORAGE_KEYS.ITEMS);
      if (legacyItemsJson) {
        try { items = JSON.parse(legacyItemsJson); } catch (e) { console.error('Failed to parse legacy items during migration', e); }
      }
      const legacyCommitteeJson = localStorage.getItem(STORAGE_KEYS.COMMITTEE);
      if (legacyCommitteeJson) {
        try { committee = JSON.parse(legacyCommitteeJson); } catch (e) { console.error('Failed to parse legacy committee during migration', e); }
      }
      const legacyConfigJson = localStorage.getItem(STORAGE_KEYS.CONFIG);
      if (legacyConfigJson) {
        try { config = JSON.parse(legacyConfigJson); } catch (e) { console.error('Failed to parse legacy config during migration', e); }
      }

      const id = generateProjectId();
      const now = new Date().toISOString();

      localStorage.setItem(projectItemsKey(id), JSON.stringify(items));
      localStorage.setItem(projectCommitteeKey(id), JSON.stringify(committee));
      localStorage.setItem(projectConfigKey(id), JSON.stringify(config));

      // isLegacyDefault marks the one project that owns the real seed data, so a
      // "reset to factory settings" here reseeds procurementData.json, while any other
      // (new/cloned) project resets to an empty item list instead.
      const meta = {
        id,
        name: config.projectTitle || 'โครงการตรวจรับพัสดุ',
        contractNumber: '',
        vendor: '',
        budgetYear: '',
        inspectionRound: config.inspectionRound || 1,
        templateId: config.templateId || 'it-computer',
        isLegacyDefault: true,
        createdAt: now,
        updatedAt: now
      };

      return writeRegistry({ version: 1, activeProjectId: id, projects: [meta] });
    } catch (e) {
      console.error('Failed to migrate to multi-project schema', e);
      return false;
    }
  },

  listProjects: () => {
    const registry = readRegistry();
    return registry ? registry.projects : [];
  },

  getProjectMeta: (id) => {
    const registry = readRegistry();
    if (!registry) return null;
    return registry.projects.find(p => p.id === id) || null;
  },

  getActiveProjectId: () => {
    const registry = readRegistry();
    return registry ? registry.activeProjectId : null;
  },

  setActiveProjectId: (id) => {
    const registry = readRegistry();
    if (!registry || !registry.projects.some(p => p.id === id)) return false;
    registry.activeProjectId = id;
    return writeRegistry(registry);
  },

  createProject: ({ name, contractNumber = '', vendor = '', budgetYear = '', inspectionRound = 1, templateId = 'it-computer', activate = true }) => {
    const registry = readRegistry();
    if (!registry) return null;

    const id = generateProjectId();
    const now = new Date().toISOString();
    const config = { templateId, projectTitle: name, inspectionRound, workflowState: 'inspecting' };

    localStorage.setItem(projectItemsKey(id), JSON.stringify([]));
    localStorage.setItem(projectCommitteeKey(id), JSON.stringify(DEFAULT_COMMITTEE));
    localStorage.setItem(projectConfigKey(id), JSON.stringify(config));

    const meta = { id, name, contractNumber, vendor, budgetYear, inspectionRound, templateId, isLegacyDefault: false, createdAt: now, updatedAt: now };
    registry.projects.push(meta);
    if (activate) registry.activeProjectId = id;
    writeRegistry(registry);
    inspectionRepository.logProjectEvent(id, { type: 'create', message: `สร้างโครงการใหม่ "${name}"` });

    return meta;
  },

  /**
   * Clone an existing project's template + committee into a brand-new project.
   * Item data is intentionally NOT copied -- the new project starts empty so the
   * next step is importing a fresh Excel sheet for the new inspection round.
   */
  cloneProject: (sourceId, { name, contractNumber = '', vendor = '', budgetYear = '', inspectionRound = 1, activate = true }) => {
    const registry = readRegistry();
    if (!registry) return null;
    const source = registry.projects.find(p => p.id === sourceId);
    if (!source) return null;

    const id = generateProjectId();
    const now = new Date().toISOString();
    const sourceCommittee = inspectionRepository.getCommittee(sourceId);
    const config = { templateId: source.templateId, projectTitle: name, inspectionRound, workflowState: 'inspecting' };

    localStorage.setItem(projectItemsKey(id), JSON.stringify([]));
    localStorage.setItem(projectCommitteeKey(id), JSON.stringify(sourceCommittee));
    localStorage.setItem(projectConfigKey(id), JSON.stringify(config));

    const meta = { id, name, contractNumber, vendor, budgetYear, inspectionRound, templateId: source.templateId, isLegacyDefault: false, createdAt: now, updatedAt: now };
    registry.projects.push(meta);
    if (activate) registry.activeProjectId = id;
    writeRegistry(registry);
    inspectionRepository.logProjectEvent(id, { type: 'clone', message: `โคลนโครงการ "${name}" มาจาก "${source.name}"` });

    return meta;
  },

  renameProject: (id, patch) => {
    const registry = readRegistry();
    if (!registry) return false;
    const idx = registry.projects.findIndex(p => p.id === id);
    if (idx === -1) return false;

    registry.projects[idx] = { ...registry.projects[idx], ...patch, updatedAt: new Date().toISOString() };
    writeRegistry(registry);

    // Mirror the fields that self-fetching components (ItemDetailModal, OfficialReport,
    // InsightEngine, ExcelImporter) read from the per-project config, so they stay in sync.
    const config = inspectionRepository.getProjectConfig(id);
    localStorage.setItem(projectConfigKey(id), JSON.stringify({
      ...config,
      projectTitle: registry.projects[idx].name,
      templateId: registry.projects[idx].templateId,
      inspectionRound: registry.projects[idx].inspectionRound
    }));

    return true;
  },

  deleteProject: (id) => {
    const registry = readRegistry();
    if (!registry) return { success: false };
    if (registry.projects.length <= 1) return { success: false, reason: 'last-project' };

    const remaining = registry.projects.filter(p => p.id !== id);
    const newActiveProjectId = registry.activeProjectId === id ? remaining[0].id : registry.activeProjectId;

    const deletedName = registry.projects.find(p => p.id === id)?.name || id;
    localStorage.removeItem(projectItemsKey(id));
    localStorage.removeItem(projectCommitteeKey(id));
    localStorage.removeItem(projectConfigKey(id));
    localStorage.removeItem(projectEventsKey(id));
    localStorage.removeItem(projectActorKey(id));
    writeRegistry({ ...registry, projects: remaining, activeProjectId: newActiveProjectId });
    inspectionRepository.logProjectEvent(newActiveProjectId, { type: 'delete', message: `ลบโครงการ "${deletedName}" ออกจากระบบ` });

    return { success: true, newActiveProjectId };
  },

  exportProjectData: (id) => {
    const meta = inspectionRepository.getProjectMeta(id);
    if (!meta) return null;
    return {
      schemaVersion: 1,
      project: meta,
      items: inspectionRepository.getItems(undefined, id),
      committee: inspectionRepository.getCommittee(id),
      config: inspectionRepository.getProjectConfig(id)
    };
  },

  /**
   * Import a project bundle produced by exportProjectData. Always creates a NEW
   * project id -- it never overwrites an existing project.
   */
  importProjectData: (bundle) => {
    if (!bundle || !bundle.project) return null;
    const registry = readRegistry();
    if (!registry) return null;

    const id = generateProjectId();
    const now = new Date().toISOString();
    const items = Array.isArray(bundle.items) ? bundle.items : [];
    const committee = Array.isArray(bundle.committee) ? bundle.committee : DEFAULT_COMMITTEE;
    const config = bundle.config || { templateId: bundle.project.templateId || 'it-computer', projectTitle: bundle.project.name, inspectionRound: bundle.project.inspectionRound || 1, workflowState: 'inspecting' };

    localStorage.setItem(projectItemsKey(id), JSON.stringify(items));
    localStorage.setItem(projectCommitteeKey(id), JSON.stringify(committee));
    localStorage.setItem(projectConfigKey(id), JSON.stringify(config));

    const meta = { ...bundle.project, id, isLegacyDefault: false, createdAt: now, updatedAt: now };
    registry.projects.push(meta);
    writeRegistry(registry);
    inspectionRepository.logProjectEvent(id, { type: 'import', message: `นำเข้าโครงการ "${meta.name}" จากไฟล์ JSON` });

    return meta;
  },

  /**
   * Get active project metadata config (e.g. active template id, project title)
   */
  getProjectConfig: (projectId = null) => {
    const pid = projectId || inspectionRepository.getActiveProjectId();
    try {
      const configJson = pid ? localStorage.getItem(projectConfigKey(pid)) : null;
      if (configJson) return JSON.parse(configJson);
    } catch (e) {
      console.error('Failed to parse project config', e);
    }
    return DEFAULT_PROJECT_CONFIG;
  },

  /**
   * Save active project metadata config
   */
  saveProjectConfig: (config, projectId = null) => {
    const pid = projectId || inspectionRepository.getActiveProjectId();
    if (!pid) return false;
    try {
      localStorage.setItem(projectConfigKey(pid), JSON.stringify(config));
      return true;
    } catch (e) {
      console.error('Failed to save project config', e);
      return false;
    }
  },

  /**
   * Get list of inspection items
   */
  getItems: (fallbackData = initialProcurementData, projectId = null) => {
    const pid = projectId || inspectionRepository.getActiveProjectId();
    try {
      const itemsJson = pid ? localStorage.getItem(projectItemsKey(pid)) : null;
      if (itemsJson) {
        const loadedItems = JSON.parse(itemsJson);
        // Auto-heal missing or duplicate images if items have legacy empty/duplicate values
        let healed = false;
        const result = loadedItems.map(item => {
          if (MAPPING_FIXES[item.id] && (!item.image || item.image === '' || (item.id === 41 && item.image === '87163_0.jpg') || (item.id === 42 && !item.image))) {
            healed = true;
            const targetImg = MAPPING_FIXES[item.id];
            return {
              ...item,
              image: targetImg,
              images: { ...(item.images || {}), product: targetImg }
            };
          }
          return item;
        });
        if (healed) {
          inspectionRepository.saveItems(result, pid);
        }
        return result;
      }
    } catch (e) {
      console.error('Failed to load items from localStorage', e);
    }
    return fallbackData;
  },

  /**
   * Auto-match 100% of images for all 49 items
   */
  autoMatchAllImages: (items, projectId = null) => {
    const updated = items.map(item => {
      const targetImg = MAPPING_FIXES[item.id];
      if (targetImg) {
        return {
          ...item,
          image: targetImg,
          images: {
            ...(item.images || {}),
            product: targetImg
          }
        };
      }
      return item;
    });
    inspectionRepository.saveItems(updated, projectId);
    return updated;
  },

  /**
   * Save list of inspection items
   */
  saveItems: (items, projectId = null) => {
    const pid = projectId || inspectionRepository.getActiveProjectId();
    if (!pid) return false;
    try {
      localStorage.setItem(projectItemsKey(pid), JSON.stringify(items));
      return true;
    } catch (e) {
      console.error('Failed to save items', e);
      return false;
    }
  },

  /**
   * Reset the given project's items/committee/config back to factory settings.
   * Snapshots the current data into a one-slot recovery backup first, so an
   * accidental reset (e.g. a misclick) can be undone via undoLastReset().
   */
  resetAll: (projectId = null) => {
    const pid = projectId || inspectionRepository.getActiveProjectId();
    if (!pid) return false;
    try {
      const backup = {
        savedAt: new Date().toISOString(),
        items: inspectionRepository.getItems(undefined, pid),
        committee: inspectionRepository.getCommittee(pid),
        config: inspectionRepository.getProjectConfig(pid)
      };
      localStorage.setItem(projectResetBackupKey(pid), JSON.stringify(backup));

      localStorage.removeItem(projectItemsKey(pid));
      localStorage.removeItem(projectCommitteeKey(pid));
      localStorage.removeItem(projectConfigKey(pid));
      inspectionRepository.logProjectEvent(pid, { type: 'reset', message: 'รีเซ็ตข้อมูลโครงการกลับเป็นค่าเริ่มต้น (สำรองข้อมูลเดิมไว้ให้กู้คืนได้)' });
      return true;
    } catch (e) {
      console.error('Failed to reset project data', e);
      return false;
    }
  },

  /**
   * Whether a one-slot recovery backup exists for this project (i.e. a reset
   * happened and hasn't been undone yet).
   */
  hasResetBackup: (projectId = null) => {
    const pid = projectId || inspectionRepository.getActiveProjectId();
    return !!(pid && localStorage.getItem(projectResetBackupKey(pid)));
  },

  /**
   * Restore items/committee/config from the last resetAll() snapshot, then
   * clear the backup slot (single-level undo, not a full history stack).
   */
  undoLastReset: (projectId = null) => {
    const pid = projectId || inspectionRepository.getActiveProjectId();
    if (!pid) return false;
    try {
      const json = localStorage.getItem(projectResetBackupKey(pid));
      if (!json) return false;
      const backup = JSON.parse(json);
      localStorage.setItem(projectItemsKey(pid), JSON.stringify(backup.items || []));
      localStorage.setItem(projectCommitteeKey(pid), JSON.stringify(backup.committee || DEFAULT_COMMITTEE));
      localStorage.setItem(projectConfigKey(pid), JSON.stringify(backup.config || DEFAULT_PROJECT_CONFIG));
      localStorage.removeItem(projectResetBackupKey(pid));
      inspectionRepository.logProjectEvent(pid, { type: 'undo_reset', message: 'เรียกคืนข้อมูลก่อนการรีเซ็ตล่าสุด' });
      return true;
    } catch (e) {
      console.error('Failed to undo reset', e);
      return false;
    }
  },

  /**
   * Get committee members
   */
  getCommittee: (projectId = null) => {
    const pid = projectId || inspectionRepository.getActiveProjectId();
    try {
      const committeeJson = pid ? localStorage.getItem(projectCommitteeKey(pid)) : null;
      if (committeeJson) return JSON.parse(committeeJson);
    } catch (e) {
      console.error('Failed to load committee members', e);
    }
    return DEFAULT_COMMITTEE;
  },

  /**
   * Save committee members
   */
  saveCommittee: (committee, projectId = null) => {
    const pid = projectId || inspectionRepository.getActiveProjectId();
    if (!pid) return false;
    try {
      localStorage.setItem(projectCommitteeKey(pid), JSON.stringify(committee));
      return true;
    } catch (e) {
      console.error('Failed to save committee members', e);
      return false;
    }
  },

  /**
   * Get the name of whichever committee member is currently recorded as "acting"
   * (used to attribute audit log entries). Falls back to the first committee member.
   */
  getCurrentActor: (projectId = null) => {
    const pid = projectId || inspectionRepository.getActiveProjectId();
    try {
      const stored = pid ? localStorage.getItem(projectActorKey(pid)) : null;
      if (stored) return stored;
    } catch (e) {
      console.error('Failed to load current actor', e);
    }
    const committee = inspectionRepository.getCommittee(pid);
    return committee[0]?.name || 'กรรมการตรวจรับ';
  },

  setCurrentActor: (name, projectId = null) => {
    const pid = projectId || inspectionRepository.getActiveProjectId();
    if (!pid) return false;
    try {
      localStorage.setItem(projectActorKey(pid), name);
      return true;
    } catch (e) {
      console.error('Failed to save current actor', e);
      return false;
    }
  },

  /**
   * Project-level activity log (separate from each item's own `history` array).
   * Covers events that aren't tied to a single inspection item: imports, template
   * switches, resets, report printing, project creation/cloning, etc.
   */
  getProjectEvents: (projectId = null) => {
    const pid = projectId || inspectionRepository.getActiveProjectId();
    try {
      const json = pid ? localStorage.getItem(projectEventsKey(pid)) : null;
      if (json) return JSON.parse(json);
    } catch (e) {
      console.error('Failed to load project events', e);
    }
    return [];
  },

  logProjectEvent: (projectId, { type, message }) => {
    const pid = projectId || inspectionRepository.getActiveProjectId();
    if (!pid) return false;
    try {
      const events = inspectionRepository.getProjectEvents(pid);
      events.push({
        timestamp: new Date().toISOString(),
        actor: inspectionRepository.getCurrentActor(pid),
        type,
        message
      });
      localStorage.setItem(projectEventsKey(pid), JSON.stringify(events));
      return true;
    } catch (e) {
      console.error('Failed to log project event', e);
      return false;
    }
  }
};
