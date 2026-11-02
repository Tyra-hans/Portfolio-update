// Shared chrome for the customer-portal redesign prototype:
// top nav, optional hero, portal identity, the tab / dropdown switcher,
// Discover-more block, support footer, and small render helpers.

const PORTAL = {
  tenant: typeof TENANT !== "undefined" ? TENANT.name : "Regal Electrical",
  sub: "Official Customer Zone",
  tabs: [
    { key: "jobs", label: "Jobs", icon: "clipboardList", href: "index.html#jobs" },
    { key: "quotes", label: "Quotes", icon: "fileText", href: "index.html#quotes" },
    { key: "invoices", label: "Invoices", icon: "receipt", href: "index.html#invoices" },
    { key: "appointments", label: "Appointments", icon: "calendar", href: "index.html#appointments" },
  ],
};

// Match the Figma convention: space thousands, full-stop decimals ("R 1 863.00").
if (typeof formatCurrency === "function") {
  formatCurrency = function (n) {
    return "R " + Number(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  };
}

/* ---------- chrome ---------- */

function renderChrome(opts) {
  const o = Object.assign({ active: "jobs", hero: false, back: null, crumbs: null, discover: false, hrefFor: (t) => t.href, onTab: null }, opts);

  // "Home" root is always implied; pages pass the trail after it.
  const crumbs = o.crumbs
    ? [{ label: "Home", href: "index.html" }, ...o.crumbs]
    : null;

  document.getElementById("nav").innerHTML = `
    <header class="nav">
      <div class="nav-inner">
        <a class="nav-logo" href="index.html"><img src="assets/servcraft-logo-white.svg" alt="ServCraft" /></a>
        <div class="nav-right">
          <a class="btn-trial" href="https://servcraft.co.za" target="_blank" rel="noopener"><span class="cta-long">Start your free trial</span><span class="cta-short">Free trial</span></a>
        </div>
      </div>
    </header>`;

  const heroRoot = document.getElementById("hero");
  if (heroRoot && o.hero) {
    heroRoot.innerHTML = `
      <section class="hero">
        <h1>Welcome to ServCraft!</h1>
        <p>Track your jobs, quotes, invoices and appointments in one place.</p>
      </section>`;
    document.getElementById("wrap").classList.add("has-hero");
  }

  const portalRoot = document.getElementById("portal-id");
  if (portalRoot) {
    portalRoot.className = "portal-id";
    portalRoot.innerHTML = `
      <span class="portal-badge">
        <img src="assets/regal-mark.png" alt="${PORTAL.tenant}"
             onerror="if(this.parentNode)this.parentNode.classList.add('is-fallback');this.remove()" />
        <span class="portal-badge-fallback">REGAL<span>ELEC</span></span>
      </span>
      <div>
        <p class="portal-name">${PORTAL.tenant}'s customer portal</p>
        <span class="portal-sub">${PORTAL.sub}</span>
      </div>`;
  }

  const switchRoot = document.getElementById("switch");
  if (switchRoot) {
    let toolbar = "";
    if (crumbs) {
      const trail = crumbs
        .map((c, i) => {
          const last = i === crumbs.length - 1;
          const node = last || !c.href
            ? `<span aria-current="page">${c.label}</span>`
            : `<a href="${c.href}">${c.label}</a>`;
          return i === 0 ? node : `${ICONS.chevronRight}${node}`;
        })
        .join("");
      // Mobile shows only a "← Parent" link (css/mobile-tabs.css) instead of the full trail.
      const parent = crumbs.slice(0, -1).reverse().find((c) => c.href);
      const back = parent ? `<a class="crumb-back" href="${parent.href}">${ICONS.arrowLeft}<span>${parent.label}</span></a>` : "";
      toolbar = `<div class="card-toolbar"><nav class="breadcrumb" aria-label="Breadcrumb">${trail}</nav>${back}</div>`;
    } else if (o.back) {
      toolbar = `<div class="card-toolbar"><a class="back-btn" href="${o.back.href}">${ICONS.arrowLeft}<span>${o.back.label || "Back"}</span></a></div>`;
    }

    // Module tabs now live in the header (topnav.js); the card keeps only the breadcrumb.
    switchRoot.innerHTML = toolbar;
  }

  const discoverRoot = document.getElementById("discover");
  if (discoverRoot && o.discover) discoverRoot.innerHTML = discoverHtml();

  const supportRoot = document.getElementById("support");
  if (supportRoot) supportRoot.innerHTML = supportHtml();

  if (!document.body._portalDelegated) {
    document.body._portalDelegated = true;
    document.body.addEventListener("click", (e) => {
      const t = e.target.closest("[data-toast]");
      if (t) toast(t.getAttribute("data-toast"));
      const p = e.target.closest("[data-print]");
      if (p) window.print();
    });
  }
}

function discoverHtml() {
  const art = {
    templates:
      '<svg viewBox="0 0 24 24" fill="none" stroke="#003ed0" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="4" rx="1"/><rect x="3" y="11" width="18" height="4" rx="1"/><rect x="3" y="18" width="12" height="3" rx="1"/></svg>',
    accounting:
      '<svg viewBox="0 0 24 24" fill="none" stroke="#003ed0" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M4 12h16M4 17h10"/><circle cx="18" cy="17" r="3"/></svg>',
    whatsnew:
      '<svg viewBox="0 0 24 24" fill="none" stroke="#003ed0" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2 3 7v10l9 5 9-5V7z"/><path d="M12 22V12M3 7l9 5 9-5"/></svg>',
  };
  return `
    <section class="discover">
      <div class="discover-head">${ICONS.sparkles}<h3>Discover more</h3></div>
      <div class="discover-cards">
        <div class="dcard">
          <div class="dcard-body">
            <div><h4>Get started with a template.</h4><p>Pre-configured for any project.</p></div>
            <button class="dbtn" type="button" data-toast="Browse templates — prototype only">Browse templates</button>
          </div>
          <div class="dcard-art">${art.templates}</div>
        </div>
        <div class="dcard">
          <div class="dcard-body">
            <div><h4>Integrate your accounting.</h4><p>Choose from Xero, Sage and Quickbooks to integrate to ServCraft and send data both ways.</p></div>
            <button class="dbtn" type="button" data-toast="Start free trial — prototype only">Start free trial</button>
          </div>
          <div class="dcard-art">${art.accounting}</div>
        </div>
        <div class="dcard">
          <div class="dcard-body">
            <div><h4>What's new in ServCraft.</h4><p>Discover new features available now.</p></div>
            <button class="dbtn" type="button" data-toast="What's new — prototype only">Learn more</button>
          </div>
          <div class="dcard-art">${art.whatsnew}</div>
        </div>
      </div>
    </section>`;
}

function supportHtml() {
  return `
    <div class="support">
      <span class="s-title">Need support?</span>
      <p>Contact us at <a href="mailto:support@servcraft.co.za">support@servcraft.co.za</a></p>
    </div>`;
}

/* ---------- render helpers ---------- */

// Prominent "Linked job" banner for quote / invoice / appointment details.
function linkedJobHtml(jobId) {
  const job = typeof JOBS !== "undefined" && JOBS.find((j) => j.id === jobId);
  if (!job) return "";
  return `
    <a class="linked-job" href="job-detail.html#${job.id}">
      <span class="lj-ic">${ICONS.clipboardList}</span>
      <span class="lj-body">
        <span class="lj-eyebrow">Linked job</span>
        <span class="lj-title"><span class="lj-id">${job.id}</span>${badge(job.status, job.statusTone)}</span>
        <span class="lj-meta">${job.jobType} · ${job.address}</span>
      </span>
      <span class="lj-cta"><span>View job</span>${ICONS.chevronRight}</span>
    </a>`;
}

function badge(label, tone, pill) {
  return `<span class="badge${pill ? " pill" : ""} tone-${tone || "info"}">${label}</span>`;
}

function row(icon, text) {
  return `<div class="mini-row">${ICONS[icon]}<span>${text}</span></div>`;
}

function miniCard(href, title, badgeHtml, rowsHtml) {
  const tag = href ? "a" : "div";
  const attr = href ? ` href="${href}"` : "";
  return `<${tag} class="mini"${attr}>
    <div class="mini-head"><h3 class="mini-title">${title}</h3>${badgeHtml || ""}</div>
    <div class="mini-rows">${rowsHtml}</div>
  </${tag}>`;
}

function groupSection(label, tone, count, cardsHtml) {
  return `
    <div class="list-group">
      <div class="group-label tone-${tone}">${label.toUpperCase()}<span class="g-count">(${count})</span></div>
      <div class="grid">${cardsHtml}</div>
    </div>`;
}

function toast(message) {
  let el = document.getElementById("toast");
  if (!el) {
    el = document.createElement("div");
    el.id = "toast";
    el.className = "toast";
    document.body.appendChild(el);
  }
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove("show"), 2400);
}
