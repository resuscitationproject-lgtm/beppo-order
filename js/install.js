(function () {
  "use strict";
  let promptEvent = null;
  const standalone = matchMedia("(display-mode: standalone)").matches || window.navigator.standalone;
  window.addEventListener("beforeinstallprompt", event => { event.preventDefault(); promptEvent = event; document.querySelectorAll("[data-install]").forEach(el => el.hidden = false); });
  function instructions(admin) { const items = admin ? ["Safari上部の共有ボタンを押す", "「ホーム画面に追加」を選ぶ", "名前を「Beppo管理」にする", "右上の「追加」を押す"] : ["Safariの共有ボタンを押す", "「ホーム画面に追加」を選ぶ", "右上の「追加」を押す"]; BeppoModal.open({ title: admin ? "Beppo管理をホーム画面に追加" : "Beppoをホーム画面に追加", html: `<ol>${items.map(x => `<li>${x}</li>`).join("")}</ol>` }); }
  document.addEventListener("click", async event => { const button = event.target.closest("[data-install]"); if (!button) return; if (promptEvent) { promptEvent.prompt(); await promptEvent.userChoice; promptEvent = null; button.hidden = true; } else instructions(button.dataset.install === "admin"); });
  document.addEventListener("DOMContentLoaded", () => { if (standalone) document.querySelectorAll("[data-install]").forEach(el => el.hidden = true); if ("serviceWorker" in navigator) navigator.serviceWorker.register("./service-worker.js").catch(() => {}); });
})();
