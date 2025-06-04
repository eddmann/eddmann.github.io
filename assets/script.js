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
    document.documentElement.classList.toggle('js-mobile-navigation-open');
    e.target.setAttribute(
      'aria-expanded',
      e.target.getAttribute('aria-expanded') === 'false' ? 'true' : 'false'
    );
  });

(() => {
  const SCROLL_THRESHOLD_PX = 10;
  const PINABLE_OFFSET_PX = 100;

  const headerClassList = document.querySelector('.site-header').classList;
  let previousPosition = window.pageYOffset;
  let isUpdating = false;

  const update = () => {
    const currentPosition = window.pageYOffset;
    const isPinable = currentPosition > PINABLE_OFFSET_PX;
    const hasMetThreshold =
      Math.abs(currentPosition - previousPosition) > SCROLL_THRESHOLD_PX;

    headerClassList.toggle('site-header--pinable', isPinable);

    if (currentPosition < previousPosition && hasMetThreshold) {
      headerClassList.add('site-header--pinned');
    }

    if ((currentPosition > previousPosition && hasMetThreshold) || !isPinable) {
      headerClassList.remove('site-header--pinned');
    }

    previousPosition = currentPosition;
    isUpdating = false;
  };

  window.addEventListener(
    'scroll',
    () => {
      if (isUpdating) return;
      isUpdating = true;
      requestAnimationFrame(update);
    },
    { passive: true }
  );
})();

(() => {
  if (
    !window.matchMedia(
      '(hover: hover) and (prefers-reduced-motion: no-preference)'
    ).matches
  ) {
    return;
  }

  document.querySelectorAll('.avatar--spin').forEach(avatar => {
    let isInitialised = false;
    let image, transitionAt, avatars, index, timer;

    avatar.addEventListener('animationstart', () => {
      if (!isInitialised) {
        image = avatar.querySelector('img');
        transitionAt =
          (parseFloat(getComputedStyle(avatar).animationDuration) * 1000) / 2;
        avatars = [
          image.src,
          ...(JSON.parse(avatar.getAttribute('data-avatars')) || []),
        ];
        index = 0;
        timer = null;
        avatar.querySelector('source').remove();
        isInitialised = true;
      }

      timer = setTimeout(() => {
        index = (index + 1) % avatars.length;
        image.src = avatars[index];
      }, transitionAt);
    });

    avatar.addEventListener('animationcancel', () => {
      if (timer) clearTimeout(timer);
    });
  });
})();
