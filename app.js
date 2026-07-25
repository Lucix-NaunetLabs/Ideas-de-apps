'use strict';

const STORAGE_KEY = 'appvault_ideas';

const CATEGORY_COLORS = {
  'PWA': '#A7D8DE',
  'Juego': '#FFB4B4',
  'Productividad': '#B9E8B0',
  'IA': '#C9B6F2',
  'Otra': '#FFD1A0'
};

/* ---------- Persistencia ---------- */

function loadIdeas() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('No se pudieron leer las ideas guardadas:', err);
    return [];
  }
}

function saveIdeas(ideas) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ideas));
}

function createIdeaId() {
  return (crypto.randomUUID ? crypto.randomUUID() : `idea-${Date.now()}-${Math.random().toString(16).slice(2)}`);
}

/* ---------- Elementos del DOM ---------- */

const screenList = document.getElementById('screen-list');
const screenDetail = document.getElementById('screen-detail');
const ideaListEl = document.getElementById('idea-list');
const emptyStateEl = document.getElementById('empty-state');

const btnNew = document.getElementById('btn-new');
const modalOverlay = document.getElementById('modal-overlay');
const btnCloseModal = document.getElementById('btn-close-modal');
const formNewIdea = document.getElementById('form-new-idea');
const inputNombre = document.getElementById('input-nombre');
const inputConcepto = document.getElementById('input-concepto');
const inputProblema = document.getElementById('input-problema');
const chipGroup = document.getElementById('chip-group');
const formError = document.getElementById('form-error');

const btnBack = document.getElementById('btn-back');
const detailSwatch = document.getElementById('detail-swatch');
const detailNombre = document.getElementById('detail-nombre');
const detailCategoria = document.getElementById('detail-categoria');
const detailConcepto = document.getElementById('detail-concepto');
const detailProblema = document.getElementById('detail-problema');
const detailFecha = document.getElementById('detail-fecha');
const btnDelete = document.getElementById('btn-delete');

const confirmOverlay = document.getElementById('confirm-overlay');
const btnConfirmCancel = document.getElementById('btn-confirm-cancel');
const btnConfirmDelete = document.getElementById('btn-confirm-delete');

let selectedCategory = null;
let currentDetailId = null;

/* ---------- Render de la lista ---------- */

function renderList() {
  const ideas = loadIdeas().sort((a, b) => b.timestamp - a.timestamp);
  ideaListEl.innerHTML = '';

  if (ideas.length === 0) {
    emptyStateEl.hidden = false;
    return;
  }
  emptyStateEl.hidden = true;

  for (const idea of ideas) {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'idea-card';
    card.setAttribute('data-id', idea.id);

    const swatch = document.createElement('span');
    swatch.className = 'swatch';
    swatch.style.background = CATEGORY_COLORS[idea.categoria] || CATEGORY_COLORS['Otra'];
    swatch.setAttribute('aria-hidden', 'true');

    const body = document.createElement('div');
    body.className = 'idea-card__body';

    const name = document.createElement('p');
    name.className = 'idea-card__name';
    name.textContent = idea.nombre;

    const concept = document.createElement('p');
    concept.className = 'idea-card__concept';
    concept.textContent = idea.concepto;

    body.append(name, concept);
    card.append(swatch, body);
    card.addEventListener('click', () => openDetail(idea.id));

    ideaListEl.appendChild(card);
  }
}

/* ---------- Navegación entre pantallas ---------- */

function showScreen(screen) {
  for (const s of [screenList, screenDetail]) {
    s.classList.remove('screen--active');
  }
  screen.classList.add('screen--active');
  window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
}

function openDetail(id) {
  const ideas = loadIdeas();
  const idea = ideas.find(i => i.id === id);
  if (!idea) return;

  currentDetailId = id;
  detailSwatch.style.background = CATEGORY_COLORS[idea.categoria] || CATEGORY_COLORS['Otra'];
  detailNombre.textContent = idea.nombre;
  detailCategoria.textContent = idea.categoria;
  detailConcepto.textContent = idea.concepto;
  detailProblema.textContent = idea.problema;
  detailFecha.textContent = new Date(idea.timestamp).toLocaleString('es-ES', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });

  showScreen(screenDetail);
}

btnBack.addEventListener('click', () => {
  currentDetailId = null;
  showScreen(screenList);
});

/* ---------- Modal: nueva idea ---------- */

function openModal() {
  formNewIdea.reset();
  selectedCategory = null;
  formError.hidden = true;
  chipGroup.querySelectorAll('.chip').forEach(c => c.classList.remove('chip--selected'));
  modalOverlay.hidden = false;
  inputNombre.focus();
}

function closeModal() {
  modalOverlay.hidden = true;
}

btnNew.addEventListener('click', openModal);
btnCloseModal.addEventListener('click', closeModal);

modalOverlay.addEventListener('click', (e) => {
  if (e.target === modalOverlay) closeModal();
});

chipGroup.addEventListener('click', (e) => {
  const chip = e.target.closest('.chip');
  if (!chip) return;
  chipGroup.querySelectorAll('.chip').forEach(c => c.classList.remove('chip--selected'));
  chip.classList.add('chip--selected');
  selectedCategory = chip.getAttribute('data-category');
});

formNewIdea.addEventListener('submit', (e) => {
  e.preventDefault();

  const nombre = inputNombre.value.trim();
  const concepto = inputConcepto.value.trim();
  const problema = inputProblema.value.trim();

  if (!nombre || !concepto || !problema) {
    formError.textContent = 'Rellena nombre, concepto y problema antes de guardar.';
    formError.hidden = false;
    return;
  }
  if (!selectedCategory) {
    formError.textContent = 'Elige una categoría para la idea.';
    formError.hidden = false;
    return;
  }

  const ideas = loadIdeas();
  ideas.push({
    id: createIdeaId(),
    nombre,
    concepto,
    problema,
    categoria: selectedCategory,
    timestamp: Date.now()
  });
  saveIdeas(ideas);

  closeModal();
  renderList();
});

/* ---------- Eliminar idea ---------- */

btnDelete.addEventListener('click', () => {
  confirmOverlay.hidden = false;
});

btnConfirmCancel.addEventListener('click', () => {
  confirmOverlay.hidden = true;
});

confirmOverlay.addEventListener('click', (e) => {
  if (e.target === confirmOverlay) confirmOverlay.hidden = true;
});

btnConfirmDelete.addEventListener('click', () => {
  if (!currentDetailId) return;
  const ideas = loadIdeas().filter(i => i.id !== currentDetailId);
  saveIdeas(ideas);
  confirmOverlay.hidden = true;
  currentDetailId = null;
  showScreen(screenList);
  renderList();
});

/* ---------- Accesibilidad: cerrar modales con Escape ---------- */

document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (!confirmOverlay.hidden) confirmOverlay.hidden = true;
  else if (!modalOverlay.hidden) closeModal();
});

/* ---------- Service Worker ---------- */

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(err => {
      console.error('No se pudo registrar el Service Worker:', err);
    });
  });
}

/* ---------- Arranque ---------- */

renderList();