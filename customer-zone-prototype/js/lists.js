// Grouped list views shown inside the switcher card on the list pages
// (Job list / Quotes list in Figma; Invoices / Appointments reuse the same pattern).

function renderGroupedList(heading, groups, moduleKey) {
  const search = MODULE_SEARCH[moduleKey];
  document.getElementById("content").innerHTML = `
    <div class="list-head">
      <h2 class="content-head">${heading}</h2>
      <div class="list-search">${searchFieldHtml(search.placeholder)}</div>
    </div>
    <div id="list-results"></div>`;

  const resultsEl = document.getElementById("list-results");
  const draw = (query = "") => {
    const filtered = groups.map((g) => ({ ...g, items: g.items.filter((item) => matchesSearch(item, query, search.fields)) }));
    const count = filtered.reduce((n, g) => n + g.items.length, 0);
    if (query && !count) {
      resultsEl.innerHTML = searchEmptyHtml(search.noun, query);
      return;
    }
    const sections = filtered
      .filter((g) => g.items.length)
      .map((g) => groupSection(g.label, g.tone, g.items.length, g.items.map(g.card).join("")))
      .join("");
    resultsEl.innerHTML = `
      <div class="list-groups">${sections || `<div class="empty-note">Nothing here yet.</div>`}</div>`;
    if (query) highlightMatches(resultsEl, ".mini-title, .mini-row > span", query);
  };

  const field = bindSearchField(document.querySelector("#content .sc-search"), draw);
  resultsEl.addEventListener("click", (e) => {
    if (!e.target.closest(".sc-search-reset")) return;
    field.set("");
    draw();
    field.input.focus();
  });
  draw();
}

function jobCard(j) {
  return miniCard(`job-detail.html#${j.id}`, j.id, badge(j.status, j.statusTone),
    row("mapPin", j.address) + row("calendar", j.date));
}
function quoteCard(q) {
  return miniCard(`quote-detail.html#${q.id}`, q.id, badge(q.status, q.statusTone, true),
    row("fileText", "Ref: " + q.ref) + row("clock", q.expiryLabel) + row("dollar", `<b>${formatCurrency(q.total)}</b>`));
}
function invoiceCard(i) {
  return miniCard(`invoice-detail.html#${i.id}`, i.id, badge(i.statusLabel, i.statusTone, true),
    row("fileText", "Ref: " + i.ref) + row("clock", i.dueLabel) + row("dollar", `<b>${formatCurrency(i.total)}</b>`));
}
function appointmentCard(a) {
  return miniCard(`appointment-detail.html#${a.id}`, a.subject, "",
    row("calendar", a.dateLabel) + row("clock", a.time) + row("mapPin", a.address));
}

function renderJobList() {
  renderGroupedList("Your Jobs", [
    { label: "Open", tone: "success", items: JOBS.filter((j) => j.group === "open"), card: jobCard },
    { label: "Closed", tone: "info", items: JOBS.filter((j) => j.group === "closed"), card: jobCard },
  ], "jobs");
}

function renderQuoteList() {
  renderGroupedList("Your Quotes", [
    { label: "Awaiting Response", tone: "warning", items: QUOTES.filter((q) => q.group === "Awaiting Response"), card: quoteCard },
    { label: "Accepted", tone: "success", items: QUOTES.filter((q) => q.group === "Accepted"), card: quoteCard },
    { label: "Declined", tone: "danger", items: QUOTES.filter((q) => q.group === "Declined"), card: quoteCard },
  ], "quotes");
}

function renderInvoiceList() {
  renderGroupedList("Your Invoices", [
    { label: "Unpaid", tone: "danger", items: INVOICES.filter((i) => i.group === "Unpaid"), card: invoiceCard },
    { label: "Paid", tone: "info", items: INVOICES.filter((i) => i.group === "Paid"), card: invoiceCard },
  ], "invoices");
}

function renderAppointmentList() {
  renderGroupedList("Your Appointments", [
    { label: "Today", tone: "info", items: APPOINTMENTS.filter((a) => a.group === "Today"), card: appointmentCard },
    { label: "Upcoming", tone: "success", items: APPOINTMENTS.filter((a) => a.group === "Future"), card: appointmentCard },
  ], "appointments");
}
