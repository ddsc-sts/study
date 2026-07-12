// ---------- Configuração dos espaços (PIN -> calendário) ----------
// Isso NÃO é segurança de verdade (tudo roda no navegador) — é só uma
// forma simples de separar os dois calendários num único site.

const SPACE_CONFIG = {
  '1234': {
    id: 'school',
    label: 'calendário escolar',
    sub: '/// organize a semana, entenda a prova',
    storageKey: 'studyPlannerTasks_school',
    hasExplain: true,
    hasSubject: true,
    topicsLabel: 'O que vai cair na prova? (conteúdo, capítulos, temas)',
    types: [
      { id: 'estudo', label: 'estudo', color: 'var(--accent-blue)' },
      { id: 'prova', label: 'prova', color: 'var(--accent-coral)' },
      { id: 'trabalho', label: 'trabalho', color: 'var(--accent-lilac)' },
      { id: 'outro', label: 'outro', color: 'var(--accent-yellow)' },
    ],
  },
  '2574': {
    id: 'home',
    label: 'afazeres de casa',
    sub: '/// organize a rotina lá de casa',
    storageKey: 'studyPlannerTasks_home',
    hasExplain: false,
    hasSubject: false,
    topicsLabel: '',
    types: [
      { id: 'limpeza', label: 'limpeza', color: 'var(--accent-blue)' },
      { id: 'comida', label: 'fazer comida', color: 'var(--accent-coral)' },
      { id: 'bichos', label: 'cuidar dos bichos', color: 'var(--accent-lilac)' },
      { id: 'outro', label: 'outro', color: 'var(--accent-yellow)' },
    ],
  },
};

const SESSION_KEY = 'plannerActiveSpacePin';

// ---------- Estado ----------

let currentSpace = null; // objeto de SPACE_CONFIG
let tasks = [];
let currentWeekStart = getMonday(new Date());
let editingTaskId = null;
let activeDetailId = null;
let selectedType = null;

const WEEKDAYS = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB', 'DOM'];
const MONTHS_SHORT = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

// ---------- Login por PIN ----------

const loginScreen = document.getElementById('loginScreen');
const appView = document.getElementById('appView');
const loginForm = document.getElementById('loginForm');
const pinInput = document.getElementById('pinInput');
const loginError = document.getElementById('loginError');

function tryEnterSpace(pin) {
  const space = SPACE_CONFIG[pin];
  if (!space) {
    loginError.classList.remove('hidden');
    pinInput.value = '';
    pinInput.focus();
    return;
  }
  loginError.classList.add('hidden');
  sessionStorage.setItem(SESSION_KEY, pin);
  enterSpace(space);
}

function enterSpace(space) {
  currentSpace = space;
  tasks = loadTasks();
  currentWeekStart = getMonday(new Date());

  document.getElementById('spaceLabel').textContent = space.label;
  document.getElementById('spaceSub').textContent = space.sub;

  buildTypePicker();
  document.getElementById('subjectField').classList.toggle('hidden', !space.hasSubject);

  loginScreen.classList.add('hidden');
  appView.classList.remove('hidden');
  renderWeek();
}

loginForm.addEventListener('submit', (e) => {
  e.preventDefault();
  tryEnterSpace(pinInput.value.trim());
});

document.getElementById('switchSpaceBtn').addEventListener('click', () => {
  sessionStorage.removeItem(SESSION_KEY);
  currentSpace = null;
  appView.classList.add('hidden');
  loginScreen.classList.remove('hidden');
  pinInput.value = '';
  pinInput.focus();
});

// entra direto se já tinha uma sessão ativa nessa aba
(function initSession() {
  const savedPin = sessionStorage.getItem(SESSION_KEY);
  if (savedPin && SPACE_CONFIG[savedPin]) {
    enterSpace(SPACE_CONFIG[savedPin]);
  }
})();

// ---------- Persistência (por espaço) ----------

function loadTasks() {
  try {
    const raw = localStorage.getItem(currentSpace.storageKey);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Erro ao carregar tarefas', e);
    return [];
  }
}

function saveTasks() {
  localStorage.setItem(currentSpace.storageKey, JSON.stringify(tasks));
}

// ---------- Helpers de tipo ----------

function getTypeInfo(typeId) {
  return currentSpace.types.find((t) => t.id === typeId) || currentSpace.types[currentSpace.types.length - 1];
}

function buildTypePicker() {
  const picker = document.getElementById('typePicker');
  picker.innerHTML = '';
  currentSpace.types.forEach((t, idx) => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'type-chip' + (idx === 0 ? ' active' : '');
    chip.dataset.type = t.id;
    chip.textContent = t.label;
    picker.appendChild(chip);
  });
  selectedType = currentSpace.types[0].id;
  updateTopicsFieldVisibility();
}

document.getElementById('typePicker').addEventListener('click', (e) => {
  const chip = e.target.closest('.type-chip');
  if (!chip) return;
  setSelectedType(chip.dataset.type);
});

function setSelectedType(typeId) {
  selectedType = typeId;
  document.querySelectorAll('.type-chip').forEach((chip) => {
    chip.classList.toggle('active', chip.dataset.type === typeId);
  });
  updateTopicsFieldVisibility();
}

function updateTopicsFieldVisibility() {
  const show = currentSpace.hasExplain && selectedType === 'prova';
  const field = document.getElementById('topicsField');
  field.classList.toggle('hidden', !show);
  if (show) {
    document.querySelector('#topicsField label').textContent = currentSpace.topicsLabel;
  }
}

// ---------- Helpers de data ----------

function getMonday(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function toISODate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function formatWeekLabel(monday) {
  const sunday = addDays(monday, 6);
  const sameMonth = monday.getMonth() === sunday.getMonth();
  if (sameMonth) {
    return `${monday.getDate()}–${sunday.getDate()} ${MONTHS_SHORT[monday.getMonth()]}`;
  }
  return `${monday.getDate()} ${MONTHS_SHORT[monday.getMonth()]} – ${sunday.getDate()} ${MONTHS_SHORT[sunday.getMonth()]}`;
}

// ---------- Render ----------

function renderWeek() {
  document.getElementById('weekLabel').textContent = formatWeekLabel(currentWeekStart);

  const grid = document.getElementById('weekGrid');
  grid.innerHTML = '';
  const today = new Date();

  for (let i = 0; i < 7; i++) {
    const day = addDays(currentWeekStart, i);
    const iso = toISODate(day);
    const dayTasks = tasks
      .filter((t) => t.date === iso)
      .sort((a, b) => (a.time || '99:99').localeCompare(b.time || '99:99'));

    const col = document.createElement('div');
    col.className = 'day-col' + (isSameDay(day, today) ? ' is-today' : '');

    const head = document.createElement('div');
    head.className = 'day-head';
    head.innerHTML = `<div class="dow">${WEEKDAYS[i]}</div><div class="dom">${String(day.getDate()).padStart(2, '0')}</div>`;
    col.appendChild(head);

    const body = document.createElement('div');
    body.className = 'day-body';

    if (dayTasks.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'day-empty';
      empty.textContent = 'nada por aqui';
      body.appendChild(empty);
    } else {
      dayTasks.forEach((t, idx) => {
        body.appendChild(renderTaskCard(t, idx));
      });
    }

    col.appendChild(body);
    grid.appendChild(col);
  }
}

function renderTaskCard(task, idx) {
  const typeInfo = getTypeInfo(task.type);
  const card = document.createElement('div');
  card.className = 'task-card';
  card.style.setProperty('--card-accent', typeInfo.color);
  card.style.setProperty('--tilt', idx % 2 === 0 ? '-0.6deg' : '0.5deg');

  card.innerHTML = `
    <div class="tape"></div>
    <div class="t-type">${typeInfo.label}</div>
    <div class="t-title">${escapeHtml(task.title)}</div>
    ${task.time ? `<div class="t-time">${task.time}</div>` : ''}
  `;

  card.addEventListener('click', () => openDetailModal(task.id));
  return card;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

// ---------- Modal: nova/editar tarefa ----------

const taskOverlay = document.getElementById('taskOverlay');
const taskForm = document.getElementById('taskForm');

function openTaskModal(taskId = null) {
  editingTaskId = taskId;
  const deleteBtn = document.getElementById('deleteTaskBtn');

  if (taskId) {
    const t = tasks.find((x) => x.id === taskId);
    document.getElementById('taskModalTitle').textContent = 'Editar tarefa';
    document.getElementById('fTitle').value = t.title;
    document.getElementById('fDate').value = t.date;
    document.getElementById('fTime').value = t.time || '';
    document.getElementById('fSubject').value = t.subject || '';
    document.getElementById('fTopics').value = t.topics || '';
    document.getElementById('fNotes').value = t.notes || '';
    setSelectedType(t.type);
    deleteBtn.classList.remove('hidden');
  } else {
    document.getElementById('taskModalTitle').textContent = 'Nova tarefa';
    taskForm.reset();
    document.getElementById('fDate').value = toISODate(new Date());
    setSelectedType(currentSpace.types[0].id);
    deleteBtn.classList.add('hidden');
  }

  taskOverlay.classList.add('open');
}

function closeTaskModal() {
  taskOverlay.classList.remove('open');
  editingTaskId = null;
}

document.getElementById('openAddBtn').addEventListener('click', () => openTaskModal(null));
document.getElementById('closeTaskModal').addEventListener('click', closeTaskModal);
taskOverlay.addEventListener('click', (e) => { if (e.target === taskOverlay) closeTaskModal(); });

taskForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const data = {
    title: document.getElementById('fTitle').value.trim(),
    date: document.getElementById('fDate').value,
    time: document.getElementById('fTime').value,
    subject: currentSpace.hasSubject ? document.getElementById('fSubject').value.trim() : '',
    topics: document.getElementById('fTopics').value.trim(),
    notes: document.getElementById('fNotes').value.trim(),
    type: selectedType,
  };

  if (!data.title || !data.date) return;

  if (editingTaskId) {
    const idx = tasks.findIndex((t) => t.id === editingTaskId);
    if (idx !== -1) {
      const prev = tasks[idx];
      const contentChanged = prev.subject !== data.subject || prev.topics !== data.topics;
      tasks[idx] = { ...prev, ...data, explanation: contentChanged ? null : prev.explanation };
    }
  } else {
    tasks.push({ id: crypto.randomUUID(), explanation: null, ...data });
  }

  saveTasks();
  renderWeek();
  closeTaskModal();
});

document.getElementById('deleteTaskBtn').addEventListener('click', () => {
  if (!editingTaskId) return;
  if (!confirm('Excluir essa tarefa?')) return;
  tasks = tasks.filter((t) => t.id !== editingTaskId);
  saveTasks();
  renderWeek();
  closeTaskModal();
});

// ---------- Modal: detalhe + explicação IA ----------

const detailOverlay = document.getElementById('detailOverlay');

function openDetailModal(taskId) {
  activeDetailId = taskId;
  const t = tasks.find((x) => x.id === taskId);
  if (!t) return;

  const typeInfo = getTypeInfo(t.type);

  document.getElementById('detailTitle').textContent = t.title;

  const badge = document.getElementById('detailBadge');
  badge.textContent = typeInfo.label;
  badge.style.color = typeInfo.color;
  badge.style.borderColor = typeInfo.color;

  const dateObj = new Date(t.date + 'T00:00:00');
  const dateStr = `${String(dateObj.getDate()).padStart(2, '0')} de ${MONTHS_SHORT[dateObj.getMonth()]}`;
  const parts = [dateStr];
  if (t.time) parts.push(t.time);
  if (t.subject) parts.push(t.subject);
  document.getElementById('detailMeta').textContent = parts.join(' · ');

  document.getElementById('detailNotes').textContent = t.notes || '';
  document.getElementById('detailNotes').classList.toggle('hidden', !t.notes);

  const explainBox = document.getElementById('explainBox');
  const explainEmpty = document.getElementById('explainEmpty');
  const explainLoading = document.getElementById('explainLoading');
  const explainError = document.getElementById('explainError');
  const explainResult = document.getElementById('explainResult');

  explainLoading.classList.add('hidden');
  explainError.classList.add('hidden');
  explainResult.classList.add('hidden');
  explainEmpty.classList.add('hidden');

  if (currentSpace.hasExplain && t.type === 'prova' && t.topics) {
    explainBox.classList.remove('hidden');
    if (t.explanation) {
      renderExplanation(t.explanation);
    } else {
      explainEmpty.classList.remove('hidden');
    }
  } else {
    explainBox.classList.add('hidden');
  }

  detailOverlay.classList.add('open');
}

function closeDetailModal() {
  detailOverlay.classList.remove('open');
  activeDetailId = null;
}

document.getElementById('closeDetailModal').addEventListener('click', closeDetailModal);
detailOverlay.addEventListener('click', (e) => { if (e.target === detailOverlay) closeDetailModal(); });

document.getElementById('editTaskBtn').addEventListener('click', () => {
  const id = activeDetailId;
  closeDetailModal();
  openTaskModal(id);
});

document.getElementById('generateBtn').addEventListener('click', async () => {
  const t = tasks.find((x) => x.id === activeDetailId);
  if (!t) return;

  document.getElementById('explainEmpty').classList.add('hidden');
  document.getElementById('explainError').classList.add('hidden');
  document.getElementById('explainLoading').classList.remove('hidden');

  try {
    const res = await fetch('/api/explain', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject: t.subject, topics: t.topics }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Erro ao gerar explicação.');
    }

    const idx = tasks.findIndex((x) => x.id === t.id);
    tasks[idx].explanation = data;
    saveTasks();

    document.getElementById('explainLoading').classList.add('hidden');
    renderExplanation(data);
  } catch (err) {
    document.getElementById('explainLoading').classList.add('hidden');
    const errBox = document.getElementById('explainError');
    errBox.textContent = err.message;
    errBox.classList.remove('hidden');
    document.getElementById('explainEmpty').classList.remove('hidden');
  }
});

function renderExplanation(data) {
  const box = document.getElementById('explainResult');
  let html = '';

  if (data.resumo) {
    html += `<div class="study-card"><h4>resumo</h4><p class="study-summary">${escapeHtml(data.resumo)}</p></div>`;
  }

  if (Array.isArray(data.topicos) && data.topicos.length) {
    html += `<div class="study-card"><h4>tópicos</h4>`;
    data.topicos.forEach((topic) => {
      html += `<div class="topic-item"><div class="tt">${escapeHtml(topic.titulo)}</div><div class="te">${escapeHtml(topic.explicacao)}</div></div>`;
    });
    html += `</div>`;
  }

  if (data.exemplo) {
    html += `<div class="study-card"><h4>exemplo</h4><div class="example-box">${escapeHtml(data.exemplo)}</div></div>`;
  }

  if (Array.isArray(data.dicas_de_prova) && data.dicas_de_prova.length) {
    html += `<div class="study-card"><h4>dicas pra prova</h4><ul class="tips-list">${data.dicas_de_prova
      .map((d) => `<li>${escapeHtml(d)}</li>`)
      .join('')}</ul></div>`;
  }

  box.innerHTML = html;
  box.classList.remove('hidden');
}

// ---------- Navegação de semana ----------

document.getElementById('prevWeek').addEventListener('click', () => {
  currentWeekStart = addDays(currentWeekStart, -7);
  renderWeek();
});

document.getElementById('nextWeek').addEventListener('click', () => {
  currentWeekStart = addDays(currentWeekStart, 7);
  renderWeek();
});
