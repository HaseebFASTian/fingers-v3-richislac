// Reference choreography: bottle arrives, splash opens, headline rises.
// No scroll hijacking: scroll-driven transforms follow the browser's normal scroll.
export function initMotion() {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const fine = matchMedia("(min-width:901px) and (pointer:fine)");
  let paused = false;
  let entranceDone = false;
  let raf = 0;
  try {
    paused = localStorage.getItem("richislac-motion-paused") === "true";
  } catch {}
  const animations = new Set();
  const hero = document.querySelector(".hero");
  const bottle = document.querySelector(".hero-bottle");
  const splash = document.querySelector(".hero-splash");
  const controls = [...document.querySelectorAll("[data-motion]")];
  const active = () => !paused && !reduced.matches;
  function animate(element, frames, options) {
    if (!element || !active()) return null;
    const a = element.animate(frames, {
      easing: "cubic-bezier(.22,1,.36,1)",
      ...options,
    });
    animations.add(a);
    a.finished
      .then(() => animations.delete(a))
      .catch(() => animations.delete(a));
    return a;
  }
  function sync() {
    const off = !active();
    document.documentElement.classList.toggle("motion-paused", off);
    controls.forEach((button) => {
      const label = reduced.matches
        ? "Reduced motion"
        : paused
          ? "Resume motion"
          : "Pause motion";
      const span = button.querySelector("span");
      if (span) span.textContent = label;
      else button.textContent = label;
      button.setAttribute("aria-pressed", String(off));
      const use = button.querySelector("use");
      if (use) use.setAttribute("href", off ? "#i-play" : "#i-pause");
    });
    for (const a of animations) {
      if (off) a.finish();
    }
    if (off) {
      bottle.style.transform = "";
      splash.style.translate = "";
      document.querySelector(".story-bottle").style.translate = "";
    } else schedule();
  }
  controls.forEach((button) =>
    button.addEventListener("click", () => {
      if (reduced.matches) {
        document.getElementById("toast").textContent =
          "Motion is reduced to match your device preference.";
        document.getElementById("toast").classList.add("visible");
        setTimeout(
          () => document.getElementById("toast").classList.remove("visible"),
          3000,
        );
        return;
      }
      paused = !paused;
      try {
        localStorage.setItem("richislac-motion-paused", String(paused));
      } catch {}
      sync();
    }),
  );
  reduced.addEventListener("change", sync);
  sync();
  // Start after the hero image is decoded so the bottle never arrives as a blank box.
  const start = () => {
    if (scrollY > 120 || !active()) {
      entranceDone = true;
      return;
    }
    const mobile = innerWidth <= 600;
    const duration = mobile ? 900 : 1350;
    animate(
      bottle,
      [
        { transform: "translateY(-90%) rotate(22deg) scale(.8)", opacity: 0 },
        { transform: "translateY(0) rotate(-6deg) scale(1)", opacity: 1 },
      ],
      { duration, fill: "backwards" },
    );
    animate(
      splash,
      [
        { transform: "translateX(-50%) scale(.65)", opacity: 0 },
        { transform: "translateX(-50%) scale(1)", opacity: 1 },
      ],
      { duration: 1050, delay: mobile ? 220 : 500, fill: "backwards" },
    );
    [...document.querySelectorAll(".hero h1 span")].forEach((word, i) =>
      animate(
        word,
        [
          { transform: "translateY(85%) rotate(4deg)", opacity: 0 },
          { transform: "translateY(0) rotate(0)", opacity: 1 },
        ],
        {
          duration: 850,
          delay: (mobile ? 280 : 650) + i * 130,
          fill: "backwards",
        },
      ),
    );
    document
      .querySelectorAll(
        ".hero-aside,.hero-action,.hero-pack-note,.sun-doodle,.milk-drop",
      )
      .forEach((el, i) =>
        animate(
          el,
          [
            { opacity: 0, transform: "translateY(14px)" },
            { opacity: 1, transform: "translateY(0)" },
          ],
          { duration: 650, delay: 650 + i * 60, fill: "backwards" },
        ),
      );
    setTimeout(() => {
      entranceDone = true;
      schedule();
    }, 1800);
  };
  Promise.all([bottle.decode().catch(() => {}), document.fonts.ready]).then(
    start,
  );
  // Reveal content only when it enters view; no persistent hidden state.
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target;
          observer.unobserve(el);
          const index = [...el.parentElement.children].indexOf(el);
          animate(
            el,
            [
              { opacity: 0.15, transform: "translateY(28px)" },
              { opacity: 1, transform: "translateY(0)" },
            ],
            { duration: 650, delay: Math.min(index * 65, 190) },
          );
        });
      },
      { threshold: 0.12 },
    );
    document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
  }
  function updateScroll() {
    raf = 0;
    if (
      !active() ||
      !entranceDone ||
      !fine.matches ||
      document.querySelector("dialog[open]")
    )
      return;
    const h = hero.getBoundingClientRect();
    if (h.bottom > 0 && h.top < innerHeight) {
      const p = Math.max(0, Math.min(1, -h.top / h.height));
      bottle.style.transform = `translateY(${p * 42}px) rotate(${-6 + p * 9}deg)`;
      splash.style.translate = `0 ${p * 60}px`;
    }
    const story = document.querySelector(".bottle-story-scene");
    const r = story.getBoundingClientRect();
    if (r.bottom > 0 && r.top < innerHeight) {
      const p = (innerHeight * 0.5 - (r.top + r.height * 0.5)) / innerHeight;
      document.querySelector(".story-bottle").style.translate =
        `0 ${Math.max(-18, Math.min(18, p * 40))}px`;
    }
  }
  function schedule() {
    if (!raf) raf = requestAnimationFrame(updateScroll);
  }
  addEventListener("scroll", schedule, { passive: true });
  addEventListener("resize", schedule, { passive: true });
  fine.addEventListener("change", () => {
    bottle.style.transform = "";
    splash.style.translate = "";
    document.querySelector(".story-bottle").style.translate = "";
    schedule();
  });
  document.addEventListener("visibilitychange", () => {
    document.documentElement.classList.toggle(
      "motion-paused",
      document.hidden || !active(),
    );
  });
}
