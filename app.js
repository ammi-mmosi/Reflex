const seedDeliveries = [
  {
    id: "RX-1048",
    customer: "Amina Wanjiku",
    phone: "0712 456 890",
    address: "Kileleshwa, Nairobi",
    item: "Samsung Galaxy A15",
    status: "Open",
    rider: null,
    created: "8 min ago",
    code: null,
  },
  {
    id: "RX-1047",
    customer: "Brian Otieno",
    phone: "0798 123 455",
    address: "Lavington, Nairobi",
    item: "Makita power drill",
    status: "Assigned",
    rider: "David K.",
    created: "24 min ago",
    code: "K7M4Q",
  },
  {
    id: "RX-1046",
    customer: "Mary Njeri",
    phone: "0701 887 234",
    address: "Parklands, Nairobi",
    item: "iPhone 13 screen protector",
    status: "Picked Up",
    rider: "Samuel O.",
    created: "1 hr ago",
    code: "P2X8L",
  },
  {
    id: "RX-1045",
    customer: "Kevin Mwangi",
    phone: "0722 334 901",
    address: "Kilimani, Nairobi",
    item: "JBL Flip 6 speaker",
    status: "Delivered",
    rider: "David K.",
    created: "2 hrs ago",
    code: "H9Q3R",
  },
  {
    id: "RX-1044",
    customer: "Faith Achieng",
    phone: "0744 610 778",
    address: "South B, Nairobi",
    item: "USB-C charging hub",
    status: "Delivered",
    rider: "Samuel O.",
    created: "3 hrs ago",
    code: "D6T1N",
  },
];
const defaultRiders = [
  { name: "David K.", initials: "DK", deliveries: 2, color: "#f4c95d" },
  { name: "Samuel O.", initials: "SO", deliveries: 2, color: "#dcebf1" },
  { name: "Lucy W.", initials: "LW", deliveries: 0, color: "#e8d7e4" },
];
const branchProfiles = {
  westlands: {
    shop: "Kijani Electronics",
    branch: "Westlands branch",
    area: "Westlands area",
    seedDeliveries,
    seedRiders: defaultRiders,
  },
  cbd: {
    shop: "Kijani Electronics",
    branch: "CBD branch",
    area: "CBD area",
    seedDeliveries: [
      {
        id: "RX-2048",
        customer: "Nadia Kamau",
        phone: "0720 551 802",
        address: "Kenyatta Avenue, Nairobi",
        item: "Lenovo wireless keyboard",
        status: "Open",
        rider: null,
        created: "12 min ago",
        code: null,
      },
      {
        id: "RX-2047",
        customer: "Owen Maina",
        phone: "0718 442 109",
        address: "Tom Mboya Street, Nairobi",
        item: "Anker power bank",
        status: "Assigned",
        rider: "Grace N.",
        created: "31 min ago",
        code: "C4B8M",
      },
      {
        id: "RX-2046",
        customer: "Zuri Wambui",
        phone: "0705 663 410",
        address: "Moi Avenue, Nairobi",
        item: "Sony WH-CH520 headphones",
        status: "Delivered",
        rider: "Grace N.",
        created: "2 hrs ago",
        code: "N2D7P",
      },
    ],
    seedRiders: [
      { name: "Grace N.", initials: "GN", deliveries: 1, color: "#f4c95d" },
      { name: "Isaac M.", initials: "IM", deliveries: 0, color: "#dcebf1" },
    ],
  },
};
let currentBranch = localStorage.getItem("reflex-branch") || "westlands";
let currentRole = "dispatcher";
let deliveries = [];
let riders = [];
let backendAvailable = false;
const appView = document.getElementById("app-view");
const toast = document.getElementById("toast");
async function loadBranch(branchId) {
  const profile = branchProfiles[branchId] || branchProfiles.westlands;
  currentBranch = branchProfiles[branchId] ? branchId : "westlands";
  let serverState = null;
  try {
    const response = await fetch(`/api/state?branch=${currentBranch}`);
    if (!response.ok) throw new Error("Backend unavailable");
    serverState = await response.json();
    backendAvailable = true;
  } catch {
    backendAvailable = false;
  }
  deliveries =
    serverState?.deliveries ||
    JSON.parse(
      localStorage.getItem(`reflex-${currentBranch}-deliveries`) ||
        (currentBranch === "westlands"
          ? localStorage.getItem("reflex-deliveries")
          : "null"),
    ) ||
    profile.seedDeliveries.map((delivery) => ({ ...delivery }));
  riders =
    serverState?.riders ||
    JSON.parse(
      localStorage.getItem(`reflex-${currentBranch}-riders`) ||
        (currentBranch === "westlands" ? localStorage.getItem("reflex-riders") : "null"),
    ) ||
    profile.seedRiders.map((rider) => ({ ...rider }));
  localStorage.setItem("reflex-branch", currentBranch);
  if (backendAvailable && !serverState?.deliveries) save();
  if (backendAvailable && !serverState?.riders) saveRiders();
}
function currentProfile() {
  return branchProfiles[currentBranch];
}
function save() {
  localStorage.setItem(
    `reflex-${currentBranch}-deliveries`,
    JSON.stringify(deliveries),
  );
  syncBackend();
}
function saveRiders() {
  localStorage.setItem(
    `reflex-${currentBranch}-riders`,
    JSON.stringify(riders),
  );
  syncBackend();
}
function syncBackend() {
  if (!backendAvailable) return;
  fetch(`/api/state?branch=${currentBranch}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ deliveries, riders }),
  }).catch(() => {
    backendAvailable = false;
  });
}
function updateWorkspaceChrome() {
  const profile = currentProfile();
  const switcher = document.getElementById("workspace-switcher");
  switcher.querySelector("b").textContent = profile.shop;
  switcher.querySelector("small").textContent = profile.branch;
  switcher.querySelector(".shop-avatar").textContent = profile.branch[0];
}
function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2600);
}
function statusClass(status) {
  return status.toLowerCase().replace(" ", "-");
}
function statusPill(status) {
  return `<span class="status ${statusClass(status)}">${status}</span>`;
}
function header(title, subtitle, action = "") {
  const eyebrow = `${currentProfile().branch} · ${currentRole === "dispatcher" ? "Tuesday, 14 May 2024" : "Your delivery desk"}`;
  return `
    <div class="page-heading">
      <div>
        <p class="eyebrow">${eyebrow}</p>
        <h1>${title}</h1>
        <p class="subheading">${subtitle}</p>
      </div>
      ${action}
    </div>`;
}
function metrics() {
  const open = deliveries.filter((d) => d.status === "Open").length;
  const active = deliveries.filter((d) =>
    ["Assigned", "Picked Up"].includes(d.status),
  ).length;
  const done = deliveries.filter((d) => d.status === "Delivered").length;
  return `
    <div class="metrics">
      <div class="metric-card">
        <div class="metric-top">Open requests <span class="metric-icon">+</span></div>
        <div class="metric-value">${open}<span class="metric-delta">today</span></div>
      </div>
      <div class="metric-card">
        <div class="metric-top">In progress <span class="metric-icon">↗</span></div>
        <div class="metric-value">${active}<span class="metric-delta">active</span></div>
      </div>
      <div class="metric-card">
        <div class="metric-top">Delivered today <span class="metric-icon">✓</span></div>
        <div class="metric-value">${done}<span class="metric-delta">+12%</span></div>
      </div>
      <div class="metric-card">
        <div class="metric-top">Avg. delivery <span class="metric-icon">◷</span></div>
        <div class="metric-value">42<span class="metric-delta">min</span></div>
      </div>
    </div>`;
}
function deliveryAction(delivery) {
  if (currentRole === "dispatcher" && delivery.status === "Open") {
    return `<button class="text-button" data-assign="${delivery.id}">Assign</button>`;
  }
  return `<button class="text-button" data-track="${delivery.id}">View</button>`;
}
function deliveryTableRow(delivery) {
  return `
    <tr>
      <td>
        <span class="delivery-id">${delivery.id}</span>
        <span class="address">${delivery.created}</span>
      </td>
      <td>
        <span class="customer">${delivery.customer}</span>
        <span class="address">${delivery.address}</span>
      </td>
      <td>${statusPill(delivery.status)}</td>
      <td><span class="rider-name">${delivery.rider || "Unassigned"}</span></td>
      <td>${deliveryAction(delivery)}</td>
    </tr>`;
}
function deliveryMobileCard(delivery) {
  return `
    <div class="delivery-row">
      <div class="delivery-row-top">
        <span class="delivery-id">${delivery.id}</span>
        ${statusPill(delivery.status)}
      </div>
      <span class="customer">${delivery.customer}</span>
      <span class="address">${delivery.address}</span>
      <div class="delivery-row-bottom">
        <span>${delivery.rider || "Unassigned"} · ${delivery.created}</span>
        ${deliveryAction(delivery)}
      </div>
    </div>`;
}
function deliveryRows(items) {
  if (!items.length) {
    return '<div class="empty-state">No deliveries match this view.</div>';
  }
  const tableRows = items.map(deliveryTableRow).join("");
  const mobileCards = items.map(deliveryMobileCard).join("");
  return `
    <table class="delivery-table">
      <thead>
        <tr><th>Delivery</th><th>Customer</th><th>Status</th><th>Rider</th><th></th></tr>
      </thead>
      <tbody>${tableRows}</tbody>
    </table>
    <div class="mobile-table-card">${mobileCards}</div>`;
}
function recentActivity() {
  const primaryRider = riders[0]?.name || "A rider";
  const latestDelivery = deliveries[0]?.id || "a delivery";
  return `
    <div class="panel">
      <div class="panel-header">
        <div>
          <h2 class="panel-title">Recent activity</h2>
          <p class="panel-subtitle">A quick look at what changed</p>
        </div>
        <button class="text-button" data-view="activity">See all</button>
      </div>
      <div class="activity-list">
        <div class="activity-item"><span class="activity-dot">↗</span><div><p><b>${primaryRider}</b> is on the delivery team</p><time>24 minutes ago</time></div></div>
        <div class="activity-item"><span class="activity-dot">✓</span><div><p><b>${latestDelivery}</b> is being tracked</p><time>2 hours ago</time></div></div>
        <div class="activity-item"><span class="activity-dot">+</span><div><p>Latest request <b>${latestDelivery}</b> is in this branch</p><time>8 minutes ago</time></div></div>
      </div>
    </div>`;
}
function renderOverview() {
  const open = deliveries.filter((d) => d.status === "Open");
  appView.innerHTML =
    header(
      `Good morning, Jane · ${currentProfile().branch}`,
      `Here is what is happening with your ${currentProfile().area} deliveries today.`,
      '<button class="primary-button" id="new-request">+ New delivery</button>',
    ) +
    metrics() +
    `<div class="dashboard-grid">
      <div class="panel">
        <div class="panel-header">
          <div><h2 class="panel-title">Open requests</h2><p class="panel-subtitle">Assign a rider to keep things moving</p></div>
          <button class="text-button" data-view="deliveries">View all</button>
        </div>
        ${deliveryRows(open)}
      </div>
      ${recentActivity()}
    </div>`;
}
function renderDeliveries() {
  appView.innerHTML =
    header(
      "Deliveries",
      "Track every request from the shop to the customer.",
      '<button class="primary-button" id="new-request">+ New delivery</button>',
    ) +
    `<div class="list-toolbar">
      <input class="search-box" id="search" placeholder="Search by ID, customer or address" />
      <select class="filter-select" id="status-filter">
        <option value="all">All statuses</option>
        <option>Open</option><option>Assigned</option><option>Picked Up</option><option>Delivered</option>
      </select>
    </div>
    <div class="panel" id="delivery-panel">${deliveryRows(deliveries)}</div>`;
  document.getElementById("search").addEventListener("input", filterDeliveries);
  document
    .getElementById("status-filter")
    .addEventListener("change", filterDeliveries);
}
function filterDeliveries() {
  const term = document.getElementById("search").value.toLowerCase();
  const filter = document.getElementById("status-filter").value;
  const items = deliveries.filter(
    (d) =>
      (filter === "all" || d.status === filter) &&
      [d.id, d.customer, d.address].join(" ").toLowerCase().includes(term),
  );
  document.getElementById("delivery-panel").innerHTML = deliveryRows(items);
  bindDynamic();
}
function renderRiders() {
  appView.innerHTML =
    header("Riders", "Your delivery team and their current workload.") +
    `<div class="rider-cards">
      ${riders
        .map((r) => {
          const activeCount = deliveries.filter(
            (d) => d.rider === r.name && d.status !== "Delivered",
          ).length;
          return `
          <div class="rider-card">
            <div class="rider-card-head">
              <span class="rider-avatar" style="background:${r.color}">${r.initials}</span>
              <div><h3>${r.name}</h3><small>${r.area || currentProfile().area}</small></div>
            </div>
            <p class="availability">● Available now</p>
            <div class="rider-stat"><span>Active deliveries</span><strong>${activeCount}</strong></div>
          </div>`;
        })
        .join("")}
    </div>`;
}
function renderActivity() {
  const primaryRider = riders[0]?.name || "A rider";
  const latestDelivery = deliveries[0]?.id || "a delivery";
  appView.innerHTML =
    header("Activity", "A complete record of changes across your workspace.") +
    `<div class="panel">
      <div class="activity-list">
        <div class="activity-item"><span class="activity-dot">↗</span><div><p><b>Jane Mwangi</b> is managing <b>${currentProfile().branch}</b></p><time>Today, 10:42 AM</time></div></div>
        <div class="activity-item"><span class="activity-dot">✓</span><div><p><b>${latestDelivery}</b> is assigned to <b>${primaryRider}</b></p><time>Today, 9:18 AM</time></div></div>
        <div class="activity-item"><span class="activity-dot">✓</span><div><p><b>${primaryRider}</b> is available in ${currentProfile().area}</p><time>Today, 8:56 AM</time></div></div>
        <div class="activity-item"><span class="activity-dot">+</span><div><p><b>${latestDelivery}</b> was created in this branch</p><time>Today, 8:49 AM</time></div></div>
      </div>
    </div>`;
}
function renderRetailer() {
  const mine = deliveries.slice(0, 4);
  appView.innerHTML =
    header("Track a delivery", "Stay in the loop without calling the shop.") +
    `<div class="panel" style="max-width:840px">
      <div class="panel-header">
        <div><h2 class="panel-title">Your recent deliveries</h2><p class="panel-subtitle">Status refreshes automatically every few seconds</p></div>
        <button class="text-button" id="new-request">+ New request</button>
      </div>
      ${deliveryRows(mine)}
    </div>`;
}
function renderRider() {
  const riderName = riders[0]?.name;
  const assigned = deliveries.filter(
    (d) => d.rider === riderName && d.status !== "Delivered",
  );
  appView.innerHTML =
    header(
      "Your route today",
      `${assigned.length} deliveries are waiting for you.`,
    ) +
    `<div class="panel">
      <div class="panel-header">
        <div><h2 class="panel-title">Assigned to you</h2><p class="panel-subtitle">Update each stop as you move</p></div>
      </div>
      ${
        assigned.length
          ? deliveryRows(assigned).replace(
              /<button class="text-button" data-track="(.*?)">View<\/button>/g,
              '<button class="text-button" data-update="$1">Update</button>',
            )
          : '<div class="empty-state">You are all caught up.</div>'
      }
    </div>`;
}
function render() {
  updateWorkspaceChrome();
  applyRoleAccess();
  const activeView =
    document.querySelector(".nav-item.active")?.dataset.view || "overview";
  if (currentRole === "retailer") renderRetailer();
  else if (currentRole === "rider") renderRider();
  else if (activeView === "deliveries") renderDeliveries();
  else if (activeView === "riders") renderRiders();
  else if (activeView === "activity") renderActivity();
  else renderOverview();
  bindDynamic();
  document.getElementById("delivery-count").textContent = deliveries.filter(
    (d) => d.status === "Open",
  ).length;
}
function openNewRequest() {
  document.getElementById("modal-content").innerHTML =
    `<h2 id="modal-title">New delivery request</h2>
     <p>Give your rider everything they need for a smooth handoff.</p>
     <form class="form-grid" id="request-form">
       <div class="form-field"><label>Customer name</label><input required name="customer" placeholder="e.g. Amina Wanjiku" /></div>
       <div class="form-field"><label>Phone number</label><input required name="phone" placeholder="07XX XXX XXX" /></div>
       <div class="form-field"><label>Delivery address</label><input required name="address" placeholder="Area, street or landmark" /></div>
       <div class="form-field"><label>Item description</label><input required name="item" placeholder="What is being delivered?" /></div>
       <div class="form-actions"><button type="button" class="secondary-button" id="cancel-modal">Cancel</button><button class="primary-button">Create request</button></div>
     </form>`;
  showModal();
  document.getElementById("request-form").onsubmit = (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    deliveries.unshift({
      ...data,
      id: "RX-" + (1049 + deliveries.length),
      status: "Open",
      rider: null,
      created: "just now",
      code: null,
    });
    save();
    closeModal();
    render();
    showToast("Delivery request created");
  };
  document.getElementById("cancel-modal").onclick = closeModal;
}
function openAssign(id) {
  const d = deliveries.find((x) => x.id === id);
  document.getElementById("modal-content").innerHTML =
    `<h2 id="modal-title">Assign ${id}</h2>
     <p>Choose an available rider for ${d.customer}.</p>
     <form class="form-grid" id="assign-form">
       <div class="form-field"><label>Rider</label><select name="rider" required><option value="">Select a rider</option>${riders.map((r) => `<option>${r.name}</option>`).join("")}</select></div>
       <div class="form-actions"><button type="button" class="secondary-button" id="cancel-modal">Cancel</button><button class="primary-button">Assign delivery</button></div>
     </form>`;
  showModal();
  document.getElementById("assign-form").onsubmit = (e) => {
    e.preventDefault();
    d.rider = new FormData(e.target).get("rider");
    d.status = "Assigned";
    d.code = Math.random().toString(36).slice(2, 7).toUpperCase();
    save();
    closeModal();
    render();
    showToast(`${d.id} assigned successfully`);
  };
  document.getElementById("cancel-modal").onclick = closeModal;
}
function openUpdate(id) {
  const d = deliveries.find((x) => x.id === id);
  document.getElementById("modal-content").innerHTML =
    `<h2 id="modal-title">Update ${id}</h2>
     <p>${d.customer} · ${d.address}</p>
     <div class="form-actions" style="justify-content:stretch">
       <button class="secondary-button" style="flex:1" id="pickup">Mark picked up</button>
       <button class="primary-button" style="flex:1" id="deliver">Confirm delivery</button>
     </div>
     <div class="form-field" style="margin-top:18px"><label>Confirmation code</label><input id="code-input" placeholder="Enter 5-character code" maxlength="5" /></div>`;
  showModal();
  document.getElementById("pickup").onclick = () => {
    d.status = "Picked Up";
    save();
    closeModal();
    render();
    showToast("Delivery marked as picked up");
  };
  document.getElementById("deliver").onclick = () => {
    if (document.getElementById("code-input").value.toUpperCase() !== d.code) {
      showToast("That confirmation code does not match");
      return;
    }
    d.status = "Delivered";
    save();
    closeModal();
    render();
    showToast("Delivery confirmed");
  };
}
function openTrack(id) {
  const d = deliveries.find((x) => x.id === id);
  const steps = ["Open", "Assigned", "Picked Up", "Delivered"];
  const current = steps.indexOf(d.status);
  const timeline = steps
    .map(
      (step, index) =>
        `<div class="timeline-step ${index < current ? "complete" : ""} ${index === current ? "current" : ""}">
          <span class="timeline-marker"></span>
          <div><b>${step}</b><small>${index < current ? "Completed" : index === current ? "Current status" : "Up next"}</small></div>
        </div>`,
    )
    .join("");
  document.getElementById("modal-content").innerHTML =
    `<h2 id="modal-title">${d.id}</h2>
     <p>${d.customer} · ${d.item}</p>
     <div class="track-head"><span class="track-id">${d.address}</span>${statusPill(d.status)}</div>
     <div class="timeline">${timeline}</div>
     ${d.code ? `<div class="code-box"><small>Confirmation code</small><br><strong>${d.code}</strong></div>` : ""}`;
  showModal();
}
let lastFocused = null;
function showModal() {
  lastFocused = document.activeElement;
  const backdrop = document.getElementById("modal-backdrop");
  backdrop.hidden = false;
  const firstField = document.querySelector(
    "#modal-content input, #modal-content select, #modal-content button",
  );
  firstField?.focus();
  document.addEventListener("keydown", handleModalKeydown);
}
function closeModal() {
  document.getElementById("modal-backdrop").hidden = true;
  document.removeEventListener("keydown", handleModalKeydown);
  lastFocused?.focus();
}
function handleModalKeydown(e) {
  if (e.key === "Escape") closeModal();
}
function applyRoleAccess() {
  document.querySelectorAll("[data-roles]").forEach((element) => {
    const allowed = element.dataset.roles.split(",").includes(currentRole);
    element.hidden = !allowed;
  });
  document.querySelector(".profile small").textContent =
    currentRole[0].toUpperCase() + currentRole.slice(1);
}
function openInfoModal(title, content) {
  document.getElementById("modal-content").innerHTML =
    `<h2 id="modal-title">${title}</h2>${content}`;
  showModal();
}
function openWorkspace() {
  const branchButtons = Object.entries(branchProfiles)
    .map(
      ([branchId, profile]) =>
        `<button class="secondary-button workspace-choice" data-branch="${branchId}">${profile.shop} · ${profile.branch}</button>`,
    )
    .join("");
  openInfoModal(
    "Switch workspace",
    `<p>Select the workspace you want to manage.</p>
     <div class="form-grid">${branchButtons}</div>`,
  );
  document.querySelectorAll(".workspace-choice").forEach(
    (button) =>
      (button.onclick = () => {
        loadBranch(button.dataset.branch).then(() => {
          closeModal();
          render();
          showToast(`${currentProfile().branch} selected`);
        });
      }),
  );
}
function openNotifications() {
  const primaryRider = riders[0]?.name || "a rider";
  const latestDelivery = deliveries[0]?.id || "a delivery";
  openInfoModal(
    "Notifications",
    `<p>You are all caught up.</p>
     <div class="activity-list">
       <div class="activity-item"><span class="activity-dot">↗</span><div><p><b>${latestDelivery}</b> is assigned to ${primaryRider}.</p><time>24 minutes ago</time></div></div>
       <div class="activity-item"><span class="activity-dot">+</span><div><p>Latest request <b>${latestDelivery}</b> is in ${currentProfile().branch}.</p><time>8 minutes ago</time></div></div>
     </div>`,
  );
}
function openAccount() {
  openInfoModal(
    "Jane Mwangi",
    `<p>Dispatcher account</p>
     <div class="form-actions">
       <button class="secondary-button" id="account-close">Close</button>
       <button class="primary-button" id="account-toast">Account active</button>
     </div>`,
  );
  document.getElementById("account-close").onclick = closeModal;
  document.getElementById("account-toast").onclick = () => {
    closeModal();
    showToast("Your dispatcher account is active");
  };
}
function openSettings() {
  openInfoModal(
    "Settings",
    `<p>Manage your local demo workspace.</p>
     <div class="form-grid">
       <button class="secondary-button" id="add-rider">Add rider</button>
       <button class="secondary-button" id="manage-riders">Delete rider</button>
       <button class="secondary-button" id="export-data">Export deliveries (CSV)</button>
       <button class="secondary-button" id="reset-data">Reset demo data</button>
     </div>`,
  );
  document.getElementById("add-rider").onclick = openAddRider;
  document.getElementById("manage-riders").onclick = openDeleteRider;
  document.getElementById("export-data").onclick = exportDeliveries;
  document.getElementById("reset-data").onclick = resetData;
}
function openAddRider() {
  openInfoModal(
    "Add rider",
    `<p>Add a rider to your delivery team.</p>
     <form class="form-grid" id="rider-form">
       <div class="form-field"><label for="rider-name">Full name</label><input id="rider-name" required name="name" placeholder="e.g. Peter O." /></div>
       <div class="form-field"><label for="rider-area">Area</label><input id="rider-area" required name="area" placeholder="e.g. Westlands" /></div>
       <div class="form-actions"><button type="button" class="secondary-button" id="back-settings">Back</button><button class="primary-button">Add rider</button></div>
     </form>`,
  );
  document.getElementById("back-settings").onclick = openSettings;
  document.getElementById("rider-form").onsubmit = (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    const name = data.name.trim();
    if (riders.some((r) => r.name.toLowerCase() === name.toLowerCase())) {
      showToast("That rider already exists");
      return;
    }
    const initials = name
      .split(/\s+/)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
    riders.push({
      name,
      initials,
      area: data.area.trim(),
      deliveries: 0,
      color: "#dce9f5",
    });
    saveRiders();
    closeModal();
    render();
    showToast(`${name} added to the team`);
  };
}
function openDeleteRider() {
  const riderButtons = riders
    .map(
      (rider) =>
        `<button class="secondary-button delete-rider" data-rider="${rider.name}">${rider.name}<span>${rider.deliveries} active deliveries</span></button>`,
    )
    .join("");
  openInfoModal(
    "Delete rider",
    `<p>Choose a rider to remove from the team.</p>
     <div class="form-grid">${riderButtons}</div>`,
  );
  document
    .querySelectorAll(".delete-rider")
    .forEach(
      (button) => (button.onclick = () => deleteRider(button.dataset.rider)),
    );
}
function deleteRider(name) {
  const rider = riders.find((r) => r.name === name);
  const activeDeliveries = deliveries.filter(
    (d) => d.rider === name && d.status !== "Delivered",
  );
  if (activeDeliveries.length) {
    showToast(`${name} still has active deliveries`);
    return;
  }
  if (!window.confirm(`Remove ${name} from the team?`)) return;
  riders.splice(riders.indexOf(rider), 1);
  saveRiders();
  closeModal();
  render();
  showToast(`${name} removed`);
}
function exportDeliveries() {
  const headers = [
    "ID",
    "Customer",
    "Phone",
    "Address",
    "Item",
    "Status",
    "Rider",
    "Created",
  ];
  const rows = deliveries.map((d) => [
    d.id,
    d.customer,
    d.phone,
    d.address,
    d.item,
    d.status,
    d.rider || "",
    d.created,
  ]);
  const csv = [headers, ...rows]
    .map((row) =>
      row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","),
    )
    .join("\n");
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  link.download = "reflex-deliveries.csv";
  link.click();
  URL.revokeObjectURL(link.href);
  closeModal();
  showToast("Deliveries exported");
}
function resetData() {
  if (
    !window.confirm(
      "Reset all deliveries and riders to the original demo data?",
    )
  )
    return;
  deliveries = currentProfile().seedDeliveries.map((delivery) => ({
    ...delivery,
  }));
  riders = currentProfile().seedRiders.map((rider) => ({ ...rider }));
  save();
  saveRiders();
  closeModal();
  render();
  showToast("Demo data reset");
}
function bindDynamic() {
  document.querySelectorAll("[data-view]").forEach(
    (b) =>
      (b.onclick = () => {
        document.querySelectorAll(".nav-item").forEach((n) => {
          n.classList.remove("active");
          if (n.hasAttribute("aria-pressed"))
            n.setAttribute("aria-pressed", "false");
        });
        const nav = document.querySelector(
          `.nav-item[data-view="${b.dataset.view}"]`,
        );
        if (nav) {
          nav.classList.add("active");
          nav.setAttribute("aria-pressed", "true");
        }
        render();
      }),
  );
  document
    .querySelectorAll("[data-track]")
    .forEach((b) => (b.onclick = () => openTrack(b.dataset.track)));
  document
    .querySelectorAll("[data-assign]")
    .forEach((b) => (b.onclick = () => openAssign(b.dataset.assign)));
  document
    .querySelectorAll("[data-update]")
    .forEach((b) => (b.onclick = () => openUpdate(b.dataset.update)));
  document.querySelectorAll(".delivery-row").forEach((row) => {
    const id = row.querySelector(".delivery-id")?.textContent;
    if (
      currentRole === "dispatcher" &&
      id &&
      deliveries.find((d) => d.id === id)?.status === "Open"
    )
      row.onclick = (e) => {
        if (!e.target.closest("button")) openAssign(id);
      };
  });
  const newButton = document.getElementById("new-request");
  if (newButton) newButton.onclick = openNewRequest;
}
document.getElementById("brand-home").onclick = (e) => {
  e.preventDefault();
  document.querySelector('.nav-item[data-view="overview"]').click();
};
document.getElementById("workspace-switcher").onclick = openWorkspace;
document.getElementById("settings-button").onclick = openSettings;
document.getElementById("notifications-button").onclick = openNotifications;
document.getElementById("account-button").onclick = openAccount;
document.querySelectorAll(".role-button").forEach(
  (button) =>
    (button.onclick = () => {
      currentRole = button.dataset.role;
      document.querySelectorAll(".role-button").forEach((b) => {
        b.classList.toggle("active", b === button);
        b.setAttribute("aria-pressed", b === button ? "true" : "false");
      });
      render();
    }),
);
document.getElementById("modal-close").onclick = closeModal;
document.getElementById("modal-backdrop").onclick = (e) => {
  if (e.target.id === "modal-backdrop") closeModal();
};
loadBranch(currentBranch).then(render);
setInterval(() => {
  document
    .querySelector(".sync-note small")
    ?.replaceChildren(document.createTextNode("Updated just now"));
}, 5000);
