/* ===================================================================
   js/main.js  — Soul Reaper Saga (Deluxe)
   Version: 1.0 (fixed)
   =================================================================== */

(function () {
  'use strict';

  const STORAGE_KEY = 'srs_v2_state';
  const LOGS_KEY = 'srs_v2_logs';
  const APP_VERSION = '1.0';
  const XP_PER_MIN = 2;
  const XP_MISSION_COMPLETE_BONUS = 10;
  const MOCK_XP_REWARD = 40;
  const BADGE_RULES = [
    {id: 'novice', name: 'Novice Edge', xp: 50, icon: 'E'},
    {id: 'shikai', name: 'Shikai Unlocked', xp: 150, icon: 'S'},
    {id: 'bankai', name: 'Bankai Master', xp: 350, icon: 'B'}
  ];

  const DEFAULT_STATE = {
    meta: {version: APP_VERSION, createdAt: Date.now()},
    skills: { listening: 28, reading: 26, writingBand: 5.5, speakingBand: 6.0, general: 50 },
    xp: 0,
    badges: [],
    rewards: [],
    missions: [],
    currentTimer: null,
    settings: { sounds: true, confetti: true, autoSave: true },
    lastMock: null
  };

  // --- Helpers ---
  function uid(prefix = 'id') { return prefix + '_' + Math.random().toString(36).slice(2, 9); }
  function now() { return Date.now(); }
  function clamp(v,a,b) { return Math.max(a,Math.min(b,v)); }
  function safeQuery(sel, root=document) { try{return root.querySelector(sel);}catch{return null;} }
  function safeQueryAll(sel, root=document) { try{return Array.from(root.querySelectorAll(sel));}catch{return [];} }

  // --- State ---
  let state = loadState();
  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : structuredClone(DEFAULT_STATE);
    } catch {
      return structuredClone(DEFAULT_STATE);
    }
  }
  function saveState() {
    try { if (state.settings.autoSave) localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
    catch (e) { console.error('save failed', e); }
  }
  function resetState() {
    state = structuredClone(DEFAULT_STATE);
    saveState();
    renderAll();
  }

  // --- Logs ---
  function getLogs() {
    try {
      const raw = localStorage.getItem(LOGS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  }
  function saveLogEntry(entry) {
    const logs = getLogs();
    logs.unshift(entry);
    localStorage.setItem(LOGS_KEY, JSON.stringify(logs));
  }
  function addLog(who, text, type='system') {
    const entry = {id:uid('log'),ts:now(),who,text,type};
    saveLogEntry(entry);
    renderLogEntry(entry);
  }

  // --- UI popups, sound, confetti ---
  function showPopup(title,text,opts={}) {
    const wrapper = document.createElement('div');
    wrapper.className='srs-popup';
    wrapper.style=`position:fixed;left:50%;top:15%;transform:translateX(-50%);background:rgba(20,20,35,0.95);padding:1rem;border-radius:12px;z-index:9999;color:#fff;text-align:center`;
    wrapper.innerHTML=`<div style="font-weight:700">${title}</div><div>${text}</div>`;
    document.body.appendChild(wrapper);
    setTimeout(()=>wrapper.remove(),opts.timeout||3000);
  }
  function playSound(name,opts={}) {
    if (!state.settings.sounds) return;
    const audio=new Audio(`assets/sounds/${name}.mp3`);
    audio.volume=opts.volume??0.8;
    audio.play().catch(()=>{});
  }
  function launchConfetti() {
    if (!state.settings.confetti) return;
    const count=20;
    for (let i=0;i<count;i++){
      const el=document.createElement('div');
      el.style.cssText=`position:fixed;width:8px;height:12px;top:-10px;left:${Math.random()*100}%;background:hsl(${Math.random()*360},80%,60%);z-index:9998`;
      document.body.appendChild(el);
      el.animate([
        {transform:`translateY(0) rotate(0)`,opacity:1},
        {transform:`translateY(100vh) rotate(${Math.random()*720}deg)`,opacity:0}
      ],{duration:2000+Math.random()*1000});
      setTimeout(()=>el.remove(),3000);
    }
  }
  function showRewardPopup(title,subtitle) {
    const modal=document.createElement('div');
    modal.style=`position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);padding:1.5rem;border-radius:12px;background:#111;color:#fff;z-index:10000;text-align:center;border:2px solid #9333ea`;
    modal.innerHTML=`<h2>${title}</h2><p>${subtitle}</p><button>OK</button>`;
    document.body.appendChild(modal);
    playSound('reward-chime');
    launchConfetti();
    modal.querySelector('button').onclick=()=>modal.remove();
  }

  // --- Missions ---
  function addMission(title,type='general',minutes=15){
    const m={id:uid('m'),title,type,minutes,createdAt:now(),order:state.missions.length,completed:false};
    state.missions.push(m); saveState(); addLog('System',`Mission added: ${m.title}`); renderMissions(); return m;
  }
  function editMission(id,updates={}){
    const m=state.missions.find(x=>x.id===id); if(!m)return null;
    Object.assign(m,updates); saveState(); renderMissions(); return m;
  }
  function deleteMission(id){
    const idx=state.missions.findIndex(x=>x.id===id); if(idx<0)return false;
    const removed=state.missions.splice(idx,1)[0]; saveState(); renderMissions(); return true;
  }
  function enableMissionDrag(container){
    if(!container)return;
    let dragged=null;
    container.querySelectorAll('.srs-mission-row').forEach(row=>{
      row.draggable=true;
      row.addEventListener('dragstart',()=>{dragged=row;row.classList.add('dragging');});
      row.addEventListener('dragend',()=>{row.classList.remove('dragging');dragged=null;reorderMissionsFromDOM(container);});
      row.addEventListener('dragover',e=>{e.preventDefault();const after=getDragAfter(container,e.clientY);if(after==null)container.appendChild(dragged);else container.insertBefore(dragged,after);});
    });
  }
  function getDragAfter(container,y){
    const els=[...container.querySelectorAll('.srs-mission-row:not(.dragging)')];
    return els.reduce((closest,child)=>{
      const box=child.getBoundingClientRect();
      const offset=y-box.top-box.height/2;
      if(offset<0&&offset>closest.offset){return{offset,element:child};}
      else return closest;
    },{offset:Number.NEGATIVE_INFINITY}).element;
  }
  function reorderMissionsFromDOM(container){
    const ids=[...container.querySelectorAll('.srs-mission-row')].map(r=>r.dataset.id);
    state.missions.sort((a,b)=>ids.indexOf(a.id)-ids.indexOf(b.id));
    saveState();
  }

  // --- Rendering stubs ---
  function renderMissions(){ /* TODO: hook into missions.html */ }
  function renderLogEntry(entry){ /* TODO: hook into battle-log.html */ }
  function renderAll(){ /* TODO: refresh all pages */ }

  // --- Expose API ---
  window.SRS={
    state,
    addMission,editMission,deleteMission,
    resetState,
    showPopup,showRewardPopup,playSound,launchConfetti,
    getLogs,addLog
  };

  // --- Example hook for index.html ---
  window.startSaga=function(){
    showPopup('Saga Begun','Your training has started!');
    addLog('Player','Started Saga');
  };

})();
