// Leonida Legends: offline GTA VI trophy guide and tracker.
// Loads the trophy list and roadmap from local JSON, renders the checklist,
// and keeps earned ticks in localStorage. No network requests are made.
const STORAGE_KEY = 'leonida-legends-earned-v1';
const SPOILER_KEY = 'leonida-legends-spoiler-v1';

const listEl = document.getElementById('trophyList');
const roadmapEl = document.getElementById('roadmapList');
const searchEl = document.getElementById('search');
const kindEl = document.getElementById('kindFilter');
const gradeEl = document.getElementById('gradeFilter');
const earnedEl = document.getElementById('earnedFilter');
const spoilerEl = document.getElementById('spoilerToggle');
const countEl = document.getElementById('resultCount');
const emptyEl = document.getElementById('emptyNote');
const onlineEl = document.getElementById('onlineNote');
const detailSection = document.getElementById('detailSection');
const detailCard = document.getElementById('detailCard');

let earned = new Set(readStoredIds(STORAGE_KEY));
let spoiler = localStorage.getItem(SPOILER_KEY) === '1';
spoilerEl.checked = spoiler;

const data = await (await fetch('data/trophies.json')).json();
const roadmap = await (await fetch('data/roadmap.json')).json();
const trophies = data.trophies;

function readStoredIds(key) {
  try {
    const raw = JSON.parse(localStorage.getItem(key) ?? '[]');
    return Array.isArray(raw) ? raw.filter((n) => Number.isInteger(n)) : [];
  } catch {
    return [];
  }
}

function saveProgress() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...earned].sort((a, b) => a - b)));
}

function gradeCounts() {
  const counts = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
  for (const t of trophies) if (earned.has(t.id)) counts[t.grade] += 1;
  return counts;
}

function renderProgress() {
  const counts = gradeCounts();
  document.getElementById('progressText').textContent = `${earned.size} of ${trophies.length} earned`;
  document.getElementById('progressFill').style.width = `${(earned.size / trophies.length) * 100}%`;
  document.getElementById('progressDetail').textContent =
    `${counts.platinum} platinum · ${counts.gold} gold · ${counts.silver} silver · ${counts.bronze} bronze`;
}

function renderRoadmap() {
  document.getElementById('roadmapIntro').textContent = roadmap.intro;
  roadmapEl.replaceChildren();
  for (const stage of roadmap.stages) {
    const members = trophies.filter((t) => t.stage === stage.stage);
    const done = members.filter((t) => earned.has(t.id)).length;
    const li = document.createElement('li');
    const num = document.createElement('span');
    num.className = 'stage-num';
    num.textContent = `Stage ${stage.stage}`;
    const title = document.createElement('h3');
    title.textContent = stage.title;
    const goal = document.createElement('p');
    goal.textContent = stage.goal;
    const note = document.createElement('p');
    note.textContent = stage.note;
    const count = document.createElement('p');
    count.className = 'stage-count';
    count.textContent = `${done} of ${members.length} trophies in this stage earned`;
    li.append(num, title, goal, note, count);
    roadmapEl.append(li);
  }
}

function matchesFilters(t) {
  const q = searchEl.value.trim().toLowerCase();
  if (q && !`${t.name} ${t.description}`.toLowerCase().includes(q)) return false;
  if (gradeEl.value !== 'all' && t.grade !== gradeEl.value) return false;
  if (earnedEl.value === 'earned' && !earned.has(t.id)) return false;
  if (earnedEl.value === 'unearned' && earned.has(t.id)) return false;
  if (kindEl.value === 'missable' && !t.missable) return false;
  if (kindEl.value === 'online') return false;
  if (kindEl.value !== 'all' && kindEl.value !== 'missable' && kindEl.value !== 'online' && t.kind !== kindEl.value) return false;
  return true;
}

function hiddenBySpoiler(t) {
  return spoiler && t.kind === 'story' && !earned.has(t.id);
}

function renderList() {
  onlineEl.hidden = kindEl.value !== 'online';
  listEl.replaceChildren();
  let shown = 0;
  for (const t of trophies) {
    if (!matchesFilters(t)) continue;
    shown += 1;
    const li = document.createElement('li');
    if (earned.has(t.id)) li.className = 'earned';
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = earned.has(t.id);
    box.setAttribute('aria-label', `Mark ${t.name} as earned`);
    box.addEventListener('change', () => {
      if (box.checked) earned.add(t.id);
      else earned.delete(t.id);
      saveProgress();
      renderAll();
    });
    const body = document.createElement('div');
    body.className = 'trophy-body';
    const title = document.createElement('h3');
    const openBtn = document.createElement('button');
    openBtn.type = 'button';
    openBtn.textContent = hiddenBySpoiler(t) ? 'Hidden story trophy — earn it to reveal' : t.name;
    openBtn.addEventListener('click', () => showDetail(t));
    title.append(openBtn);
    const desc = document.createElement('p');
    desc.className = 'desc';
    desc.textContent = hiddenBySpoiler(t) ? 'Its name and description are hidden until earned (spoiler-safe mode).' : t.description;
    const meta = document.createElement('p');
    meta.className = 'meta';
    const grade = document.createElement('span');
    grade.className = `grade ${t.grade}`;
    grade.textContent = t.grade;
    const kind = document.createElement('span');
    kind.className = 'kind-tag';
    kind.textContent = t.kind;
    meta.append(grade, kind);
    if (t.missable) {
      const flag = document.createElement('span');
      flag.className = 'flag';
      flag.textContent = 'Missable';
      meta.append(flag);
    }
    const guide = document.createElement('p');
    guide.textContent = hiddenBySpoiler(t) ? 'Guide hidden until earned.' : t.guide;
    const sources = document.createElement('p');
    sources.className = 'sources';
    sources.textContent = `Sources: ${t.sources.join(' · ')}`;
    body.append(title, desc, meta, guide, sources);
    li.append(box, body);
    listEl.append(li);
  }
  countEl.textContent = `Showing ${shown} of ${trophies.length} trophies · ${earned.size} earned`;
  emptyEl.hidden = shown > 0;
}

function showDetail(t) {
  detailSection.hidden = false;
  detailCard.replaceChildren();
  const title = document.createElement('h3');
  title.textContent = hiddenBySpoiler(t) ? 'Hidden story trophy' : t.name;
  const desc = document.createElement('p');
  desc.className = 'desc';
  desc.textContent = hiddenBySpoiler(t) ? 'Hidden until earned (spoiler-safe mode).' : `Official description: ${t.description}`;
  const meta = document.createElement('p');
  meta.className = 'meta';
  meta.textContent = `Grade: ${t.grade} · Kind: ${t.kind} · Roadmap stage ${t.stage}${t.missable ? ' · Missable' : ''}`;
  const guide = document.createElement('p');
  guide.textContent = hiddenBySpoiler(t) ? 'Guide hidden until earned.' : t.guide;
  detailCard.append(title, desc, meta, guide);
  if (t.missable && t.missableNote) {
    const warn = document.createElement('p');
    warn.className = 'missable-note';
    warn.textContent = `Missable — ${t.missableNote}`;
    detailCard.append(warn);
  }
  const stepsTitle = document.createElement('h4');
  stepsTitle.textContent = 'Steps';
  const steps = document.createElement('ol');
  for (const step of t.steps) {
    const item = document.createElement('li');
    item.textContent = step;
    steps.append(item);
  }
  const sources = document.createElement('p');
  sources.className = 'sources';
  sources.textContent = `Sources: ${t.sources.join(' · ')} — guides are written in our own words; sources are cited, never copied.`;
  detailCard.append(stepsTitle, steps, sources);
  detailSection.scrollIntoView({ behavior: 'auto', block: 'start' });
}

function renderAll() {
  renderProgress();
  renderRoadmap();
  renderList();
}

function exportProgress() {
  const payload = { game: 'Grand Theft Auto VI', exportedAt: new Date().toISOString(), earned: [...earned].sort((a, b) => a - b) };
  const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'gta6-trophy-progress.json';
  link.click();
  URL.revokeObjectURL(url);
}

async function importProgress(file) {
  if (!file) return;
  const payload = JSON.parse(await file.text());
  const ids = Array.isArray(payload) ? payload : payload.earned;
  if (!Array.isArray(ids)) throw new Error('That file does not hold a trophy progress list.');
  earned = new Set(ids.filter((n) => Number.isInteger(n) && trophies.some((t) => t.id === n)));
  saveProgress();
  renderAll();
}

document.getElementById('exportBtn').addEventListener('click', exportProgress);
document.getElementById('importInput').addEventListener('change', async (event) => {
  try {
    await importProgress(event.target.files[0]);
  } catch (error) {
    alert(`Could not import that file: ${error.message}`);
  }
  event.target.value = '';
});
document.getElementById('resetBtn').addEventListener('click', () => {
  if (confirm('Clear all earned trophies?')) {
    earned = new Set();
    saveProgress();
    renderAll();
  }
});
document.getElementById('closeDetail').addEventListener('click', () => {
  detailSection.hidden = true;
});
spoilerEl.addEventListener('change', () => {
  spoiler = spoilerEl.checked;
  localStorage.setItem(SPOILER_KEY, spoiler ? '1' : '0');
  renderList();
});
for (const el of [searchEl, kindEl, gradeEl, earnedEl]) el.addEventListener('input', renderList);

renderAll();
