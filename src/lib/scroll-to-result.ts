/** Smooth-scroll to a result block after generation completes. */
export function scrollToResult(targetId: string, offset = 120) {
  const attemptScroll = () => {
    const el = document.getElementById(targetId)
    if (!el) return false
    const top = el.getBoundingClientRect().top + window.scrollY - offset
    window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' })
    return true
  }

  if (attemptScroll()) return
  window.setTimeout(() => {
    if (!attemptScroll()) window.setTimeout(attemptScroll, 350)
  }, 150)
}
