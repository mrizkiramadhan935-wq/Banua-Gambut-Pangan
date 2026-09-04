(() => {
  const root = document.documentElement;
  const script = document.currentScript;
  const storageKey = "bgp_intro_seen_v1";
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let hasSeenIntro = false;

  try {
    hasSeenIntro = window.sessionStorage.getItem(storageKey) === "1";
  } catch (_) {
    hasSeenIntro = false;
  }

  if (hasSeenIntro || prefersReducedMotion || !script) {
    root.classList.remove("bgp-intro-pending");
    return;
  }

  root.classList.add("bgp-intro-pending");

  const mountIntro = () => {
    const logoUrl = new URL("logo-bgp.png", script.src).href;
    const intro = document.createElement("div");
    intro.className = "bgp-preloader";
    intro.setAttribute("aria-hidden", "true");
    intro.innerHTML = `
      <div class="bgp-preloader__content">
        <p class="bgp-preloader__eyebrow">Selamat Datang</p>
        <img class="bgp-preloader__logo" src="${logoUrl}" alt="" width="923" height="451">
        <div class="bgp-preloader__line"></div>
      </div>
    `;

    document.body.prepend(intro);

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => intro.classList.add("is-running"));
    });

    const startedAt = performance.now();
    let isFinishing = false;

    const finishIntro = () => {
      if (isFinishing) return;
      isFinishing = true;

      const minimumDuration = 2300;
      const remainingTime = Math.max(0, minimumDuration - (performance.now() - startedAt));

      window.setTimeout(() => {
        try {
          window.sessionStorage.setItem(storageKey, "1");
        } catch (_) {
          // The animation still works when storage is unavailable.
        }

        intro.classList.add("is-leaving");
        root.classList.remove("bgp-intro-pending");
        window.setTimeout(() => intro.remove(), 950);
      }, remainingTime);
    };

    if (document.readyState === "complete") {
      finishIntro();
    } else {
      window.addEventListener("load", finishIntro, { once: true });
    }

    window.setTimeout(finishIntro, 5000);
  };

  if (document.body) {
    mountIntro();
  } else {
    document.addEventListener("DOMContentLoaded", mountIntro, { once: true });
  }
})();
