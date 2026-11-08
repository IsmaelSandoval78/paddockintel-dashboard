import gsap from 'gsap'

const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const DIGIT = '0123456789'

/**
 * Reveals text left to right, churning through random glyphs of the same
 * kind (letters stay letters, digits stay digits) until each lands.
 */
export function scrambleTo(targets, text, { duration = 0.9, delay = 0 } = {}) {
  const chars = [...text]
  const proxy = { p: 0 }
  const write = (value) => {
    for (const el of targets) el.textContent = value
  }
  return gsap.to(proxy, {
    p: 1,
    duration,
    delay,
    ease: 'power2.out',
    onUpdate() {
      const revealed = proxy.p * chars.length
      write(
        chars
          .map((c, i) => {
            if (i < revealed) return c
            if (/[0-9]/.test(c)) return DIGIT[(Math.random() * 10) | 0]
            if (/[A-Za-z]/.test(c)) return ALPHA[(Math.random() * 26) | 0]
            return c
          })
          .join('')
      )
    },
    onComplete: () => write(text),
  })
}
