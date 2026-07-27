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

/**
 * Read an uploaded photo as a downscaled JPEG data URL.
 *
 * Uploaded photos are stored inline with the item, and each item is now one Cloud
 * Firestore document with a hard 1 MB limit -- a raw 4 MB phone photo would fail to
 * sync (and used to quietly blow the ~5 MB localStorage quota too). 1600px / q0.82
 * keeps evidence photos legible in the printed report at a few hundred KB.
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
          const scale = Math.min(1, maxDimension / Math.max(img.width, img.height));
          if (scale === 1 && dataUrl.length < 700 * 1024) {
            resolve(dataUrl);
            return;
          }

          const canvas = document.createElement('canvas');
          canvas.width = Math.round(img.width * scale);
          canvas.height = Math.round(img.height * scale);
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          let out = canvas.toDataURL('image/jpeg', quality);
          // Last-resort squeeze so a very detailed photo still fits in one document.
          if (out.length > 900 * 1024) out = canvas.toDataURL('image/jpeg', 0.6);
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
