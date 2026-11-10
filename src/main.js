import { products } from "./products.js";
import { initMotion } from "./motion.js";

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const reduced = matchMedia("(prefers-reduced-motion: reduce)");
const productMap = new Map(products.map((product) => [product.id, product]));
const saved = new Set();
const storageKey = "richislac-saved-v1";
let activeProduct = null;
let toastTimer;
function node(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text) element.textContent = text;
  return element;
}
function icon(name) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.classList.add("icon");
  svg.setAttribute("aria-hidden", "true");
  const use = document.createElementNS(svg.namespaceURI, "use");
  use.setAttribute("href", `#i-${name}`);
  svg.append(use);
  return svg;
}
function productImage(product) {
  const image = node("img");
  image.src = product.image;
  image.alt = `Richislac ${product.name}, ${product.size}`;
  image.width = 768;
  image.height = 768;
  image.loading = "lazy";
  return image;
}
function announce(message) {
  clearTimeout(toastTimer);
  $("#toast").textContent = message;
  $("#toast").classList.add("visible");
  toastTimer = setTimeout(() => $("#toast").classList.remove("visible"), 3300);
}
function renderProducts() {
  const cards = products.map((product) => {
    const card = node("article", "product-card reveal");
    card.id = `product-${product.id}`;
    const top = node("div", "product-top");
    top.append(
      node("h3", "", product.name.toUpperCase()),
      node("span", "", product.size),
    );
    const art = node("button", "product-art");
    art.type = "button";
    art.dataset.product = product.id;
    art.setAttribute("aria-label", `View ${product.name}`);
    art.append(productImage(product));
    const actions = node("div", "product-actions");
    const detail = node("button", "button button-cream", "View product");
    detail.type = "button";
    detail.dataset.product = product.id;
    detail.setAttribute("aria-label", `Details for ${product.name}`);
    const save = node("button", "icon-button");
    save.type = "button";
    save.dataset.save = product.id;
    save.append(icon("heart"));
    actions.append(detail, save);
    card.append(top, art, node("p", "product-caption", product.use), actions);
    return card;
  });
  $("#product-grid").replaceChildren(...cards);
}
function updateSaved() {
  $$("[data-count]").forEach((el) => (el.textContent = saved.size));
  $$("[data-save]").forEach((button) => {
    const selected = saved.has(button.dataset.save);
    const product = productMap.get(button.dataset.save);
    button.classList.toggle("is-saved", selected);
    button.setAttribute("aria-pressed", String(selected));
    button.setAttribute(
      "aria-label",
      `${selected ? "Remove" : "Save"} ${product.name}${selected ? " from" : " to"} enquiry`,
    );
  });
  const list = $("#saved-list");
  if (!saved.size)
    list.replaceChildren(
      node("p", "", "Tap the heart on a product to save it here."),
    );
  else
    list.replaceChildren(
      ...[...saved].map((id) => {
        const product = productMap.get(id);
        const row = node("div", "saved-row");
        const copy = node("div");
        copy.append(
          node("strong", "", product.name),
          node("span", "", `${product.size} · ${product.packaging}`),
        );
        const remove = node("button", "icon-button");
        remove.dataset.remove = id;
        remove.setAttribute("aria-label", `Remove ${product.name}`);
        remove.append(icon("close"));
        row.append(productImage(product), copy, remove);
        return row;
      }),
    );
  try {
    localStorage.setItem(storageKey, JSON.stringify([...saved]));
  } catch {
    /* Private mode still supports the current session. */
  }
  if (!$("#enquiry-preview").hidden) renderPreview();
}
let lockState = null;
const openers = new WeakMap();
const closeTimers = new WeakMap();
function openDialog(dialog, opener) {
  if (dialog.open) return;
  openers.set(dialog, opener || document.activeElement);
  lockState = {
    y: scrollY,
    position: document.body.style.position,
    top: document.body.style.top,
    width: document.body.style.width,
  };
  Object.assign(document.body.style, {
    position: "fixed",
    top: `-${lockState.y}px`,
    width: "100%",
  });
  dialog.classList.remove("is-closing");
  dialog.showModal();
  if (dialog.id === "menu-dialog")
    $("#menu-open").setAttribute("aria-expanded", "true");
}
function closeDialog(dialog, after) {
  if (!dialog?.open || closeTimers.has(dialog)) return;
  dialog.classList.add("is-closing");
  const finish = () => {
    closeTimers.delete(dialog);
    dialog.close();
    dialog.classList.remove("is-closing");
    if (lockState) {
      const state = lockState;
      lockState = null;
      Object.assign(document.body.style, {
        position: state.position,
        top: state.top,
        width: state.width,
      });
      const old = document.documentElement.style.scrollBehavior;
      document.documentElement.style.scrollBehavior = "auto";
      window.scrollTo(0, state.y);
      document.documentElement.style.scrollBehavior = old;
    }
    if (dialog.id === "menu-dialog")
      $("#menu-open").setAttribute("aria-expanded", "false");
    if (after) after();
    else openers.get(dialog)?.focus({ preventScroll: true });
  };
  if (reduced.matches) finish();
  else closeTimers.set(dialog, setTimeout(finish, 200));
}
function goTo(hash) {
  const target = document.getElementById(hash.slice(1));
  if (!target) return;
  history.replaceState(null, "", hash);
  if (hash === "#home")
    window.scrollTo({
      top: 0,
      behavior: reduced.matches ? "instant" : "smooth",
    });
  else
    target.scrollIntoView({
      behavior: reduced.matches ? "instant" : "smooth",
      block: "start",
    });
  const focusTarget = target.querySelector("h1,h2,h3") || target;
  focusTarget.tabIndex = -1;
  focusTarget.focus({ preventScroll: true });
}
function showProduct(id, opener) {
  const product = productMap.get(id);
  if (!product) return;
  activeProduct = id;
  const art = node("div", "detail-art");
  art.append(productImage(product));
  const copy = node("div", "detail-copy");
  const title = node("h2", "", product.name.toUpperCase());
  title.id = "product-title";
  const pack = node("div", "detail-pack");
  pack.append(
    node("span", "", product.packaging),
    node("span", "", product.size),
  );
  const button = node(
    "button",
    "button button-navy",
    saved.has(id) ? "Saved to your list" : "Save to enquiry",
  );
  button.id = "save-product";
  button.type = "button";
  button.append(icon(saved.has(id) ? "check" : "bag"));
  copy.append(
    node("p", "eyebrow", `RICHISLAC / ${product.kind.toUpperCase()}`),
    title,
    node("p", "", product.description),
    pack,
    button,
    node(
      "small",
      "",
      "This saves your product choice. It does not place an order.",
    ),
  );
  $("#product-detail").replaceChildren(art, copy);
  openDialog($("#product-dialog"), opener);
}
document.addEventListener("click", (event) => {
  const details = event.target.closest("[data-product]");
  if (details) showProduct(details.dataset.product, details);
  const save = event.target.closest("[data-save]");
  if (save) {
    const id = save.dataset.save;
    const already = saved.has(id);
    if (already) saved.delete(id);
    else saved.add(id);
    updateSaved();
    announce(
      `${productMap.get(id).name} ${already ? "removed from" : "saved to"} your enquiry.`,
    );
  }
  const remove = event.target.closest("[data-remove]");
  if (remove) {
    saved.delete(remove.dataset.remove);
    updateSaved();
    announce("Product removed from your enquiry.");
    $("#saved-list").tabIndex = -1;
    $("#saved-list").focus({ preventScroll: true });
  }
  if (event.target.closest("#save-product") && activeProduct) {
    saved.add(activeProduct);
    updateSaved();
    closeDialog($("#product-dialog"));
    announce("Product saved to your enquiry.");
  }
  if (event.target.closest("[data-close]"))
    closeDialog(event.target.closest("dialog"));
  const anchor = event.target.closest('a[href^="#"]');
  if (anchor) {
    const hash = anchor.getAttribute("href");
    if (hash.length < 2) return;
    event.preventDefault();
    if (anchor.closest("#menu-dialog"))
      closeDialog($("#menu-dialog"), () => goTo(hash));
    else goTo(hash);
  }
});
$("#menu-open").addEventListener("click", (e) =>
  openDialog($("#menu-dialog"), e.currentTarget),
);
$$("dialog").forEach((dialog) => {
  dialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeDialog(dialog);
  });
  dialog.addEventListener("click", (event) => {
    if (event.target !== dialog) return;
    const r = dialog.getBoundingClientRect();
    if (
      event.clientX < r.left ||
      event.clientX > r.right ||
      event.clientY < r.top ||
      event.clientY > r.bottom
    )
      closeDialog(dialog);
  });
});
window.addEventListener(
  "resize",
  () => {
    if (innerWidth > 900 && $("#menu-dialog").open)
      closeDialog($("#menu-dialog"));
  },
  { passive: true },
);

// Only local preview/download. No form values are sent to a service.
const form = $("#enquiry-form");
let previewText = "";
function renderPreview() {
  const values = new FormData(form);
  const lines = [...saved].map((id) => {
    const p = productMap.get(id);
    return `• ${p.name} — ${p.size} · ${p.packaging}`;
  });
  previewText = `RICHISLAC — ENQUIRY PREVIEW\nThis message has not been sent.\n\nName: ${String(values.get("name") || "").trim()}\nEmail: ${String(values.get("email") || "").trim()}\nBusiness: ${String(values.get("business") || "").trim() || "Not specified"}\nCity: ${String(values.get("city") || "").trim() || "Not specified"}\n\nProducts:\n${lines.join("\n") || "General enquiry"}\n\nMessage:\n${String(values.get("message") || "").trim()}`;
  $("#preview-text").textContent = previewText;
}
form.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  renderPreview();
  form.hidden = true;
  $("#enquiry-preview").hidden = false;
  $("#enquiry-preview").scrollIntoView({
    behavior: reduced.matches ? "instant" : "smooth",
    block: "center",
  });
  $("#enquiry-preview h3").tabIndex = -1;
  $("#enquiry-preview h3").focus({ preventScroll: true });
});
$("#edit-enquiry").addEventListener("click", () => {
  form.hidden = false;
  $("#enquiry-preview").hidden = true;
  form.querySelector("input").focus();
});
$("#download-enquiry").addEventListener("click", () => {
  renderPreview();
  const url = URL.createObjectURL(
    new Blob([previewText], { type: "text/plain;charset=utf-8" }),
  );
  const a = node("a");
  a.href = url;
  a.download = "richislac-enquiry-preview.txt";
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});
const navLinks = $$(".desktop-nav a,.bottom-nav a,#menu-dialog nav a");
const observedSections = $$("main>section[id]");
let pendingScroll = false;
function updateNavigation() {
  let active = "home";
  const line = innerHeight * 0.34;
  observedSections.forEach((section) => {
    if (section.getBoundingClientRect().top < line) active = section.id;
  });
  const aliases = {
    explore: "range",
    business: "contact",
    faq: "contact",
    locations: "contact",
    story: "moments",
    about: "moments",
  };
  navLinks.forEach((a) => {
    const current = a.closest(".bottom-nav")
      ? aliases[active] || active
      : active === "explore"
        ? "range"
        : active;
    const isActive = a.hash === `#${current}`;
    a.classList.toggle("active", isActive);
    if (isActive) a.setAttribute("aria-current", "location");
    else a.removeAttribute("aria-current");
  });
  pendingScroll = false;
}
addEventListener(
  "scroll",
  () => {
    if (!pendingScroll) {
      pendingScroll = true;
      requestAnimationFrame(updateNavigation);
    }
  },
  { passive: true },
);
if (visualViewport) {
  const keyboard = () => {
    const editing = document.activeElement?.matches("input,textarea");
    document.body.classList.toggle(
      "keyboard-open",
      !!editing && innerHeight - visualViewport.height > 140,
    );
  };
  visualViewport.addEventListener("resize", keyboard);
  document.addEventListener("focusin", keyboard);
  document.addEventListener("focusout", () =>
    document.body.classList.remove("keyboard-open"),
  );
}
try {
  const items = JSON.parse(localStorage.getItem(storageKey) || "[]");
  if (Array.isArray(items))
    items.forEach((id) => {
      if (productMap.has(id)) saved.add(id);
    });
} catch {
  /* Ignore invalid saved data. */
}
renderProducts();
updateSaved();
updateNavigation();
initMotion();
form.querySelector('[type="submit"]').disabled = false;
if (location.hash === "#home")
  requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "instant" }));
