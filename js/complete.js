(function(){
  "use strict";
  const $=selector=>document.querySelector(selector),yen=value=>new Intl.NumberFormat("ja-JP").format(value)+"円";
  function row(label,value){const wrapper=document.createElement("div");wrapper.className="summary-row";const term=document.createElement("dt"),description=document.createElement("dd");term.textContent=label;description.textContent=value;wrapper.append(term,description);return wrapper}
  document.addEventListener("DOMContentLoaded",async()=>{
    const order=BeppoStorage.get("beppoCompletedOrder",null);if(!order){location.replace("./index.html");return}
    $("#complete-number").textContent=order.orderNumber;$("#complete-time").textContent=`${order.pickupTime}にお待ちしています。`;
    const items=Array.isArray(order.items)&&order.items.length?order.items:[{menuName:order.menuName,spice:order.spice,vegan:order.vegan,toppings:order.toppings||[]}];
    const rows=items.map((item,index)=>row(`${index+1}食目`,`${item.menuName}／${item.spice}${item.vegan?"／ビーガン":""}${item.toppings?.length?"／"+item.toppings.join("・"):""}`));
    $("#complete-summary").append(...rows,row("追加",[...(order.desserts||[]),...(order.drinks||[])].join("、")||"なし"),row("合計",yen(order.total)));
    try{const {settings}=await BeppoApi.getStatus();$("#complete-map").href=settings.mapUrl;$("#complete-phone").href=`tel:${settings.phone.replace(/\D/g,"")}`;$("#complete-instagram").href=settings.instagramUrl}catch(_){$("#complete-map").hidden=$("#complete-phone").hidden=true}
  });
})();
