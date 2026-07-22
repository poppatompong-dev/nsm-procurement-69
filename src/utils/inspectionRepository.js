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

// Per-project storage keys are namespaced off the existing v4 keys so a single project's
// data shape stays identical to before -- only the wrapper (which project it belongs to) is new.
const projectItemsKey = (id) => `${STORAGE_KEYS.ITEMS}__${id}`;
const projectCommitteeKey = (id) => `${STORAGE_KEYS.COMMITTEE}__${id}`;
const projectConfigKey = (id) => `${STORAGE_KEYS.CONFIG}__${id}`;
const projectEventsKey = (id) => `procurement_events_v1__${id}`;
const projectActorKey = (id) => `procurement_actor_v1__${id}`;

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
      if (itemsJson) return JSON.parse(itemsJson);
    } catch (e) {
      console.error('Failed to load items from localStorage', e);
    }
    return fallbackData;
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
   * Reset the given project's items/committee/config back to factory settings
   */
  resetAll: (projectId = null) => {
    const pid = projectId || inspectionRepository.getActiveProjectId();
    if (!pid) return false;
    try {
      localStorage.removeItem(projectItemsKey(pid));
      localStorage.removeItem(projectCommitteeKey(pid));
      localStorage.removeItem(projectConfigKey(pid));
      return true;
    } catch (e) {
      console.error('Failed to reset project data', e);
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
