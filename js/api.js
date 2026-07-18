(function () {
  "use strict";
  const config = window.BEPPO_CONFIG || {};
  const demo = {
    settings: { storeName: "Beppo", subtitle: "スリランカカレーとうつわのお店", phone: "093-000-0000", address: "福岡県北九州市小倉北区（公開前に店舗設定で変更）", businessHours: "11:30–14:00", closedDay: "不定休", instagramUrl: "https://www.instagram.com/beppo_kitakyu", mapUrl: "https://maps.google.com/?q=北九州市小倉北区", maxOrderQuantity: 3 },
    status: { businessStatus: "受付中", planned: 15, mobileOrders: 4, counterSales: 2, reservations: 1, remaining: 8, lowStockThreshold: 3, updatedAt: new Date().toISOString(), ownerComment: "今日はレンズ豆を少し濃いめに。野菜とココナッツの優しい味に仕上げました。", menuName: "Sri Lankan Rice & Curry", menuDescription: "野菜の旨味とココナッツ、香り高いスパイスを重ねた本日の一皿。", sides: ["ジャスミンライス", "パリップ", "キリホディ", "大根カリー", "にんじんサンボル", "サルサ", "パパダン"], veganAvailable: true, spiceAdjustable: true },
    menus: [
      { id: "curry", name: "Sri Lankan Rice & Curry", description: "本日のカレーと副菜を古いうつわで。", price: 1200, available: true },
      { id: "rice-half", name: "ごはんだけハーフ", description: "ごはんを少なめに。", price: 1100, available: true },
      { id: "half", name: "ハーフサイズ", description: "軽めのお食事に。", price: 800, available: true }
    ],
    toppings: [["tandoori","タンドリーチキン",300],["chicken-curry","チキンカリー",450],["egg","ゆで玉子",150],["omelette","オムレツ",250],["cheese-omelette","チーズオムレツ",350],["large-rice","ごはん大盛り",100],["refill","おかわり",100]].map((x,i)=>({id:x[0],name:x[1],price:x[2],available:i!==4})),
    extras: [
      ["watalappan","dessert","ワタラッパン",450,350],["kiripani","dessert","豆乳キリパニ",400,300],["vanilla","dessert","バニラアイス",400,300],["watalappan-ice","dessert","ワタラッパン＆アイス",600,500],
      ["coffee","drink","コーヒー",550,450],["ceylon-tea","drink","セイロンティー",400,300],["samahan","drink","サマハン",350,250],["soy-milk","drink","ふわふわホットソイミルク",500,400],["plum","drink","自家製梅ジュース",500,400],["ginger","drink","自家製ジンジャーエール",550,450],["chai","drink","豆乳マサラチャイ",550,450],["lassi","drink","豆乳黒糖ラッシー",550,450],["float","drink","コーヒーフロート",700,600]
    ].map(x=>({id:x[0],category:x[1],name:x[2],singlePrice:x[3],setPrice:x[4],available:true})),
    slots: [["11:30",2,0],["11:45",2,1],["12:00",3,1],["12:15",3,3],["12:30",3,0],["12:45",2,0],["13:00",2,0],["13:15",2,0]].map(x=>({time:x[0],limit:x[1],current:x[2],available:x[2]<x[1]})),
    orders: [
      { orderNumber:"B260715-001", pickupTime:"11:45", customerName:"佐藤", phone:"090****1234", quantity:1, menuName:"Sri Lankan Rice & Curry", spice:"普通", vegan:false, toppings:["ゆで玉子"], desserts:[], drinks:[], total:1350, status:"受付済み", orderedAt:"11:02", source:"cityhall", notes:"", allergies:"" },
      { orderNumber:"B260715-002", pickupTime:"12:15", customerName:"山田", phone:"080****5678", quantity:2, menuName:"Sri Lankan Rice & Curry", spice:"辛口", vegan:false, toppings:["オムレツ"], desserts:[], drinks:["セイロンティー"], total:2950, status:"調理中", orderedAt:"11:18", source:"instagram", notes:"", allergies:"ナッツ類" }
    ]
  };
  const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
  async function fetchWithTimeout(url, options) {
    const timeout = config.requestTimeoutMs || 12000;
    if (window.AbortController) { const controller = new AbortController(); const timer = setTimeout(()=>controller.abort(), timeout); try { return await fetch(url,{...options,signal:controller.signal}); } finally { clearTimeout(timer); } }
    return Promise.race([fetch(url, options), new Promise((_, reject)=>setTimeout(()=>reject(new Error("TIMEOUT")),timeout))]);
  }
  function calculateRemaining() { return Math.max(0, demo.status.planned - demo.status.mobileOrders - demo.status.counterSales - demo.status.reservations); }
  async function demoRequest(action, payload) {
    await delay(180); demo.status.remaining = calculateRemaining();
    if (action === "getStatus") return { status: demo.status, settings: demo.settings };
    if (action === "getMenu") return { menus:demo.menus,toppings:demo.toppings,extras:demo.extras,status:demo.status,settings:demo.settings };
    if (action === "getPickupSlots") return { slots: demo.slots };
    if (action === "getOrder") { const order = demo.orders.find(x=>x.orderNumber===payload.orderNumber) || BeppoStorage.get("beppoCompletedOrder", null); if (!order) throw apiError("注文が見つかりません", "ORDER_NOT_FOUND"); return { order }; }
    if (action === "createOrder") {
      const duplicate = BeppoStorage.get("demoRequest_"+payload.clientRequestId, null); if (duplicate) return duplicate;
      if (payload.quantity > demo.status.remaining) throw apiError("残り食数が不足しています。内容を見直してください。", "STOCK_SHORTAGE");
      const slot = demo.slots.find(x=>x.time===payload.pickupTime); if (!slot?.available) throw apiError("選択した受取時間は受付を終了しました。", "SLOT_FULL");
      const stamp = new Date(); const orderNumber = `B${String(stamp.getFullYear()).slice(-2)}${String(stamp.getMonth()+1).padStart(2,"0")}${String(stamp.getDate()).padStart(2,"0")}-${String(demo.orders.length+1).padStart(3,"0")}`;
      const order = {...payload,orderNumber,status:"受付済み",orderedAt:stamp.toLocaleTimeString("ja-JP",{hour:"2-digit",minute:"2-digit"})}; demo.orders.push(order); demo.status.mobileOrders += Number(payload.quantity); slot.current++; slot.available=slot.current<slot.limit;
      const result={order,remaining:calculateRemaining()}; BeppoStorage.set("demoRequest_"+payload.clientRequestId,result); return result;
    }
    if (action === "adminLogin") { if (String(payload.pin) !== "1234") throw apiError("PINが正しくありません", "AUTH_FAILED"); return { token:"demo-admin-session",expiresAt:new Date(Date.now()+8*3600000).toISOString() }; }
    if (action === "adminLogout") return {};
    if (action === "getAdminDashboard") return { status:demo.status,settings:demo.settings,orders:demo.orders,slots:demo.slots,estimatedSales:demo.orders.filter(o=>o.status!=="キャンセル").reduce((s,o)=>s+Number(o.total),0) };
    if (action === "registerCounterSale") demo.status.counterSales++;
    if (action === "undoCounterSale") demo.status.counterSales=Math.max(0,demo.status.counterSales-1);
    if (action === "updateBusinessStatus") demo.status.businessStatus=payload.status;
    if (action === "updateStock") demo.status.planned=Number(payload.planned ?? demo.status.planned);
    if (action === "updateReservationCount") demo.status.reservations=Math.max(0,Number(payload.count));
    if (action === "updateOrderStatus") { const order=demo.orders.find(o=>o.orderNumber===payload.orderNumber); if(order) order.status=payload.status; }
    if (action === "updatePickupSlot") { const slot=demo.slots.find(s=>s.time===payload.time); if(slot){slot.limit=Number(payload.limit);slot.available=slot.current<slot.limit;} }
    demo.status.remaining=calculateRemaining(); return { status:demo.status, orders:demo.orders, slots:demo.slots };
  }
  function apiError(message, code) { const error=new Error(message); error.code=code; return error; }
  async function request(action, payload={}, method="GET") {
    if (config.demoMode || !config.apiUrl) return demoRequest(action,payload);
    let url=config.apiUrl; let options={method,cache:"no-store",redirect:"follow"};
    if(method==="GET") url += `${url.includes("?")?"&":"?"}action=${encodeURIComponent(action)}&payload=${encodeURIComponent(JSON.stringify(payload))}`;
    else { options.headers={"Content-Type":"text/plain;charset=utf-8"}; options.body=JSON.stringify({action,...payload}); }
    let response; try { response=await fetchWithTimeout(url,options); } catch(error) { throw apiError(navigator.onLine?"通信に時間がかかっています。もう一度お試しください。":"インターネット接続をご確認ください。",error.name==="AbortError"?"TIMEOUT":"NETWORK_ERROR"); }
    const result=await response.json(); if(!result.success) throw apiError(result.message||"処理を完了できませんでした",result.code||"API_ERROR"); return result.data;
  }
  window.BeppoApi={ getStatus:()=>request("getStatus"), getMenu:()=>request("getMenu"), getPickupSlots:()=>request("getPickupSlots"), getOrder:n=>request("getOrder",{orderNumber:n}), createOrder:o=>request("createOrder",o,"POST"), admin:(action,payload={})=>request(action,payload,"POST") };
})();
