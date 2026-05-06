export function triggerGlitch(cb: () => void): void {
  const ov = document.getElementById('glitch-overlay')
  if (!ov) { cb(); return }
  ov.classList.remove('active')
  void ov.offsetWidth // reflow
  ov.classList.add('active')
  setTimeout(() => {
    cb()
    setTimeout(() => ov.classList.remove('active'), 200)
  }, 80)
}
