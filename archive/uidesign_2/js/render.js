// ===== 渲染函数 =====
function renderAll(){renderHome();renderSidebar();updateStats()}

function renderHome(){
  let plan=getPlan(),stageList=document.getElementById('stage-list');
  stageList.innerHTML='';
  if(currentTrack==='math'){
    MATH_TRACK.modules.forEach(mod=>{
      let card=document.createElement('div');card.className='stage-card open';
      let hd=document.createElement('div');hd.className='stage-hd';
      hd.innerHTML='<div class="stage-hd-l"><span class="stage-arrow">▶</span><span class="stage-name">'+mod.name+'</span></div><span class="stage-meta">'+mod.days.length+'天</span>';
      hd.addEventListener('click',()=>card.classList.toggle('open'));card.appendChild(hd);
      let body=document.createElement('div');body.className='stage-body';
      let grid=document.createElement('div');grid.className='day-grid';
      mod.days.forEach(day=>{let cell=document.createElement('div');cell.className='day-cell';cell.setAttribute('data-lv',Store.getLevel(day.d));cell.setAttribute('data-tip','M'+day.d+': '+day.title);cell.addEventListener('click',()=>goDay(day.d));grid.appendChild(cell);});
      body.appendChild(grid);card.appendChild(body);stageList.appendChild(card);
    })
  } else {
    MAIN_PLAN.stages.forEach(stage=>{
      let card=document.createElement('div');card.className='stage-card open';
      let hd=document.createElement('div');hd.className='stage-hd';
      hd.innerHTML='<div class="stage-hd-l"><span class="stage-arrow">▶</span><span class="stage-name">'+stage.name+'</span></div>';
      hd.addEventListener('click',()=>card.classList.toggle('open'));card.appendChild(hd);
      let body=document.createElement('div');body.className='stage-body';
      stage.sections.forEach(sec=>{
        let st=document.createElement('div');st.className='sec-title';st.textContent=sec.name;body.appendChild(st);
        let grid=document.createElement('div');grid.className='day-grid';
        sec.days.forEach(day=>{let cell=document.createElement('div');cell.className='day-cell';cell.setAttribute('data-lv',Store.getLevel(day.d));cell.setAttribute('data-tip','Day '+day.d+': '+day.title);cell.addEventListener('click',()=>goDay(day.d));grid.appendChild(cell);});
        body.appendChild(grid);
      });
      card.appendChild(body);stageList.appendChild(card);
    })
  }
}

function renderSidebar(){
  let sb=document.getElementById('sidebar');sb.innerHTML='';
  if(currentTrack==='math'){
    MATH_TRACK.modules.forEach(mod=>{
      let wrap=document.createElement('div');wrap.className='side-stage open';
      let hd=document.createElement('div');hd.className='side-stage-hd';
      hd.innerHTML='<span class="side-arrow">▶</span><span class="side-stage-name">'+mod.name+'</span><span class="side-stage-n">'+mod.days.length+'天</span>';
      hd.addEventListener('click',e=>{e.stopPropagation();wrap.classList.toggle('open')});wrap.appendChild(hd);
      let bd=document.createElement('div');bd.className='side-body';
      mod.days.forEach(day=>{let item=document.createElement('div');item.className='side-item';let lv=Store.getLevel(day.d);item.innerHTML='<span class="side-dot d'+lv+'"></span>M'+day.d+': '+day.title;if(currentDay===day.d)item.classList.add('active');item.addEventListener('click',e=>{e.stopPropagation();goDay(day.d)});bd.appendChild(item);});
      wrap.appendChild(bd);sb.appendChild(wrap);
    })
  } else {
    MAIN_PLAN.stages.forEach(stage=>{
      let wrap=document.createElement('div');wrap.className='side-stage open';
      let hd=document.createElement('div');hd.className='side-stage-hd';
      hd.innerHTML='<span class="side-arrow">▶</span><span class="side-stage-name">'+stage.name+'</span>';
      hd.addEventListener('click',e=>{e.stopPropagation();wrap.classList.toggle('open')});wrap.appendChild(hd);
      let bd=document.createElement('div');bd.className='side-body';
      stage.sections.forEach(sec=>{sec.days.forEach(day=>{let item=document.createElement('div');item.className='side-item';let lv=Store.getLevel(day.d);item.innerHTML='<span class="side-dot d'+lv+'"></span>Day '+day.d+': '+day.title;if(currentDay===day.d)item.classList.add('active');item.addEventListener('click',e=>{e.stopPropagation();goDay(day.d)});bd.appendChild(item);})});
      wrap.appendChild(bd);sb.appendChild(wrap);
    })
  }
}

function renderDay(globalDay){
  let plan=getPlan(),dayData=plan.getDay(globalDay);
  if(!dayData){goHome();return}
  currentDay=globalDay;
  document.getElementById('day-breadcrumb').innerHTML=currentTrack==='math'?'数学 › '+dayData.moduleName+' › <span class="cur">Day '+globalDay+'</span>':'主计划 › '+dayData.stageName+' › '+dayData.sectionName+' › <span class="cur">Day '+globalDay+'</span>';
  document.getElementById('day-num').textContent=globalDay;
  document.getElementById('day-meta').textContent=dayData.title;
  document.getElementById('day-desc').textContent=dayData.desc;
  document.getElementById('prompt-body').textContent=dayData.prompt;
  let sync=document.getElementById('sync-badge');
  if(currentTrack==='math'&&dayData.sync){sync.style.display='inline-flex';sync.textContent='↗ 同步：Main Day '+dayData.sync;sync.onclick=function(){currentTrack='main';switchTrackUI();goDay(dayData.sync)};}else{sync.style.display='none'}
  let tl=document.getElementById('task-list');tl.innerHTML='';
  dayData.tasks.forEach((task,idx)=>{
    let label=document.createElement('label');label.className='task-item';
    if(Store.isTaskDone(globalDay,idx))label.classList.add('done');
    let chk=document.createElement('div');chk.className='task-chk';chk.innerHTML='<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>';
    let txt=document.createElement('span');txt.className='task-txt';txt.textContent=task;
    label.appendChild(chk);label.appendChild(txt);
    label.addEventListener('click',function(){Store.toggleTask(globalDay,idx);label.classList.toggle('done');updateDayFooter(globalDay);renderAll();checkOverlay()});
    tl.appendChild(label);
  });
  updateDayFooter(globalDay);checkOverlay();
  let prevDay=currentTrack==='math'?MATH_TRACK.getPrevDay(globalDay):MAIN_PLAN.getPrevDay(globalDay);
  let nextDay=currentTrack==='math'?MATH_TRACK.getNextDay(globalDay):MAIN_PLAN.getNextDay(globalDay);
  document.getElementById('btn-prev').style.visibility=prevDay?'visible':'hidden';
  document.getElementById('btn-next').style.visibility=nextDay?'visible':'hidden';
  document.getElementById('btn-prev').textContent='← '+(prevDay||'');
  document.getElementById('btn-next').textContent=(nextDay||'')+' →';
  document.getElementById('btn-prev').onclick=function(){if(prevDay)goDay(prevDay)};
  document.getElementById('btn-next').onclick=function(){if(nextDay)goDay(nextDay)};
  document.getElementById('btn-home').onclick=function(){goHome()};
  document.getElementById('view-home').classList.remove('active');
  document.getElementById('view-day').classList.add('active');
  document.getElementById('content').scrollTop=0;
}

function updateDayFooter(globalDay){
  let plan=getPlan(),done=Store.isDayDone(globalDay);
  let data=Store.load(),dk='d'+globalDay;
  let doneCount=(data[dk]&&data[dk].tasks)?data[dk].tasks.filter(t=>t).length:0;
  let dd=plan.getDay(globalDay);let totalTasks=dd?dd.tasks.length:3;
  let el=document.getElementById('footer-status');
  if(done){el.textContent='Day '+globalDay+' — COMPLETE ✓';el.style.color='var(--success)'}else{el.textContent='Tasks: '+doneCount+'/'+totalTasks;el.style.color=''}
}

function updateStats(){
  let plan=getPlan(),done=Store.getDoneCount();
  let total=currentTrack==='math'?MATH_TRACK.allDays().length:plan.totalDays;
  let pct=total>0?Math.round(done/total*100):0,streak=Store.getStreak();
  document.getElementById('tb-done').textContent=done+'/'+total;
  document.getElementById('tb-pct').textContent=pct+'%';
  document.getElementById('tb-streak').textContent=streak+'d';
  document.getElementById('progress-bar').style.width=pct+'%';
  document.getElementById('tb-badge').textContent=plan.name;
  document.querySelectorAll('.tb-track').forEach(t=>t.classList.toggle('active',t.getAttribute('data-track')===currentTrack));
  let sr=document.getElementById('stats-row');
  if(sr)sr.innerHTML='<div class="stat-card"><div class="stat-label">已完成</div><div class="stat-val">'+done+'/'+total+'</div></div><div class="stat-card"><div class="stat-label">进度</div><div class="stat-val">'+pct+'%</div></div><div class="stat-card"><div class="stat-label">连续学习</div><div class="stat-val">'+streak+'</div><div class="stat-sub">天</div></div>';
}

function checkOverlay(){
  let plan=getPlan(),total=currentTrack==='math'?MATH_TRACK.allDays().length:plan.totalDays;
  let allDone=true;
  if(currentTrack==='math'){MATH_TRACK.allDays().forEach(day=>{if(!Store.isDayDone(day.d))allDone=false})}else{for(let i=1;i<=total;i++){if(!Store.isDayDone(i)){allDone=false;break}}}
  let ov=document.getElementById('overlay');
  if(allDone&&total>0){ov.classList.add('show');document.getElementById('overlay-msg').textContent=(currentTrack==='math'?'Math Track':'Main Plan')+' Complete! 🎉'}else{ov.classList.remove('show')}
}

// ===== 总览页渲染 =====
function renderOverview(){
  var tempTrack=currentTrack;
  currentTrack='main';var mainDone=Store.getDoneCount(),mainTotal=MAIN_PLAN.totalDays;var mainPct=mainTotal>0?Math.round(mainDone/mainTotal*100):0;
  currentTrack='math';var mathDone=Store.getDoneCount(),mathTotal=MATH_TRACK.allDays().length;var mathPct=mathTotal>0?Math.round(mathDone/mathTotal*100):0;
  var totalDone=mainDone+mathDone,totalAll=mainTotal+mathTotal;var combinedPct=totalAll>0?Math.round(totalDone/totalAll*100):0;
  currentTrack=tempTrack;
  var mainRing=document.getElementById('ov-ring-main'),mathRing=document.getElementById('ov-ring-math');
  if(mainRing)mainRing.style.strokeDashoffset=628-(628*mainPct/100);
  if(mathRing)mathRing.style.strokeDashoffset=440-(440*mathPct/100);
  var pctEl=document.getElementById('ov-ring-pct');if(pctEl)pctEl.textContent=combinedPct+'%';
  // Continue cards
  var mainNext=1;currentTrack='main';
  for(var i=1;i<=mainTotal;i++){if(!Store.isDayDone(i)){mainNext=i;break}else mainNext=i}if(mainNext>mainTotal)mainNext=mainTotal;
  var mainDayData=MAIN_PLAN.getDay(mainNext)||MAIN_PLAN.getDay(mainTotal);
  var mc=document.getElementById('ov-main-title');if(mc)mc.textContent=(mainDayData?'Day '+mainNext+': '+mainDayData.title:'暂无数据');
  var mm=document.getElementById('ov-main-meta');if(mm)mm.textContent='';
  var mathNext=1;currentTrack='math';var mathAll=MATH_TRACK.allDays();
  for(var i=0;i<mathAll.length;i++){var md=mathAll[i].d;if(!Store.isDayDone(md)){mathNext=md;break}else mathNext=md}if(mathAll.length>0&&mathNext<mathAll[0].d)mathNext=mathAll[0].d;
  var mathDayData=MATH_TRACK.getDay(mathNext);
  var mtc=document.getElementById('ov-math-title');if(mtc)mtc.textContent=(mathDayData?'Day '+mathNext+': '+mathDayData.title:'暂无数据');
  var mtm=document.getElementById('ov-math-meta');if(mtm)mtm.textContent='';
  currentTrack=tempTrack;
  // Mind map
  var ol=document.getElementById('ov-outline');if(!ol)return;
  var bridges={main:['↓ 会写代码了，怎么处理真实金融数据？','↓ 管道通了，工程稳了，补上金融数学基础','↓ 技术有了，但做什么产品？AI怎么帮你？','↓ 会用AI了，回到量化：策略怎么评估？','↓ 策略有了，怎么让它每天自动跑？','↓ 部署好了，能不能让AI自己管？'],math:['↓ 有了描述不确定性的语言，如何从数据推断规律？','↓ 数据在高维空间长什么样？AI内部算什么？','↓ 数学地基打好，回到量化：那些数字的本质是什么？','↓ 工具箱齐全。还有些高阶概念需要知道它们存在。']};
  var html='<div class="ov-outline-hd">课程大纲</div><div class="mindmap">';
  var maxRows=Math.max(MAIN_PLAN.stages.length,MATH_TRACK.modules.length),bridgeIdx=0;
  for(var i=0;i<maxRows;i++){
    html+='<div class="mm-row">';
    if(i<MAIN_PLAN.stages.length){var stage=MAIN_PLAN.stages[i],totalDays=0,l2='';stage.sections.forEach(function(sec){var secDays=0,l3='';sec.days.forEach(function(day){totalDays++;secDays++;var st=Store.isDayDone(day.d)?'st2':(Store.isTaskDone(day.d,0)?'st1':'st0');l3+='<div class="mm-l3-item '+st+'" onclick="event.stopPropagation();setHash(\'read-main-'+day.d+'\')">D'+day.d+': '+day.title+'</div>';});l2+='<div class="mm-l2-item" onclick="event.stopPropagation();setHash(\'read-main-'+sec.days[0].d+'\')">'+sec.name+' ('+secDays+'天)</div><div class="mm-l3">'+l3+'</div>';});html+='<div class="mm-left"><div class="mm-parent" onclick="goTrack(\'main\')">'+stage.name+'<span class="mm-parent-meta">'+totalDays+'天</span></div><div class="mm-l2">'+l2+'</div></div>';}else{html+='<div class="mm-left"></div>'}
    html+='<div class="mm-dot '+(i<MAIN_PLAN.stages.length?'main':'math')+'"></div>';
    if(i<MATH_TRACK.modules.length){var mod=MATH_TRACK.modules[i],children='';mod.days.forEach(function(day){var st=Store.isDayDone(day.d)?'st2':(Store.isTaskDone(day.d,0)?'st1':'st0');children+='<div class="mm-child '+st+'" onclick="event.stopPropagation();setHash(\'read-math-'+day.d+'\')">M'+day.d+': '+day.title+'</div>';});html+='<div class="mm-right"><div class="mm-parent" onclick="goTrack(\'math\')">'+mod.name+'<span class="mm-parent-meta">'+mod.days.length+'天</span></div><div class="mm-children">'+children+'</div></div>';}else{html+='<div class="mm-right"></div>'}
    html+='</div>';
    if(i<maxRows-1){var bm=bridges.main[bridgeIdx]||'',bmt=bridges.math[bridgeIdx]||'';html+='<div class="mm-bridge"><div class="mm-bridge-l">'+(bm?'<span class="mm-bridge-text">'+bm+'</span>':'')+'</div><div class="mm-bridge-r">'+(bmt?'<span class="mm-bridge-text">'+bmt+'</span>':'')+'</div></div>';bridgeIdx++;}
  }
  html+='</div>';ol.innerHTML=html;
}
