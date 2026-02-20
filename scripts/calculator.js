(function(){
  "use strict";

  // Глобальні змінні для конфігурації
  let DEVICE_CONFIG = null;
  let COMPONENTS_DATA = null;
  let DATA = null;

  // Ініціалізація з URL параметра
  const deviceId = new URLSearchParams(window.location.search).get('device') || 
                   window.location.pathname.split('/').pop().replace('.html', '');

  // Завантаження конфігурацій
  async function loadConfigs() {
    try {
      // Завантажуємо конфігурацію приладів
      const devicesResponse = await fetch('../data/devices-config.json');
      const devicesConfig = await devicesResponse.json();
      
      // Знаходимо конфігурацію поточного приладу
      DEVICE_CONFIG = devicesConfig.devices.find(d => d.id === deviceId);
      
      if (!DEVICE_CONFIG) {
        throw new Error(`Device configuration not found for: ${deviceId}`);
      }

      // Завантажуємо конфігурацію компонентів
      const componentsResponse = await fetch('../data/components.json');
      COMPONENTS_DATA = await componentsResponse.json();

      // Фільтруємо модулі згідно excludeModules
      const filteredModules = COMPONENTS_DATA.modulesInner.filter(
        m => !DEVICE_CONFIG.excludeModules.includes(m.name)
      );

      // Формуємо DATA об'єкт
      DATA = {
        base: {
          device: DEVICE_CONFIG.baseDevice.name,
          normal: DEVICE_CONFIG.baseDevice.normal,
          alarm: DEVICE_CONFIG.baseDevice.alarm
        },
        modulesInner: filteredModules,
        keyboardGroups: COMPONENTS_DATA.keyboardGroups,
        modulesExt: COMPONENTS_DATA.modulesExt,
        sensors: COMPONENTS_DATA.sensors,
        sirens: COMPONENTS_DATA.sirens
      };

      return true;
    } catch (error) {
      console.error('Error loading configurations:', error);
      document.body.innerHTML = `
        <div style="padding: 40px; text-align: center; color: #fff;">
          <h1>Помилка завантаження конфігурації</h1>
          <p>${error.message}</p>
          <a href="../index.html" style="color: #00ff66;">Повернутися на головну</a>
        </div>
      `;
      return false;
    }
  }

  // Оновлення UI на основі конфігурації
  function updatePageUI() {
    document.getElementById('pageTitle').textContent = DEVICE_CONFIG.title;
    document.getElementById('deviceTitle').textContent = DEVICE_CONFIG.title;
    document.getElementById('backLink').href = DEVICE_CONFIG.backLink;
    document.getElementById('boardImage').src = `../${DEVICE_CONFIG.boardImage}`;
    document.getElementById('boardImage').alt = DEVICE_CONFIG.name;

    // Генерація hotspots
    const boardWrap = document.getElementById('boardWrap');
    const hotspots = DEVICE_CONFIG.hotspots;

    // Додаємо модуль слот 1 (завжди є)
    if (hotspots.mod1) {
      boardWrap.innerHTML += `
        <button class="hotspot hot-mod-1" data-type="modules" data-device="main" title="Модулі" 
                style="left:${hotspots.mod1.left};top:${hotspots.mod1.top};">+</button>
      `;
    }

    // Додаємо модуль слот 2 (якщо є)
    if (DEVICE_CONFIG.hasModSlot2 && hotspots.mod2) {
      boardWrap.innerHTML += `
        <button class="hotspot hot-mod-2" data-type="modules" data-device="main" title="Модулі"
                style="left:${hotspots.mod2.left};top:${hotspots.mod2.top};">+</button>
      `;
    }
    // Додаємо M-Z слот (тільки для NOVA M)
    if (DEVICE_CONFIG.hasMzSlot && hotspots.mz) {
      boardWrap.innerHTML += `
        <button class="hotspot hot-mz" data-type="main-mz" data-device="main" title="M-Z"
                style="left:${hotspots.mz.left};top:${hotspots.mz.top};">+</button>
      `;
    }
    // Додаємо клавіатури
    if (hotspots.kb) {
      boardWrap.innerHTML += `
        <button class="hotspot hot-kb" data-type="keyboards" data-device="main" title="Клавіатури"
                style="left:${hotspots.kb.left};top:${hotspots.kb.top};">+</button>
      `;
    }

    // Додаємо датчики
    if (hotspots.sens) {
      boardWrap.innerHTML += `
        <button class="hotspot hot-sens" data-type="sensors" data-device="main" title="Датчики"
                style="left:${hotspots.sens.left};top:${hotspots.sens.top};">+</button>
      `;
    }

    // Додаємо сирени
    if (hotspots.sir) {
      boardWrap.innerHTML += `
        <button class="hotspot hot-sir" data-type="sirens" data-device="main" title="Сирени"
                style="left:${hotspots.sir.left};top:${hotspots.sir.top};">+</button>
      `;
    }
  }

  // ====== HELPERS ======
  function qs(sel,root){return (root||document).querySelector(sel);}
  function qsa(sel,root){return Array.from((root||document).querySelectorAll(sel));}

  // DOM references
  let rowsEl, hoursEl, reserveEl, sumNormEl, sumAlarmEl, capEl;
  let modal, modalTitle, tabKbBody, tabModsBody, genericBody;
  let tabKbBtn, tabModsBtn, closeBtn, clearBtn, deviceTypeSwitch;
  
  const cart = new Map();
  let universalSlots = [null, null];
  const SLOT_LIMITS = COMPONENTS_DATA ? COMPONENTS_DATA.slotLimits : {};
  
  let currentSlotIndex = null;
  let slotButtons = [];

  // Extenders context
  const extDevices = new Map();
  let currentContext = { type: "main", id: "main" };

  let deviceTabsEl = null;
  let extPagesEl   = null;
  let stageEl      = null;

  function initDOMReferences() {
    rowsEl     = qs("#rows");
    hoursEl    = qs("#hours");
    reserveEl  = qs("#reserve");
    sumNormEl  = qs("#sumNorm");
    sumAlarmEl = qs("#sumAlarm");
    capEl      = qs("#capacity");

    modal       = qs("#modal");
    modalTitle  = qs("#modalTitle");
    tabKbBody   = qs("#tab-kb");
    tabModsBody = qs("#tab-mods");
    genericBody = qs("#generic-body");

    tabKbBtn    = qs('.tab[data-tab="kb"]');
    tabModsBtn  = qs('.tab[data-tab="mods"]');
    closeBtn    = qs("#closeModal");
    clearBtn    = qs("#clearAll");
    deviceTypeSwitch = document.getElementById("device-type-switch");
    
    if (deviceTypeSwitch) {
      deviceTypeSwitch.dataset.visible = "false";
    }
    
    // Ініціалізуємо slot buttons після генерації hotspots
    slotButtons = [
      document.querySelector(".hot-mod-1"),
      DEVICE_CONFIG.hasModSlot2 ? document.querySelector(".hot-mod-2") : null
    ].filter(Boolean);
    
    // Коригуємо universalSlots
    universalSlots = DEVICE_CONFIG.hasModSlot2 ? [null, null] : [null];
  }

  function updateSlotUI(){
    if(!slotButtons) return;
    slotButtons.forEach((btn, idx)=>{
      if(!btn) return;
      const slot = universalSlots[idx];
      if(slot){
        btn.classList.add("occupied");
        btn.classList.remove("free");
        btn.title = slot.name;
      }else{
        btn.classList.remove("occupied");
        btn.classList.add("free");
        btn.title = "Модулі";
        btn.textContent = "+";
      }
    });
  }

  function clearSlotsByModuleName(name){
    for(let i=0;i<universalSlots.length;i++){
      const s = universalSlots[i];
      if(s && s.name === name){
        universalSlots[i] = null;
      }
    }
    updateSlotUI();
  }

  function syncCartFromSlots(){
    const counts = {};
    universalSlots.forEach(s=>{
      if(s){
        counts[s.name] = (counts[s.name]||0)+1;
      }
    });

    cart.forEach((item,key)=>{
      if(item.type === "Модуль" && DATA.modulesInner.some(m=>m.name===item.name)){
        const c = counts[item.name] || 0;
        if(c<=0){
          cart.delete(key);
        }else{
          item.qty = c;
        }
      }
    });

    DATA.modulesInner.forEach(m=>{
      const c = counts[m.name] || 0;
      if(c>0){
        const proto = {
          type:"Модуль",
          name:m.name,
          normal:m.normal||0,
          alarm:m.alarm||0,
          qty:c,
          fixed:false
        };
        const k = keyOf(proto);
        if(cart.has(k)){
          cart.get(k).qty = c;
        }else{
          cart.set(k, proto);
        }
      }
    });

    renderTable();
  }

  function assignModuleToSlot(slotIndex, mod){
    if(slotIndex == null || slotIndex < 0 || slotIndex >= universalSlots.length) return;
    const name = mod.name;
    const max = SLOT_LIMITS[name] || 1;

    let otherCount = 0;
    universalSlots.forEach((s, idx)=>{
      if(idx !== slotIndex && s && s.name === name) otherCount++;
    });
    if(otherCount >= max){
      return;
    }

    universalSlots[slotIndex] = { name:name };
    updateSlotUI();
    syncCartFromSlots();
    modal.classList.remove("open");
  }

  function keyOf(it){return it.type+":"+it.name;}

  function initCart(){
    cart.clear();
    const base = {
      type:"Прилад",
      name:DATA.base.device,
      normal:DATA.base.normal,
      alarm:DATA.base.alarm,
      qty:1,
      fixed:true
    };
    cart.set(keyOf(base), base);
    for(let i=0;i<universalSlots.length;i++){
      universalSlots[i] = null;
    }
    updateSlotUI();
  }

  function updateMzHotspotState(){
  const btn = document.querySelector(".hot-mz");
  if(!btn) return;

  const hasMz = cart.has("Модуль:M-Z");

  btn.classList.toggle("occupied", hasMz);
  }

  function renderTable(){
    rowsEl.innerHTML = "";
    const order = ["Прилад","Модуль","Модуль (корпус)","Клавіатура","Датчик","Сирена"];
    const arr = Array.from(cart.values()).sort((a,b)=>{
      const ai = order.indexOf(a.type);
      const bi = order.indexOf(b.type);
      if(ai!==bi) return ai-bi;
      return a.name.localeCompare(b.name,"uk");
    });

    arr.forEach(item=>{
      const tr = document.createElement("tr");
      const td = txt=>{
        const c = document.createElement("td");
        c.textContent = txt;
        return c;
      };
      tr.appendChild(td(item.type));

      if(item.custom){
        const tdName=document.createElement("td");
        const inpName=document.createElement("input");
        inpName.className="ext-edit";
        inpName.value=item.name;
        inpName.addEventListener("input",()=>{item.name=inpName.value;});
        tdName.appendChild(inpName);
        tr.appendChild(tdName);

        const tdNorm=document.createElement("td");
        const inpNorm=document.createElement("input");
        inpNorm.type="number";
        inpNorm.className="ext-edit";
        inpNorm.value=item.normal;
        inpNorm.addEventListener("input",()=>{
          let v=parseFloat(inpNorm.value||"0");
          if(isNaN(v)||v<0) v=0;
          item.normal=v;
          inpNorm.value=v;
          updateTotals();
        });
        tdNorm.appendChild(inpNorm);
        tr.appendChild(tdNorm);

        const tdAlarm=document.createElement("td");
        const inpAlarm=document.createElement("input");
        inpAlarm.type="number";
        inpAlarm.className="ext-edit";
        inpAlarm.value=item.alarm;
        inpAlarm.addEventListener("input",()=>{
          let v=parseFloat(inpAlarm.value||"0");
          if(isNaN(v)||v<0) v=0;
          item.alarm=v;
          inpAlarm.value=v;
          updateTotals();
        });
        tdAlarm.appendChild(inpAlarm);
        tr.appendChild(tdAlarm);
      }else{
        tr.appendChild(td(item.name));
        tr.appendChild(td(item.normal));
        tr.appendChild(td(item.alarm));
      }

      const tdQty = document.createElement("td");
      tdQty.className="qty";
      const inp = document.createElement("input");
      if(item.fixed){
        inp.value = 1;
        inp.disabled = true;
        inp.classList.add("locked");
      }
      if(item.type === "Модуль" && DATA.modulesInner.some(m => m.name === item.name)){
        inp.disabled = true;
        inp.classList.add("locked");
      }
      inp.type="number"; inp.min="1"; inp.step="1"; inp.value=item.qty;
      inp.addEventListener("input",()=>{
        let v = parseInt(inp.value||"1",10);
        if(isNaN(v)||v<1) v=1;
        item.qty=v;
        inp.value = v;
        updateTotals();
      });
      tdQty.appendChild(inp);
      tr.appendChild(tdQty);

      const tdAct = document.createElement("td");
      if(item.fixed){
        const span=document.createElement("span");
        span.textContent="база";
        span.style.fontSize="12px";
        span.style.color="#9fe8b7";
        tdAct.appendChild(span);
      }else{
        const btn=document.createElement("button");
        btn.textContent="✕";
        btn.className="row-del";
        btn.addEventListener("click",()=>{
          const k = keyOf(item);
          if(item.type === "Модуль" && DATA.modulesInner.some(m=>m.name===item.name)){
            clearSlotsByModuleName(item.name);
            cart.delete(k);
            syncCartFromSlots();
          }else{
            cart.delete(k);
            renderTable();
            updateTotals();
            updateMzHotspotState();
          }
        });
        tdAct.appendChild(btn);
      }
      tr.appendChild(tdAct);

      rowsEl.appendChild(tr);
    });

    updateTotals();
  }

  function updateTotals(){
    let norm=0, alarm=0;
    cart.forEach(it=>{
      norm += (it.normal||0)*it.qty;
      alarm+= (it.alarm ||0)*it.qty;
    });
    sumNormEl.textContent  = Math.round(norm);
    sumAlarmEl.textContent = Math.round(alarm);

    const hours   = Math.max(1, parseFloat(hoursEl.value||"1"));
    const reserve = parseFloat(reserveEl.value||"1.25");
    const cap     = (norm * hours / 1000) * reserve;
    capEl.textContent = cap.toFixed(2);
  }

    function addItem(type,obj,ctx){
    const context = ctx || currentContext;

  const item = {
    type,
    name:obj.name,
    normal:obj.normal||0,
    alarm:obj.alarm||0,
    qty:1,
    fixed:false,
    custom: !!obj.custom
  };

  // ===== MAIN DEVICE: M-Z TOGGLE =====
  if (context.type === "main" && obj.name === "M-Z") {
    const key = "Модуль:M-Z";

    if (cart.has(key)) {
      cart.delete(key);
      renderTable();
      updateMzHotspotState();
      return;
    }
    // якщо нема — йдемо далі, додаємо
  }
    if(context.type === "ext" && context.id !== "main"){
      const dev = extDevices.get(context.id);
      if(!dev) return;
      const rows = dev.rows;

      const isUnique = (item.name === "M-Z" || item.name === "M-OUT2R");
      const existingIndex = rows.findIndex(r=>r.type===item.type && r.name===item.name);
      const existing = existingIndex >= 0 ? rows[existingIndex] : null;

      if(isUnique){
        // Тогл: якщо модуль вже є — видаляємо, якщо немає — додаємо один
        if(existing){
          rows.splice(existingIndex,1);
        }else{
          rows.push(item);
        }
      }else{
        if(existing) existing.qty += 1;
        else rows.push(item);
      }
      recalcExtDevice(context.id);
    }else{
      const k = keyOf(item);
      if(cart.has(k)) cart.get(k).qty += 1;
      else cart.set(k,item);
      renderTable();
      updateMzHotspotState();
    }
  }
  function buildGenericList(list,label){
    genericBody.innerHTML="";
    const grid=document.createElement("div");
    grid.className="mod-grid";

    list.forEach(it=>{
      const card=document.createElement("div");
      card.className="card";

      const img=document.createElement("img");
      img.src = `../${it.img}` || "../assets/modules/placeholder.png";
      img.alt=it.name;

      const lbl=document.createElement("div");
      lbl.className="card-label";
      lbl.textContent=it.name;

      card.appendChild(img);
      card.appendChild(lbl);

      if(currentContext && currentContext.type === "ext" && currentContext.id !== "main"){
        const dev = extDevices.get(currentContext.id);
        const highlight = (it.name === "M-Z" || it.name === "M-OUT2R");
        if(dev && highlight && dev.rows.some(r=>r.name === it.name)){
          card.classList.add("used-item");
        }
      }

      card.addEventListener("click",()=>{
        addItem(label, it);
        modal.classList.remove("open");
      });

      grid.appendChild(card);
    });

    genericBody.appendChild(grid);
  }

  function clearTabs(){
    qsa(".tab-body").forEach(b=>b.classList.remove("active"));
    qsa(".tab").forEach(t=>t.classList.remove("active"));
  }

  function buildKeyboardTab(){
    tabKbBody.innerHTML="";
    const grid=document.createElement("div");
    grid.className="kb-grid";

    Object.entries(DATA.keyboardGroups).forEach(([group,info])=>{
      const card=document.createElement("div");
      card.className="card";
      const img=document.createElement("img");
      img.src=`../${info.img}`;
      img.alt=group;
      const label=document.createElement("div");
      label.className="card-label";
      label.textContent=group;
      card.appendChild(img);
      card.appendChild(label);
      card.addEventListener("click",()=>showKeyboardModels(group,info));
      grid.appendChild(card);
    });

    const modelsBox=document.createElement("div");
    modelsBox.className="kb-models";
    modelsBox.id="kbModelsBox";
    const title=document.createElement("div");
    title.className="kb-models-title";
    title.textContent="Оберіть тип клавіатури, щоб побачити моделі.";
    modelsBox.appendChild(title);

    tabKbBody.appendChild(grid);
    tabKbBody.appendChild(modelsBox);
  }

  function showKeyboardModels(group,info){
    const box=qs("#kbModelsBox");
    if(!box) return;
    box.innerHTML="";
    const title=document.createElement("div");
    title.className="kb-models-title";
    title.textContent=group+" — моделі:";
    const list=document.createElement("div");
    list.className="model-list";
    info.models.forEach(m=>{
      const btn=document.createElement("button");
      btn.className="model-btn";
      btn.textContent=m.name;
      btn.addEventListener("click",()=>{
        addItem("Клавіатура",m);
        modal.classList.remove("open");
      });
      list.appendChild(btn);
    });
    box.appendChild(title);
    box.appendChild(list);
  }

  function buildModulesTab(){
    tabModsBody.innerHTML="";
    const section=document.createElement("div");
    section.className="mod-section";

    const h=document.createElement("h4");
    section.appendChild(h);

    const grid=document.createElement("div");
    grid.className="mod-grid";

    DATA.modulesInner.forEach(m=>{
      const card=document.createElement("div");
      card.className="card";

      const img=document.createElement("img");
      img.src = `../${m.img}` || "../assets/modules/placeholder.png";
      img.alt=m.name;

      const label=document.createElement("div");
      label.className="card-label";
      label.textContent=m.name;

      card.appendChild(img);
      card.appendChild(label);

      const max = SLOT_LIMITS[m.name] || 1;
      let total = 0;
      let other = 0;
      universalSlots.forEach((s, idx)=>{
        if(s && s.name === m.name){
          total++;
          if(currentSlotIndex === null || idx !== currentSlotIndex){
            other++;
          }
        }
      });

      const isSelected = (currentSlotIndex !== null &&
                          universalSlots[currentSlotIndex] &&
                          universalSlots[currentSlotIndex].name === m.name);

      const freeSlots = universalSlots.filter(s=>!s).length;

      let isFull;
      if(currentSlotIndex === null){
        isFull = (total >= max) || (freeSlots === 0);
      }else{
        isFull = (!isSelected && other >= max);
      }

      if(isSelected){
        card.classList.add("selected");
      }
      if(isFull){
        card.classList.add("disabled");
      }

      card.addEventListener("click", () => {
        if (card.classList.contains("disabled")) return;
        if (currentSlotIndex == null) return;

        const selected = universalSlots[currentSlotIndex];

        if (selected && selected.name === m.name) {
          universalSlots[currentSlotIndex] = null;
          updateSlotUI();
          syncCartFromSlots();
          modal.classList.remove("open");
          return;
        }

        assignModuleToSlot(currentSlotIndex, m);
      });

      grid.appendChild(card);
    });

    section.appendChild(grid);
    tabModsBody.appendChild(section);
  }

  function buildExtModulesTab(){
    tabModsBody.innerHTML="";
    const container=document.createElement("div");
    container.className="ext-mods-container";

    Object.entries(DATA.modulesExt).forEach(([group,list])=>{
      const block=document.createElement("div");
      block.className="ext-mod-block";

      const h=document.createElement("h4");
      h.textContent=group;
      block.appendChild(h);

      const grid=document.createElement("div");
      grid.className="mod-grid";

      list.forEach(m=>{
        const card=document.createElement("div");
        card.className="card";

        const img=document.createElement("img");
        img.src = `../${m.img}` || "../assets/modules/placeholder.png";
        img.alt=m.name;

        const label=document.createElement("div");
        label.className="card-label";
        label.textContent=m.name;

        card.appendChild(img);
        card.appendChild(label);

        card.addEventListener("click",()=>{
          if(m.name === "M-ZP box" || m.name === "M-ZP mBox" || m.name === "M-ZP sBox"){
            createExtTab(m);
          }else{
            addItem("Модуль (корпус)", m, { type:"main", id:"main" });
          }
          modal.classList.remove("open");
        });

        grid.appendChild(card);
      });

      block.appendChild(grid);
      container.appendChild(block);
    });

    tabModsBody.appendChild(container);
  }


  function openModalFor(section){
    modal.classList.add("open");

    tabKbBtn.style.display   = "none";
    tabModsBtn.style.display = "none";

    clearTabs();
    genericBody.classList.remove("active");

    if(section==="modules"){
      tabKbBtn.style.display = "none";
      buildModulesTab();
      tabModsBtn.classList.add("active");
      tabModsBody.classList.add("active");
      modalTitle.textContent="Модулі універсального слота";
    }else if(section==="keyboards"){
      buildKeyboardTab();
      buildExtModulesTab();
      
      // Показуємо вкладку "Модулі" тільки якщо прилад підтримує розширювачі
      tabKbBtn.style.display = "inline-flex";
      if (DEVICE_CONFIG.supportsExtenders) {
        tabModsBtn.style.display = "inline-flex";
        modalTitle.textContent = "Клавіатури та розширювачі";
      } else {
        tabKbBtn.style.display = "none";
        tabModsBtn.style.display = "none";
        modalTitle.textContent = "Клавіатури";
      }
      
      tabKbBtn.classList.add("active");
      tabKbBody.classList.add("active");
    }else if(section === "ext-power"){
      tabKbBtn.style.display = "none";
      tabModsBtn.style.display = "none";
      genericBody.classList.add("active");
      modalTitle.textContent = "Модулі";

      const list = [
        { name: "M-Z box",   img: "assets/modules/M-Z box.png", normal: 60,  alarm: 60  },
        { name: "M-OUT2R box",   img: "assets/modules/M-OUT2R box.png", normal: 40, alarm: 40 },
        { name: "M-OUT8R",   img: "assets/modules/M-OUT8R.png", normal: 25,  alarm: 360 },
        { name: "P-IND32",   img: "assets/modules/P-IND32.png", normal: 5,   alarm: 5 }
      ];

      buildGenericList(list, "Модуль");
    }else if(section === "ext-modx"){
      tabKbBtn.style.display   = "none";
      tabModsBtn.style.display = "none";
      genericBody.classList.add("active");
      modalTitle.textContent = "Модуль розширювача";

      const list = [
        { name:"M-OUT2R", img:"assets/modules/M-OUT2R.png", normal:40, alarm:40 }
      ];

      buildGenericList(list, "Модуль");
    }else if(section==="ext-mz"){
      tabKbBtn.style.display   = "none";
      tabModsBtn.style.display = "none";
      genericBody.classList.add("active");
      modalTitle.textContent="Модуль M-Z";

      const mzModule = {
        name: "M-Z",
        img: "assets/modules/M-Z.png",
        normal: 60,
        alarm: 60
      };

      buildGenericList([mzModule],"Модуль зон");
    }else if(section==="sensors"){
      tabKbBtn.style.display   = "none";
      tabModsBtn.style.display = "none";
      genericBody.classList.add("active");
      modalTitle.textContent="Датчики";

      const list = [
        ...DATA.sensors,
        { name: "Своє значення", img: "assets/tiras_logo_w.png", normal: 0, alarm: 0, custom: true }
      ];

      buildGenericList(list,"Датчик");
    }else if(section==="sirens"){
      tabKbBtn.style.display   = "none";
      tabModsBtn.style.display = "none";
      genericBody.classList.add("active");
      modalTitle.textContent="Сирени";

      const list = [
        ...DATA.sirens,
        { name: "Своє значення", img: "assets/tiras_logo_w.png", normal: 0, alarm: 0, custom: true }
      ];

      buildGenericList(list,"Сирена");
    }else if(section === "main-mz"){
    tabKbBtn.style.display   = "none";
    tabModsBtn.style.display = "none";
    genericBody.classList.add("active");

    modalTitle.textContent = "Модуль M-Z";

    const mzModule = {
    name: "M-Z",
    img: "assets/modules/M-Z.png",
    normal: 60,
    alarm: 60
  };

  buildGenericList([mzModule], "Модуль");
    }
  }


  function setupDeviceTabs(){
    deviceTabsEl = qs("#deviceTabs");
    extPagesEl   = qs("#extPages");
    stageEl      = qs("main.stage");
    if(!deviceTabsEl) return;

    deviceTabsEl.addEventListener("click",(e)=>{
      const btn = e.target.closest(".dev-tab-btn");
      if(!btn) return;
      const id = btn.dataset.deviceTab;
      if(!id) return;
      switchDeviceTab(id);
    });
  }

  function switchDeviceTab(id){
    if(!deviceTabsEl) return;
    currentContext = (id === "main") ? { type:"main", id:"main" } : { type:"ext", id };
    qsa(".dev-tab-btn", deviceTabsEl).forEach(btn=>{
      btn.classList.toggle("active", btn.dataset.deviceTab === id);
    });
    if(stageEl){
      stageEl.style.display = (id === "main") ? "" : "none";
    }
    if(extPagesEl){
      if(id === "main"){
        extPagesEl.style.display = "none";
      }else{
        extPagesEl.style.display = "";
      }
      qsa(".ext-page", extPagesEl).forEach(page=>{
        page.classList.toggle("active", page.dataset.deviceId === id);
      });
    }
  }

  function recalcExtDevice(extId){
    const dev = extDevices.get(extId);
    if(!dev) return;
    const { rows, dom } = dev;
    const { rowsBody, sumNormEl, sumAlarmEl, hoursEl, reserveEl, capEl, page } = dom;
    let sumNorm = 0;
    let sumAlarm = 0;
    rowsBody.innerHTML = "";
    
    rows.forEach((r, idx)=>{
      const tr = document.createElement("tr");

      const tdType  = document.createElement("td");
      const tdName  = document.createElement("td");
      const tdNorm  = document.createElement("td");
      const tdAlarm = document.createElement("td");
      const tdQty   = document.createElement("td");
      const tdAct   = document.createElement("td");

      tdType.textContent  = r.type;

      const isUniqueMod = (r.name === "M-Z" || r.name === "M-OUT2R");

      if(r.custom){
        const nameInput = document.createElement("input");
        nameInput.type = "text";
        nameInput.className = "ext-edit";
        nameInput.value = r.name;
        nameInput.addEventListener("input", ()=>{
          r.name = nameInput.value;
        });
        tdName.appendChild(nameInput);

        const normInput = document.createElement("input");
        normInput.type = "number";
        normInput.className = "ext-edit";
        normInput.value = r.normal;
        normInput.addEventListener("input", ()=>{
          let v = parseFloat(normInput.value || "0");
          if(isNaN(v) || v < 0) v = 0;
          r.normal = v;
          normInput.value = v;
          recalcExtDevice(extId);
        });
        tdNorm.appendChild(normInput);

        const alarmInput = document.createElement("input");
        alarmInput.type = "number";
        alarmInput.className = "ext-edit";
        alarmInput.value = r.alarm;
        alarmInput.addEventListener("input", ()=>{
          let v = parseFloat(alarmInput.value || "0");
          if(isNaN(v) || v < 0) v = 0;
          r.alarm = v;
          alarmInput.value = v;
          recalcExtDevice(extId);
        });
        tdAlarm.appendChild(alarmInput);
      }else{
        tdName.textContent  = r.name;
        tdNorm.textContent  = r.normal;
        tdAlarm.textContent = r.alarm;
      }

      if(r.fixed || isUniqueMod){
        tdQty.className = "qty";
        tdQty.textContent = r.qty;
      }else{
        tdQty.className = "qty";
        const inp = document.createElement("input");
        inp.type = "number";
        inp.min  = "1";
        inp.step = "1";
        inp.value = r.qty;
        inp.addEventListener("input", ()=>{
          let v = parseInt(inp.value || "1", 10);
          if(isNaN(v) || v < 1) v = 1;
          r.qty = v;
          inp.value = v;
          updateExtTotals(extId);
        });
        tdQty.appendChild(inp);
      }

      if(r.fixed){
        tdAct.textContent = "";
      }else{
        const btn = document.createElement("button");
        btn.textContent = "✕";
        btn.className = "row-del";
        btn.addEventListener("click", ()=>{
          rows.splice(idx,1);
          recalcExtDevice(extId);
        });
        tdAct.appendChild(btn);
      }

      tr.appendChild(tdType);
      tr.appendChild(tdName);
      tr.appendChild(tdNorm);
      tr.appendChild(tdAlarm);
      tr.appendChild(tdQty);
      tr.appendChild(tdAct);

      rowsBody.appendChild(tr);

      sumNorm  += r.normal * r.qty;
      sumAlarm += r.alarm  * r.qty;
    });
    
    sumNormEl.textContent  = sumNorm || "—";
    sumAlarmEl.textContent = sumAlarm || "—";

    const hours   = parseFloat(hoursEl.value || "0");
    const reserve = parseFloat(reserveEl.value || "1.25");
    if(sumNorm > 0 && hours > 0){
      const cap = (sumNorm * hours / 1000) * reserve;
      capEl.textContent = cap.toFixed(2);
    }else{
      capEl.textContent = "—";
    }

    const mzBtn = page.querySelector(".hot-ext-sens2");
    if (mzBtn) {
      const hasMz = rows.some(r => r.name === "M-Z");
      mzBtn.classList.toggle("occupied", hasMz);
    }

    const modxBtn = page.querySelector(".hot-ext-modx");
    if (modxBtn) {
      const hasOut = rows.some(r => r.name === "M-OUT2R");
      modxBtn.classList.toggle("occupied", hasOut);
    }
  }

  function updateExtTotals(extId){
    const dev = extDevices.get(extId);
    if(!dev) return;

    const { rows, dom } = dev;
    const { sumNormEl, sumAlarmEl, hoursEl, reserveEl, capEl } = dom;

    let sumNorm = 0;
    let sumAlarm = 0;

    rows.forEach(r=>{
      sumNorm  += r.normal * r.qty;
      sumAlarm += r.alarm  * r.qty;
    });

    sumNormEl.textContent  = sumNorm || "—";
    sumAlarmEl.textContent = sumAlarm || "—";

    const hours   = parseFloat(hoursEl.value || "0");
    const reserve = parseFloat(reserveEl.value || "1.25");

    if(sumNorm > 0 && hours > 0){
      const cap = (sumNorm * hours / 1000) * reserve;
      capEl.textContent = cap.toFixed(2);
    }else{
      capEl.textContent = "—";
    }
  }

  function removeExtDevice(extId){
    const dev = extDevices.get(extId);
    if(!dev) return;
    const { dom } = dev;
    const { page } = dom;
    if(page) page.remove();
    if(deviceTabsEl){
      const btn = deviceTabsEl.querySelector(`.dev-tab-btn[data-device-tab="${extId}"]`);
      if(btn) btn.remove();
    }
    extDevices.delete(extId);
    switchDeviceTab("main");
    if (deviceTypeSwitch && extDevices.size === 0) {
      deviceTypeSwitch.dataset.visible = "false";
    }
  }

  function clearExtDevice(extId){
    const dev = extDevices.get(extId);
    if(!dev) return;
    dev.rows = dev.rows.filter(r => r.fixed);
    recalcExtDevice(extId);
  }


  function createExtTab(mod){
    if(!deviceTabsEl || !extPagesEl) return;
    const safeId = "ext_"+mod.name.replace(/\s+/g,"_");
    if(extDevices.has(safeId)){
      switchDeviceTab(safeId);
      return;
    }

    const btn = document.createElement("button");
    btn.className = "dev-tab-btn";
    btn.dataset.deviceTab = safeId;
    btn.textContent = mod.name;
    deviceTabsEl.appendChild(btn);

    const page = document.createElement("div");
    page.className = "ext-page";
    page.dataset.deviceId = safeId;

    const hs = COMPONENTS_DATA.extHotspots[mod.name] || COMPONENTS_DATA.extHotspots["M-ZP box"];

    page.innerHTML = `
      <div class="ext-board-wrap">
        <img src="../${mod.img || "assets/modules/M-ZP box.png"}" alt="${mod.name}" class="ext-board">
        <button class="hotspot ext hot-ext-sens" data-type="sensors" data-device="${safeId}" style="left:${hs.sens.left}%;top:${hs.sens.top}%;">+</button>
        <button class="hotspot ext hot-ext-modx" data-type="modules" data-device="${safeId}" style="left:${hs.modx.left}%;top:${hs.modx.top}%;">+</button>
        <button class="hotspot ext hot-ext-power" data-type="modules" data-device="${safeId}" style="left:${hs.power.left}%;top:${hs.power.top}%;">+</button>
        <button class="hotspot ext hot-ext-sir" data-type="sirens" data-device="${safeId}" style="left:${hs.sir.left}%;top:${hs.sir.top}%;">+</button>
      </div>

      <section class="table-wrap ext-table">
        <table>
        <div class="table-actions">
          <button class="btn ext-clear">Очистити все</button>
        </div>
          <thead>
            <tr>
              <th>Тип</th>
              <th>Назва</th>
              <th>Норма (мА)</th>
              <th>Тривога (мА)</th>
              <th>Кількість</th>
              <th></th>
            </tr>
          </thead>
          <tbody class="ext-rows"></tbody>
        </table>
      </section>

      <section class="capacity ext-capacity">
        <div class="row">
          <label>Σ Споживання в нормі:</label>
          <span><span class="ext-sumNorm">—</span> мА</span>
        </div>
        <div class="row">
          <label>Σ Споживання в тривозі:</label>
          <span><span class="ext-sumAlarm">—</span> мА</span>
        </div>
        <div class="row">
          <label>Час роботи (год):</label>
          <input type="number" class="ext-hours" min="1" step="1" value="30">
        </div>
        <div class="row">
          <label>Коефіцієнт запасу:</label>
          <select class="ext-reserve">
            <option value="1" selected>Без запасу</option>
            <option value="1.25">З запасом 25%</option>
          </select>
        </div>
        <div class="row">
          <label>Розрахункова ємність АКБ:</label>
          <span><span class="ext-capacity-val">—</span> А·год</span>
        </div>
      </section>
      
      <div class="ext-actions">
        <button class="btn ext-remove">Видалити розширювач</button>
      </div>
    `;

    if (hs.sens2) {
      const wrap = page.querySelector(".ext-board-wrap");
      if (wrap) {
        const btn = document.createElement("button");
        btn.className = "hotspot ext hot-ext-sens2";
        btn.dataset.type = "ext-mz";
        btn.dataset.device = safeId;
        btn.style.left = hs.sens2.left + "%";
        btn.style.top  = hs.sens2.top  + "%";
        btn.textContent = "+";
        wrap.appendChild(btn);
      }
    }

    extPagesEl.appendChild(page);

    const rowsBody   = page.querySelector(".ext-rows");
    const sumNormEl  = page.querySelector(".ext-sumNorm");
    const sumAlarmEl = page.querySelector(".ext-sumAlarm");
    const hoursEl    = page.querySelector(".ext-hours");
    const reserveEl  = page.querySelector(".ext-reserve");
    const capEl      = page.querySelector(".ext-capacity-val");
    const removeBtn  = page.querySelector(".ext-remove");
    const clearBtn = page.querySelector(".ext-clear");

    const dev = {
      name: mod.name,
      rows: [],
      dom: { page, rowsBody, sumNormEl, sumAlarmEl, hoursEl, reserveEl, capEl, removeBtn, clearBtn }
    };
    extDevices.set(safeId, dev);

    dev.rows.push({
      type:"Розширювач",
      name: mod.name,
      normal: mod.normal || 0,
      alarm:  mod.alarm  || 0,
      qty:1,
      fixed:true
    });
    recalcExtDevice(safeId);

    hoursEl.addEventListener("input", ()=>recalcExtDevice(safeId));
    reserveEl.addEventListener("change", ()=>recalcExtDevice(safeId));
    clearBtn.addEventListener("click", ()=>{clearExtDevice(safeId);});
    removeBtn.addEventListener("click", ()=>removeExtDevice(safeId));

    attachEvents();
    if (deviceTypeSwitch && extDevices.size === 1) {
      deviceTypeSwitch.dataset.visible = "true";
    }
    switchDeviceTab(safeId);
  }


  function attachEvents(){
    qsa(".hotspot").forEach(hot=>{
      if(hot.__extBound) return;
      hot.__extBound = true;

      hot.addEventListener("click", ()=>{
        const type   = hot.dataset.type;
        const device = hot.dataset.device || "main";

        if (type === "modules" && hot.classList.contains("hot-ext-power") && device !== "main") {
          openModalFor("ext-power");
          return;
        }

        if(device === "main"){
          currentContext = { type:"main", id:"main" };
        }else{
          currentContext = { type:"ext", id:device };
        }

        if(type === "modules"){
          if(hot.classList.contains("hot-mod-1"))      currentSlotIndex = 0;
          else if(hot.classList.contains("hot-mod-2")) currentSlotIndex = 1;
          else                                         currentSlotIndex = null;
        }else{
          currentSlotIndex = null;
        }

        if (type === "modules" && hot.classList.contains("hot-ext-modx") && device !== "main") {
          openModalFor("ext-modx");
          return;
        }
        if(type === "main-mz"){
        currentContext = { type:"main", id:"main" };
        currentSlotIndex = null;

        openModalFor("main-mz");
        return;
        }
        openModalFor(type);
        });
    });

    qsa(".tab").forEach(tab=>{
      tab.addEventListener("click",()=>{
        if(tab.style.display==="none") return;
        clearTabs();
        tab.classList.add("active");
        const target = tab.dataset.tab;
        const body = qs("#tab-"+target);
        if(body) body.classList.add("active");
      });
    });

    if(closeBtn){
      closeBtn.addEventListener("click",()=>{
        modal.classList.remove("open");
      });
    }

    modal.addEventListener("click",(e)=>{
      if(e.target===modal) modal.classList.remove("open");
    });

    hoursEl.addEventListener("input", updateTotals);
    reserveEl.addEventListener("change", updateTotals);

    if(clearBtn){
      clearBtn.addEventListener("click",()=>{
        initCart();
        renderTable();
        updateMzHotspotState();
      });
    }
  }

  async function init(){
    const loaded = await loadConfigs();
    if (!loaded) return;

    updatePageUI();
    initDOMReferences();
    initCart();
    setupDeviceTabs();
    switchDeviceTab("main");
    renderTable();
    updateSlotUI();
    attachEvents();
    updateMzHotspotState();
    attachPdfExport();
  }

  document.addEventListener("DOMContentLoaded", init);

  // ========== PDF EXPORT FUNCTIONALITY ==========

  function generatePDF() {
    // Перевірка чи є дані для експорту
    //if (cart.size <= 1) { // Тільки базовий прилад
    //  alert('Додайте компоненти для розрахунку перед експортом в PDF');
    //  return;
    //}

    // Створюємо вікно для друку з красивим форматуванням
    const printWindow = window.open('', '_blank');

    const deviceName = DATA.base.device;
    const currentDate = new Date().toLocaleDateString('uk-UA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Збираємо дані з таблиці
    let tableRows = '';
    const order = ["Прилад","Модуль","Модуль (корпус)","Клавіатура","Датчик","Сирена"];
    const arr = Array.from(cart.values()).sort((a,b)=>{
      const ai = order.indexOf(a.type);
      const bi = order.indexOf(b.type);
      if(ai!==bi) return ai-bi;
      return a.name.localeCompare(b.name,"uk");
    });

    arr.forEach(item => {
      tableRows += `
        <tr>
          <td>${item.type}</td>
          <td>${item.name}</td>
          <td>${item.normal}</td>
          <td>${item.alarm}</td>
          <td style="text-align: center;">${item.qty}</td>
          <td>${Math.round(item.normal * item.qty)}</td>
          <td>${Math.round(item.alarm * item.qty)}</td>
        </tr>
      `;
    });

    // Отримуємо підсумкові значення
    const sumNorm = sumNormEl.textContent;
    const sumAlarm = sumAlarmEl.textContent;
    const hours = hoursEl.value;
    const reserve = parseFloat(reserveEl.value);
    const reserveText = reserve === 1.25 ? 'З запасом 25%' : 'Без запасу';
    const capacity = capEl.textContent;

    // Собираем секции для розширювачів (extDevices)
    let extSections = '';
    if (extDevices && extDevices.size > 0) {
      extDevices.forEach((dev) => {
        const devName = dev.name || 'Розширювач';
        let devRowsHtml = '';
        let devSumNorm = 0;
        let devSumAlarm = 0;
        dev.rows.forEach(r => {
          devRowsHtml += `
            <tr>
              <td>${r.type}</td>
              <td>${r.name}</td>
              <td>${r.normal}</td>
              <td>${r.alarm}</td>
              <td style="text-align: center;">${r.qty}</td>
              <td>${Math.round(r.normal * r.qty)}</td>
              <td>${Math.round(r.alarm * r.qty)}</td>
            </tr>`;
          devSumNorm += (r.normal || 0) * (r.qty || 0);
          devSumAlarm += (r.alarm || 0) * (r.qty || 0);
        });

        // Час і запас для розширювача (беремо з DOM якщо є)
        const hoursExt = (dev.dom && dev.dom.hoursEl) ? dev.dom.hoursEl.value : '';
        const reserveExt = (dev.dom && dev.dom.reserveEl) ? parseFloat(dev.dom.reserveEl.value) : 1.25;
        const reserveTextExt = reserveExt === 1.25 ? 'З запасом 25%' : 'Без запасу';
        const capExt = (devSumNorm > 0 && parseFloat(hoursExt) > 0) ? ((devSumNorm * parseFloat(hoursExt) / 1000) * reserveExt).toFixed(2) : '—';

        extSections += `
  <div class="section">
    <div class="section-title">${devName}</div>
    <table>
      <thead>
        <tr>
          <th>Тип</th>
          <th>Назва</th>
          <th>Норма (мА)</th>
          <th>Тривога (мА)</th>
          <th style="text-align: center;">Кількість</th>
          <th>Σ Норма (мА)</th>
          <th>Σ Тривога (мА)</th>
        </tr>
      </thead>
      <tbody>
        ${devRowsHtml}
      </tbody>
    </table>
    <div class="summary-box">
      <div class="summary-row">
        <span class="summary-label">Сумарне споживання в нормі:</span>
        <span class="summary-value">${Math.round(devSumNorm)} мА</span>
      </div>
      <div class="summary-row">
        <span class="summary-label">Сумарне споживання в тривозі:</span>
        <span class="summary-value">${Math.round(devSumAlarm)} мА</span>
      </div>
      <div class="summary-row">
        <span class="summary-label">Час роботи від АКБ:</span>
        <span class="summary-value">${hoursExt || '—'} год</span>
      </div>
      <div class="summary-row">
        <span class="summary-label">Коефіцієнт запасу:</span>
        <span class="summary-value">${reserveTextExt}</span>
      </div>
      <div class="summary-row">
        <span class="summary-label result-highlight">Рекомендована ємність АКБ:</span>
        <span class="summary-value result-highlight">${capExt} А·год</span>
      </div>
    </div>
  </div>`;
      });
    }

    const html = `
<!DOCTYPE html>
<html lang="uk">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Розрахунок АКБ - ${deviceName}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
      padding: 40px;
      background: white;
      color: #000;
    }
    
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 3px solid #00ff66;
    }
    
    .logo-section {
      flex: 1;
    }
    
    .logo {
      width: 150px;
      height: auto;
      margin-bottom: 10px;
    }
    
    .company-info {
      font-size: 12px;
      color: #666;
      line-height: 1.6;
    }
    
    .doc-info {
      text-align: right;
    }
    
    .doc-title {
      font-size: 24px;
      font-weight: 700;
      color: #000;
      margin-bottom: 8px;
    }
    
    .doc-subtitle {
      font-size: 18px;
      color: #00c853;
      font-weight: 600;
      margin-bottom: 10px;
    }
    
    .doc-date {
      font-size: 12px;
      color: #666;
    }
    
    .section {
      margin-bottom: 30px;
    }
    
    .section-title {
      font-size: 16px;
      font-weight: 700;
      color: #000;
      margin-bottom: 15px;
      padding-bottom: 8px;
      border-bottom: 2px solid #e0e0e0;
    }
    .device-model{
      font-size:13px;
      color:#222;
      margin-bottom:10px;
      font-weight:600;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
      font-size: 13px;
    }
    
    th {
      background: #f5f5f5;
      padding: 12px 8px;
      text-align: center;
      font-weight: 600;
      border: 1px solid #ddd;
      color: #000;
    }
    th:nth-child(1), th:nth-child(2) {
      text-align: left;
    }
    
    td {
      padding: 10px 8px;
      border: 1px solid #ddd;
      text-align: center;
    }
    td:nth-child(1), td:nth-child(2) {
      text-align: left;
    }
    
    tr:nth-child(even) {
      background: #fafafa;
    }
    
    .summary-box {
      background: linear-gradient(135deg, #f0fff4, #e6ffe6);
      border: 2px solid #00ff66;
      border-radius: 8px;
      padding: 20px;
      margin-top: 20px;
    }
    
    .summary-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #d0d0d0;
    }
    
    .summary-row:last-child {
      border-bottom: none;
      margin-top: 10px;
      padding-top: 15px;
      border-top: 2px solid #00c853;
    }
    
    .summary-label {
      font-weight: 600;
      color: #000;
    }
    
    .summary-value {
      font-weight: 700;
      color: #00c853;
    }
    
    .result-highlight {
      font-size: 20px;
    }
    
    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 2px solid #e0e0e0;
      text-align: center;
      font-size: 11px;
      color: #999;
    }
    
    @media print {
      body {
        padding: 20px;
      }
      
      .no-print {
        display: none;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo-section">
      <img class="logo" src="../assets/images/tiras-full.svg" alt="TIRAS">
      <div class="company-info">
        ТОВ "ТІРАС-12"<br>
        Системи безпеки та охорони<br>
        www.tiras.technology
      </div>
    </div>
    <div class="doc-info">
      <div class="doc-title">Розрахунок АКБ</div>
      <div class="doc-subtitle">${deviceName}</div>
      <div class="doc-date">Дата: ${currentDate}</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">${deviceName}</div>
    <table>
      <thead>
        <tr>
          <th>Тип</th>
          <th>Назва</th>
          <th>Норма (мА)</th>
          <th>Тривога (мА)</th>
          <th style="text-align: center;">Кількість</th>
          <th>Σ Норма (мА)</th>
          <th>Σ Тривога (мА)</th>
        </tr>
      </thead>
      <tbody>
        ${tableRows}
      </tbody>
    </table>
  </div>

  <div class="section">
    <div class="section-title">Підсумковий розрахунок</div>
    <div class="summary-box">
      <div class="summary-row">
        <span class="summary-label">Сумарне споживання в нормі:</span>
        <span class="summary-value">${sumNorm} мА</span>
      </div>
      <div class="summary-row">
        <span class="summary-label">Сумарне споживання в тривозі:</span>
        <span class="summary-value">${sumAlarm} мА</span>
      </div>
      <div class="summary-row">
        <span class="summary-label">Час роботи від АКБ:</span>
        <span class="summary-value">${hours} год</span>
      </div>
      <div class="summary-row">
        <span class="summary-label">Коефіцієнт запасу:</span>
        <span class="summary-value">${reserveText}</span>
      </div>
      <div class="summary-row">
        <span class="summary-label result-highlight">Рекомендована ємність АКБ:</span>
        <span class="summary-value result-highlight">${capacity} А·год</span>
      </div>
    </div>
  </div>

  ${extSections}

  <div class="footer">
    Розрахунок виконано за допомогою калькулятора TIRAS | ${currentDate}<br>
    Цей документ згенеровано автоматично і має інформаційний характер
  </div>

  <div class="no-print" style="margin-top: 30px; text-align: center;">
    <button onclick="window.print()" style="
      background: linear-gradient(135deg, #00c853, #00ff66);
      color: #000;
      border: none;
      padding: 12px 30px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      border-radius: 8px;
      margin-right: 10px;
    ">🖨️ Друкувати</button>
    <button onclick="window.close()" style="
      background: #f0f0f0;
      color: #000;
      border: 1px solid #ccc;
      padding: 12px 30px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      border-radius: 8px;
    ">Закрити</button>
  </div>
</body>
</html>
    `;
    

    printWindow.document.write(html);
    printWindow.document.close();

    // Автоматично відкриваємо діалог друку через секунду
    setTimeout(() => {
      printWindow.focus();
    }, 500);
  }

  // Додаємо обробник для кнопки експорту (буде підключено в init)
  function attachPdfExport() {
    const exportBtn = document.getElementById('exportPdf');
    if (exportBtn) {
      exportBtn.addEventListener('click', generatePDF);
    }
  }

})();

