// utils/termUtils.js
export const getCurrentTerm = (date = new Date()) => {
  const month = date.getMonth() + 1; // 1-12 (Jan-Dec)
  const year = date.getFullYear();

  // Example: Term 1 (Aug-Jan), Term 2 (Feb-Jul)
  if (month >= 8 || month <= 1) { // Aug-Jan = Term 1
    return `Term_1_${month >= 8 ? year : year - 1}-${month >= 8 ? year + 1 : year}`;
  } else { // Feb-Jul = Term 2
    return `Term_2_${year}-${year + 1}`;
  }
};
