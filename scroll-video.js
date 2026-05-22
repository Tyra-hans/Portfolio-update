history.scrollRestoration = 'manual';
window.scrollTo(0, 0);
window.addEventListener('load', () => window.scrollTo(0, 0));

gsap.registerPlugin(ScrollTrigger);

const video1    = document.getElementById('video1');
const video2    = document.getElementById('video2');
const video3    = document.getElementById('video3');
const videoWrap = document.getElementById('video-wrap');
const textBlock = document.getElementById('text-block');
const container = document.getElementById('scroll-container');

const ZOOM_END   = 0.09;  // intro zoom finishes at 9% scroll
const VIDEO_END  = 0.72;  // videos scrub until 72% scroll
const SCALE_FROM = 0.36;  // initial thumbnail scale
const CARD_SCALE = 0.44;  // video card scale in final staff layout

const HOLD_PX   = 4522;  // scroll pixel where meals hold begins
const HOLD_SIZE = 2400;  // extra scroll pixels for meals text animation

const RAMP_START   = 8741;             // actual scroll px — start scrubbing faster
const RAMP_END     = 11256;            // actual scroll px — resume normal speed
const RAMP_SPEED   = 2.5;             // times faster through the ramp zone
const RAMP_START_V = RAMP_START - HOLD_SIZE;  // same in video-coord space
const RAMP_END_V   = RAMP_END   - HOLD_SIZE;  // same in video-coord space

let rawProgress    = 0;
let smoothProgress = 0;
let lastTime       = performance.now();
let durations      = null;
let shrinkStartP   = VIDEO_END; // updated once durations are known (= scroll fraction where v3 begins)

function clamp(v, lo, hi) { return Math.min(Math.max(v, lo), hi); }
function invlerp(a, b, v)  { return clamp((v - a) / (b - a), 0, 1); }
function lerp(a, b, t)     { return a + (b - a) * t; }
function ease(t)           { return t < 0.5 ? 2*t*t : -1 + (4 - 2*t)*t; }

function seek(video, time) {
  const t = Math.min(Math.max(time, 0), video.duration - 0.001);
  if (Math.abs(video.currentTime - t) > 0.005) {
    if (video.fastSeek) video.fastSeek(t);
    else video.currentTime = t;
  }
}

// scroll listener — always active
window.addEventListener('scroll', () => {
  const max = container.scrollHeight - window.innerHeight;
  rawProgress = clamp(window.scrollY / max, 0, 1);
}, { passive: true });

// RAF loop
function tick(now) {
  const dt = Math.min((now - lastTime) / 1000, 0.1);
  lastTime = now;
  smoothProgress += (rawProgress - smoothProgress) * (1 - Math.exp(-10 * dt));
  const p = smoothProgress;

  // Remap scroll progress for video: freeze the frame during the meals hold zone
  const maxScroll = container.scrollHeight - window.innerHeight;
  const scrollY   = p * maxScroll;
  let videoY;
  if (scrollY < HOLD_PX) {
    videoY = scrollY;
  } else if (scrollY < HOLD_PX + HOLD_SIZE) {
    videoY = HOLD_PX;           // frozen
  } else {
    const rawV = scrollY - HOLD_SIZE;
    if (rawV <= RAMP_START_V) {
      videoY = rawV;                                                   // normal
    } else if (rawV <= RAMP_END_V) {
      videoY = RAMP_START_V + (rawV - RAMP_START_V) * RAMP_SPEED;     // faster
    } else {
      videoY = rawV + (RAMP_SPEED - 1) * (RAMP_END_V - RAMP_START_V); // post-ramp offset
    }
  }
  const videoP = clamp(videoY / (maxScroll - HOLD_SIZE), 0, 1);

  // Intro zoom + text fade (uses actual scroll p — zoom ends long before HOLD_PX)
  const zoomP = ease(invlerp(0, ZOOM_END, p));
  // Hand off to GSAP once v3 starts — shrinkStartP is updated by Promise.all
  if (videoP < shrinkStartP) {
    videoWrap.style.transform    = `scale(${lerp(SCALE_FROM, 1, zoomP)})`;
    videoWrap.style.borderRadius = `${lerp(14, 0, zoomP)}px`;
  }
  textBlock.style.opacity   = 1 - zoomP;
  textBlock.style.transform = `translateX(-50%) translateY(${-zoomP * 48}px) scale(${lerp(1, 0.88, zoomP)})`;

  // Video scrub with tight crossfades (uses remapped videoP)
  if (durations) {
    const { dur1, dur2, dur3, total } = durations;
    const scrubP = clamp(invlerp(0, VIDEO_END, videoP), 0, 1);
    const t      = scrubP * total;
    const vp     = scrubP;

    const b12 = dur1 / total;
    const b23 = (dur1 + dur2) / total;
    const CF  = 0.004;

    const ops = { v1: 0, v2: 0, v3: 0 };

    if (vp < b12 - CF) {
      seek(video1, t); ops.v1 = 1;
    } else if (vp < b12 + CF) {
      const f = (vp - (b12 - CF)) / (2 * CF);
      seek(video1, Math.min(t, dur1 - 0.001));
      seek(video2, Math.max(t - dur1, 0));
      ops.v1 = 1 - f; ops.v2 = f;
    } else if (vp < b23 - CF) {
      seek(video2, t - dur1); ops.v2 = 1;
    } else if (vp < b23 + CF) {
      const f = (vp - (b23 - CF)) / (2 * CF);
      seek(video2, Math.min(t - dur1, dur2 - 0.001));
      seek(video3, Math.max(t - dur1 - dur2, 0));
      ops.v2 = 1 - f; ops.v3 = f;
    } else {
      seek(video3, Math.min(t - dur1 - dur2, dur3 - 0.001));
      ops.v3 = 1;
    }

    video1.style.opacity = ops.v1;
    video2.style.opacity = ops.v2;
    video3.style.opacity = ops.v3;
  }

  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);

// Word mask for heading lines
function maskWords(el) {
  el.innerHTML = el.textContent.trim()
    .split(/\s+/)
    .map(w => `<span class="w-outer"><span class="w-inner">${w}</span></span>`)
    .join(' ');
}
maskWords(document.querySelector('.sh-line1'));
maskWords(document.querySelector('.sh-line2'));

// Word mask for meals heading (preserves <br> line breaks)
function maskMealsWords(el) {
  el.innerHTML = el.innerHTML
    .split(/<br\s*\/?>/i)
    .map(line =>
      line.trim().split(/\s+/).map(word =>
        `<span class="meals-w-outer"><span class="meals-w-inner">${word}</span></span>`
      ).join(' ')
    ).join('<br>');
}
maskMealsWords(document.querySelector('#meals-heading'));

// Metadata helpers
function getMetadata(v) {
  if (v.readyState >= 1) return Promise.resolve();
  return new Promise(res => {
    v.addEventListener('loadedmetadata', res, { once: true });
    v.addEventListener('error',          res, { once: true });
  });
}

// Start scrubbing as soon as v1+v2 are ready
Promise.all([video1, video2].map(getMetadata)).then(() => {
  video1.currentTime = 0.001;
  const dur1 = video1.duration || 0;
  const dur2 = video2.duration || 0;
  durations = { dur1, dur2, dur3: 0, total: dur1 + dur2 };
});

// Full setup once all 3 videos are ready
Promise.all([video1, video2, video3].map(getMetadata)).then(() => {
  const dur1  = video1.duration || 0;
  const dur2  = video2.duration || 0;
  const dur3  = video3.duration || 0;
  const total = dur1 + dur2 + dur3;
  durations = { dur1, dur2, dur3, total };

  // shrinkStartP = video-progress fraction where v3 first appears
  shrinkStartP = ((dur1 + dur2) / total) * VIDEO_END;

  const maxScroll      = container.scrollHeight - window.innerHeight;
  const videoMaxScroll = maxScroll - HOLD_SIZE; // scroll range that maps to actual video

  // Shrink & end positions are always after the hold zone, so offset by HOLD_SIZE
  const shrinkStartPx = shrinkStartP * videoMaxScroll + HOLD_SIZE;
  // Fixed 2000px window for the staff section — text reveals in the first half,
  // holds briefly, then the section is done regardless of viewport height.
  const endPx         = shrinkStartPx + 2000;

  gsap.set('#staff-section', { visibility: 'visible' });

  // ── Auto-glide past dead zone after staff section ────────────────────────
  // Once the staff animation is done, carry the user to the container end
  // automatically so they don't have to keep scrolling over empty space.
  // Manual wheel/touch immediately cancels and hands back control.
  let glideTriggered = false;
  ScrollTrigger.create({
    trigger: container,
    start: `${endPx}px top`,
    onEnter() {
      if (glideTriggered) return;
      glideTriggered = true;

      let cancelled = false;
      const cancelGlide = () => { cancelled = true; };
      window.addEventListener('wheel',     cancelGlide, { once: true, passive: true });
      window.addEventListener('touchmove', cancelGlide, { once: true, passive: true });

      const startY  = window.scrollY;
      const targetY = container.scrollHeight - window.innerHeight;
      const dur     = 1100; // ms
      const t0      = performance.now();

      (function step(now) {
        if (cancelled) return;
        const p = Math.min((now - t0) / dur, 1);
        const e = 1 - Math.pow(1 - p, 3); // cubic ease-out — fast start, long settle
        window.scrollTo(0, startY + (targetY - startY) * e);
        if (p < 1) requestAnimationFrame(step);
      })(t0);
    },
    onLeaveBack() { glideTriggered = false; },
  });

  // ── MEALS HOLD ──────────────────────────────────────────────────────────────
  // Video frame freezes here; meal video + text fades in, holds, then exits.
  gsap.timeline({
    scrollTrigger: {
      trigger: container,
      start: `${HOLD_PX}px top`,
      end:   `${HOLD_PX + HOLD_SIZE}px top`,
      scrub: 1.8,
    }
  })
  .fromTo('#meals-overlay',
    { opacity: 0 },
    { opacity: 1, duration: 0.1, ease: 'none' },
    0
  )
  .fromTo('.meals-w-inner',
    { yPercent: 115, opacity: 0 },
    { yPercent: 0, opacity: 1, stagger: { amount: 0.2 }, duration: 0.42, ease: 'none' },
    0
  )
  .fromTo('.meals-eyebrow',
    { opacity: 0, yPercent: 30 },
    { opacity: 1, yPercent: 0, duration: 0.22, ease: 'none' },
    0.05
  )
  .fromTo('.meals-subtitle',
    { opacity: 0, yPercent: 20 },
    { opacity: 1, yPercent: 0, duration: 0.2, ease: 'none' },
    0.38
  )
  .fromTo('.meals-cta',
    { opacity: 0, y: 8 },
    { opacity: 1, y: 0, duration: 0.2, ease: 'none' },
    0.58
  )
  // hold at peak
  .to({}, { duration: 0.28 }, 0.62)
  // exit: text and overlay fade out
  .to('.meals-subtitle', { opacity: 0, duration: 0.18, ease: 'none' }, 1.2)
  .to('.meals-cta',      { opacity: 0, duration: 0.15, ease: 'none' }, 1.2)
  .to('#meals-overlay',  { opacity: 0, duration: 0.28, ease: 'none' }, 1.2);

  // ── SHRINK + STAFF ───────────────────────────────────────────────────────────
  gsap.timeline({
    scrollTrigger: {
      trigger: container,
      start: `${shrinkStartPx}px top`,
      end:   `${endPx}px top`,
      scrub: 1.8,
      onEnter:     () => gsap.set(videoWrap, { transformOrigin: '0% 50%' }),
      onLeaveBack: () => gsap.set(videoWrap, { clearProps: 'transformOrigin' }),
    }
  })
  .fromTo('#video-wrap',
    { scale: 1, borderRadius: '0px', immediateRender: false },
    { scale: CARD_SCALE, borderRadius: '10px', duration: 0.44, ease: 'power1.inOut' },
    0
  )
  .fromTo('#staff-section',
    { opacity: 0, x: 50 },
    { opacity: 1, x: 0, duration: 0.26, ease: 'none' },
    0.10
  )
  .fromTo('.w-inner',
    { yPercent: 115, opacity: 0 },
    { yPercent: 0, opacity: 1, stagger: 0.03, duration: 0.26, ease: 'none' },
    0.14
  )
  .fromTo('.staff-subtitle',
    { opacity: 0, y: 12 },
    { opacity: 1, y: 0,  duration: 0.20, ease: 'none' },
    0.34
  )
  .fromTo('.staff-cta',
    { opacity: 0, y: 8 },
    { opacity: 1, y: 0,  duration: 0.16, ease: 'none' },
    0.48
  )
  .to({}, { duration: 0.10 });
});

// ── Page-open staggered intro reveal ────────────────────────────────────────
(function () {
  // Mask h1 words for the slide-up reveal (preserves <br> line breaks)
  const h1 = document.querySelector('#text-block h1');
  h1.innerHTML = h1.innerHTML
    .split(/<br\s*\/?>/i)
    .map(line =>
      line.trim().split(/\s+/).map(word =>
        `<span class="hw-outer"><span class="hw-inner">${word}</span></span>`
      ).join(' ')
    ).join('<br>');

  const eyebrow     = document.querySelector('#text-block .eyebrow');
  const hwInners    = document.querySelectorAll('.hw-inner');
  const videoReveal = document.getElementById('video-reveal');

  // Set initial hidden state immediately (before first paint)
  gsap.set(eyebrow,     { opacity: 0, y: 22 });
  gsap.set(hwInners,    { yPercent: 115, opacity: 0 });
  gsap.set(videoReveal, { opacity: 0, y: 44 });

  window.addEventListener('load', () => {
    gsap.timeline({ delay: 0.35 })
      // 1. Eyebrow rises — y leads, opacity chases slightly behind
      .to(eyebrow, { y: 0, duration: 1.1, ease: 'power4.out' }, 0)
      .to(eyebrow, { opacity: 1, duration: 0.9, ease: 'power2.out' }, 0.08)

      // 2. Heading words slide up one by one
      .to(hwInners, {
        yPercent: 0,
        stagger: 0.085, duration: 1.0, ease: 'power4.out'
      }, 0.22)
      .to(hwInners, {
        opacity: 1,
        stagger: 0.085, duration: 0.75, ease: 'power2.out'
      }, 0.30)

      // 3. Video thumbnail rises last — the longest, most settled move
      .to(videoReveal, { y: 0, duration: 1.5, ease: 'power4.out' }, 0.5)
      .to(videoReveal, { opacity: 1, duration: 1.2, ease: 'power2.out' }, 0.6);
  });
}());
