const SERVICES = [
  { id:"oil",     name:"Oil Change",            duration:"45 min",     price:"R899–R1 599",   icon:"🛢️", desc:"Full synthetic or conventional oil + filter replacement" },
  { id:"tire",    name:"Tire Change / Rotation", duration:"30–60 min",  price:"R350–R1 400",   icon:"🔄", desc:"Rotate, balance, or swap out tires at your location" },
  { id:"battery", name:"Battery Replacement",   duration:"30 min",     price:"R1 799–R3 199", icon:"⚡", desc:"Test, remove, and install a new battery on-site" },
  { id:"brake",   name:"Brake Service",         duration:"60–90 min",  price:"R2 299–R5 399", icon:"🛑", desc:"Pad replacement, rotor inspection and resurfacing" },
  { id:"diag",    name:"General Diagnostics",   duration:"45 min",     price:"R1 099",        icon:"🔍", desc:"Full OBD scan and vehicle health check-up" },
];

const TIMES = ["8:00 AM","9:00 AM","10:00 AM","11:00 AM","12:00 PM","1:00 PM","2:00 PM","3:00 PM","4:00 PM","5:00 PM"];

let state = {
  view: "home",
  step: 1,
  selectedService: null,
  selectedDate: "",
  selectedTime: "",
  form: { name:"", phone:"", email:"", address:"", vehicle:"", notes:"" },
  bookings: [],
  submitted: false,
};

function loadBookings() {
  try { state.bookings = JSON.parse(localStorage.getItem("mech_bookings_za") || "[]"); } catch {}
}

function saveBookings() {
  localStorage.setItem("mech_bookings_za", JSON.stringify(state.bookings));
}

function formatDate(d) { return d.toISOString().split("T")[0]; }
function displayDate(str) {
  const [y,m,day] = str.split("-");
  return new Date(y, m-1, day).toLocaleDateString("en-ZA", { weekday:"short", month:"short", day:"numeric" });
}
function getNext7Days() {
  const today = new Date();
  return Array.from({length:7}, (_,i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i + 1);
    return formatDate(d);
  });
}

function navigate(view) {
  state.view = view;
  render();
}

function resetBook() {
  state.step = 1;
  state.selectedService = null;
  state.selectedDate = "";
  state.selectedTime = "";
  state.form = { name:"", phone:"", email:"", address:"", vehicle:"", notes:"" };
  state.submitted = false;
}

async function saveBooking() {
  const booking = {
    id: Date.now().toString(),
    serviceId: state.selectedService.id,
    date: state.selectedDate,
    time: state.selectedTime,
    ...state.form,
    createdAt: new Date().toISOString()
  };
  state.bookings.unshift(booking);
  saveBookings();
  state.submitted = true;
  render();

  // Send emails via backend
  try {
    await fetch("/api/send-emails", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service: state.selectedService.name,
        date: displayDate(state.selectedDate),
        time: state.selectedTime,
        name: state.form.name,
        phone: state.form.phone,
        email: state.form.email,
        address: state.form.address,
        vehicle: state.form.vehicle,
        notes: state.form.notes,
      })
    });
  } catch (err) {
    console.error("Email sending failed:", err);
  }
}

function cancelBooking(id) {
  if (confirm("Cancel this booking?")) {
    state.bookings = state.bookings.filter(b => b.id !== id);
    saveBookings();
    render();
  }
}

// ── RENDER FUNCTIONS ──

function renderNav() {
  const count = state.bookings.length;
  return `
  <nav>
    <div class="logo" onclick="navigate('home')">🔧 MechOnWheels</div>
    <div class="nav-right">
      <button class="btn-outline" onclick="navigate('bookings')">
        My Bookings ${count > 0 ? `<span class="badge">${count}</span>` : ""}
      </button>
      <button class="btn-dark" onclick="navigate('book'); resetBook(); render();">Book Now</button>
    </div>
  </nav>`;
}

function renderHome() {
  return `
  ${renderNav()}
  <div class="hero">
    <div class="hero-tag">MOBILE CAR SERVICE · SOUTH AFRICA</div>
    <h1>We Come<br>To <span>You.</span></h1>
    <p>Book your car service online. We show up at your home, office or anywhere you need us.</p>
    <button class="btn-green" onclick="navigate('book'); resetBook(); render();">Book a Service →</button>
  </div>

  <div class="section">
    <h2>What We Fix</h2>
    <p>All services performed at your location</p>
    <div class="services-grid">
      ${SERVICES.map(s => `
        <div class="service-tile">
          <div class="icon">${s.icon}</div>
          <div class="name">${s.name}</div>
          <div class="price">${s.price}</div>
        </div>
      `).join("")}
    </div>
  </div>

  <div class="why">
    <div class="why-inner">
      <div class="why-item"><div class="wi">🏠</div><strong>At Your Location</strong><span>Home, office, or roadside</span></div>
      <div class="why-item"><div class="wi">⏱️</div><strong>Same-Day Slots</strong><span>Book and we're there fast</span></div>
      <div class="why-item"><div class="wi">🔒</div><strong>Trusted & Insured</strong><span>Certified mechanics only</span></div>
    </div>
  </div>

  <footer>© 2026 MechOnWheels · All rights reserved</footer>`;
}

function renderBookings() {
  const cards = state.bookings.map(b => {
    const svc = SERVICES.find(s => s.id === b.serviceId);
    return `
    <div class="booking-card">
      <div>
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
          <span style="font-size:20px">${svc?.icon}</span>
          <span class="bc-name">${svc?.name}</span>
        </div>
        <div class="bc-detail">📅 ${displayDate(b.date)} at ${b.time}</div>
        <div class="bc-detail">📍 ${b.address}</div>
        <div class="bc-detail">🚗 ${b.vehicle}</div>
      </div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;">
        <span class="badge-confirmed">CONFIRMED</span>
        <button class="btn-cancel" onclick="cancelBooking('${b.id}')">Cancel</button>
      </div>
    </div>`;
  }).join("");

  const empty = `
    <div style="text-align:center;padding:64px 0;color:#94a3b8;">
      <div style="font-size:48px;margin-bottom:16px;">📋</div>
      <div style="font-size:18px;font-weight:600;margin-bottom:8px;">No bookings yet</div>
      <button class="btn-dark" style="margin-top:12px;padding:10px 28px;border-radius:10px;" onclick="navigate('book');resetBook();render();">Book Your First Service</button>
    </div>`;

  return `
  ${renderNav()}
  <div class="booking-wrap">
    <h2 style="font-family:'Playfair Display',serif;font-size:30px;margin-bottom:8px;">My Bookings</h2>
    <p style="color:#64748b;margin-bottom:28px;">${state.bookings.length} appointment${state.bookings.length !== 1 ? "s" : ""} scheduled</p>
    ${state.bookings.length === 0 ? empty : cards}
  </div>`;
}

function renderProgress() {
  const steps = [["1","Service"],["2","Date & Time"],["3","Your Info"]];
  return `<div class="progress">
    ${steps.map(([n, label], i) => {
      const done = state.step > i+1;
      const active = state.step === i+1;
      const bg = done ? "#16a34a" : active ? "#0f172a" : "#e2e8f0";
      const col = (done||active) ? "#fff" : "#94a3b8";
      const lCol = active ? "#0f172a" : "#94a3b8";
      const lW = active ? 600 : 400;
      const line = i < 2 ? `<div class="step-line" style="background:${done?'#16a34a':'#e2e8f0'}"></div>` : "";
      return `
        <div class="step-col">
          <div class="step-circle" style="background:${bg};color:${col}">${done?"✓":n}</div>
          <span class="step-label" style="color:${lCol};font-weight:${lW}">${label}</span>
        </div>
        ${line}`;
    }).join("")}
  </div>`;
}

function renderStep1() {
  return `
  <h2 class="section-title">Choose a Service</h2>
  <p class="section-sub">Select what your car needs today</p>
  <div class="svc-grid">
    ${SERVICES.map(s => {
      const sel = state.selectedService?.id === s.id;
      return `
      <div class="svc-card ${sel?"selected":""}" onclick="selectService('${s.id}')">
        <div class="svc-icon">${s.icon}</div>
        <div class="svc-name">${s.name}</div>
        <div class="svc-desc">${s.desc}</div>
        <div class="svc-footer">
          <span class="svc-dur">${s.duration}</span>
          <span class="svc-price">${s.price}</span>
        </div>
      </div>`;
    }).join("")}
  </div>
  <div class="row-btns" style="justify-content:flex-end;">
    <button class="btn-continue" ${!state.selectedService?"disabled":""} onclick="goStep(2)">Continue →</button>
  </div>`;
}

function renderStep2() {
  const days = getNext7Days();
  const timesHtml = state.selectedDate ? `
    <div style="margin-bottom:24px;">
      <span class="label-sm">Available Times</span>
      <div class="date-grid">
        ${TIMES.map(t => `<button class="time-btn ${state.selectedTime===t?"selected":""}" onclick="selectTime('${t}')">${t}</button>`).join("")}
      </div>
    </div>` : "";

  return `
  <h2 class="section-title">Pick a Date & Time</h2>
  <p class="section-sub">Choose when works best for you</p>
  <div style="margin-bottom:24px;">
    <span class="label-sm">Available Dates</span>
    <div class="date-grid">
      ${days.map(d => `<button class="date-btn ${state.selectedDate===d?"selected":""}" onclick="selectDate('${d}')">${displayDate(d)}</button>`).join("")}
    </div>
  </div>
  ${timesHtml}
  <div class="row-btns">
    <button class="btn-back" onclick="goStep(1)">← Back</button>
    <button class="btn-continue" ${(!state.selectedDate||!state.selectedTime)?"disabled":""} onclick="goStep(3)">Continue →</button>
  </div>`;
}

function renderStep3() {
  const f = state.form;
  const valid = f.name.trim() && f.phone.trim() && f.address.trim() && f.vehicle.trim();
  const fields = [
    { key:"name",    label:"Full Name",            placeholder:"Mulweli Mungani",                       type:"text" },
    { key:"phone",   label:"Phone Number",          placeholder:"081 866 5412",                      type:"tel"  },
    { key:"email",   label:"Email (optional)",      placeholder:"you@email.co.za",                   type:"email"},
    { key:"address", label:"Service Address",       placeholder:"12 Main Rd, Sandton, Johannesburg", type:"text" },
    { key:"vehicle", label:"Vehicle",               placeholder:"2020 Toyota Corolla",               type:"text" },
  ];

  return `
  <h2 class="section-title">Your Details</h2>
  <p class="section-sub">So we know where to go and who to contact</p>
  <div class="summary-bar">
    <span>🔧 <strong>${state.selectedService?.name}</strong></span>
    <span>📅 ${displayDate(state.selectedDate)}</span>
    <span>⏰ ${state.selectedTime}</span>
  </div>
  ${fields.map(({key,label,placeholder,type}) => `
    <div class="form-group">
      <label>${label}</label>
      <input type="${type}" placeholder="${placeholder}" value="${f[key]}" oninput="updateForm('${key}', this.value)" onblur="revalidate()" />
    </div>
  `).join("")}
  <div class="form-group">
    <label>Additional Notes (optional)</label>
    <textarea rows="3" placeholder="Any specific issues or info for the mechanic..." oninput="updateForm('notes', this.value)">${f.notes}</textarea>
  </div>
  <div class="row-btns">
    <button class="btn-back" onclick="goStep(2)">← Back</button>
    <button class="btn-confirm" ${!valid?"disabled":""} onclick="saveBooking()">✓ Confirm Booking</button>
  </div>`;
}

function renderSuccess() {
  return `
  <div class="success">
    <div class="big-icon">✅</div>
    <h2>You're Booked!</h2>
    <p style="color:#64748b;font-size:16px;margin-bottom:8px;">
      ${state.form.name}, your <strong>${state.selectedService?.name}</strong> is confirmed for
    </p>
    <div class="success-box">
      <div style="font-weight:700;font-size:18px;color:#0f172a">${displayDate(state.selectedDate)} at ${state.selectedTime}</div>
      <div style="color:#64748b;margin-top:4px">📍 ${state.form.address}</div>
    </div>
    <p style="color:#64748b;margin-bottom:28px;">We'll contact you at ${state.form.phone} to confirm.</p>
    <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">
      <button class="btn-dark" style="border-radius:10px;padding:12px 28px;" onclick="navigate('bookings')">View My Bookings</button>
      <button class="btn-back" style="padding:12px 28px;" onclick="navigate('book');resetBook();render();">Book Another</button>
    </div>
  </div>`;
}

function renderBook() {
  return `
  ${renderNav()}
  <div class="booking-wrap">
    ${!state.submitted ? renderProgress() : ""}
    ${state.submitted ? renderSuccess() : state.step===1 ? renderStep1() : state.step===2 ? renderStep2() : renderStep3()}
  </div>`;
}

function render() {
  const app = document.getElementById("app");
  if (state.view === "home") app.innerHTML = renderHome();
  else if (state.view === "bookings") app.innerHTML = renderBookings();
  else app.innerHTML = renderBook();
}

// ── ACTIONS ──
function selectService(id) {
  state.selectedService = SERVICES.find(s => s.id === id);
  render();
}
function selectDate(d) { state.selectedDate = d; state.selectedTime = ""; render(); }
function selectTime(t) { state.selectedTime = t; render(); }
function updateForm(key, val) { state.form[key] = val; }
function revalidate() {
  const valid = state.form.name.trim() && state.form.phone.trim() && state.form.address.trim() && state.form.vehicle.trim();
  const btn = document.querySelector(".btn-confirm");
  if (btn) { btn.disabled = !valid; btn.style.background = valid ? "#16a34a" : "#e2e8f0"; btn.style.color = valid ? "#fff" : "#94a3b8"; }
}
function goStep(n) { state.step = n; render(); }

// ── INIT ──
loadBookings();
render();