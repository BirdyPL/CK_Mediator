const ROLLOUTS = {
  silver: [
    { day: 'Day 1–30', text: 'Market analysis delivered + Allegro Brand Zone setup' },
    { day: 'Day 31–60', text: 'First listings live + customs flows onboarded' },
    { day: 'Day 61–90', text: 'First sales + RMA process operational' }
  ],
  gold: [
    { day: 'Day 1–30', text: 'Dedicated PM onboard + D2C webshop design + 3 marketplaces in setup' },
    { day: 'Day 31–60', text: 'D2C store live + marketplaces selling + first co-op campaign' },
    { day: 'Day 61–90', text: 'Optimization + first retail leaflet placement + partner credit lines active' }
  ],
  platinum: [
    { day: 'Day 1–30', text: 'PM team assembled + premium content production + all 5 marketplaces in prep' },
    { day: 'Day 31–60', text: '5 marketplaces live (incl. TEMU 24h) + influencer wave 1 + D2C launch' },
    { day: 'Day 61–90', text: 'Retail POS rollout + service center activated + first category share gains' }
  ]
};

const PKG_NAME = {
  silver: 'Silver — Test the Market',
  gold: 'Gold — Scale Across CEE',
  platinum: 'Platinum — Become a Category Leader'
};
const PKG_LABEL = { silver: 'Silver', gold: 'Gold', platinum: 'Platinum' };

const CATEGORY_LABEL = {
  phones: 'Smartphones & Mobile',
  computing: 'Laptops & Computing',
  cameras: 'Cameras & Surveillance',
  av: 'Audio, Video & Projectors',
  'smart-home': 'Smart Home & IoT',
  tools: 'Power Tools & Hardware',
  mixed: 'a mixed portfolio'
};
const GOAL_LABEL = {
  test: 'testing the market',
  scale: 'scaling',
  leader: 'becoming a category leader'
};
const MARKETS_LABEL = {
  pl: 'Poland only',
  baltics: 'Poland and the Baltics',
  cee: 'all of Central & Eastern Europe',
  eu: 'beyond CEE — the full EU'
};
const MODULE_LABELS = {
  m1: 'Regulatory & Compliance',
  m2: 'Warehousing & Fulfillment',
  m3: 'Sales & Channel Development',
  m4: 'Marketing & PR',
  m5: 'Warranty & Service Center',
  m6: 'Financial & Invoicing Support',
  m7: 'EU Authorized Representative',
  m8: 'Market Intelligence & Reporting'
};

const SCREEN_ORDER = ['welcome', 'q1', 'q2', 'q3', 'q4', 'q5', 'summary'];
const QUESTION_SCREENS = ['q1', 'q2', 'q3', 'q4', 'q5'];
const SCREEN_TO_QUESTION = { q1: 'category', q2: 'presence', q3: 'goal', q4: 'markets', q5: 'budget' };

const initialAnswers = () => ({ category: [], presence: null, goal: null, markets: null, budget: null });

const state = {
  current: 'welcome',
  answers: initialAnswers(),
  modules: new Set()
};

function show(screen) {
  document.querySelectorAll('.screen').forEach(s => {
    s.classList.toggle('is-active', s.dataset.screen === screen);
  });
  state.current = screen;

  const isQuestion = QUESTION_SCREENS.includes(screen);
  document.getElementById('wizard-nav').hidden = !isQuestion;
  document.getElementById('progress').hidden = !isQuestion;

  updateScopeBar();

  if (isQuestion) {
    updateProgress();
    updateContinueButton();
  }

  if (screen === 'summary') renderSummary();

  window.scrollTo({ top: 0, behavior: 'instant' });
}

function updateProgress() {
  const screenEl = document.querySelector(`.screen[data-screen="${state.current}"]`);
  const step = parseInt(screenEl.dataset.step, 10);
  document.getElementById('progress-text').textContent = `Step ${step} of 5`;
  document.getElementById('progress-fill').style.width = `${(step / 5) * 100}%`;

  const dots = QUESTION_SCREENS.map((_, i) => {
    const idx = i + 1;
    let cls = 'dot';
    if (idx < step) cls += ' is-done';
    if (idx === step) cls += ' is-current';
    return `<span class="${cls}"></span>`;
  }).join('');
  document.getElementById('dots').innerHTML = dots;
}

function isAnswered(question) {
  const v = state.answers[question];
  if (Array.isArray(v)) return v.length > 0;
  return v !== null;
}

function updateContinueButton() {
  const screen = state.current;
  const questionKey = SCREEN_TO_QUESTION[screen];
  const answered = isAnswered(questionKey);
  const btn = document.getElementById('continue-btn');
  if (screen === 'q5') {
    btn.disabled = false;
    btn.textContent = answered ? 'See your plan →' : 'Skip & see plan →';
  } else {
    btn.disabled = !answered;
    btn.textContent = 'Continue →';
  }
}

function next() {
  const idx = SCREEN_ORDER.indexOf(state.current);
  if (idx >= 0 && idx < SCREEN_ORDER.length - 1) show(SCREEN_ORDER[idx + 1]);
}

function back() {
  const idx = SCREEN_ORDER.indexOf(state.current);
  if (idx > 0) show(SCREEN_ORDER[idx - 1]);
}

function recommend() {
  const tiers = { silver: 0, gold: 0, platinum: 0 };
  ['presence', 'goal', 'markets', 'budget'].forEach(q => {
    const val = state.answers[q];
    if (!val) return;
    const opt = document.querySelector(`.options[data-question="${q}"] .option[data-value="${val}"]`);
    if (!opt) return;
    const tier = opt.dataset.tier;
    if (tier && tiers[tier] !== undefined) tiers[tier] += 1;
  });
  const max = Math.max(tiers.silver, tiers.gold, tiers.platinum);
  if (max === 0) return 'gold';
  if (tiers.gold === max) return 'gold';
  if (tiers.platinum === max) return 'platinum';
  return 'silver';
}

function joinList(arr) {
  if (arr.length === 0) return '';
  if (arr.length === 1) return arr[0];
  if (arr.length === 2) return `${arr[0]} and ${arr[1]}`;
  return `${arr.slice(0, -1).join(', ')}, and ${arr[arr.length - 1]}`;
}

function renderSummary() {
  const pkg = recommend();
  document.getElementById('summary-title-pkg').textContent = PKG_NAME[pkg];

  document.querySelectorAll('.pkg').forEach(card => {
    const isRec = card.dataset.pkg === pkg;
    card.classList.toggle('pkg-recommended', isRec);
    const tierEl = card.querySelector('.pkg-tier');
    const existingBadge = tierEl.querySelector('.pkg-badge');
    if (isRec && !existingBadge) {
      tierEl.insertAdjacentHTML('beforeend', '<span class="pkg-badge">Recommended for you</span>');
    } else if (!isRec && existingBadge) {
      existingBadge.remove();
    }
  });

  const why = [];
  if (state.answers.category && state.answers.category.length) {
    const labels = state.answers.category.map(c => CATEGORY_LABEL[c]);
    why.push(`You're in <strong>${joinList(labels)}</strong> — matches our strongest channels.`);
  }
  if (state.answers.goal) {
    why.push(`Your 12-month goal is <strong>${GOAL_LABEL[state.answers.goal]}</strong> — ${PKG_LABEL[pkg]} is built exactly for this.`);
  }
  if (state.answers.markets) {
    why.push(`You're targeting <strong>${MARKETS_LABEL[state.answers.markets]}</strong> — we cover that under one contract.`);
  }
  document.getElementById('why-list').innerHTML = why.length
    ? why.map(w => `<li>${w}</li>`).join('')
    : '<li>Tell us a bit about your goals and we\'ll tailor the plan.</li>';

  document.getElementById('rollout-pkg').textContent = PKG_LABEL[pkg];
  document.getElementById('rollout-list').innerHTML = ROLLOUTS[pkg].map(item =>
    `<li><span class="rollout-day">${item.day}</span>${item.text}</li>`
  ).join('');

  document.getElementById('form-package-input').value = PKG_NAME[pkg];
}

function selectOption(btn) {
  const optionsEl = btn.parentElement;
  const question = optionsEl.dataset.question;
  const value = btn.dataset.value;
  const multi = optionsEl.dataset.multi === 'true';

  if (multi) {
    btn.classList.toggle('is-selected');
    if (!Array.isArray(state.answers[question])) state.answers[question] = [];
    const arr = state.answers[question];
    const idx = arr.indexOf(value);
    if (btn.classList.contains('is-selected')) {
      if (idx === -1) arr.push(value);
    } else if (idx !== -1) {
      arr.splice(idx, 1);
    }
  } else {
    optionsEl.querySelectorAll('.option').forEach(o => o.classList.remove('is-selected'));
    btn.classList.add('is-selected');
    state.answers[question] = value;
  }

  updateContinueButton();
}

function toggleModule(card) {
  const key = card.dataset.module;
  const btn = card.querySelector('.module-toggle');
  if (state.modules.has(key)) {
    state.modules.delete(key);
    card.classList.remove('is-selected');
    btn.textContent = '+ Add';
  } else {
    state.modules.add(key);
    card.classList.add('is-selected');
    btn.textContent = '✓ Added';
  }
  updateScopeBar();
}

function updateScopeBar() {
  const bar = document.getElementById('scope-bar');
  const count = state.modules.size;
  bar.hidden = !(state.current === 'modules' && count > 0);
  document.getElementById('scope-count').textContent = count === 1 ? '1 module selected' : `${count} modules selected`;
  document.getElementById('scope-list').textContent = Array.from(state.modules).map(m => MODULE_LABELS[m]).join(' · ');
}

function openForm(context) {
  const ctx = context || 'wizard';
  const input = document.getElementById('form-package-input');
  if (ctx === 'direct') {
    input.value = 'Direct inquiry (no wizard run)';
  } else if (ctx === 'modules') {
    const labels = Array.from(state.modules).map(m => MODULE_LABELS[m]);
    input.value = labels.length ? `Custom: ${labels.join(', ')}` : 'Custom configuration (no modules selected)';
  } else {
    input.value = PKG_NAME[recommend()];
  }
  document.querySelector('.modal[data-modal="form"]').hidden = false;
  document.body.style.overflow = 'hidden';
}

function closeForm() {
  document.querySelector('.modal[data-modal="form"]').hidden = true;
  document.body.style.overflow = '';
}

function restart() {
  state.answers = initialAnswers();
  state.modules.clear();
  document.querySelectorAll('.option.is-selected').forEach(o => o.classList.remove('is-selected'));
  document.querySelectorAll('.module.is-selected').forEach(m => m.classList.remove('is-selected'));
  document.querySelectorAll('.module-toggle').forEach(t => { t.textContent = '+ Add'; });
  document.getElementById('intake-form').reset();
  show('welcome');
}

document.addEventListener('click', (e) => {
  const actionEl = e.target.closest('[data-action]');
  if (actionEl) {
    e.preventDefault();
    const action = actionEl.dataset.action;
    switch (action) {
      case 'start': show('q1'); break;
      case 'continue': next(); break;
      case 'back': back(); break;
      case 'direct-contact': openForm('direct'); break;
      case 'open-form': openForm('wizard'); break;
      case 'open-modules': show('modules'); break;
      case 'request-quote': openForm('modules'); break;
      case 'close-form': closeForm(); break;
      case 'download-pdf': alert('PDF generation — wire-up planned for next build step.'); break;
      case 'restart': restart(); break;
    }
    return;
  }

  const moduleCard = e.target.closest('.module');
  if (moduleCard) {
    toggleModule(moduleCard);
    return;
  }

  const opt = e.target.closest('.option');
  if (opt) selectOption(opt);
});

document.getElementById('intake-form').addEventListener('submit', (e) => {
  e.preventDefault();
  closeForm();
  show('confirm');
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !document.querySelector('.modal[data-modal="form"]').hidden) {
    closeForm();
  }
});
