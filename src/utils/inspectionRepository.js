import defaultTemplates from '../data/inspectionTemplates.json';
import initialProcurementData from '../data/procurementData.json';

const STORAGE_KEYS = {
  ITEMS: 'procurement_items_v4',
  COMMITTEE: 'procurement_committee_v4',
  CONFIG: 'procurement_config_v4',
  TEMPLATES: 'procurement_custom_templates_v4'
};

const DEFAULT_COMMITTEE = [
  { name: 'นายณัฏฐวุฒิ จีนมหันต์', position: 'ประธานกรรมการตรวจรับ (นักวิชาการคอมพิวเตอร์ชำนาญการพิเศษ)' },
  { name: 'นายปฐมพงษ์ หล้ามหศักดิ์', position: 'กรรมการตรวจรับ (นักวิชาการคอมพิวเตอร์ปฏิบัติการ)' },
  { name: 'นายประชารักษ์ ประทุมโทน', position: 'กรรมการตรวจรับ (นักประชาสัมพันธ์ปฏิบัติการ)' }
];

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
   * Get active project metadata config (e.g. active template id, project title)
   */
  getProjectConfig: () => {
    try {
      const configJson = localStorage.getItem(STORAGE_KEYS.CONFIG);
      if (configJson) {
        return JSON.parse(configJson);
      }
    } catch (e) {
      console.error('Failed to parse project config', e);
    }
    return {
      templateId: 'it-computer',
      projectTitle: 'ระบบตรวจรับครุภัณฑ์คอมพิวเตอร์อัจฉริยะ',
      inspectionRound: 1,
      workflowState: 'inspecting'
    };
  },

  /**
   * Save active project metadata config
   */
  saveProjectConfig: (config) => {
    try {
      localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
      return true;
    } catch (e) {
      console.error('Failed to save project config', e);
      return false;
    }
  },

  /**
   * Get list of inspection items
   */
  getItems: (fallbackData = initialProcurementData) => {
    try {
      const itemsJson = localStorage.getItem(STORAGE_KEYS.ITEMS);
      if (itemsJson) {
        return JSON.parse(itemsJson);
      }
    } catch (e) {
      console.error('Failed to load items from localStorage', e);
    }
    return fallbackData;
  },

  /**
   * Save list of inspection items
   */
  saveItems: (items) => {
    try {
      localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(items));
      return true;
    } catch (e) {
      console.error('Failed to save items', e);
      return false;
    }
  },

  /**
   * Reset database back to factory settings
   */
  resetAll: () => {
    try {
      localStorage.removeItem(STORAGE_KEYS.ITEMS);
      localStorage.removeItem(STORAGE_KEYS.COMMITTEE);
      localStorage.removeItem(STORAGE_KEYS.CONFIG);
      // We don't remove custom templates to let user preserve their custom builders
      return true;
    } catch (e) {
      console.error('Failed to reset localStorage databases', e);
      return false;
    }
  },

  /**
   * Get committee members
   */
  getCommittee: () => {
    try {
      const committeeJson = localStorage.getItem(STORAGE_KEYS.COMMITTEE);
      if (committeeJson) {
        return JSON.parse(committeeJson);
      }
    } catch (e) {
      console.error('Failed to load committee members', e);
    }
    return DEFAULT_COMMITTEE;
  },

  /**
   * Save committee members
   */
  saveCommittee: (committee) => {
    try {
      localStorage.setItem(STORAGE_KEYS.COMMITTEE, JSON.stringify(committee));
      return true;
    } catch (e) {
      console.error('Failed to save committee members', e);
      return false;
    }
  }
};
