(function () {
  "use strict";
  const $ = selector => document.querySelector(selector);
  function setText(selector, value) { const el=$(selector); if(el) el.textContent=value; }
  function image(selector,key) { const el=$(selector); const src=window.BEPPO_CONFIG?.images?.[key]; if(el&&src) el.src=src; }
  function captureSource() { const value=new URLSearchParams(location.search).get("src"); BeppoStorage.set("beppoSource",BeppoValidation.source(value)); }
  function applyStatus(data) {
    const {status,settings}=data; const remaining=Number(status.remaining); const state=remaining===0?"売り切れ":remaining<=3?"残りわずか":status.businessStatus;
    setText("#header-status",state); setText("#header-stock",`${remaining}食`); setText("#hero-status",state); setText("#hero-stock",`あと${remaining}食`); setText("#hero-price",new Intl.NumberFormat("ja-JP",{style:"currency",currency:"JPY",maximumFractionDigits:0}).format(1200));
    setText("#today-menu-name",status.menuName); setText("#today-description",status.menuDescription); setText("#owner-comment",`「${status.ownerComment}」`);
    const sides=$("#side-list"); if(sides) { sides.replaceChildren(...status.sides.map(name=>{const li=document.createElement("li");li.textContent=name;return li;})); }
    setText("#store-address",settings.address); setText("#business-hours",settings.businessHours); setText("#closed-day",settings.closedDay); const phone=$("#store-phone");if(phone){phone.textContent=settings.phone;phone.href=`tel:${settings.phone.replace(/\D/g,"")}`;}
    const instagram=$("#instagram-link");if(instagram)instagram.href=settings.instagramUrl; const map=$("#map-link");if(map)map.href=settings.mapUrl;
    const order=$("#order-button"); const unavailable=remaining<=0||["営業終了","休業","準備中"].includes(status.businessStatus); if(order){order.classList.toggle("disabled",unavailable);order.setAttribute("aria-disabled",String(unavailable));order.href=unavailable?"#status-section":"./order.html";order.textContent=remaining<=0?"本日のカレーは売り切れました":status.businessStatus==="休業"?"本日はお休みです":"モバイル・オーダー";}
    document.querySelectorAll(".skeleton").forEach(el=>el.classList.remove("skeleton"));
  }
  async function load() { const error=$("#load-error"); try { error.hidden=true; applyStatus(await BeppoApi.getStatus()); } catch(e) { error.hidden=false; error.querySelector("p").textContent=e.message; } }
  document.addEventListener("DOMContentLoaded",()=>{ captureSource(); image("#hero-image","hero"); image("#today-image","today"); image("#shop-image","shop"); image("#pottery-image","pottery"); load(); $("#retry-button")?.addEventListener("click",load); });
})();
