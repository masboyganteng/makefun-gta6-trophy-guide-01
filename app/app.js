// Leonida Ledger — GTA 6 trophy guide and tracker.
// Static, offline: the only file it loads at run time is data/trophies.json,
// a file inside app/. Progress lives in localStorage and never leaves the browser.

const STORAGE_KEY = "leonida-ledger-v1";
const DEMO_EARNED = [2, 3, 4, 8, 9, 16, 21, 35, 41, 44, 46, 53, 55];
const KIND_LABELS = {
  platinum: "Platinum",
  story: "Story",
  side: "Strangers & side",
  activity: "Activity",
  collectible: "Collectible",
  combat: "Combat & crime",
  economy: "Money & property",
  misc: "One-off moment",
  completion: "100% completion",
};

let trophyData = null;
let trophyList = [];
let roadmapPhases = [];
let savedProgress = loadSavedProgress();
let selectedId = 17;
let currentView = "tracker";

const params = new URLSearchParams(window.location.search);
if (params.get("demo") === "1" && savedProgress.earned.size === 0) seedDemoProgress();

function loadSavedProgress() {
  const fallback = { earned: new Set(), notes: {}, spoiler: true };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return {
      earned: new Set(Array.isArray(parsed.earned) ? parsed.earned : []),
      notes: parsed.notes && typeof parsed.notes === "object" ? parsed.notes : {},
      spoiler: parsed.spoiler !== false,
    };
  } catch {
    return fallback;
  }
}

function persistProgress() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
      earned: [...savedProgress.earned],
      notes: savedProgress.notes,
      spoiler: savedProgress.spoiler,
    }));
  } catch {
    // Storage full or blocked: the tracker still works in memory for this visit.
  }
}

function seedDemoProgress() {
  DEMO_EARNED.forEach((id) => savedProgress.earned.add(id));
  persistProgress();
}

function trophyById(id) {
  return trophyList.find((trophy) => trophy.id === id) || null;
}

function isSpoilerHidden(trophy) {
  return savedProgress.spoiler && trophy.kind === "story" && !savedProgress.earned.has(trophy.id);
}

function gradeDotColor(grade) {
  if (grade === "platinum") return "#bfe3ea";
  if (grade === "gold") return "#e8b64c";
  if (grade === "silver") return "#c9d2dc";
  return "#d08a4e";
}

function applyFilters() {
  const query = document.getElementById("searchInput").value.trim().toLowerCase();
  const grade = document.getElementById("gradeFilter").value;
  const kind = document.getElementById("kindFilter").value;
  const missable = document.getElementById("missableFilter").value;
  const status = document.getElementById("statusFilter").value;
  return trophyList.filter((trophy) => {
    if (grade !== "all" && trophy.grade !== grade) return false;
    if (kind !== "all" && trophy.kind !== kind) return false;
    if (missable === "watch" && trophy.missable !== "watch") return false;
    if (missable === "safe" && trophy.missable !== "safe") return false;
    if (status === "earned" && !savedProgress.earned.has(trophy.id)) return false;
    if (status === "unearned" && savedProgress.earned.has(trophy.id)) return false;
    if (query) {
      const haystack = `${trophy.name} ${trophy.description} ${trophy.guide} ${KIND_LABELS[trophy.kind] || ""}`.toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });
}

function renderTrophyList() {
  const list = document.getElementById("trophyList");
  const filtered = applyFilters();
  const earnedTotal = savedProgress.earned.size;
  document.getElementById("listMeta").textContent =
    `Showing ${filtered.length} of 55 trophies · ${earnedTotal} earned · ${55 - earnedTotal} to go`;
  list.innerHTML = "";
  if (filtered.length === 0) {
    const empty = document.createElement("li");
    empty.className = "trophy-item";
    empty.textContent = "No trophies match these filters. Loosen a filter or clear the search.";
    list.appendChild(empty);
    return;
  }
  filtered.forEach((trophy) => {
    const earned = savedProgress.earned.has(trophy.id);
    const hidden = isSpoilerHidden(trophy);
    const item = document.createElement("li");
    item.className = `trophy-item${earned ? " earned" : ""}${trophy.id === selectedId ? " selected" : ""}`;
    item.dataset.id = String(trophy.id);

    const check = document.createElement("input");
    check.type = "checkbox";
    check.className = "trophy-check";
    check.checked = earned;
    check.setAttribute("aria-label", `Mark ${hidden ? "hidden story trophy" : trophy.name} as earned`);
    check.addEventListener("click", (event) => {
      event.stopPropagation();
      toggleEarned(trophy.id);
    });

    const body = document.createElement("div");
    body.className = "trophy-body";
    const name = document.createElement("p");
    name.className = "trophy-name";
    name.textContent = hidden ? "Hidden story trophy" : trophy.name;
    const desc = document.createElement("p");
    desc.className = "trophy-desc";
    if (hidden) {
      desc.innerHTML = '<span class="spoiler-note">Hidden until earned — spoiler setting is on.</span>';
    } else {
      desc.textContent = trophy.description;
    }
    const tags = document.createElement("div");
    tags.className = "trophy-tags";
    tags.appendChild(makeTag(`grade-${trophy.grade}`, trophy.grade));
    tags.appendChild(makeTag("", KIND_LABELS[trophy.kind] || trophy.kind));
    if (trophy.target) tags.appendChild(makeTag("", `Target: ${trophy.target}`));
    if (trophy.missable === "watch") tags.appendChild(makeTag("watch", "⚠ Watch out"));
    if (earned) tags.appendChild(makeTag("earned-tag", "✓ Earned"));

    body.append(name, desc, tags);
    item.append(check, body);
    item.addEventListener("click", () => selectTrophy(trophy.id));
    list.appendChild(item);
  });
}

function makeTag(extraClass, text) {
  const tag = document.createElement("span");
  tag.className = `tag ${extraClass}`.trim();
  tag.textContent = text;
  return tag;
}

function renderStatsBar() {
  const bar = document.getElementById("statsBar");
  bar.innerHTML = "";
  const grades = ["platinum", "gold", "silver", "bronze"];
  grades.forEach((grade) => {
    const total = trophyList.filter((t) => t.grade === grade).length;
    const earned = trophyList.filter((t) => t.grade === grade && savedProgress.earned.has(t.id)).length;
    const chip = document.createElement("span");
    chip.className = "stat-chip";
    const dot = document.createElement("span");
    dot.className = "dot";
    dot.style.background = gradeDotColor(grade);
    chip.append(dot, document.createTextNode(`${grade}: `));
    const strong = document.createElement("strong");
    strong.textContent = `${earned}/${total}`;
    chip.appendChild(strong);
    bar.appendChild(chip);
  });
  const watchTotal = trophyList.filter((t) => t.missable === "watch").length;
  const watchEarned = trophyList.filter((t) => t.missable === "watch" && savedProgress.earned.has(t.id)).length;
  const watchChip = document.createElement("span");
  watchChip.className = "stat-chip";
  watchChip.append(document.createTextNode("Watch-out trophies: "));
  const watchStrong = document.createElement("strong");
  watchStrong.textContent = `${watchEarned}/${watchTotal}`;
  watchChip.appendChild(watchStrong);
  bar.appendChild(watchChip);
}

function renderProgressHeader() {
  const earned = savedProgress.earned.size;
  document.getElementById("earnedCount").textContent = String(earned);
  const fill = document.getElementById("progressFill");
  fill.style.width = `${Math.round((earned / 55) * 100)}%`;
  const bar = document.getElementById("progressBar");
  bar.setAttribute("aria-valuenow", String(earned));
  const note = document.getElementById("progressNote");
  if (earned === 0) note.textContent = "Your platinum journey starts here.";
  else if (earned < 14) note.textContent = "Story underway — keep the one-off moments in sight.";
  else if (earned < 30) note.textContent = "Halfway there. Strangers and activities next.";
  else if (earned < 54) note.textContent = "Cleanup phase — grinds and collectibles to go.";
  else note.textContent = "Leonida Legend. The platinum is yours.";
}

function renderDetailPane() {
  const pane = document.getElementById("detailPane");
  const trophy = trophyById(selectedId);
  pane.innerHTML = "";
  if (!trophy) {
    pane.innerHTML = '<p class="detail-empty">Pick a trophy from the list to read its guide.</p>';
    return;
  }
  const earned = savedProgress.earned.has(trophy.id);
  const hidden = isSpoilerHidden(trophy);

  const title = document.createElement("h2");
  title.textContent = hidden ? "Hidden story trophy" : trophy.name;
  const official = document.createElement("p");
  official.className = "detail-official";
  official.textContent = hidden
    ? "Official name and description hidden until earned (spoiler setting)."
    : `“${trophy.description}” — official description, PlayStation.`;

  const tags = document.createElement("div");
  tags.className = "trophy-tags";
  tags.appendChild(makeTag(`grade-${trophy.grade}`, trophy.grade));
  tags.appendChild(makeTag("", KIND_LABELS[trophy.kind] || trophy.kind));
  if (trophy.target) tags.appendChild(makeTag("", `PSN target: ${trophy.target}`));

  const missableBox = document.createElement("div");
  missableBox.className = `missable-box${trophy.missable === "safe" ? " safe" : ""}`;
  missableBox.textContent = trophy.missable === "watch"
    ? `⚠ Watch out — ${trophy.missableNote}`
    : `✓ Safe — ${trophy.missableNote}`;

  const guideLabel = document.createElement("p");
  guideLabel.className = "detail-label";
  guideLabel.textContent = "Guide — in our own words";
  const guide = document.createElement("div");
  guide.className = "detail-guide";
  if (hidden) {
    guide.innerHTML = "<p>Turn off the spoiler setting, or earn this trophy, to read its guide.</p>";
  } else {
    trophy.guide.split(/(?<=[.!?])\s+/).forEach((sentence) => {
      if (!sentence.trim()) return;
      const p = document.createElement("p");
      p.textContent = sentence.trim();
      guide.appendChild(p);
    });
  }

  const sourceLabel = document.createElement("p");
  sourceLabel.className = "detail-label";
  sourceLabel.textContent = "Sources";
  const sources = document.createElement("p");
  sources.className = "detail-sources";
  sources.textContent = hidden ? "—" : trophy.sources;

  const noteLabel = document.createElement("p");
  noteLabel.className = "detail-label";
  noteLabel.textContent = "Your note";
  const noteInput = document.createElement("textarea");
  noteInput.className = "note-input";
  noteInput.placeholder = "Where you found it, what worked, what to retry…";
  noteInput.value = savedProgress.notes[trophy.id] || "";
  noteInput.setAttribute("aria-label", `Note for ${trophy.name}`);
  noteInput.addEventListener("input", () => {
    savedProgress.notes[trophy.id] = noteInput.value;
    persistProgress();
  });

  const actions = document.createElement("div");
  actions.className = "detail-actions";
  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.textContent = earned ? "✓ Earned — unmark" : "Mark as earned";
  toggle.addEventListener("click", () => toggleEarned(trophy.id));
  const jump = document.createElement("button");
  jump.type = "button";
  jump.className = "ghost";
  jump.textContent = "Open roadmap";
  jump.addEventListener("click", () => showView("roadmap"));
  actions.append(toggle, jump);

  pane.append(title, official, tags, missableBox, guideLabel, guide, sourceLabel, sources, noteLabel, noteInput, actions);
}

function renderRoadmap() {
  const list = document.getElementById("roadmapList");
  list.innerHTML = "";
  roadmapPhases.forEach((phase) => {
    const item = document.createElement("li");
    const heading = document.createElement("h3");
    heading.textContent = phase.title;
    const text = document.createElement("p");
    text.textContent = phase.text;
    const trophies = document.createElement("p");
    trophies.className = "phase-trophies";
    trophies.textContent = `Trophies: ${phase.trophies}`;
    item.append(heading, text, trophies);
    list.appendChild(item);
  });
}

function renderWatchList() {
  const list = document.getElementById("watchList");
  list.innerHTML = "";
  trophyList.filter((t) => t.missable === "watch").forEach((trophy) => {
    const earned = savedProgress.earned.has(trophy.id);
    const item = document.createElement("li");
    item.className = `trophy-item${earned ? " earned" : ""}`;
    const check = document.createElement("input");
    check.type = "checkbox";
    check.className = "trophy-check";
    check.checked = earned;
    check.setAttribute("aria-label", `Mark ${trophy.name} as earned`);
    check.addEventListener("click", (event) => {
      event.stopPropagation();
      toggleEarned(trophy.id);
    });
    const body = document.createElement("div");
    body.className = "trophy-body";
    const name = document.createElement("p");
    name.className = "trophy-name";
    name.textContent = trophy.name;
    const desc = document.createElement("p");
    desc.className = "trophy-desc";
    desc.textContent = trophy.missableNote;
    const guide = document.createElement("p");
    guide.className = "trophy-desc";
    guide.textContent = trophy.guide;
    body.append(name, desc, guide);
    item.append(check, body);
    item.addEventListener("click", () => {
      selectTrophy(trophy.id);
      showView("tracker");
    });
    list.appendChild(item);
  });
}

function renderSourceList() {
  const list = document.getElementById("sourceList");
  if (!trophyData || !trophyData.sources) return;
  list.innerHTML = "";
  trophyData.sources.forEach((source) => {
    const item = document.createElement("li");
    item.textContent = source;
    list.appendChild(item);
  });
}

function renderAll() {
  renderProgressHeader();
  renderStatsBar();
  renderTrophyList();
  renderDetailPane();
  renderRoadmap();
  renderWatchList();
  renderSourceList();
}

function toggleEarned(id) {
  if (savedProgress.earned.has(id)) savedProgress.earned.delete(id);
  else savedProgress.earned.add(id);
  persistProgress();
  renderAll();
}

function selectTrophy(id) {
  selectedId = id;
  renderTrophyList();
  renderDetailPane();
}

function showView(view) {
  currentView = view;
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.view === view);
  });
  document.querySelectorAll(".view").forEach((section) => {
    section.classList.toggle("active", section.id === `view-${view}`);
  });
}

function exportProgress() {
  const payload = {
    app: "leonida-ledger",
    game: "Grand Theft Auto VI",
    exportedAt: new Date().toISOString(),
    earned: [...savedProgress.earned].sort((a, b) => a - b),
    notes: savedProgress.notes,
    spoiler: savedProgress.spoiler,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "gta6-trophies-progress.json";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  setImportStatus("Progress exported — check your downloads.");
}

function importProgress(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(String(reader.result));
      const earned = Array.isArray(parsed.earned) ? parsed.earned : parsed.trophies;
      if (!Array.isArray(earned)) throw new Error("no earned list");
      const valid = earned.filter((id) => Number.isInteger(id) && trophyById(id));
      savedProgress.earned = new Set(valid);
      if (parsed.notes && typeof parsed.notes === "object") savedProgress.notes = parsed.notes;
      if (typeof parsed.spoiler === "boolean") {
        savedProgress.spoiler = parsed.spoiler;
        document.getElementById("spoilerToggle").checked = parsed.spoiler;
      }
      persistProgress();
      renderAll();
      setImportStatus(`Imported ${valid.length} earned trophies.`);
    } catch {
      setImportStatus("That file could not be imported — it is not a Leonida Ledger export.");
    }
  };
  reader.readAsText(file);
}

function setImportStatus(message) {
  document.getElementById("importStatus").textContent = message;
  const top = document.getElementById("importStatusTop");
  if (top) top.textContent = message;
}

function resetAllProgress() {
  if (!window.confirm("Reset all 55 trophies to unearned and clear your notes?")) return;
  savedProgress.earned = new Set();
  savedProgress.notes = {};
  persistProgress();
  renderAll();
  setImportStatus("Progress reset.");
}

function bindControls() {
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", () => showView(tab.dataset.view));
  });
  ["searchInput", "gradeFilter", "kindFilter", "missableFilter", "statusFilter"].forEach((id) => {
    document.getElementById(id).addEventListener("input", renderTrophyList);
  });
  const spoiler = document.getElementById("spoilerToggle");
  spoiler.checked = savedProgress.spoiler;
  spoiler.addEventListener("change", () => {
    savedProgress.spoiler = spoiler.checked;
    persistProgress();
    renderTrophyList();
    renderDetailPane();
  });
  document.getElementById("exportBtn").addEventListener("click", exportProgress);
  const exportTop = document.getElementById("exportBtnTop");
  if (exportTop) exportTop.addEventListener("click", exportProgress);
  document.getElementById("importInput").addEventListener("change", (event) => {
    const file = event.target.files && event.target.files[0];
    if (file) importProgress(file);
    event.target.value = "";
  });
  const importTop = document.getElementById("importInputTop");
  if (importTop) importTop.addEventListener("change", (event) => {
    const file = event.target.files && event.target.files[0];
    if (file) importProgress(file);
    event.target.value = "";
  });
  document.getElementById("resetBtn").addEventListener("click", resetAllProgress);
}

async function loadTrophyData() {
  const response = await fetch("data/trophies.json");
  if (!response.ok) throw new Error(`trophies.json failed: ${response.status}`);
  trophyData = await response.json();
  trophyList = trophyData.trophies;
  roadmapPhases = trophyData.roadmap || [];
}

async function bootLeonidaLedger() {
  try {
    await loadTrophyData();
  } catch (error) {
    document.getElementById("trophyList").innerHTML =
      "<li class='trophy-item'>Could not load data/trophies.json. Serve app/ over HTTP (node serve.ts) and reload.</li>";
    return;
  }
  bindControls();
  renderAll();
  const shot = params.get("shot");
  const detailId = Number(params.get("trophy"));
  if (shot === "roadmap") showView("roadmap");
  else if (shot === "watch") showView("watch");
  else if (shot === "detail" || detailId) {
    if (trophyById(detailId)) selectedId = detailId;
    showView("tracker");
    renderAll();
  }
}

bootLeonidaLedger();
