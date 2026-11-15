/* =========================================================
   planner.js — Academic Planner
   Features: add / edit / delete / complete tasks, filters,
   search, sorting, statistics, progress bar, localStorage,
   sample data, delete confirmation, toast notifications.
   ========================================================= */
(function () {
  "use strict";

  /* ---------- Constants ---------- */
  const STORAGE_KEY = "isaacPlanner.tasks.v1";
  const SEEDED_KEY = "isaacPlanner.seeded.v1"; // remembers that sample data was offered once
  const PRIORITY_RANK = { high: 3, medium: 2, low: 1 };
  const PRIORITY_LABEL = { high: "High", medium: "Medium", low: "Low" };

  const ICON = {
    edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>',
    trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>',
    calendar: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>'
  };

  /* ---------- DOM references ---------- */
  const $ = (id) => document.getElementById(id);
  const els = {
    form: $("task-form"), formTitle: $("form-title"), id: $("task-id"),
    title: $("task-title"), desc: $("task-desc"), due: $("task-due"),
    category: $("task-category"), priority: $("task-priority"), status: $("task-status"),
    submitLabel: $("task-submit-label"), cancel: $("task-cancel"),
    list: $("task-list"), empty: $("empty-state"), emptyTitle: $("empty-title"), emptyText: $("empty-text"),
    loadSamples: $("load-samples"), search: $("task-search"), sort: $("task-sort"),
    count: $("result-count"), banner: $("sample-banner"), removeSamples: $("remove-samples"),
    statTotal: $("stat-total"), statCompleted: $("stat-completed"), statPending: $("stat-pending"),
    statPercent: $("stat-percent"), progressBar: $("progress-bar"), progressText: $("progress-text"),
    progressTrack: $("progress-track"),
    confirm: $("confirm-dialog"), confirmText: $("confirm-text"), confirmOk: $("confirm-ok"), confirmCancel: $("confirm-cancel")
  };
  if (!els.form || !els.list) return;

  /* ---------- State ---------- */
  const state = { tasks: [], filter: "all", query: "", sort: "due-asc", pendingDeleteId: null };

  /* ---------- Helpers ---------- */
  function toast(message, type) {
    if (window.Toast) window.Toast.show(message, type);
  }

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function pad(n) { return String(n).padStart(2, "0"); }

  function toISODate(date) {
    return date.getFullYear() + "-" + pad(date.getMonth() + 1) + "-" + pad(date.getDate());
  }

  /** Parse "YYYY-MM-DD" as a local date (avoids timezone shifts). */
  function parseISODate(value) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || "");
    if (!match) return null;
    const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    return Number.isNaN(date.getTime()) ? null : date;
  }

  function startOfToday() {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  function daysFromToday(value) {
    const date = parseISODate(value);
    if (!date) return null;
    return Math.round((date - startOfToday()) / 86400000);
  }

  function formatDate(value) {
    const date = parseISODate(value);
    return date ? date.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" }) : "No date";
  }

  function offsetDate(days) {
    const d = startOfToday();
    d.setDate(d.getDate() + days);
    return toISODate(d);
  }

  /* ---------- Persistence ---------- */
  function loadTasks() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw === null) return null;
      const data = JSON.parse(raw);
      return Array.isArray(data) ? data.filter((t) => t && typeof t.id === "string") : [];
    } catch (err) {
      return [];
    }
  }

  function saveTasks() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.tasks));
      return true;
    } catch (err) {
      toast("Could not save: browser storage is unavailable.", "error");
      return false;
    }
  }

  /* ---------- Sample (demonstration) data ---------- */
  function createSampleTasks() {
    const now = Date.now();
    const make = (i, title, description, offset, category, priority, status) => ({
      id: "sample-" + uid() + i, title, description, due: offsetDate(offset), category, priority, status,
      sample: true, createdAt: now - i * 1000
    });
    return [
      make(1, "Write network security reflection", "Sample task: summarise key ideas from this week's cybersecurity reading.", 3, "Assignments", "medium", "pending"),
      make(2, "Revise cryptography basics for quiz", "Sample task: review symmetric vs asymmetric encryption notes.", 5, "Examinations", "high", "pending"),
      make(3, "Attend live lecture: threat modelling", "Sample task: join the session and take notes on common attack types.", 1, "Lectures", "low", "pending"),
      make(4, "Polish portfolio project descriptions", "Sample task: proofread the demonstration project pages.", 9, "Projects", "medium", "pending"),
      make(5, "Submit password policy case study", "Sample task: finalise and upload the case study document.", 2, "Assignments", "high", "pending"),
      make(6, "Football practice with friends", "Sample task: personal activity to keep a healthy balance.", -1, "Personal Activities", "low", "completed")
    ];
  }

  /* ---------- Derived data ---------- */
  function getVisibleTasks() {
    const query = state.query.trim().toLowerCase();

    let result = state.tasks.filter((task) => {
      if (state.filter === "pending" && task.status !== "pending") return false;
      if (state.filter === "completed" && task.status !== "completed") return false;
      if (state.filter === "high" && task.priority !== "high") return false;
      if (query) {
        const haystack = [task.title, task.description, task.category, PRIORITY_LABEL[task.priority], task.status]
          .join(" ").toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });

    const byDue = (a, b) => (a.due || "9999").localeCompare(b.due || "9999");
    const sorters = {
      "due-asc": (a, b) => byDue(a, b) || a.createdAt - b.createdAt,
      "due-desc": (a, b) => byDue(b, a) || a.createdAt - b.createdAt,
      priority: (a, b) => (PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority]) || byDue(a, b),
      newest: (a, b) => b.createdAt - a.createdAt
    };
    result = result.slice().sort(sorters[state.sort] || sorters["due-asc"]);
    return result;
  }

  function getStats() {
    const total = state.tasks.length;
    const completed = state.tasks.filter((t) => t.status === "completed").length;
    return { total, completed, pending: total - completed, percent: total ? Math.round((completed / total) * 100) : 0 };
  }

  /* ---------- Rendering ---------- */
  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function badge(text, modifier) {
    return el("span", "badge" + (modifier ? " badge--" + modifier : ""), text);
  }

  function iconButton(action, label, svg) {
    const btn = el("button", "icon-btn");
    btn.type = "button";
    btn.dataset.action = action;
    btn.setAttribute("aria-label", label);
    btn.title = label;
    btn.innerHTML = svg; // static, trusted markup
    return btn;
  }

  function buildTask(task) {
    const done = task.status === "completed";
    const li = el("li", "task task--" + task.priority + (done ? " task--done" : ""));
    li.dataset.id = task.id;

    const check = el("input", "task__check");
    check.type = "checkbox";
    check.checked = done;
    check.dataset.action = "toggle";
    check.setAttribute("aria-label", (done ? "Mark as pending: " : "Mark as completed: ") + task.title);

    const body = el("div");
    const heading = el("h3", "task__title");
    heading.appendChild(el("span", "", task.title));
    if (task.sample) heading.appendChild(badge("Sample", "sample"));
    body.appendChild(heading);
    if (task.description) body.appendChild(el("p", "task__desc", task.description));

    const meta = el("div", "task__meta");
    meta.appendChild(badge(PRIORITY_LABEL[task.priority] + " priority", task.priority));
    meta.appendChild(badge(task.category, "cat"));

    const due = el("span", "due");
    due.innerHTML = ICON.calendar; // static, trusted markup
    due.appendChild(document.createTextNode(formatDate(task.due)));
    meta.appendChild(due);

    if (done) {
      meta.appendChild(badge("Completed"));
    } else {
      const diff = daysFromToday(task.due);
      if (diff !== null && diff < 0) meta.appendChild(badge("Overdue by " + Math.abs(diff) + (Math.abs(diff) === 1 ? " day" : " days"), "overdue"));
      else if (diff === 0) meta.appendChild(badge("Due today", "medium"));
      else if (diff === 1) meta.appendChild(badge("Due tomorrow", "medium"));
      else meta.appendChild(badge("Pending"));
    }
    body.appendChild(meta);

    const actions = el("div", "task__actions");
    actions.appendChild(iconButton("edit", "Edit task: " + task.title, ICON.edit));
    actions.appendChild(iconButton("delete", "Delete task: " + task.title, ICON.trash));

    li.append(check, body, actions);
    return li;
  }

  function renderStats() {
    const s = getStats();
    els.statTotal.textContent = s.total;
    els.statCompleted.textContent = s.completed;
    els.statPending.textContent = s.pending;
    els.statPercent.textContent = s.percent + "%";
    els.progressText.textContent = s.percent + "%";
    els.progressBar.style.width = s.percent + "%";
    els.progressTrack.setAttribute("aria-valuenow", String(s.percent));
  }

  function render() {
    const visible = getVisibleTasks();
    els.list.replaceChildren(...visible.map(buildTask));

    const hasAny = state.tasks.length > 0;
    els.empty.hidden = visible.length > 0;
    if (!visible.length) {
      els.emptyTitle.textContent = hasAny ? "No matching tasks" : "No tasks yet";
      els.emptyText.textContent = hasAny
        ? "Try a different search term or filter."
        : "Add your first task using the form to start planning, or load a few sample tasks.";
      els.loadSamples.hidden = hasAny;
    }

    els.count.textContent = hasAny ? "Showing " + visible.length + " of " + state.tasks.length : "";
    els.banner.hidden = !state.tasks.some((t) => t.sample);
    renderStats();
  }

  /* ---------- Form handling ---------- */
  function setFieldError(inputEl, message) {
    const field = inputEl.closest(".field");
    const errorEl = $(inputEl.id + "-error");
    field.classList.toggle("field--error", Boolean(message));
    inputEl.setAttribute("aria-invalid", message ? "true" : "false");
    if (errorEl) errorEl.textContent = message || "";
  }

  function clearErrors() {
    setFieldError(els.title, "");
    setFieldError(els.due, "");
  }

  function validateForm() {
    let firstInvalid = null;
    const title = els.title.value.trim();
    if (!title) {
      setFieldError(els.title, "Please enter a task title.");
      firstInvalid = firstInvalid || els.title;
    } else setFieldError(els.title, "");

    if (!els.due.value) {
      setFieldError(els.due, "Please choose a due date.");
      firstInvalid = firstInvalid || els.due;
    } else if (!parseISODate(els.due.value)) {
      setFieldError(els.due, "Please enter a valid date.");
      firstInvalid = firstInvalid || els.due;
    } else setFieldError(els.due, "");

    return firstInvalid;
  }

  function enterEditMode(task) {
    els.id.value = task.id;
    els.title.value = task.title;
    els.desc.value = task.description || "";
    els.due.value = task.due;
    els.category.value = task.category;
    els.priority.value = task.priority;
    els.status.value = task.status;
    els.formTitle.textContent = "Edit task";
    els.submitLabel.textContent = "Save changes";
    els.cancel.hidden = false;
    clearErrors();
    els.form.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "center" });
    els.title.focus({ preventScroll: true });
  }

  function exitEditMode() {
    els.id.value = "";
    els.formTitle.textContent = "Add a task";
    els.submitLabel.textContent = "Add task";
    els.cancel.hidden = true;
    clearErrors();
  }

  els.form.addEventListener("submit", (event) => {
    event.preventDefault();
    const firstInvalid = validateForm();
    if (firstInvalid) { firstInvalid.focus(); return; }

    const data = {
      title: els.title.value.trim(),
      description: els.desc.value.trim(),
      due: els.due.value,
      category: els.category.value,
      priority: els.priority.value,
      status: els.status.value
    };

    const editingId = els.id.value;
    if (editingId) {
      const task = state.tasks.find((t) => t.id === editingId);
      if (task) {
        Object.assign(task, data, { sample: false }); // an edited sample becomes the user's own task
        toast("Task updated.");
      }
    } else {
      state.tasks.push(Object.assign({ id: uid(), sample: false, createdAt: Date.now() }, data));
      toast("Task added.");
    }

    saveTasks();
    render();
    els.form.reset(); // the reset listener below returns the form to "add" mode
    els.title.focus({ preventScroll: true });
  });

  els.form.addEventListener("reset", () => setTimeout(exitEditMode, 0));
  els.cancel.addEventListener("click", () => { els.form.reset(); toast("Edit cancelled.", "info"); });
  els.title.addEventListener("input", () => { if (els.title.value.trim()) setFieldError(els.title, ""); });
  els.due.addEventListener("input", () => { if (els.due.value) setFieldError(els.due, ""); });

  /* ---------- List interactions (event delegation) ---------- */
  els.list.addEventListener("change", (event) => {
    const box = event.target.closest('[data-action="toggle"]');
    if (!box) return;
    const id = box.closest(".task").dataset.id;
    const task = state.tasks.find((t) => t.id === id);
    if (!task) return;
    task.status = box.checked ? "completed" : "pending";
    saveTasks();
    render();
    // The list is rebuilt on render, so hand keyboard focus back to the same task
    const again = els.list.querySelector('[data-id="' + id + '"] .task__check');
    if (again) again.focus();
    toast(box.checked ? "Task marked as completed." : "Task moved back to pending.");
  });

  els.list.addEventListener("click", (event) => {
    const btn = event.target.closest("button[data-action]");
    if (!btn) return;
    const id = btn.closest(".task").dataset.id;
    const task = state.tasks.find((t) => t.id === id);
    if (!task) return;

    if (btn.dataset.action === "edit") {
      enterEditMode(task);
    } else if (btn.dataset.action === "delete") {
      state.pendingDeleteId = id;
      els.confirmText.textContent = "“" + task.title + "” will be permanently removed. This cannot be undone.";
      if (typeof els.confirm.showModal === "function") els.confirm.showModal();
      else els.confirm.setAttribute("open", "");
      els.confirmCancel.focus();
    }
  });

  /* ---------- Delete confirmation ---------- */
  function closeConfirm() {
    state.pendingDeleteId = null;
    if (typeof els.confirm.close === "function") els.confirm.close();
    else els.confirm.removeAttribute("open");
  }

  els.confirmCancel.addEventListener("click", closeConfirm);
  els.confirm.addEventListener("click", (e) => { if (e.target === els.confirm) closeConfirm(); });
  els.confirm.addEventListener("cancel", () => { state.pendingDeleteId = null; });

  els.confirmOk.addEventListener("click", () => {
    const id = state.pendingDeleteId;
    if (!id) return closeConfirm();
    state.tasks = state.tasks.filter((t) => t.id !== id);
    if (els.id.value === id) els.form.reset();
    saveTasks();
    render();
    closeConfirm();
    toast("Task deleted.", "info");
  });

  /* ---------- Toolbar: search, sort, filters ---------- */
  els.search.addEventListener("input", () => { state.query = els.search.value; render(); });
  els.sort.addEventListener("change", () => { state.sort = els.sort.value; render(); });

  const filterButtons = Array.from(document.querySelectorAll("[data-filter]"));
  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      state.filter = button.dataset.filter;
      filterButtons.forEach((b) => b.setAttribute("aria-pressed", String(b === button)));
      render();
    });
  });

  /* ---------- Sample data controls ---------- */
  els.removeSamples.addEventListener("click", () => {
    const before = state.tasks.length;
    state.tasks = state.tasks.filter((t) => !t.sample);
    const removed = before - state.tasks.length;
    saveTasks();
    render();
    toast(removed + " sample " + (removed === 1 ? "task" : "tasks") + " removed.", "info");
  });

  els.loadSamples.addEventListener("click", () => {
    state.tasks = state.tasks.concat(createSampleTasks());
    saveTasks();
    render();
    toast("Sample tasks loaded.");
  });

  /* ---------- Initialise ---------- */
  function init() {
    const stored = loadTasks();
    let seeded = null;
    try { seeded = localStorage.getItem(SEEDED_KEY); } catch (err) { /* storage unavailable */ }

    if (stored === null && !seeded) {
      state.tasks = createSampleTasks(); // first visit: show demonstration tasks
      try { localStorage.setItem(SEEDED_KEY, "1"); } catch (err) { /* ignore */ }
      saveTasks();
    } else {
      state.tasks = stored || [];
    }
    render();
  }

  init();
})();
