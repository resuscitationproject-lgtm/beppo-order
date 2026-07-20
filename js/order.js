(function () {
  "use strict";
  const state={items:[],menus:[],toppings:[],extras:[],slots:[],status:null,settings:null,nextItemId:1};
  const $=selector=>document.querySelector(selector);
  const yen=value=>new Intl.NumberFormat("ja-JP").format(value)+"円";
  const spiceOptions=["辛さ控えめ","普通","辛口","現地風"];

  function setLoading(active){state.loading=active;const overlay=$("#order-loading"),main=$("#order-main");if(overlay)overlay.hidden=!active;if(main)main.setAttribute("aria-busy",String(active));document.body.classList.toggle("order-is-loading",active)}

  function formatPickupTime(value){
    const text=String(value??"").trim();
    if(/^\d{1,2}:\d{2}$/.test(text)){const parts=text.split(":");return parts[0].padStart(2,"0")+":"+parts[1]}
    const date=new Date(text);
    if(!Number.isNaN(date.getTime()))return new Intl.DateTimeFormat("ja-JP",{timeZone:"Asia/Tokyo",hour:"2-digit",minute:"2-digit",hour12:false}).format(date);
    const match=text.match(/(\d{1,2}):(\d{2})/);return match?match[1].padStart(2,"0")+":"+match[2]:text;
  }
  function tokyoNowMinutes(){const parts=new Intl.DateTimeFormat("ja-JP",{timeZone:"Asia/Tokyo",hour:"2-digit",minute:"2-digit",hour12:false}).formatToParts(new Date());const hour=Number(parts.find(part=>part.type==="hour")?.value||0)%24,minute=Number(parts.find(part=>part.type==="minute")?.value||0);return hour*60+minute}
  function isFuturePickupTime(value){const match=formatPickupTime(value).match(/^(\d{2}):(\d{2})$/);return!!match&&(Number(match[1])*60+Number(match[2])>tokyoNowMinutes())}

  function choice({name,value,label,detail,price,disabled,type="checkbox"}){
    const wrap=document.createElement("label");wrap.className="choice";
    const input=document.createElement("input");input.type=type;input.name=name;input.value=value;input.disabled=!!disabled;
    const body=document.createElement("span");body.className="choice-body";
    const main=document.createElement("span");main.className="choice-main";
    const title=document.createElement("strong");title.textContent=label;main.append(title);
    if(detail){const small=document.createElement("small");small.textContent=detail;main.append(small)}
    const amount=document.createElement("span");amount.className="choice-price";amount.textContent=price||"";
    body.append(main,amount);wrap.append(input,body);return wrap;
  }

  function blankItem(source){
    const first=state.menus.find(menu=>menu.available)||state.menus[0];
    return {id:state.nextItemId++,menuId:source?.menuId||first?.id||"",spice:source?.spice||"普通",vegan:!!source?.vegan,toppingIds:Array.isArray(source?.toppingIds)?source.toppingIds:[]};
  }

  function option(value,label,selected,disabled){const el=document.createElement("option");el.value=value;el.textContent=label;el.selected=selected;el.disabled=!!disabled;return el}

  function renderPlates(){
    const list=$("#plate-list");list.replaceChildren();
    state.items.forEach((item,index)=>{
      const card=document.createElement("article");card.className="plate-card";card.dataset.itemId=item.id;
      card.innerHTML=`<header class="plate-header"><div><span class="plate-number">${index+1}</span><h2>${index+1}食目</h2></div><button class="icon-button plate-remove" type="button" aria-label="${index+1}食目を削除">削除</button></header><div class="plate-fields"><label class="field"><span>基本メニュー</span><select class="plate-menu"></select></label><label class="field"><span>辛さ</span><select class="plate-spice"></select></label><label class="field"><span>ビーガン対応</span><select class="plate-vegan"></select></label></div><div class="plate-toppings"><p class="field-label">この一皿のトッピング</p><div class="mini-choice-grid"></div></div><p class="plate-subtotal"></p>`;
      const menuSelect=card.querySelector(".plate-menu");state.menus.forEach(menu=>menuSelect.append(option(menu.id,`${menu.name}　${yen(menu.price)}${menu.available?"":"（終了）"}`,menu.id===item.menuId,!menu.available)));
      const spiceSelect=card.querySelector(".plate-spice");spiceOptions.forEach(value=>spiceSelect.append(option(value,value,value===item.spice,false)));
      const veganSelect=card.querySelector(".plate-vegan");veganSelect.append(option("false","通常",!item.vegan,false),option("true",state.status.veganAvailable?"ビーガン対応希望":"本日は対応できません",item.vegan,!state.status.veganAvailable));
      const toppings=card.querySelector(".mini-choice-grid");state.toppings.forEach(topping=>{const label=document.createElement("label");label.className="mini-choice";const input=document.createElement("input");input.type="checkbox";input.className="plate-topping";input.dataset.toppingId=topping.id;input.checked=item.toppingIds.includes(topping.id);input.disabled=!topping.available;const span=document.createElement("span");span.textContent=`${topping.name} ＋${yen(topping.price)}${topping.available?"":"（終了）"}`;label.append(input,span);toppings.append(label)});
      card.querySelector(".plate-remove").hidden=state.items.length===1;
      card.querySelector(".plate-subtotal").textContent=`この一皿　${yen(itemTotal(item))}`;
      list.append(card);
    });
    const max=Math.min(Number(state.settings?.maxOrderQuantity||3),Number(state.status?.remaining||0));
    $("#add-plate").disabled=state.items.length>=max;$("#add-plate").textContent=state.items.length>=max?"追加できる上限です":"＋ もう1食追加する";
    $("#quantity-note").textContent=`最大${state.settings?.maxOrderQuantity||3}食・本日の残り${state.status?.remaining||0}食`;
  }

  function itemTotal(item){const menu=state.menus.find(value=>value.id===item.menuId);return Number(menu?.price||0)+item.toppingIds.reduce((sum,id)=>sum+Number(state.toppings.find(value=>value.id===id)?.price||0),0)}
  function selected(name){return [...document.querySelectorAll(`input[name="${name}"]:checked`)].map(input=>input.value)}
  function total(){const extras=[...selected("dessert"),...selected("drink")].reduce((sum,id)=>sum+Number(state.extras.find(value=>value.id===id)?.setPrice||0),0);return state.items.reduce((sum,item)=>sum+itemTotal(item),0)+extras}
  function updateTotal(){$("#order-total").textContent=yen(total());$("#total-quantity").textContent=`${state.items.length}食`;document.querySelectorAll(".plate-card").forEach(card=>{const item=state.items.find(value=>String(value.id)===card.dataset.itemId);if(item)card.querySelector(".plate-subtotal").textContent=`この一皿　${yen(itemTotal(item))}`})}

  function renderOrderOptions(){
    ["dessert","drink"].forEach(category=>$("#"+category+"-choices").replaceChildren(...state.extras.filter(item=>item.category===category).map(item=>choice({name:category,value:item.id,label:item.name,detail:`単品 ${yen(item.singlePrice)} ／ セット ${yen(item.setPrice)}`,price:yen(item.setPrice),disabled:!item.available}))));
    $("#slot-choices").replaceChildren(...state.slots.map(slot=>{const time=formatPickupTime(slot.time),future=isFuturePickupTime(time),available=slot.available&&future,reason=!future?"受付時間終了":slot.unavailableReason||"受付終了";return choice({name:"pickupTime",value:time,label:time,detail:available?`残り${slot.limit-slot.current}枠`:reason,disabled:!available,type:"radio"})}));
  }

  function refreshExpiredSlots(){let changed=false;document.querySelectorAll('input[name="pickupTime"]').forEach(input=>{if(!isFuturePickupTime(input.value)&&!input.disabled){input.disabled=true;if(input.checked){input.checked=false;changed=true}const detail=input.nextElementSibling?.querySelector("small");if(detail)detail.textContent="受付時間終了"}});if(changed){saveDraft();const error=document.querySelector('[data-error="pickupTime"]');if(error)error.textContent="選択していた受取時間の受付が終了しました。別の時間を選んでください"}}

  function restoreDraft(){
    const draft=BeppoStorage.get("beppoOrderDraft",null);if(!draft)return;
    if(Array.isArray(draft.items)&&draft.items.length){const max=Math.min(Number(state.settings?.maxOrderQuantity||3),Number(state.status?.remaining||0));state.items=draft.items.slice(0,max).map(blankItem);renderPlates()}
    ["dessert","drink"].forEach(name=>(draft[name]||[]).forEach(value=>{const input=[...document.querySelectorAll(`input[name="${name}"]`)].find(el=>el.value===String(value)&&!el.disabled);if(input)input.checked=true}));
    if(draft.pickupTime){const normalized=formatPickupTime(draft.pickupTime);const input=[...document.querySelectorAll('input[name="pickupTime"]')].find(el=>el.value===normalized&&!el.disabled);if(input)input.checked=true}
    const fields={customerName:"customer-name",phone:"phone",notes:"notes",allergies:"allergies"};Object.keys(fields).forEach(key=>{if(draft[key]!=null)$("#"+fields[key]).value=draft[key]});$("#privacy-consent").checked=!!draft.privacyConsent;
  }

  function saveDraft(){if(!state.status)return;BeppoStorage.set("beppoOrderDraft",{items:state.items.map(({menuId,spice,vegan,toppingIds})=>({menuId,spice,vegan,toppingIds})),dessert:selected("dessert"),drink:selected("drink"),pickupTime:selected("pickupTime")[0],customerName:$("#customer-name").value,phone:$("#phone").value,notes:$("#notes").value,allergies:$("#allergies").value,privacyConsent:$("#privacy-consent").checked})}

  function orderPayload(){
    const items=state.items.map(item=>{const menu=state.menus.find(value=>value.id===item.menuId);const toppings=item.toppingIds.map(id=>state.toppings.find(value=>value.id===id)).filter(Boolean);return{menuId:menu.id,menuName:menu.name,menuPrice:menu.price,spice:item.spice,vegan:item.vegan,toppingIds:item.toppingIds,toppings:toppings.map(value=>value.name),subtotal:itemTotal(item)}});
    const mapNames=(key)=>selected(key).map(id=>state.extras.find(value=>value.id===id)?.name).filter(Boolean);
    return {clientRequestId:crypto.randomUUID?crypto.randomUUID():`${Date.now()}-${Math.random().toString(16).slice(2)}`,items,quantity:items.length,menuId:items[0].menuId,menuName:items.map(item=>item.menuName).join(" / "),menuPrice:items[0].menuPrice,spice:items.map(item=>item.spice).join(" / "),vegan:items.some(item=>item.vegan),toppingIds:items.flatMap(item=>item.toppingIds),toppings:items.flatMap(item=>item.toppings),dessertIds:selected("dessert"),desserts:mapNames("dessert"),drinkIds:selected("drink"),drinks:mapNames("drink"),pickupTime:selected("pickupTime")[0]||"",customerName:$("#customer-name").value,phone:BeppoValidation.normalizePhone($("#phone").value),notes:BeppoValidation.text($("#notes").value,500),allergies:BeppoValidation.text($("#allergies").value,500),privacyConsent:$("#privacy-consent").checked,source:BeppoStorage.get("beppoSource","direct"),total:total()};
  }

  function validate(order){document.querySelectorAll("[data-error]").forEach(element=>element.textContent="");const errors=BeppoValidation.order(order);Object.entries(errors).forEach(([key,message])=>{const element=document.querySelector(`[data-error="${key}"]`);if(element)element.textContent=message});return Object.keys(errors).length===0}

  function handlePlateChange(event){const card=event.target.closest(".plate-card");if(!card)return;const item=state.items.find(value=>String(value.id)===card.dataset.itemId);if(!item)return;if(event.target.classList.contains("plate-menu"))item.menuId=event.target.value;if(event.target.classList.contains("plate-spice"))item.spice=event.target.value;if(event.target.classList.contains("plate-vegan"))item.vegan=event.target.value==="true";if(event.target.classList.contains("plate-topping")){const id=event.target.dataset.toppingId;item.toppingIds=event.target.checked?[...new Set([...item.toppingIds,id])]:item.toppingIds.filter(value=>value!==id)}updateTotal();saveDraft()}

  async function load(){
    setLoading(true);
    try{const [data,slots]=await Promise.all([BeppoApi.getMenu(),BeppoApi.getPickupSlots()]);Object.assign(state,data,slots);state.items=[blankItem()];$("#order-stock").textContent=`${state.status.remaining}食`;renderPlates();renderOrderOptions();restoreDraft();updateTotal();const orderingOpen=["受付中","残りわずか"].includes(state.status.businessStatus)&&Number(state.status.remaining)>0;$("#confirm-button").disabled=!orderingOpen;$("#order-error").hidden=orderingOpen;if(!orderingOpen){$("#order-error p").textContent=state.status.businessStatus==="売り切れ"?"売り切れ・オーダーストップのため、現在モバイルオーダーを受け付けていません。":"現在モバイルオーダーを受け付けていません。";document.querySelectorAll("#order-form input,#order-form select,#order-form textarea,#order-form button").forEach(element=>element.disabled=true)}}
    catch(error){$("#order-error").hidden=false;$("#order-error p").textContent=error.message}
    finally{setLoading(false)}
  }

  document.addEventListener("DOMContentLoaded",()=>{
    setLoading(true);
    $("#plate-list").addEventListener("change",handlePlateChange);
    $("#plate-list").addEventListener("click",event=>{const button=event.target.closest(".plate-remove");if(!button)return;const card=button.closest(".plate-card");state.items=state.items.filter(item=>String(item.id)!==card.dataset.itemId);renderPlates();updateTotal();saveDraft()});
    $("#add-plate").addEventListener("click",()=>{state.items.push(blankItem());renderPlates();updateTotal();saveDraft()});
    $("#order-form").addEventListener("change",()=>{updateTotal();saveDraft()});$("#order-form").addEventListener("input",saveDraft);
    $("#order-form").addEventListener("submit",event=>{event.preventDefault();const order=orderPayload();if(!validate(order)){document.querySelector(".field-error:not(:empty)")?.scrollIntoView({behavior:"smooth",block:"center"});return}BeppoStorage.set("beppoPendingOrder",order);location.href="./confirm.html"});
    $("#order-retry").addEventListener("click",load);setInterval(refreshExpiredSlots,30000);load();
  });
  addEventListener("beforeunload",event=>{if(state.loading){event.preventDefault();event.returnValue=""}});
})();
