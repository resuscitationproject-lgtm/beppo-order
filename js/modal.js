(function () {
  "use strict";
  let previousFocus = null;
  function close() { const root = document.querySelector(".modal-backdrop"); if (!root) return; root.remove(); document.body.style.overflow = ""; previousFocus?.focus?.(); }
  function open(options) {
    close(); previousFocus = document.activeElement;
    const root = document.createElement("div"); root.className = "modal-backdrop";
    root.innerHTML = `<section class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><h2 id="modal-title"></h2><div class="modal-body"></div><div class="modal-actions"></div></section>`;
    root.querySelector("h2").textContent = options.title || "確認";
    const body = root.querySelector(".modal-body");
    if (options.html) body.innerHTML = options.html; else body.textContent = options.message || "";
    const actions = root.querySelector(".modal-actions");
    (options.actions || [{ label: "閉じる" }]).forEach(action => { const button = document.createElement("button"); button.type = "button"; button.className = `button ${action.className || "button-secondary"}`; button.textContent = action.label; button.addEventListener("click", () => { if (action.close !== false) close(); action.onClick?.(); }); actions.append(button); });
    root.addEventListener("click", event => { if (event.target === root && options.dismissible !== false) close(); });
    root.addEventListener("keydown", event => { if (event.key === "Escape" && options.dismissible !== false) close(); });
    document.body.append(root); document.body.style.overflow = "hidden"; actions.querySelector("button")?.focus();
  }
  window.BeppoModal = { open, close };
})();
