(function () {
  "use strict";
  const order = BeppoStorage.get("beppoPendingOrder", null);
  const $ = selector => document.querySelector(selector);
  const yen = value => new Intl.NumberFormat("ja-JP").format(value) + "円";

  function mask(phone) {
    return phone.length > 6 ? phone.slice(0, 3) + "****" + phone.slice(-4) : phone;
  }

  function row(label, value, className = "") {
    const wrapper = document.createElement("div");
    wrapper.className = "summary-row " + className;
    const term = document.createElement("dt");
    const description = document.createElement("dd");
    term.textContent = label;
    description.textContent = value || "なし";
    wrapper.append(term, description);
    return wrapper;
  }

  function render() {
    if (!order) {
      location.replace("./order.html");
      return;
    }
    $("#confirm-summary").append(
      row("お名前", order.customerName),
      row("電話番号", mask(order.phone)),
      row("基本メニュー", `${order.menuName} × ${order.quantity}`),
      row("辛さ", order.spice),
      row("ビーガン", order.vegan ? "希望する" : "なし"),
      row("トッピング", order.toppings.join("、")),
      row("デザート", order.desserts.join("、")),
      row("ドリンク", order.drinks.join("、")),
      row("受取時間", order.pickupTime),
      row("備考", order.notes),
      row("アレルギー等", order.allergies),
      row("お支払い", "店舗支払い"),
      row("合計", yen(order.total), "total")
    );
  }

  async function checkTimedOutOrder(errorPanel) {
    try {
      const result = await BeppoApi.getOrder(order.clientRequestId);
      if (result.order) {
        BeppoStorage.set("beppoCompletedOrder", result.order);
        BeppoStorage.remove("beppoPendingOrder");
        BeppoStorage.remove("beppoOrderDraft");
        location.replace("./complete.html");
      }
    } catch (_) {
      errorPanel.querySelector("p").textContent = "注文を確認できませんでした。時間をおいて再度お試しください。";
    }
  }

  async function submit() {
    const button = $("#submit-order");
    const errorPanel = $("#submit-error");
    button.disabled = true;
    button.textContent = "取り置きを受け付けています…";
    errorPanel.hidden = true;
    try {
      const result = await BeppoApi.createOrder(order);
      BeppoStorage.set("beppoCompletedOrder", result.order);
      BeppoStorage.remove("beppoPendingOrder");
      BeppoStorage.remove("beppoOrderDraft");
      location.replace("./complete.html");
    } catch (error) {
      errorPanel.hidden = false;
      errorPanel.querySelector("p").textContent = error.message;
      button.disabled = false;
      button.textContent = "もう一度取り置く";
      if (error.code === "TIMEOUT") {
        const checkButton = $("#check-order");
        checkButton.hidden = false;
        checkButton.onclick = () => checkTimedOutOrder(errorPanel);
      }
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    render();
    $("#submit-order").addEventListener("click", submit);
  });
})();
