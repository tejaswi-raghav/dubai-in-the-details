const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const hero = document.querySelector('.hero');
const frame = document.querySelector('.hero-frame');
const leftWord = document.querySelector('.word-left');
const rightWord = document.querySelector('.word-right');

function clamp(n, min = 0, max = 1) { return Math.min(max, Math.max(min, n)); }

function updateHero() {
  if (reduced) return;
  const rect = hero.getBoundingClientRect();
  const progress = clamp(-rect.top / (rect.height - innerHeight));
  const scaleX = 1 + progress * (innerWidth / frame.offsetWidth - 1.05);
  const scaleY = 1 + progress * (innerHeight / frame.offsetHeight - 1.05);
  frame.style.transform = `translateX(-50%) scale(${scaleX}, ${scaleY})`;
  frame.style.filter = `saturate(${1 - progress * .35}) brightness(${1 - progress * .25})`;
  leftWord.style.transform = `translateX(${-progress * 38}vw)`;
  rightWord.style.transform = `translateX(${progress * 38}vw)`;
}

let ticking = false;
addEventListener('scroll', () => {
  if (!ticking) requestAnimationFrame(() => { updateHero(); ticking = false; });
  ticking = true;
}, { passive: true });
addEventListener('resize', updateHero);
updateHero();

const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('is-visible'); });
}, { threshold: .13 });
document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

if (!reduced) {
  const driftingPhotos = [...document.querySelectorAll('[data-drift]')];
  const updateDrift = () => {
    const mid = innerHeight / 2;
    driftingPhotos.forEach(photo => {
      const rect = photo.getBoundingClientRect();
      const offset = ((rect.top + rect.height / 2) - mid) / innerHeight;
      const amount = Number(photo.dataset.drift);
      photo.style.translate = `0 ${clamp(offset, -1, 1) * amount}px`;
    });
  };
  addEventListener('scroll', () => requestAnimationFrame(updateDrift), { passive: true });
  updateDrift();
}

const stack = document.querySelector('.photo-stack');
if (!reduced && matchMedia('(pointer:fine)').matches) {
  stack.addEventListener('pointermove', event => {
    const r = stack.getBoundingClientRect();
    const x = (event.clientX - r.left) / r.width - .5;
    const y = (event.clientY - r.top) / r.height - .5;
    stack.style.transform = `rotateX(${-y * 3}deg) rotateY(${x * 3}deg)`;
  });
  stack.addEventListener('pointerleave', () => stack.style.transform = '');
}

let active = 0;
const cards = [...document.querySelectorAll('.relay-card')];
const count = document.querySelector('.relay-count strong');
function renderRelay() {
  cards.forEach((card, i) => {
    card.classList.remove('is-active', 'is-prev', 'is-next');
    const prev = (active - 1 + cards.length) % cards.length;
    const next = (active + 1) % cards.length;
    if (i === active) card.classList.add('is-active');
    if (i === prev) card.classList.add('is-prev');
    if (i === next) card.classList.add('is-next');
    card.setAttribute('aria-hidden', i === active ? 'false' : 'true');
  });
  count.textContent = String(active + 1).padStart(2, '0');
}
document.querySelector('.relay-next').addEventListener('click', () => { active = (active + 1) % cards.length; renderRelay(); });
document.querySelector('.relay-prev').addEventListener('click', () => { active = (active - 1 + cards.length) % cards.length; renderRelay(); });
renderRelay();

function updateClock() {
  document.querySelector('#clock').textContent = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Dubai', hour: '2-digit', minute: '2-digit', hour12: false
  }).format(new Date());
}
updateClock(); setInterval(updateClock, 30000);

let audio;
const sound = document.querySelector('.sound-toggle');
sound.addEventListener('click', async () => {
  const on = sound.getAttribute('aria-pressed') === 'true';
  sound.setAttribute('aria-pressed', String(!on));
  sound.lastElementChild.textContent = on ? 'SOUND OFF' : 'SOUND ON';
  if (!audio) {
    audio = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = 'sine'; oscillator.frequency.value = 55; gain.gain.value = .018;
    oscillator.connect(gain).connect(audio.destination); oscillator.start();
  }
  if (audio.state === 'suspended') await audio.resume();
  audio.destination.channelCount = on ? 1 : 2;
  audio[on ? 'suspend' : 'resume']();
});
