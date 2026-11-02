// Per-module search — shared by the list pages (lists.js) and the landing module card (index.html).
// Self-contained: no dependency on icons.js / portal.js, so the landing page can load it on its own.

const MODULE_SEARCH = {
  jobs: {
    noun: "jobs",
    placeholder: "Search jobs",
    fields: ["id", "status", "address", "date", "jobType", "comments"],
  },
  quotes: {
    noun: "quotes",
    placeholder: "Search quotes",
    fields: ["id", "status", "ref", "expiryLabel", "comments", "total"],
  },
  invoices: {
    noun: "invoices",
    placeholder: "Search invoices",
    fields: ["id", "statusLabel", "ref", "dueLabel", "total"],
  },
  appointments: {
    noun: "appointments",
    placeholder: "Search appointments",
    fields: ["subject", "dateLabel", "time", "address"],
  },
};

const SEARCH_ICONS = {
  search:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
  x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>',
};

function searchTerms(query) {
  return query.toLowerCase().split(/\s+/).filter(Boolean);
}

// Every term must appear in at least one field. Amounts match with or without
// thousands spaces, so "1863", "1 863" and "1863.00" all find R 1 863.00.
function matchesSearch(item, query, fields) {
  const terms = searchTerms(query);
  if (!terms.length) return true;
  const values = fields
    .map((f) => (typeof f === "function" ? f(item) : item[f]))
    .filter((v) => v != null)
    .map((v) => (typeof v === "number" ? `${v.toFixed(2)} ${formatSearchAmount(v)}` : String(v)).toLowerCase());
  return terms.every((t) => values.some((v) => v.includes(t) || v.replace(/\s+/g, "").includes(t)));
}

function formatSearchAmount(n) {
  return "R " + Number(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

function searchFieldHtml(placeholder) {
  return `
    <label class="sc-search">
      <span class="sc-search-ic">${SEARCH_ICONS.search}</span>
      <input type="search" placeholder="${placeholder}" aria-label="${placeholder}" autocomplete="off" spellcheck="false" />
      <button type="button" class="sc-search-clear" aria-label="Clear search" hidden>${SEARCH_ICONS.x}</button>
    </label>`;
}

// Wires a field rendered by searchFieldHtml(). Returns { set(value), input }.
function bindSearchField(root, onSearch) {
  const input = root.querySelector("input");
  const clear = root.querySelector(".sc-search-clear");
  const update = () => {
    root.classList.toggle("has-value", !!input.value);
    clear.hidden = !input.value;
    onSearch(input.value.trim());
  };
  input.addEventListener("input", update);
  input.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (input.value) { input.value = ""; update(); } else input.blur();
  });
  clear.addEventListener("click", () => { input.value = ""; update(); input.focus(); });

  // "/" focuses the search from anywhere on the page (unless already typing somewhere).
  if (!document._scSearchSlash) {
    document._scSearchSlash = true;
    document.addEventListener("keydown", (e) => {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
      const el = document.activeElement;
      if (el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))) return;
      const field = document.querySelector(".sc-search input");
      if (field) { e.preventDefault(); field.focus(); }
    });
  }

  return {
    input,
    set(value) { input.value = value; root.classList.toggle("has-value", !!value); clear.hidden = !value; },
  };
}

// Wraps matched terms in <mark> inside the given elements' text nodes.
function highlightMatches(scope, selector, query) {
  const terms = searchTerms(query).map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  if (!terms.length) return;
  const re = new RegExp(`(${terms.join("|")})`, "gi");
  scope.querySelectorAll(selector).forEach((el) => {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach((node) => {
      if (!re.test(node.nodeValue)) return;
      re.lastIndex = 0;
      const frag = document.createDocumentFragment();
      node.nodeValue.split(re).forEach((part, i) => {
        if (!part) return;
        if (i % 2) {
          const m = document.createElement("mark");
          m.className = "sc-hl";
          m.textContent = part;
          frag.appendChild(m);
        } else frag.appendChild(document.createTextNode(part));
      });
      node.parentNode.replaceChild(frag, node);
    });
  });
}

const SEARCH_HINT = {
  jobs: "Try a job number, address or status.",
  quotes: "Try a quote number, reference or amount.",
  invoices: "Try an invoice number, reference or amount.",
  appointments: "Try a date, address or description.",
};

function searchEmptyHtml(noun, query) {
  return `
    <div class="sc-search-empty" role="status">
      <span class="sc-search-empty-ic">${SEARCH_ICONS.search}</span>
      <p class="sc-search-empty-title">No ${noun} found</p>
      <p class="sc-search-empty-sub">Nothing matches “${escapeSearchHtml(query)}”. ${SEARCH_HINT[noun] || "Check the spelling and try again."}</p>
      <button type="button" class="sc-search-reset">Clear search</button>
    </div>`;
}

function escapeSearchHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
