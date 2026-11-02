// Xero-style primary navigation: module links sit in the blue header bar beside the logo.
// On mobile (≤860px) the links collapse into a "Menu" dropdown so the bar keeps its height.
const TOP_NAV = [
  { key: "jobs", label: "Jobs", href: "index.html#jobs" },
  { key: "quotes", label: "Quotes", href: "index.html#quotes" },
  { key: "invoices", label: "Invoices", href: "index.html#invoices" },
  { key: "appointments", label: "Appointments", href: "index.html#appointments" },
];

function topNavLinksHtml(active) {
  const links = TOP_NAV.map(
    (t) => `<a class="topnav-link${t.key === active ? " active" : ""}" href="${t.href}"${t.key === active ? ' aria-current="page"' : ""}>${t.label}</a>`
  ).join("");
  return `
    <nav class="topnav" aria-label="Main">
      <div class="topnav-links">${links}</div>
      <div class="topnav-menu">
        <button class="topnav-trigger" type="button" aria-expanded="false" aria-label="Menu">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
        </button>
        <div class="topnav-panel">${links}</div>
      </div>
    </nav>`;
}

function bindTopNav(root) {
  const menu = root.querySelector(".topnav-menu");
  if (!menu) return;
  const trg = menu.querySelector(".topnav-trigger");
  trg.addEventListener("click", (e) => {
    e.stopPropagation();
    trg.setAttribute("aria-expanded", String(menu.classList.toggle("open")));
  });
  document.addEventListener("click", () => {
    menu.classList.remove("open");
    trg.setAttribute("aria-expanded", "false");
  });
}

// Links between a job and its quotes / invoices / appointments (via `jobId` in data.js).
function relatedTo(jobId) {
  return {
    quotes: QUOTES.filter((q) => q.jobId === jobId),
    invoices: INVOICES.filter((i) => i.jobId === jobId),
    appointments: APPOINTMENTS.filter((a) => a.jobId === jobId),
  };
}

// When the prototype is embedded in the case study, Escape tells the page to close its large view.
if (window.parent !== window) {
  addEventListener("keydown", (e) => { if (e.key === "Escape") parent.postMessage("cz-escape", "*"); });
}
