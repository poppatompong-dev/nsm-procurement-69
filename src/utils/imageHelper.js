/**
 * Robust image URL helper that handles relative paths, data URLs, 
 * Thai directory names ('รูปภาพ'), and fallback path resolutions.
 */
export const getImageUrl = (item) => {
  if (!item) return null;
  
  let raw = item.images?.product || item.image || item.images?.spec;
  if (!raw) return null;
  if (typeof raw !== 'string') return null;
  if (raw.startsWith('data:')) return raw;
  
  // Clean string to extract actual filename (e.g. '87202_0.jpg' or '336724_0.jpg')
  const filename = raw.split('/').pop().trim();
  if (!filename) return null;

  // Return clean relative path to images folder
  return `./รูปภาพ/${filename}`;
};

// Every item is one Cloud Firestore document with a hard 1 MiB (1,048,576 byte) limit,
// shared with the item's other fields (name, spec, notes, history...). Keep a single
// uploaded photo comfortably under that so one oversized photo can't blow out the whole
// document -- and can't take the rest of that write batch down with it (a Firestore
// batch commit is all-or-nothing, so one bad item used to silently fail everyone else's
// saves in the same sync cycle too).
const MAX_IMAGE_DATAURL_BYTES = 650 * 1024;

/**
 * Read an uploaded photo as a downscaled JPEG data URL, trying progressively smaller
 * dimensions/quality until the result fits under MAX_IMAGE_DATAURL_BYTES.
 */
export const readImageAsDownscaledDataUrl = (file, { maxDimension = 1600, quality = 0.82 } = {}) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('อ่านไฟล์รูปภาพไม่สำเร็จ'));
    reader.onload = (event) => {
      const dataUrl = event.target.result;
      const img = new Image();

      // If anything about decoding/canvas fails (e.g. an exotic format), fall back to
      // the original data URL rather than losing the user's photo.
      img.onerror = () => resolve(dataUrl);
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          const dims = [maxDimension, 1200, 900, 600];
          const qualities = [quality, 0.7, 0.55, 0.4];

          let out = dataUrl;
          let fitsBudget = false;
          for (const dim of dims) {
            const scale = Math.min(1, dim / Math.max(img.width, img.height));
            canvas.width = Math.max(1, Math.round(img.width * scale));
            canvas.height = Math.max(1, Math.round(img.height * scale));
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            for (const q of qualities) {
              out = canvas.toDataURL('image/jpeg', q);
              if (out.length <= MAX_IMAGE_DATAURL_BYTES) { fitsBudget = true; break; }
            }
            if (fitsBudget) break;
          }

          resolve(out);
        } catch (e) {
          console.warn('Image downscale failed, using original', e);
          resolve(dataUrl);
        }
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
