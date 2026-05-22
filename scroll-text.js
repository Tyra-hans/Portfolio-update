gsap.registerPlugin(ScrollTrigger);

// Wrap each word in a mask container for curtain reveal
function maskWords(el) {
  el.innerHTML = el.innerHTML
    .split(/<br\s*\/?>/i)
    .map(line =>
      line.trim().split(/\s+/).map(word =>
        `<span class="w-outer"><span class="w-inner">${word}</span></span>`
      ).join(' ')
    ).join('<br>');
}

maskWords(document.querySelector('h1'));

const tl = gsap.timeline({
  scrollTrigger: {
    trigger: '#section',
    start: 'top top',
    end: '+=260%',
    scrub: 1.8,
    pin: true,
  }
});

// ── ENTRY ──────────────────────────────────────────────────────────────────
// Text rushes in from bottom-left: small, transparent → centered, full size
tl.fromTo('#text-wrap', {
  scale: 0.2,
  xPercent: -18,
  yPercent: 55,
  opacity: 0,
}, {
  scale: 1,
  xPercent: 0,
  yPercent: 0,
  opacity: 1,
  duration: 1,
  ease: 'none',
})

// Word curtain reveal — each word slides up from behind its overflow:hidden parent
.fromTo('.w-inner', {
  yPercent: 115,
}, {
  yPercent: 0,
  stagger: { amount: 0.5 },
  duration: 0.9,
  ease: 'none',
}, 0)

// Eyebrow fades in early
.fromTo('.eyebrow', {
  opacity: 0,
  yPercent: 30,
}, {
  opacity: 1,
  yPercent: 0,
  duration: 0.4,
  ease: 'none',
}, 0.1)

// Subtitle slides up and fades in near the peak
.fromTo('.subtitle', {
  opacity: 0,
  yPercent: 20,
}, {
  opacity: 1,
  yPercent: 0,
  duration: 0.35,
  ease: 'none',
}, 0.65)

// ── HOLD at peak ───────────────────────────────────────────────────────────
.to('#text-wrap', { duration: 0.3, ease: 'none' }, 1)

// ── EXIT ───────────────────────────────────────────────────────────────────
// Continues scaling up and drifts to top-right, fades out
.to('#text-wrap', {
  scale: 1.75,
  xPercent: 12,
  yPercent: -28,
  opacity: 0,
  duration: 1,
  ease: 'none',
}, 1.3)

.to('.subtitle', {
  opacity: 0,
  duration: 0.25,
  ease: 'none',
}, 1.3);
