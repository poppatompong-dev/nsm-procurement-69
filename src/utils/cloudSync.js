import {
  collection,
  doc,
  getDocs,
  getDocFromServer,
  getDocsFromServer,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { getDb } from './firebaseClient';

/**
 * Cloud sync layer.
 *
 * Why this exists: every device used to keep its own private copy of the inspection
 * data in localStorage, so two committee members on two machines each saw their own
 * stale dataset. This module makes Cloud Firestore the shared source of truth and
 * demotes localStorage to an offline cache/mirror.
 *
 * Data model (one workspace per project, resolved by inspectionRepository.getCloudProjectId --
 * the original project keeps the literal id 'main' it was seeded under; every later project
 * gets its own workspace named after its own generated project id):
 *   projects/{cloudProjectId}                -> { committee, config, seeded, updatedAt }
 *   projects/{cloudProjectId}/items/{itemId} -> one document per inspection item
 *
 * One document per item (rather than one big array document) matters: two people can
 * grade two different items at the same time without either overwriting the other.
 *
 * This module is a page-lifetime singleton scoped to whichever project was active when
 * start() was called. Switching the active project is handled by reloading the page
 * (see App.jsx) rather than hot-swapping listeners mid-session.
 */

const RETRY_MS = 15000;
const BATCH_OP_LIMIT = 400;      // Firestore allows 500 writes per batch
const BATCH_BYTE_LIMIT = 7_000_000; // Firestore allows ~10 MB per commit; leave headroom
// Firestore hard-caps a single document at 1 MiB (1,048,576 bytes). Leave headroom for
// field-name overhead and Firestore's own per-document bookkeeping.
const MAX_ITEM_DOC_BYTES = 900_000;
const WRITE_RETRY_ATTEMPTS = 3;
const WRITE_RETRY_BASE_MS = 2000;
const MAX_BACKUPS = 10;

// Snapshot of this device's localStorage data taken the first time it adopts cloud
// data, so a bad first sync is never unrecoverable.
export const PRE_CLOUD_BACKUP_KEY = 'procurement_pre_cloud_backup_v1';

const CLOUD_META_FIELDS = ['_updatedAt', '_updatedBy', '_deleted', '_deletedAt'];

const state = {
  started: false,
  ready: false,
  cloudProjectId: null,
  status: 'idle', // idle | connecting | synced | saving | offline | error
  lastSyncAt: null,
  known: new Map(), // itemId(string) -> item as last seen on the cloud
  knownCommittee: null,
  knownConfig: null,
  handlers: {},
  unsubs: [],
  retryTimer: null,
  bootContext: null,
  writeChain: Promise.resolve()
};

/* ------------------------------------------------------------------ helpers */

// Firestore rejects `undefined`; drop those keys instead of failing the whole write.
const sanitize = (value) => {
  if (Array.isArray(value)) return value.map(v => (v === undefined ? null : sanitize(v)));
  if (value && typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      if (v === undefined || typeof v === 'function') continue;
      out[k] = sanitize(v);
    }
    return out;
  }
  if (value === undefined || typeof value === 'function') return null;
  return value;
};

const deepEqual = (a, b) => {
  if (a === b) return true;
  if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object') return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a)) return a.length === b.length && a.every((x, i) => deepEqual(x, b[i]));
  const ka = Object.keys(a);
  const kb = Object.keys(b);
  if (ka.length !== kb.length) return false;
  return ka.every(k => Object.prototype.hasOwnProperty.call(b, k) && deepEqual(a[k], b[k]));
};

const stripCloudMeta = (docData) => {
  const clean = { ...docData };
  CLOUD_META_FIELDS.forEach(f => delete clean[f]);
  return clean;
};

const itemKey = (item) => String(item?.id);

const sortItems = (items) => [...items].sort((a, b) => {
  const na = Number(a.id);
  const nb = Number(b.id);
  if (Number.isFinite(na) && Number.isFinite(nb)) return na - nb;
  return String(a.id).localeCompare(String(b.id));
});

const projectRef = () => doc(getDb(), 'projects', state.cloudProjectId);
const itemsRef = () => collection(getDb(), 'projects', state.cloudProjectId, 'items');
const backupsRef = () => collection(getDb(), 'projects', state.cloudProjectId, 'backups');
const backupItemsRef = (backupId) => collection(getDb(), 'projects', state.cloudProjectId, 'backups', backupId, 'items');

/** Live (non-tombstoned) item documents from a query snapshot. */
const liveItems = (snap) => snap.docs
  .filter(d => d.data()?._deleted !== true)
  .map(d => stripCloudMeta(d.data()));

const setStatus = (status) => {
  if (state.status === status) return;
  state.status = status;
  state.handlers.onStatus?.(status, state.lastSyncAt);
};

const markSynced = () => {
  state.lastSyncAt = new Date().toISOString();
  setStatus('synced');
};

/** Run writes one after another so two rapid edits can't interleave their diffs. */
const enqueue = (fn) => {
  state.writeChain = state.writeChain.then(fn).catch(e => {
    console.error('Cloud write failed', e);
    setStatus('error');
  });
  return state.writeChain;
};

const estimateBytes = (value) => {
  try {
    const json = JSON.stringify(value);
    if (!json) return 0;
    // Thai text is multi-byte in UTF-8 but single-length in a JS string, so measure
    // actual encoded bytes rather than .length -- what matters here is what Firestore
    // will actually store.
    if (typeof TextEncoder !== 'undefined') return new TextEncoder().encode(json).length;
    return json.length;
  } catch {
    return 0;
  }
};

/**
 * Commit write operations, splitting on both Firestore's per-batch write count and
 * its ~10 MB per-commit payload limit. The byte guard matters because item documents
 * can carry inline evidence photos.
 */
const commitInChunks = async (ops) => {
  const db = getDb();
  let batch = writeBatch(db);
  let count = 0;
  let bytes = 0;

  for (const op of ops) {
    const opBytes = op.bytes || 0;
    if (count > 0 && (count >= BATCH_OP_LIMIT || bytes + opBytes > BATCH_BYTE_LIMIT)) {
      await batch.commit();
      batch = writeBatch(db);
      count = 0;
      bytes = 0;
    }
    op.apply(batch);
    count += 1;
    bytes += opBytes;
  }

  if (count > 0) await batch.commit();
};

/**
 * Retry transient failures (network blips, momentary quota errors) a few times with
 * backoff before giving up. A batch commit is all-or-nothing, so without this a single
 * flaky request could fail every item queued in the same write.
 */
const commitWithRetry = async (ops, attempts = WRITE_RETRY_ATTEMPTS) => {
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    try {
      await commitInChunks(ops);
      return;
    } catch (e) {
      lastErr = e;
      if (i < attempts - 1) await new Promise(r => setTimeout(r, WRITE_RETRY_BASE_MS * (i + 1)));
    }
  }
  throw lastErr;
};

/* -------------------------------------------------------------- bootstrap */

const seedFromLocal = async ({ items, committee, config }) => {
  // Claim the "I seeded this workspace" flag transactionally so two devices opening
  // the app at the same moment can't both upload their own copy of the data.
  const claimed = await runTransaction(getDb(), async (tx) => {
    const snap = await tx.get(projectRef());
    if (snap.exists() && snap.data()?.seeded) return false;
    tx.set(projectRef(), {
      committee: sanitize(committee),
      config: sanitize(config),
      seeded: true,
      _updatedAt: serverTimestamp()
    }, { merge: true });
    return true;
  });

  if (!claimed) return false;

  await commitInChunks(items.map(item => ({
    bytes: estimateBytes(item),
    apply: (batch) => batch.set(doc(itemsRef(), itemKey(item)), {
      ...sanitize(item),
      _updatedAt: serverTimestamp()
    })
  })));

  return true;
};

const attachListeners = () => {
  const unsubItems = onSnapshot(itemsRef(), (snap) => {
    const remote = liveItems(snap);
    state.known = new Map(remote.map(item => [itemKey(item), item]));

    if (snap.metadata.hasPendingWrites) {
      setStatus('saving');
    } else {
      markSynced();
    }

    state.handlers.onItems?.(sortItems(remote));
  }, (err) => {
    console.error('Items listener error', err);
    setStatus('error');
  });

  const unsubProject = onSnapshot(projectRef(), (snap) => {
    if (!snap.exists()) return;
    const data = snap.data();
    if (Array.isArray(data.committee)) state.knownCommittee = data.committee;
    if (data.config && typeof data.config === 'object') state.knownConfig = data.config;
    state.handlers.onMeta?.({ committee: state.knownCommittee, config: state.knownConfig });
    if (!snap.metadata.hasPendingWrites) markSynced();
  }, (err) => {
    console.error('Project listener error', err);
    setStatus('error');
  });

  state.unsubs = [unsubItems, unsubProject];
};

const scheduleRetry = () => {
  if (state.retryTimer) return;
  state.retryTimer = setTimeout(() => {
    state.retryTimer = null;
    connect().catch(e => console.error('Cloud reconnect failed', e));
  }, RETRY_MS);
};

const connect = async () => {
  if (state.ready) return true;
  setStatus('connecting');

  const { items: localItems, committee: localCommittee, config: localConfig } = state.bootContext;

  let remoteItems = [];
  let projectSnap = null;
  try {
    // Deliberately server-only: an empty *cache* on a fresh device must never be
    // mistaken for "the cloud workspace is empty", which would wipe real data.
    const [itemsSnap, projSnap] = await Promise.all([
      getDocsFromServer(itemsRef()),
      getDocFromServer(projectRef()).catch(() => null)
    ]);
    remoteItems = liveItems(itemsSnap);
    projectSnap = projSnap;
  } catch (e) {
    console.warn('Cloud unreachable, staying on local data for now', e);
    setStatus('offline');
    scheduleRetry();
    return false;
  }

  if (remoteItems.length === 0 && localItems.length > 0) {
    const seeded = await seedFromLocal({ items: localItems, committee: localCommittee, config: localConfig });
    if (seeded) {
      state.handlers.onNotice?.('seeded', localItems.length);
    }
  } else if (remoteItems.length > 0) {
    const sortedRemote = sortItems(remoteItems);
    const localMatchesRemote =
      localItems.length === remoteItems.length &&
      sortItems(localItems).every((li, i) => deepEqual(li, sortedRemote[i]));

    if (!localMatchesRemote && localItems.length > 0) {
      try {
        localStorage.setItem(PRE_CLOUD_BACKUP_KEY, JSON.stringify({
          savedAt: new Date().toISOString(),
          items: localItems,
          committee: localCommittee,
          config: localConfig
        }));
      } catch (e) {
        console.error('Failed to snapshot pre-cloud local data', e);
      }
      state.handlers.onNotice?.('adopted', remoteItems.length);
    }

    // Make sure the shared project doc carries committee/config even if it was
    // created by an older/partial write.
    if (!projectSnap?.exists() || !Array.isArray(projectSnap.data()?.committee)) {
      await enqueue(() => runTransaction(getDb(), async (tx) => {
        tx.set(projectRef(), {
          committee: sanitize(localCommittee),
          config: sanitize(localConfig),
          seeded: true,
          _updatedAt: serverTimestamp()
        }, { merge: true });
      }));

    }
  }

  state.ready = true;
  attachListeners();
  return true;
};

/* ------------------------------------------------------------------- public */

export const cloudSync = {
  isReady: () => state.ready,
  getStatus: () => state.status,
  getLastSyncAt: () => state.lastSyncAt,

  /**
   * Boot cloud sync. `items` / `committee` / `config` are this device's current
   * localStorage data, used only to seed an empty cloud workspace.
   */
  start: ({ projectId = 'main', items = [], committee = [], config = {}, onItems, onMeta, onStatus, onNotice, onItemError }) => {
    if (state.started) return;
    state.started = true;
    state.cloudProjectId = projectId;
    state.bootContext = { items, committee, config };
    state.handlers = { onItems, onMeta, onStatus, onNotice, onItemError };

    connect().catch(e => {
      console.error('Cloud sync failed to start', e);
      setStatus('error');
      scheduleRetry();
    });

    // Retry promptly when the browser regains connectivity instead of waiting out
    // the polling interval.
    window.addEventListener('online', () => {
      if (!state.ready) connect().catch(e => console.error('Cloud reconnect failed', e));
    });
  },

  /**
   * Push only the items that actually changed, plus removals. Called from
   * inspectionRepository.saveItems, so every existing save path syncs for free.
   *
   * Removals are written as tombstones (`_deleted: true`) rather than real deletes:
   * the document keeps its full contents, so an item that disappears -- e.g. because
   * someone re-imported a shorter Excel sheet -- is always recoverable.
   */
  pushItems: (items) => {
    if (!state.ready || !Array.isArray(items)) return;

    const nextIds = new Set(items.map(itemKey));
    const ops = [];
    // Only merged into state.known once the write actually succeeds -- marking an item
    // "known" (synced) before Firestore confirms it used to mean a failed write was
    // never retried, and looked identical to a successful one, on this device.
    const pendingKnown = new Map();

    items.forEach(item => {
      const key = itemKey(item);
      if (!key || key === 'undefined') return;
      const known = state.known.get(key);
      if (known && deepEqual(known, item)) return;

      const bytes = estimateBytes(item);
      if (bytes > MAX_ITEM_DOC_BYTES) {
        // Too big for one Firestore document (almost always an oversized photo).
        // Skip it rather than let it fail -- and take -- the whole batch, and tell the
        // caller so the user can be warned instead of the photo silently vanishing.
        console.error(`Item #${key} is ${bytes} bytes, over the Firestore document limit; not syncing it`);
        state.handlers.onItemError?.(item, bytes);
        return;
      }

      pendingKnown.set(key, item);
      ops.push({
        bytes,
        apply: (batch) => batch.set(doc(itemsRef(), key), {
          ...sanitize(item),
          _updatedAt: serverTimestamp()
        })
      });
    });

    [...state.known.keys()].forEach(key => {
      if (nextIds.has(key)) return;
      pendingKnown.set(key, null); // tombstone marker
      ops.push({
        bytes: 200,
        apply: (batch) => batch.set(doc(itemsRef(), key), {
          _deleted: true,
          _deletedAt: serverTimestamp()
        }, { merge: true })
      });
    });

    if (ops.length === 0) return;
    setStatus('saving');
    return enqueue(async () => {
      await commitWithRetry(ops);
      // Only reached on success -- a thrown error here leaves state.known untouched,
      // so the next saveItems() call for these same items retries them automatically.
      pendingKnown.forEach((item, key) => {
        if (item === null) state.known.delete(key);
        else state.known.set(key, item);
      });
    });
  },

  pushCommittee: (committee) => {
    if (!state.ready || !Array.isArray(committee)) return;
    if (deepEqual(state.knownCommittee, committee)) return;
    state.knownCommittee = committee;
    setStatus('saving');
    return enqueue(() => commitInChunks([{
      bytes: estimateBytes(committee),
      apply: (batch) => batch.set(projectRef(), { committee: sanitize(committee), _updatedAt: serverTimestamp() }, { merge: true })
    }]));
  },

  pushConfig: (config) => {
    if (!state.ready || !config || typeof config !== 'object') return;
    if (deepEqual(state.knownConfig, config)) return;
    state.knownConfig = config;
    setStatus('saving');
    return enqueue(() => commitInChunks([{
      bytes: estimateBytes(config),
      apply: (batch) => batch.set(projectRef(), { config: sanitize(config), _updatedAt: serverTimestamp() }, { merge: true })
    }]));
  },

  /**
   * Recovery escape hatch: overwrite the shared cloud workspace with this device's
   * data (used when a device was offline while others edited, or after a bad sync).
   */
  forcePush: async ({ items, committee, config, backupLabel = 'ก่อนอัปโหลดทับจากอีกเครื่อง' }) => {
    if (!state.ready) throw new Error('ยังไม่ได้เชื่อมต่อคลาวด์');
    await cloudSync.backupWorkspace(backupLabel);
    setStatus('saving');
    const remoteKeys = new Set(state.known.keys());
    const ops = [];
    const pendingKnown = new Map();

    items.forEach(item => {
      const key = itemKey(item);
      remoteKeys.delete(key);

      const bytes = estimateBytes(item);
      if (bytes > MAX_ITEM_DOC_BYTES) {
        console.error(`Item #${key} is ${bytes} bytes, over the Firestore document limit; not syncing it`);
        state.handlers.onItemError?.(item, bytes);
        return;
      }

      pendingKnown.set(key, item);
      ops.push({
        bytes,
        apply: (batch) => batch.set(doc(itemsRef(), key), { ...sanitize(item), _updatedAt: serverTimestamp() })
      });
    });
    remoteKeys.forEach(key => {
      pendingKnown.set(key, null);
      ops.push({
        bytes: 200,
        apply: (batch) => batch.set(doc(itemsRef(), key), { _deleted: true, _deletedAt: serverTimestamp() }, { merge: true })
      });
    });
    ops.push({
      bytes: estimateBytes(committee) + estimateBytes(config),
      apply: (batch) => batch.set(projectRef(), {
        committee: sanitize(committee),
        config: sanitize(config),
        seeded: true,
        _updatedAt: serverTimestamp()
      }, { merge: true })
    });

    await enqueue(async () => {
      await commitWithRetry(ops);
      // Merged inside the write-chain callback, like pushItems -- otherwise a
      // concurrent enqueue()'d write chained on right after this one's commit
      // resolves could read state.known before this merge applies.
      pendingKnown.forEach((item, key) => {
        if (item === null) state.known.delete(key);
        else state.known.set(key, item);
      });
    });
    markSynced();
  },

  /**
   * Snapshot the entire shared workspace into projects/main/backups/{id}. Runs before
   * every destructive bulk operation (Excel re-import, reset, force push) so no single
   * click can permanently destroy the committee's inspection record.
   *
   * Backups live in the cloud, not localStorage, so ANY device can restore them --
   * including when the person who caused the loss was using a different machine.
   */
  backupWorkspace: async (label = 'สำรองอัตโนมัติ') => {
    if (!state.ready) return null;

    const items = [...state.known.values()];
    const backupId = `bk_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    const createdAtIso = new Date().toISOString();

    const ops = items.map(item => ({
      bytes: estimateBytes(item),
      apply: (batch) => batch.set(doc(backupItemsRef(backupId), itemKey(item)), sanitize(item))
    }));
    // Written last so a backup only ever "exists" once its items are safely stored.
    ops.push({
      bytes: estimateBytes(state.knownCommittee) + estimateBytes(state.knownConfig) + 500,
      apply: (batch) => batch.set(doc(backupsRef(), backupId), {
        label,
        createdAtIso,
        itemCount: items.length,
        committee: sanitize(state.knownCommittee || []),
        config: sanitize(state.knownConfig || {}),
        _updatedAt: serverTimestamp()
      })
    });

    await enqueue(() => commitInChunks(ops));
    await cloudSync.pruneBackups();
    return { id: backupId, label, createdAtIso, itemCount: items.length };
  },

  listBackups: async () => {
    if (!state.ready) return [];
    const snap = await getDocs(query(backupsRef(), orderBy('createdAtIso', 'desc')));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  /** Keep only the newest MAX_BACKUPS snapshots so storage doesn't grow unbounded. */
  pruneBackups: async () => {
    const all = await cloudSync.listBackups();
    const stale = all.slice(MAX_BACKUPS);
    if (stale.length === 0) return;

    for (const backup of stale) {
      const itemsSnap = await getDocs(backupItemsRef(backup.id));
      const ops = itemsSnap.docs.map(d => ({ bytes: 200, apply: (batch) => batch.delete(d.ref) }));
      ops.push({ bytes: 200, apply: (batch) => batch.delete(doc(backupsRef(), backup.id)) });
      await commitInChunks(ops);
    }
  },

  /** Restore a cloud snapshot over the current workspace (itself backed up first). */
  restoreBackup: async (backupId) => {
    if (!state.ready) throw new Error('ยังไม่ได้เชื่อมต่อคลาวด์');

    const [metaSnap, itemsSnap] = await Promise.all([
      getDocFromServer(doc(backupsRef(), backupId)),
      getDocsFromServer(backupItemsRef(backupId))
    ]);
    if (!metaSnap.exists()) throw new Error('ไม่พบข้อมูลสำรองชุดนี้');

    const meta = metaSnap.data();
    const items = sortItems(itemsSnap.docs.map(d => stripCloudMeta(d.data())));

    await cloudSync.forcePush({
      items,
      committee: Array.isArray(meta.committee) && meta.committee.length ? meta.committee : state.knownCommittee,
      config: meta.config || state.knownConfig,
      backupLabel: 'ก่อนกู้คืนข้อมูลสำรอง'
    });

    return { items, committee: meta.committee, config: meta.config };
  },

  /** Recovery escape hatch: re-read the cloud workspace straight from the server. */
  forcePull: async () => {
    const [itemsSnap, projSnap] = await Promise.all([
      getDocsFromServer(itemsRef()),
      getDocFromServer(projectRef()).catch(() => null)
    ]);
    const remote = sortItems(liveItems(itemsSnap));
    state.known = new Map(remote.map(item => [itemKey(item), item]));

    const data = projSnap?.exists() ? projSnap.data() : null;
    if (Array.isArray(data?.committee)) state.knownCommittee = data.committee;
    if (data?.config) state.knownConfig = data.config;

    markSynced();
    return { items: remote, committee: state.knownCommittee, config: state.knownConfig };
  },

  stop: () => {
    state.unsubs.forEach(u => u());
    state.unsubs = [];
    state.started = false;
    state.ready = false;
    state.cloudProjectId = null;
  }
};
