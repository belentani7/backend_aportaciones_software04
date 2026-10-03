const $ = (selector) => document.querySelector(selector);
const state = { contacts: [], jobs: [], runs: [], governance: null };

async function api(path, options = {}) {
  const response = await fetch(path, { credentials: "include", headers: { "Content-Type": "application/json", ...(options.headers || {}) }, ...options });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
  return data;
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character]));
}

function formatDate(value) {
  if (!value) return "Nunca";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" });
}

function renderContacts() {
  if (!state.contacts.length) { $("#contacts").innerHTML = '<p class="muted">No hay contactos todavía.</p>'; return; }
  $("#contacts").innerHTML = `<table><thead><tr><th>Nombre</th><th>Email</th><th>Estado</th><th>Valor</th></tr></thead><tbody>${state.contacts.map((contact) => `<tr><td>${escapeHtml(contact.name)}</td><td class="muted">${escapeHtml(contact.email)}</td><td><span class="tag">${escapeHtml(contact.status)}</span></td><td>${escapeHtml(contact.value)} €</td></tr>`).join("")}</tbody></table>`;
}

function renderJobs() {
  if (!state.jobs.length) { $("#jobs").innerHTML = '<p class="muted">No hay automatizaciones programadas.</p>'; return; }
  $("#jobs").innerHTML = state.jobs.map((job) => `<div class="job"><div><div class="job-name">${escapeHtml(job.jobName)}</div><div class="job-meta">${escapeHtml(job.schedule)} · ${escapeHtml(job.status)} · última: ${formatDate(job.lastRunAt)}</div></div><div class="job-actions"><span class="tag ${job.status === "active" ? "ok-text" : ""}">${escapeHtml(job.status)}</span><button class="button small secondary" data-run="${job.id}">Ejecutar</button></div></div>`).join("");
  document.querySelectorAll("[data-run]").forEach((button) => button.addEventListener("click", async () => {
    button.disabled = true;
    button.textContent = "…";
    try { await api(`/api/crm/jobs/${button.dataset.run}/run`, { method: "POST" }); await load(); }
    catch (error) { alert(error.message); }
    finally { button.disabled = false; button.textContent = "Ejecutar"; }
  }));
}

function renderRuns() {
  if (!state.runs.length) { $("#runs").innerHTML = '<p class="muted">Aún no existen ejecuciones. Usa “Ejecutar” para probar el flujo.</p>'; return; }
  $("#runs").innerHTML = `<table><thead><tr><th>Job</th><th>Estado</th><th>Fase</th><th>Idempotencia</th><th>Inicio</th></tr></thead><tbody>${state.runs.map((run) => `<tr><td>#${run.jobId}</td><td class="${run.status === "succeeded" ? "ok-text" : ""}">${escapeHtml(run.status)}</td><td>${escapeHtml(run.phase)}</td><td class="muted">${escapeHtml(run.idempotencyKey)}</td><td>${formatDate(run.startedAt)}</td></tr>`).join("")}</tbody></table>`;
}

function renderGovernance() {
  const panel = $("#governance-panel");
  const governance = state.governance;
  if (!governance) { panel.classList.add("hidden"); return; }
  panel.classList.remove("hidden");
  $("#kill-status").textContent = governance.killSwitchActive ? "PAUSADO" : "ACTIVO";
  $("#kill-updated").textContent = formatDate(governance.updatedAt);
  $("#ledger-count").textContent = String(governance.ledger?.length || 0);
  const button = $("#kill-switch");
  button.textContent = governance.killSwitchActive ? "Reanudar con motivo" : "Activar kill switch";
  button.classList.toggle("secondary", governance.killSwitchActive);
  $("#governance-audit").innerHTML = governance.auditLogs?.length
    ? `<table><thead><tr><th>Evento</th><th>Fecha</th></tr></thead><tbody>${governance.auditLogs.map((entry) => `<tr><td>${escapeHtml(entry.eventType)}</td><td class="muted">${formatDate(entry.createdAt)}</td></tr>`).join("")}</tbody></table>`
    : '<p class="muted">No hay entradas de gobierno para esta cuenta.</p>';
}

async function load() {
  try {
    const [contacts, jobs, runs] = await Promise.all([api("/api/crm/contacts"), api("/api/crm/jobs"), api("/api/crm/runs")]);
    let governance = null;
    try { governance = await api("/api/crm/governance"); } catch { governance = null; }
    state.contacts = contacts.contacts || [];
    state.jobs = jobs.jobs || [];
    state.runs = runs.runs || [];
    state.governance = governance;
    $("#auth-status").textContent = "Sesión activa";
    $("#auth-status").classList.add("ok");
    $("#login-panel").classList.add("hidden");
    $("#contact-count").textContent = state.contacts.length;
    $("#job-count").textContent = state.jobs.filter((job) => job.status === "active").length;
    $("#last-run").textContent = formatDate(state.runs[0]?.finishedAt || state.runs[0]?.startedAt);
    renderContacts(); renderJobs(); renderRuns(); renderGovernance();
  } catch (error) {
    $("#auth-status").textContent = "Sin sesión";
    $("#login-panel").classList.remove("hidden");
    $("#contacts").innerHTML = `<p class="muted">${escapeHtml(error.message)}</p>`;
    $("#jobs").innerHTML = `<p class="muted">${escapeHtml(error.message)}</p>`;
    $("#runs").innerHTML = '<p class="muted">Autentícate para ver ejecuciones.</p>';
    state.governance = null; renderGovernance();
  }
}

$("#refresh").addEventListener("click", load);
$("#new-contact").addEventListener("click", () => $("#contact-form").classList.toggle("hidden"));
$("#contact-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  try { await api("/api/crm/contacts", { method: "POST", body: JSON.stringify(Object.fromEntries(form.entries())) }); event.currentTarget.reset(); event.currentTarget.classList.add("hidden"); await load(); }
  catch (error) { alert(error.message); }
});
$("#kill-switch").addEventListener("click", async () => {
  if (!state.governance) return;
  const nextActive = !state.governance.killSwitchActive;
  const reason = window.prompt(nextActive ? "Motivo para activar el kill switch:" : "Motivo para reanudar operaciones:", "Owner confirmation");
  if (!reason || reason.trim().length < 3) return;
  try { await api("/api/crm/governance/kill-switch", { method: "POST", body: JSON.stringify({ active: nextActive, reason: reason.trim() }) }); await load(); }
  catch (error) { alert(error.message); }
});

load();
