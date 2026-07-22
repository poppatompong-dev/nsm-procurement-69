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
