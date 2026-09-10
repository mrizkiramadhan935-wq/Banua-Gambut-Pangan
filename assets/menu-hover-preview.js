(() => {
  const imageByMenu = {
    'Nasi Goreng': 'assets/images/cari-beras/nasi-goreng.jpg',
    'Nasi Uduk': 'assets/images/cari-beras/nasi-uduk.jpg',
    'Nasi Kuning': 'assets/images/cari-beras/nasi-kuning.jpg',
    Lontong: 'assets/images/cari-beras/lontong.jpg',
    Ketupat: 'assets/images/cari-beras/ketupat.jpg',
    Lalapan: 'assets/images/cari-beras/lalapan.jpg',
    Catering: 'assets/images/cari-beras/catering.jpg',
    'Konsumsi Harian': 'assets/images/cari-beras/konsumsi-harian.jpg',
  };

  const cards = [...document.querySelectorAll('.menu-float-card')];
  const hoverQuery = window.matchMedia('(hover: hover) and (pointer: fine)');

  if (!cards.length) return;

  const preview = document.createElement('figure');
  const previewImage = document.createElement('img');

  preview.className = 'menu-hover-preview';
  preview.setAttribute('aria-hidden', 'true');
  previewImage.alt = '';
  previewImage.decoding = 'async';
  preview.appendChild(previewImage);
  document.body.appendChild(preview);

  [...new Set(Object.values(imageByMenu))].forEach((source) => {
    const image = new Image();
    image.src = source;
  });

  let activeCard = null;
  let positionFrame = 0;

  const positionPreview = (clientX, clientY) => {
    cancelAnimationFrame(positionFrame);

    positionFrame = requestAnimationFrame(() => {
      const margin = 16;
      const previewWidth = preview.offsetWidth || 220;
      const previewHeight = preview.offsetHeight || 275;
      const minX = margin + previewWidth / 2;
      const maxX = window.innerWidth - margin - previewWidth / 2;
      const x = Math.min(Math.max(clientX, minX), Math.max(minX, maxX));
      const placeBelow = clientY < previewHeight + 54;

      preview.classList.toggle('is-below', placeBelow);
      preview.style.left = `${x}px`;
      preview.style.top = `${clientY}px`;
    });
  };

  const showPreview = (card, clientX, clientY) => {
    if (!hoverQuery.matches) return;

    const menuName = card.textContent.trim();
    const source = imageByMenu[menuName];

    if (!source) return;

    if (activeCard && activeCard !== card) {
      activeCard.classList.remove('is-preview-active');
    }

    activeCard = card;
    activeCard.classList.add('is-preview-active');

    if (previewImage.getAttribute('src') !== source) {
      previewImage.src = source;
    }

    const tilt = cards.indexOf(card) % 2 === 0 ? '-7deg' : '7deg';
    preview.style.setProperty('--menu-preview-tilt', tilt);
    positionPreview(clientX, clientY);
    preview.classList.add('is-visible');
  };

  const hidePreview = () => {
    cancelAnimationFrame(positionFrame);
    preview.classList.remove('is-visible', 'is-below');

    if (activeCard) {
      activeCard.classList.remove('is-preview-active');
      activeCard = null;
    }
  };

  cards.forEach((card) => {
    card.addEventListener('pointerenter', (event) => {
      if (event.pointerType !== 'mouse') return;
      showPreview(card, event.clientX, event.clientY);
    });

    card.addEventListener('pointermove', (event) => {
      if (activeCard !== card || event.pointerType !== 'mouse') return;
      positionPreview(event.clientX, event.clientY);
    });

    card.addEventListener('pointerleave', hidePreview);

    card.addEventListener('focus', () => {
      const bounds = card.getBoundingClientRect();
      showPreview(card, bounds.left + bounds.width / 2, bounds.top);
    });

    card.addEventListener('blur', hidePreview);
  });

  window.addEventListener('scroll', hidePreview, { passive: true });
  window.addEventListener('resize', hidePreview, { passive: true });
  hoverQuery.addEventListener('change', hidePreview);
})();
