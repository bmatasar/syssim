export const parseNumbers = s => {
  const result = s?.split(/,/)?.map(p => {
    const m = /^\s*(\d+)\s*$/.exec(p);
    return m ? parseInt(m[1]) : NaN;
  });
  return result?.every(p => !isNaN(p)) ? result : [];
};
