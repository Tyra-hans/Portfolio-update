gsap.registerPlugin(ScrollTrigger);

const cabinVideo = document.getElementById('cabin-video');

// Set initial clip-path through GSAP so both from/to use identical units,
// avoiding browser computed-style px conversion that breaks interpolation.
gsap.set('#cabin-wrap', { clipPath: 'inset(16% 55.68% 16% 2.32% round 14px)' });

// ── Video scrub ────────────────────────────────────────────────────────────
function seekCabin(time) {
  if (!cabinVideo.duration) return;
  const t = Math.min(Math.max(time, 0), cabinVideo.duration - 0.001);
  if (Math.abs(cabinVideo.currentTime - t) > 0.005) {
    if (cabinVideo.fastSeek) cabinVideo.fastSeek(t);
    else cabinVideo.currentTime = t;
  }
}
ScrollTrigger.create({
  trigger: '#cabin-scroll',
  start: 'top top',
  end:   'bottom bottom',
  onUpdate: (self) => seekCabin(self.progress * (cabinVideo.duration || 0)),
});

// ── Clip-path expand + text fade (scrubbed) ────────────────────────────────
gsap.timeline({
  scrollTrigger: {
    trigger: '#cabin-scroll',
    start: 'top top',
    end:   'bottom bottom',
    scrub: 1.8,
  }
})
// Text fades in first, then fades out as video expands
.fromTo('#cabin-text',
  { opacity: 0, x: -16 },
  { opacity: 1, x: 0, duration: 0.18, ease: 'none' },
  0
)
.to('#cabin-text', {
  opacity: 0,
  x: 28,
  duration: 0.22,
  ease: 'none',
}, 0.2)
// Clip-path expands from left rectangle to fullscreen
.to('#cabin-wrap', {
  clipPath: 'inset(0% 0% 0% 0% round 0px)',
  duration: 0.68,
  ease: 'power1.inOut',
}, 0.12)
// Hold at fullscreen
.to({}, { duration: 0.24 });

// ── Exit: darken + snap up into CTA ───────────────────────────────────────
gsap.timeline({
  scrollTrigger: {
    trigger: '#cabin-scroll',
    start: 'bottom bottom',
    end:   'bottom top',
    scrub: 0.8,
  }
})
// Darken overlay fades in (video "darkens out")
.fromTo('#cabin-overlay',
  { opacity: 0 },
  { opacity: 0.88, ease: 'power2.in', duration: 1 },
  0
)
// Sticky panel nudges upward for snap feel
.to('#cabin-sticky', {
  y: '-14vh',
  ease: 'power2.in',
  duration: 1,
}, 0);

// ── CTA word-mask + entrance animation ────────────────────────────────────
// Mask words in the CTA heading (preserves <br>)
function maskCTAHeading(el) {
  el.innerHTML = el.innerHTML
    .split(/<br\s*\/?>/i)
    .map(line =>
      line.trim().split(/\s+/).map(word =>
        `<span class="cta-w-outer"><span class="cta-w-inner">${word}</span></span>`
      ).join(' ')
    ).join('<br>');
}
maskCTAHeading(document.querySelector('.cta-heading'));

// Animate CTA content in on scroll — scrubbed so it also fades out on reverse
gsap.timeline({
  scrollTrigger: {
    trigger: '#cta-section',
    start: 'top 78%',
    end:   'top 18%',
    scrub: 1.2,
  }
})
.fromTo('.cta-eyebrow',
  { opacity: 0, y: 12 },
  { opacity: 1, y: 0, duration: 0.22, ease: 'none' },
  0
)
.fromTo('.cta-w-inner',
  { yPercent: 110, opacity: 0 },
  { yPercent: 0, opacity: 1, stagger: 0.055, duration: 0.42, ease: 'none' },
  0.08
)
.fromTo('.cta-sub',
  { opacity: 0, y: 10 },
  { opacity: 1, y: 0, duration: 0.22, ease: 'none' },
  0.46
)
.fromTo('.cta-form',
  { opacity: 0, y: 12 },
  { opacity: 1, y: 0, duration: 0.2, ease: 'none' },
  0.66
);
