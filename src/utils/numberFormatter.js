/**
 * Safe number formatter helper
 * @param {number|string|null|undefined} val 
 * @returns {string} Formatted number with commas
 */
export const formatNumber = (val) => {
  if (val === undefined || val === null) return '0';
  const num = Number(val);
  return isNaN(num) ? '0' : num.toLocaleString();
};
