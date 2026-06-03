const SCREEN_ORDER = ['welcome', 'q1', 'q2', 'q3', 'q4', 'q5', 'summary'];
const QUESTION_SCREENS = ['q1', 'q2', 'q3', 'q4', 'q5'];
const SCREEN_TO_QUESTION = { q1: 'category', q2: 'presence', q3: 'goal', q4: 'markets', q5: 'budget' };

const initialAnswers = () => ({ category: [], presence: null, goal: null, markets: null, budget: null });

const state = {
  current: 'welcome',
  answers: initialAnswers(),
  modules: new Set(),
  formContext: null
};

const PKG_KEYS = ['silver', 'gold', 'platinum'];
const MODULE_KEYS = ['m1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7', 'm8'];

function pkgFullName(pkg) {
  return t(`summary.title.${pkg}`);
}

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
  document.getElementById('progress-text').textContent = t('progress.step', { n: step });
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
    btn.textContent = answered ? t('nav.see_plan') : t('nav.skip_see');
  } else {
    btn.disabled = !answered;
    btn.textContent = t('nav.continue');
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
  document.getElementById('summary-title-pkg').textContent = pkgFullName(pkg);

  document.querySelectorAll('.pkg').forEach(card => {
    const isRec = card.dataset.pkg === pkg;
    card.classList.toggle('pkg-recommended', isRec);
    const tierEl = card.querySelector('.pkg-tier');
    const existingBadge = tierEl.querySelector('.pkg-badge');
    if (isRec && !existingBadge) {
      tierEl.insertAdjacentHTML('beforeend', `<span class="pkg-badge" data-i18n="pkg.recommended_badge">${t('pkg.recommended_badge')}</span>`);
    } else if (!isRec && existingBadge) {
      existingBadge.remove();
    }
  });

  const why = [];
  if (state.answers.category && state.answers.category.length) {
    const labels = state.answers.category.map(c => t(`category.label.${c === 'smart-home' ? 'smart_home' : c}`));
    why.push(tHtml('summary.why.template.category', { categories: joinList(labels) }));
  }
  if (state.answers.goal) {
    why.push(tHtml('summary.why.template.goal', {
      goal: t(`goal.label.${state.answers.goal}`),
      pkg: t(`pkg.label.${pkg}`)
    }));
  }
  if (state.answers.markets) {
    why.push(tHtml('summary.why.template.markets', { markets: t(`markets.label.${state.answers.markets}`) }));
  }
  document.getElementById('why-list').innerHTML = why.length
    ? why.map(w => `<li>${w}</li>`).join('')
    : `<li>${t('summary.why.empty')}</li>`;

  const rolloutHeading = document.getElementById('rollout-heading');
  rolloutHeading.innerHTML = tHtml('rollout.heading', { pkg: `<span id="rollout-pkg">${t(`pkg.label.${pkg}`)}</span>` });

  const dayKeys = ['rollout.d1', 'rollout.d2', 'rollout.d3'];
  const textKeys = [`rollout.${pkg}.t1`, `rollout.${pkg}.t2`, `rollout.${pkg}.t3`];
  document.getElementById('rollout-list').innerHTML = dayKeys.map((dk, i) =>
    `<li><span class="rollout-day">${t(dk)}</span>${t(textKeys[i])}</li>`
  ).join('');

  computePackageInput('wizard');
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
    btn.dataset.i18n = 'modules.add';
    btn.textContent = t('modules.add');
  } else {
    state.modules.add(key);
    card.classList.add('is-selected');
    btn.dataset.i18n = 'modules.added';
    btn.textContent = t('modules.added');
  }
  updateScopeBar();
}

function updateScopeBar() {
  const bar = document.getElementById('scope-bar');
  const count = state.modules.size;
  bar.hidden = !(state.current === 'modules' && count > 0);
  const countText = count === 1 ? t('scope.count_one') : t('scope.count_many', { n: count });
  document.getElementById('scope-count').textContent = countText;
  document.getElementById('scope-list').textContent = Array.from(state.modules).map(m => t(`module.${m}.title`)).join(' · ');
}

function computePackageInput(context) {
  const input = document.getElementById('form-package-input');
  if (!input) return;
  if (context === 'direct') {
    input.value = t('form.value.direct');
  } else if (context === 'modules') {
    const labels = Array.from(state.modules).map(m => t(`module.${m}.title`));
    input.value = labels.length
      ? t('form.value.custom_with', { modules: labels.join(', ') })
      : t('form.value.custom_empty');
  } else {
    input.value = pkgFullName(recommend());
  }
}

function openForm(context) {
  const ctx = context || 'wizard';
  state.formContext = ctx;
  computePackageInput(ctx);
  document.querySelector('.modal[data-modal="form"]').hidden = false;
  document.body.style.overflow = 'hidden';
}

function closeForm() {
  document.querySelector('.modal[data-modal="form"]').hidden = true;
  document.body.style.overflow = '';
  state.formContext = null;
}

function restart() {
  state.answers = initialAnswers();
  state.modules.clear();
  document.querySelectorAll('.option.is-selected').forEach(o => o.classList.remove('is-selected'));
  document.querySelectorAll('.module.is-selected').forEach(m => m.classList.remove('is-selected'));
  document.querySelectorAll('.module-toggle').forEach(b => {
    b.dataset.i18n = 'modules.add';
    b.textContent = t('modules.add');
  });
  document.getElementById('intake-form').reset();
  show('welcome');
}

function onLanguageChange() {
  if (state.current === 'summary') {
    renderSummary();
  } else if (QUESTION_SCREENS.includes(state.current)) {
    updateProgress();
    updateContinueButton();
  }
  updateScopeBar();
  if (state.formContext) {
    computePackageInput(state.formContext);
  }
}

document.addEventListener('click', (e) => {
  const langBtn = e.target.closest('.lang-btn');
  if (langBtn && langBtn.dataset.lang) {
    setLanguage(langBtn.dataset.lang);
    return;
  }

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
      case 'download-pdf': alert(t('alert.pdf')); break;
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

initI18n();
