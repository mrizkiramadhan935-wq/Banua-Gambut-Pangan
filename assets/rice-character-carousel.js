(() => {
  const carousel = document.querySelector('[data-character-carousel]');

  if (!carousel) return;

  const track = carousel.querySelector('[data-character-track]');
  const cards = Array.from(track?.children || []);
  const previousButton = carousel.querySelector('[data-character-prev]');
  const nextButton = carousel.querySelector('[data-character-next]');
  const currentLabel = carousel.querySelector('[data-character-current]');
  const totalLabel = carousel.querySelector('[data-character-total]');

  if (!track || cards.length < 2) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let activeIndex = 0;
  let autoplayTimer;
  let pointerStartX = 0;
  let pointerDistance = 0;
  let pointerActive = false;
  let ignoreClick = false;

  const render = () => {
    const count = cards.length;

    cards.forEach((card, index) => {
      let distance = (index - activeIndex + count) % count;

      if (distance > count / 2) distance -= count;

      const position = distance === 0
        ? 'active'
        : distance === -1
          ? 'previous'
          : distance === 1
            ? 'next'
            : 'far';

      card.dataset.position = position;
      card.setAttribute('aria-current', position === 'active' ? 'true' : 'false');
    });

    if (currentLabel) currentLabel.textContent = String(activeIndex + 1).padStart(2, '0');
    if (totalLabel) totalLabel.textContent = String(count).padStart(2, '0');
  };

  const select = (index) => {
    activeIndex = (index + cards.length) % cards.length;
    render();
  };

  const stopAutoplay = () => {
    window.clearTimeout(autoplayTimer);
  };

  const startAutoplay = () => {
    stopAutoplay();

    if (reducedMotion.matches || document.hidden) return;

    autoplayTimer = window.setTimeout(() => {
      select(activeIndex + 1);
      startAutoplay();
    }, 4200);
  };

  cards.forEach((card, index) => {
    card.addEventListener('click', () => {
      if (ignoreClick || index === activeIndex) return;
      select(index);
      startAutoplay();
    });
  });

  previousButton?.addEventListener('click', () => {
    select(activeIndex - 1);
    startAutoplay();
  });

  nextButton?.addEventListener('click', () => {
    select(activeIndex + 1);
    startAutoplay();
  });

  track.addEventListener('keydown', (event) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;

    event.preventDefault();
    select(activeIndex + (event.key === 'ArrowRight' ? 1 : -1));
    startAutoplay();
  });

  track.addEventListener('pointerdown', (event) => {
    pointerActive = true;
    pointerStartX = event.clientX;
    pointerDistance = 0;
    ignoreClick = false;
    stopAutoplay();
    track.setPointerCapture?.(event.pointerId);
  });

  track.addEventListener('pointermove', (event) => {
    if (!pointerActive) return;
    pointerDistance = event.clientX - pointerStartX;
    if (Math.abs(pointerDistance) > 10) ignoreClick = true;
  });

  const finishPointer = (event) => {
    if (!pointerActive) return;

    pointerActive = false;
    track.releasePointerCapture?.(event.pointerId);

    if (Math.abs(pointerDistance) >= 42) {
      select(activeIndex + (pointerDistance < 0 ? 1 : -1));
    }

    window.setTimeout(() => {
      ignoreClick = false;
    }, 0);
    startAutoplay();
  };

  track.addEventListener('pointerup', finishPointer);
  track.addEventListener('pointercancel', finishPointer);
  carousel.addEventListener('mouseenter', stopAutoplay);
  carousel.addEventListener('mouseleave', startAutoplay);
  carousel.addEventListener('focusin', stopAutoplay);
  carousel.addEventListener('focusout', startAutoplay);
  reducedMotion.addEventListener?.('change', startAutoplay);
  document.addEventListener('visibilitychange', startAutoplay);

  render();
  startAutoplay();
})();
