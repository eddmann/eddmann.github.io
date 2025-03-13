(function () {
  document
    .querySelector('.site-footer__theme-toggle')
    .addEventListener('click', () => {
      localStorage.setItem(
        'theme',
        localStorage.getItem('theme') === 'dark' ? 'light' : 'dark'
      );
      document.documentElement.setAttribute(
        'data-theme',
        localStorage.getItem('theme')
      );
    });

  document
    .querySelector('.site-header__mobile-navigation-button')
    .addEventListener('click', e => {
      document.documentElement.classList.toggle('mobile-navigation-open');
      e.target.setAttribute(
        'aria-expanded',
        e.target.getAttribute('aria-expanded') === 'false' ? 'true' : 'false'
      );
    });

  const header = document.querySelector('.site-header');
  let previousPosition = window.pageYOffset;
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    setTimeout(() => {
      const currentPosition = window.pageYOffset;
      header.classList.toggle(
        'is-sticky',
        currentPosition > 0 && previousPosition > currentPosition
      );
      previousPosition = currentPosition;
      ticking = false;
    }, 500);
    ticking = true;
  });
})();
