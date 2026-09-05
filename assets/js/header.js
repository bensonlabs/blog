(() => {
  const nav = document.getElementById('bl-nav');
  const toggle = document.getElementById('bl-nav-toggle');
  if (!nav || !toggle) return;
  function setOpen(open) {
    nav.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
  }
  toggle.addEventListener('click', () => setOpen(!nav.classList.contains('is-open')));
  nav.addEventListener('keydown', event => {
    if (event.key === 'Escape') { setOpen(false); toggle.focus(); }
  });
  nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setOpen(false)));
})();
