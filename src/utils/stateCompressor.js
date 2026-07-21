/**
 * Parses the state encoded in the URL hash.
 * @param {Array} currentItems - Default items list to merge with parsed state
 * @returns {Object|null} The parsed application state containing committee, items, activeTab, viewMode, sortBy, filters, etc.
 */
export const parseUrlState = (currentItems) => {
  const hash = window.location.hash;
  if (hash && hash.startsWith('#state=')) {
    try {
      const base64 = hash.split('state=')[1];
      const json = decodeURIComponent(escape(atob(base64)));
      const decoded = JSON.parse(json);
      
      const result = {};
      
      // Restore committee members
      if (decoded.c && Array.isArray(decoded.c)) {
        result.committee = decoded.c.map(m => ({
          name: m.n || '',
          position: m.p || ''
        }));
      }
      
      // Restore modified items list
      if (decoded.s && currentItems.length > 0) {
        const map = {};
        decoded.s.forEach(x => {
          map[x.id] = x;
        });
        
        result.items = currentItems.map(item => {
          if (map[item.id]) {
            const m = map[item.id];
            return {
              ...item,
              inspectStatus: m.st || 'passed',
              notes: m.nt || '',
              serial_number: m.sn || '',
              mac_address: m.mc || '',
              asset_number: m.an || '',
              images: m.img || item.images,
              checklist: m.ch || item.checklist,
              timeline: m.tl || item.timeline,
              history: m.hs || item.history,
              version: m.vs || item.version
            };
          }
          return item;
        });
      }

      // Restore UI States
      if (decoded.t) result.activeTab = decoded.t;
      if (decoded.vm) result.viewMode = decoded.vm;
      if (decoded.sb) result.sortBy = decoded.sb;
      if (decoded.q) result.searchQuery = decoded.q;
      if (decoded.cf) result.categoryFilter = decoded.cf;
      if (decoded.df) result.divisionFilter = decoded.df;
      if (decoded.sf) result.statusFilter = decoded.sf;
      if (decoded.nf) result.hasNotesFilter = decoded.nf;
      if (decoded.imf) result.hasImageFilter = decoded.imf;
      if (decoded.mn) result.minPrice = decoded.mn;
      if (decoded.mx) result.maxPrice = decoded.mx;
      if (decoded.sel) result.selectedItemId = decoded.sel;

      return result;
    } catch (e) {
      console.error('Failed to parse shareable link', e);
    }
  }
  return null;
};

/**
 * Generates a base64 encoded URL with the current app state.
 * @param {Array} committee - Current committee list
 * @param {Array} items - Current items list
 * @param {Object} uiState - Current UI states (activeTab, viewMode, sortBy, filters, selectedItemId)
 * @returns {string} The full shareable URL
 */
export const generateShareLink = (committee, items, uiState = {}) => {
  try {
    const state = {
      c: committee.map(m => ({ n: m.name, p: m.position })),
      s: items
        .filter(i => 
          i.inspectStatus !== 'passed' || 
          i.notes || 
          i.serial_number || 
          i.mac_address || 
          i.asset_number || 
          Object.values(i.images).some(img => img && img !== i.images.product) ||
          i.history.length > 0 ||
          i.version > 1 ||
          Object.values(i.checklist).some(val => !val)
        )
        .map(i => ({
          id: i.id,
          st: i.inspectStatus,
          nt: i.notes,
          sn: i.serial_number,
          mc: i.mac_address,
          an: i.asset_number,
          img: i.images,
          ch: i.checklist,
          tl: i.timeline,
          hs: i.history,
          vs: i.version
        })),
      t: uiState.activeTab,
      vm: uiState.viewMode,
      sb: uiState.sortBy,
      q: uiState.searchQuery,
      cf: uiState.categoryFilter,
      df: uiState.divisionFilter,
      sf: uiState.statusFilter,
      nf: uiState.hasNotesFilter,
      imf: uiState.hasImageFilter,
      mn: uiState.minPrice,
      mx: uiState.maxPrice,
      sel: uiState.selectedItemId
    };
    
    const json = JSON.stringify(state);
    const base64 = btoa(unescape(encodeURIComponent(json)));
    return `${window.location.origin}${window.location.pathname}#state=${base64}`;
  } catch (e) {
    console.error('Failed to generate share link', e);
    throw e;
  }
};
