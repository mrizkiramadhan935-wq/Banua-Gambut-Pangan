(() => {
  const normalizeText = (value) => value.replace(/\s+/g, ' ').trim();

  const initCoverflow = (root) => {
    const stage = root.querySelector('[data-coverflow-stage]');
    const cards = Array.from(stage?.querySelectorAll(':scope > article') || []);
    const previousButton = root.querySelector('[data-coverflow-prev]');
    const nextButton = root.querySelector('[data-coverflow-next]');
    const backdrop = root.querySelector('[data-coverflow-backdrop]');
    const dotsContainer = root.querySelector('[data-coverflow-dots]');
    if (!stage || cards.length < 2) return;

    const products = cards.map((card) => {
      const link = card.querySelector(':scope > a');
      const image = link?.querySelector('img');
      const content = link?.querySelector(':scope > div:nth-child(2)');
      const heading = content?.querySelector(':scope > h3');
      const detailAction = content?.querySelector(':scope > div:last-child > div > span');
      detailAction?.classList.add('product-coverflow__text-link');

      return {
        link,
        image: image?.getAttribute('src') || '',
        name: normalizeText(heading?.textContent || image?.getAttribute('alt') || ''),
        href: link?.getAttribute('href') || 'produk.html',
        detailAction
      };
    });

    let activeIndex = 0;
    let pointerStartX = 0;
    let pointerStartY = 0;
    let dragDistance = 0;
    let activePointerId = null;
    let horizontalDrag = false;
    let suppressClick = false;
    let backdropTimer = null;

    const dots = products.map((product, index) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'product-coverflow__dot';
      dot.setAttribute('aria-label', `Tampilkan ${product.name}`);
      dot.addEventListener('click', () => setActive(index));
      dotsContainer?.appendChild(dot);
      return dot;
    });

    const getDelta = (index) => {
      let delta = index - activeIndex;
      const midpoint = cards.length / 2;

      if (delta > midpoint) delta -= cards.length;
      if (delta < -midpoint) delta += cards.length;

      return delta;
    };

    const getSideOffset = () => {
      const width = stage.getBoundingClientRect().width;
      if (width < 520) return Math.min(190, width * 0.52);
      if (width < 900) return Math.min(245, width * 0.3);
      return Math.min(290, width * 0.235);
    };

    const updateDetails = () => {
      const product = products[activeIndex];

      if (backdrop && product.image) {
        backdrop.classList.add('is-changing');
        window.clearTimeout(backdropTimer);
        backdropTimer = window.setTimeout(() => {
          backdrop.style.backgroundImage = `url("${product.image}")`;
          backdrop.classList.remove('is-changing');
        }, 120);
      }
    };

    const render = () => {
      const sideOffset = getSideOffset();

      cards.forEach((card, index) => {
        const delta = getDelta(index);
        const visible = Math.abs(delta) <= 1;
        const active = delta === 0;
        const product = products[index];

        card.classList.toggle('is-visible', visible);
        card.classList.toggle('is-active', active);
        card.style.setProperty('--coverflow-x', `${delta * sideOffset}px`);
        card.style.setProperty('--coverflow-scale', active ? '1' : '0.82');
        card.style.setProperty('--coverflow-opacity', visible ? (active ? '1' : '0.82') : '0');
        card.style.setProperty('--coverflow-rotate', '0deg');
        card.style.zIndex = String(active ? 10 : 5 - Math.abs(delta));
        card.setAttribute('aria-hidden', String(!visible));

        if (product.link) {
          product.link.tabIndex = active ? 0 : -1;
          product.link.setAttribute(
            'aria-label',
            active
              ? `${product.name}, buka halaman detail`
              : `${product.name}, tampilkan sebagai produk utama`
          );
        }
      });

      dots.forEach((dot, index) => {
        const active = index === activeIndex;
        dot.classList.toggle('is-active', active);
        dot.setAttribute('aria-current', active ? 'true' : 'false');
      });

      updateDetails();
    };

    function setActive(index) {
      activeIndex = (index + cards.length) % cards.length;
      stage.style.setProperty('--drag-offset', '0px');
      render();
    }

    cards.forEach((card, index) => {
      const product = products[index];
      const { link, detailAction } = product;

      detailAction?.addEventListener('pointerdown', (event) => {
        event.stopPropagation();
      });

      detailAction?.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();

        if (index !== activeIndex) {
          setActive(index);
          return;
        }

        window.location.assign(product.href);
      });

      link?.addEventListener('click', (event) => {
        if (suppressClick || index !== activeIndex) {
          event.preventDefault();
        }

        if (!suppressClick && index !== activeIndex) {
          setActive(index);
        }
      });
    });

    previousButton?.addEventListener('click', () => setActive(activeIndex - 1));
    nextButton?.addEventListener('click', () => setActive(activeIndex + 1));

    stage.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        setActive(activeIndex - 1);
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        setActive(activeIndex + 1);
      }
    });

    stage.addEventListener('pointerdown', (event) => {
      if (event.button !== 0 || event.target.closest('button')) return;

      activePointerId = event.pointerId;
      pointerStartX = event.clientX;
      pointerStartY = event.clientY;
      dragDistance = 0;
      horizontalDrag = false;
      suppressClick = false;
      stage.setPointerCapture?.(event.pointerId);
    });

    stage.addEventListener('pointermove', (event) => {
      if (event.pointerId !== activePointerId) return;

      const deltaX = event.clientX - pointerStartX;
      const deltaY = event.clientY - pointerStartY;

      if (!horizontalDrag && Math.abs(deltaX) > 12 && Math.abs(deltaX) > Math.abs(deltaY)) {
        horizontalDrag = true;
        stage.classList.add('is-dragging');
      }

      if (!horizontalDrag) return;

      dragDistance = Math.max(-130, Math.min(130, deltaX));
      stage.style.setProperty('--drag-offset', `${dragDistance}px`);
    });

    const finishDrag = (event) => {
      if (event.pointerId !== activePointerId) return;

      const shouldMove = horizontalDrag && Math.abs(dragDistance) >= 48;
      suppressClick = horizontalDrag;
      stage.classList.remove('is-dragging');
      activePointerId = null;

      if (shouldMove) {
        setActive(activeIndex + (dragDistance < 0 ? 1 : -1));
      } else {
        stage.style.setProperty('--drag-offset', '0px');
      }

      window.setTimeout(() => {
        suppressClick = false;
      }, 0);
    };

    stage.addEventListener('pointerup', finishDrag);
    stage.addEventListener('pointercancel', finishDrag);
    window.addEventListener('resize', render, { passive: true });

    root.classList.add('is-ready');
    render();
  };

  const boot = () => {
    document.querySelectorAll('[data-product-coverflow]').forEach(initCoverflow);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
