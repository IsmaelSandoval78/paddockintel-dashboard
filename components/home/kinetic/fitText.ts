// Kinetic display type never wraps: scale font-size down so the
// single-line text fits its parent exactly. Call after fonts are ready.
export function fitToWidth(el: HTMLElement) {
  el.style.fontSize = ''; // reset to CSS clamp value before measuring
  const parent = el.parentElement;
  if (!parent || parent.clientWidth === 0) return;
  const ratio = parent.clientWidth / el.scrollWidth;
  if (ratio < 1) {
    const cs = parseFloat(getComputedStyle(el).fontSize);
    el.style.fontSize = `${Math.floor(cs * ratio * 0.97)}px`;
  }
}

// Keep the fit on viewport resize. Returns a cleanup function.
export function observeFit(el: HTMLElement): () => void {
  let raf = 0;
  const onResize = () => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => fitToWidth(el));
  };
  window.addEventListener('resize', onResize);
  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener('resize', onResize);
  };
}
