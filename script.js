// ===== Module selection (Add to scope) =====
const selected = new Set();
const scopeBar   = document.getElementById('scopeBar');
const scopeCount = document.getElementById('scopeCount');
const scopeList  = document.getElementById('scopeList');

document.querySelectorAll('.module').forEach((card) => {
  const btn = card.querySelector('.module-toggle');
  const key = card.dataset.moduleKey;

  btn.addEventListener('click', () => {
    if (selected.has(key)) {
      selected.delete(key);
      btn.classList.remove('is-on');
      btn.setAttribute('data-i18n', 'mod.add');
      btn.textContent = window.t ? window.t('mod.add') : '+ Add to scope';
      btn.setAttribute('aria-pressed', 'false');
    } else {
      selected.add(key);
      btn.classList.add('is-on');
      btn.setAttribute('data-i18n', 'mod.added');
      btn.textContent = window.t ? window.t('mod.added') : '✓ In scope';
      btn.setAttribute('aria-pressed', 'true');
    }
    renderScope();
  });
});

function renderScope() {
  const n = selected.size;
  if (n === 0) { scopeBar.hidden = true; return; }
  scopeBar.hidden = false;
  const tFn = window.t || ((k, v) => k);
  scopeCount.textContent = tFn(n === 1 ? 'scope.count.one' : 'scope.count.other', { n });

  const names = [...selected].map((k) => tFn('mod.' + k + '.t'));
  scopeList.textContent = names.length > 3
    ? names.slice(0, 3).join(', ') + ' ' + tFn('scope.more', { n: names.length - 3 })
    : names.join(', ');
}
window.__renderScope = renderScope;

// ===== Side-nav active state on scroll + progress =====
const sideNavItems = [...document.querySelectorAll('#sideNav li')];
const steps        = [...document.querySelectorAll('.step')];
const progressFill  = document.getElementById('progressFill');
const progressLabel = document.getElementById('progressLabel');

const stepObserver = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (e.isIntersecting) {
      const id  = e.target.id;
      const idx = steps.findIndex((s) => s.id === id);
      sideNavItems.forEach((li, i) => li.classList.toggle('active', i === idx));
    }
  });
}, { rootMargin: '-40% 0px -55% 0px' });
steps.forEach((s) => stepObserver.observe(s));

// ===== Progress based on filled fields =====
const intakeForm = document.getElementById('intakeForm');
function updateProgress() {
  if (!intakeForm) return;
  const inputs = [...intakeForm.querySelectorAll('input, select, textarea')];
  const radioGroups = new Set();
  let total = 0, filled = 0;
  inputs.forEach((el) => {
    if (el.type === 'radio') {
      if (!radioGroups.has(el.name)) {
        radioGroups.add(el.name);
        total++;
        if (intakeForm.querySelector(`input[name="${el.name}"]:checked`)) filled++;
      }
    } else if (el.type === 'checkbox') {
      // checkboxes don't count individually toward %
    } else {
      total++;
      if (el.value && el.value.trim() !== '') filled++;
    }
  });
  const pct = total ? Math.round((filled / total) * 100) : 0;
  progressFill.style.width  = pct + '%';
  const tFn = window.t || ((k, v) => k);
  progressLabel.textContent = tFn('progress.fmt', { pct });
}
window.__updateProgress = updateProgress;
intakeForm?.addEventListener('input',  updateProgress);
intakeForm?.addEventListener('change', updateProgress);
updateProgress();

// ===== Smooth scroll offset for sticky nav =====
document.querySelectorAll('a[href^="#"]').forEach((a) => {
  a.addEventListener('click', (e) => {
    const id = a.getAttribute('href');
    if (id.length < 2) return;
    const target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    const top = target.getBoundingClientRect().top + window.scrollY - 72;
    window.scrollTo({ top, behavior: 'smooth' });
  });
});
