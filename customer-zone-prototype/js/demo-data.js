// Demo-only volume so the home card's "View all" has enough records to paginate.
// Appends generated records after the hand-written ones in data.js (load right after it).
(function () {
  const streets = ["3 Palm Drive, Fourways", "18 Willow Lane, Randburg", "7 Acacia Road, Midrand", "22 Jacaranda Street, Bedfordview",
    "5 Protea Close, Northcliff", "41 Main Road, Bryanston", "9 Marula Avenue, Lonehill", "14 Baobab Crescent, Sunninghill"];
  const work = ["Install new plug points", "Replace faulty light switch", "DB board inspection", "Geyser thermostat replacement",
    "Outdoor lighting repair", "Compliance certificate (CoC)", "Trip switch fault finding", "Install ceiling fan",
    "Rewire kitchen circuit", "Replace isolator switch"];
  const jobTypes = ["Repair", "Installation", "Inspection", "Callout"];
  const months = ["Jul", "Jun", "May", "Apr"];
  const day = (i) => String(28 - (i % 27)).padStart(2, "0");
  const date = (i) => `${day(i)} ${months[Math.floor(i / 6) % months.length]} 2026`;
  const amount = (i) => 450 + ((i * 373) % 4200);
  const tech = { initials: "RP", name: "Riaan Pretorius" };

  for (let i = 0; i < 20; i++) {
    const open = i < 4;
    JOBS.push({
      id: `JC-${10180 - i * 3}`,
      status: open ? (i % 2 ? "Awaiting Parts" : "In Progress") : "Completed",
      statusTone: open ? (i % 2 ? "warning" : "success") : "info",
      group: open ? "open" : "closed",
      address: streets[i % streets.length],
      date: `${date(i)}, ${String(8 + (i % 8)).padStart(2, "0")}:00`,
      startDate: date(i),
      jobType: jobTypes[i % jobTypes.length],
      comments: work[i % work.length] + ".",
      assets: [],
      employees: [tech],
      statusFlow: [{ date: `${date(i)}, 08:00`, desc: "Job Booked" }],
      canSign: false,
    });
  }

  const quoteStates = [
    ["Accepted", "success", "Accepted"], ["Declined", "danger", "Declined"], ["Accepted", "success", "Accepted"],
  ];
  for (let i = 0; i < 18; i++) {
    const [status, tone, group] = quoteStates[i % quoteStates.length];
    const total = amount(i);
    QUOTES.push({
      id: `QT-${1007 - i}`, status, statusTone: tone, group,
      ref: `REF-${4290 - i * 7}`, quoteDate: date(i), expiryDate: date(i), expiryLabel: `Expired ${date(i)}`,
      comments: work[(i + 3) % work.length] + ".", total,
      items: [{ code: "LAB-01", description: work[(i + 3) % work.length], qty: 1, price: total, discount: 0, amount: total }],
      canRespond: false,
    });
  }

  for (let i = 0; i < 17; i++) {
    const total = amount(i + 5);
    INVOICES.push({
      id: `INV-${3288 - i * 2}`, status: "Paid", statusTone: "info", statusLabel: "Paid", group: "Paid",
      ref: `REF-${4280 - i * 7}`, invoiceDate: date(i), dueDate: date(i), dueLabel: `Paid ${date(i)}`,
      comments: work[(i + 6) % work.length] + ".", total,
      items: [{ code: "LAB-01", description: work[(i + 6) % work.length], qty: 1, price: total, discount: 0, amount: total }],
      payments: [{ date: date(i), reference: `EFT-${87000 + i * 13}`, description: "Payment", amount: total }],
      payable: false,
    });
  }

  const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  for (let i = 0; i < 15; i++) {
    const d = `${String(25 + (i % 5)).padStart(2, "0")} ${i < 5 ? "Aug" : i < 10 ? "Sep" : "Oct"} 2026`;
    const h = String(8 + (i % 7)).padStart(2, "0");
    APPOINTMENTS.push({
      id: `APT-${4 + i}`, group: "Future",
      dateLabel: `${weekdays[i % weekdays.length]}, ${d}`, time: `${h}:00 - ${h}:45`,
      start: `${d}, ${h}:00`, end: `${d}, ${h}:45`,
      address: streets[(i + 2) % streets.length], subject: work[(i + 1) % work.length], employees: [tech],
    });
  }
})();
