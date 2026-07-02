// ===== 渲染函数 =====
function renderAll(){renderHome();renderSidebar();updateStats()}

function renderHome(){
  var plan=getPlan(),stageList=document.getElementById('stage-list');
  stageList.innerHTML='';
  if(currentTrack==='math'){
    MATH_TRACK.modules.forEach(function(mod){
      var card=document.createElement('div');card.className='stage-card open';
      var hd=document.createElement('div');hd.className='stage-hd';
      hd.innerHTML='<div class="stage-hd-l"><span class="stage-arrow">▶</span><span class="stage-name">'+mod.name+'</span></div><span class="stage-meta">'+mod.daysData.length+'天</span>';
      hd.addEventListener('click',function(){card.classList.toggle('open')});card.appendChild(hd);
      var body=document.createElement('div');body.className='stage-body';
      var grid=document.createElement('div');grid.className='day-grid';
      mod.daysData.forEach(function(day){
        var cell=document.createElement('div');cell.className='day-cell';cell.setAttribute('data-lv',Store.getLevel(day.globalDay));
        cell.setAttribute('data-tip','M'+day.globalDay+': '+day.title);
        cell.addEventListener('click',function(){goDay(day.globalDay)});grid.appendChild(cell);
      });
      body.appendChild(grid);card.appendChild(body);stageList.appendChild(card);
    })
  } else {
    MAIN_PLAN.stages.forEach(function(stage){
      var card=document.createElement('div');card.className='stage-card open';
      var hd=document.createElement('div');hd.className='stage-hd';
      hd.innerHTML='<div class="stage-hd-l"><span class="stage-arrow">▶</span><span class="stage-name">'+stage.name+'</span></div>';
      hd.addEventListener('click',function(){card.classList.toggle('open')});card.appendChild(hd);
      var body=document.createElement('div');body.className='stage-body';
      stage.sections.forEach(function(sec){
        var st=document.createElement('div');st.className='sec-title';st.textContent=sec.name;body.appendChild(st);
        var grid=document.createElement('div');grid.className='day-grid';
        sec.daysData.forEach(function(day){
          var cell=document.createElement('div');cell.className='day-cell';cell.setAttribute('data-lv',Store.getLevel(day.globalDay));
          cell.setAttribute('data-tip','Day '+day.globalDay+': '+day.title);
          cell.addEventListener('click',function(){goDay(day.globalDay)});grid.appendChild(cell);
        });
        body.appendChild(grid);
      });
      card.appendChild(body);stageList.appendChild(card);
    })
  }
}

function renderSidebar(){
  var sb=document.getElementById('sidebar');sb.innerHTML='';
  if(currentTrack==='math'){
    MATH_TRACK.modules.forEach(function(mod){
      var wrap=document.createElement('div');wrap.className='side-stage open';
      var hd=document.createElement('div');hd.className='side-stage-hd';
      hd.innerHTML='<span class="side-arrow">▶</span><span class="side-stage-name">'+mod.name+'</span><span class="side-stage-n">'+mod.daysData.length+'天</span>';
      hd.addEventListener('click',function(e){e.stopPropagation();wrap.classList.toggle('open')});wrap.appendChild(hd);
      var bd=document.createElement('div');bd.className='side-body';
      mod.daysData.forEach(function(day){
        var item=document.createElement('div');item.className='side-item';var lv=Store.getLevel(day.globalDay);
        item.innerHTML='<span class="side-dot d'+lv+'"></span>M'+day.globalDay+': '+day.title;
        if(currentDay===day.globalDay)item.classList.add('active');
        item.addEventListener('click',function(e){e.stopPropagation();goDay(day.globalDay)});bd.appendChild(item);
      });
      wrap.appendChild(bd);sb.appendChild(wrap);
    })
  } else {
    MAIN_PLAN.stages.forEach(function(stage){
      var wrap=document.createElement('div');wrap.className='side-stage open';
      var hd=document.createElement('div');hd.className='side-stage-hd';
      hd.innerHTML='<span class="side-arrow">▶</span><span class="side-stage-name">'+stage.name+'</span>';
      hd.addEventListener('click',function(e){e.stopPropagation();wrap.classList.toggle('open')});wrap.appendChild(hd);
      var bd=document.createElement('div');bd.className='side-body';
      stage.sections.forEach(function(sec){sec.daysData.forEach(function(day){
        var item=document.createElement('div');item.className='side-item';var lv=Store.getLevel(day.globalDay);
        item.innerHTML='<span class="side-dot d'+lv+'"></span>Day '+day.globalDay+': '+day.title;
        if(currentDay===day.globalDay)item.classList.add('active');
        item.addEventListener('click',function(e){e.stopPropagation();goDay(day.globalDay)});bd.appendChild(item);
      })});
      wrap.appendChild(bd);sb.appendChild(wrap);
    })
  }
}

function renderDay(globalDay){
  var plan=getPlan(),dayData=plan.getDay(globalDay);
  if(!dayData){goHome();return}
  currentDay=globalDay;
  document.getElementById('day-breadcrumb').innerHTML=currentTrack==='math'?'数学 › '+dayData.moduleName+' › <span class="cur">Day '+globalDay+'</span>':'主计划 › '+dayData.stageName+' › '+dayData.sectionName+' › <span class="cur">Day '+globalDay+'</span>';
  document.getElementById('day-num').textContent=globalDay;
  document.getElementById('day-meta').textContent=dayData.title;
  document.getElementById('day-desc').textContent=dayData.description;
  document.getElementById('prompt-body').textContent=dayData.prompt;
  var sync=document.getElementById('sync-badge');
  if(currentTrack==='math'&&dayData.syncMain){sync.style.display='inline-flex';sync.textContent='↗ 同步：Main Day '+dayData.syncMain;sync.onclick=function(){currentTrack='main';switchTrackUI();goDay(dayData.syncMain)};}else{sync.style.display='none'}
  var tl=document.getElementById('task-list');tl.innerHTML='';
  if(dayData.tasks.length===0){
    // 复习/缓冲日 — 单个完成按钮
    var reviewed=Store.isDayDone(globalDay);
    var label=document.createElement('label');label.className='task-item';
    if(reviewed)label.classList.add('done');
    var chk=document.createElement('div');chk.className='task-chk';chk.innerHTML='<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>';
    var txt=document.createElement('span');txt.className='task-txt';txt.textContent='标记本日已完成';
    label.appendChild(chk);label.appendChild(txt);
    label.addEventListener('click',function(){Store.markReviewed(globalDay);label.classList.toggle('done');updateDayFooter(globalDay);renderAll();checkOverlay()});
    tl.appendChild(label);
  } else {
    dayData.tasks.forEach(function(task,idx){
      var label=document.createElement('label');label.className='task-item';
      if(Store.isTaskDone(globalDay,idx))label.classList.add('done');
      var chk=document.createElement('div');chk.className='task-chk';chk.innerHTML='<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>';
      var txt=document.createElement('span');txt.className='task-txt';txt.textContent=task;
      label.appendChild(chk);label.appendChild(txt);
      label.addEventListener('click',function(){Store.toggleTask(globalDay,idx);label.classList.toggle('done');updateDayFooter(globalDay);renderAll();checkOverlay()});
      tl.appendChild(label);
    });
  }
  updateDayFooter(globalDay);checkOverlay();
  var prevDay=currentTrack==='math'?MATH_TRACK.getPrevDay(globalDay):MAIN_PLAN.getPrevDay(globalDay);
  var nextDay=currentTrack==='math'?MATH_TRACK.getNextDay(globalDay):MAIN_PLAN.getNextDay(globalDay);
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
  var plan=getPlan(),done=Store.isDayDone(globalDay);
  var data=Store.load(),dk='d'+globalDay;
  var doneCount=(data[dk]&&data[dk].tasks)?data[dk].tasks.filter(function(t){return t}).length:0;
  var dd=plan.getDay(globalDay);var totalTasks=dd?dd.tasks.length:3;
  var el=document.getElementById('footer-status');
  if(done){el.textContent='Day '+globalDay+' — COMPLETE ✓';el.style.color='var(--success)'}else{el.textContent='Tasks: '+doneCount+'/'+totalTasks;el.style.color=''}
}

function updateStats(){
  var plan=getPlan(),done=Store.getDoneCount();
  var total=currentTrack==='math'?MATH_TRACK.totalDays:MAIN_PLAN.totalDays;
  var pct=total>0?Math.round(done/total*100):0,streak=Store.getStreak();
  document.getElementById('tb-done').textContent=done+'/'+total;
  document.getElementById('tb-pct').textContent=pct+'%';
  document.getElementById('tb-streak').textContent=streak+'d';
  document.getElementById('progress-bar').style.width=pct+'%';
  document.getElementById('tb-badge').textContent=plan.name;
  document.querySelectorAll('.tb-track').forEach(function(t){t.classList.toggle('active',t.getAttribute('data-track')===currentTrack)});
  var sr=document.getElementById('stats-row');
  if(sr)sr.innerHTML='<div class="stat-card"><div class="stat-label">已完成</div><div class="stat-val">'+done+'/'+total+'</div></div><div class="stat-card"><div class="stat-label">进度</div><div class="stat-val">'+pct+'%</div></div><div class="stat-card"><div class="stat-label">连续学习</div><div class="stat-val">'+streak+'</div><div class="stat-sub">天</div></div>';
}

function checkOverlay(){
  var plan=getPlan(),total=currentTrack==='math'?MATH_TRACK.totalDays:MAIN_PLAN.totalDays;
  var allDone=true;
  if(currentTrack==='math'){MATH_TRACK.allDays().forEach(function(day){if(!Store.isDayDone(day.globalDay))allDone=false})}else{MAIN_PLAN.allDays().forEach(function(gd){if(!Store.isDayDone(gd))allDone=false})}
  var ov=document.getElementById('overlay');
  if(allDone&&total>0){ov.classList.add('show');document.getElementById('overlay-msg').textContent=(currentTrack==='math'?'Math Track':'Main Plan')+' Complete! 🎉'}else{ov.classList.remove('show')}
}

// ===== 总览页渲染（137天7阶段 + 61天5模块）=====
function renderOverview(){
  var tempTrack=currentTrack;
  currentTrack='main';var mainDone=Store.getDoneCount(),mainTotal=MAIN_PLAN.totalDays;var mainPct=mainTotal>0?Math.round(mainDone/mainTotal*100):0;
  currentTrack='math';var mathDone=Store.getDoneCount(),mathTotal=MATH_TRACK.totalDays;var mathPct=mathTotal>0?Math.round(mathDone/mathTotal*100):0;
  var totalDone=mainDone+mathDone,totalAll=mainTotal+mathTotal;var combinedPct=totalAll>0?Math.round(totalDone/totalAll*100):0;
  currentTrack=tempTrack;
  var mainRing=document.getElementById('ov-ring-main'),mathRing=document.getElementById('ov-ring-math');
  if(mainRing)mainRing.style.strokeDashoffset=628-(628*mainPct/100);
  if(mathRing)mathRing.style.strokeDashoffset=440-(440*mathPct/100);
  var pctEl=document.getElementById('ov-ring-pct');if(pctEl)pctEl.textContent=combinedPct+'%';
  // Continue cards
  var mainAll=MAIN_PLAN.allDays(),mainNext=mainAll.length>0?mainAll[0]:1;currentTrack='main';
  for(var i=0;i<mainAll.length;i++){var gd=mainAll[i];if(!Store.isDayDone(gd)){mainNext=gd;break}else mainNext=gd}
  if(!mainNext||mainNext>mainAll[mainAll.length-1])mainNext=mainAll[mainAll.length-1];
  var mainDayData=MAIN_PLAN.getDay(mainNext)||MAIN_PLAN.getDay(mainTotal);
  var mc=document.getElementById('ov-main-title');if(mc)mc.textContent=(mainDayData?'Day '+mainNext+': '+mainDayData.title:'暂无数据');
  var mm=document.getElementById('ov-main-meta');if(mm)mm.textContent='';
  var mathAll=MATH_TRACK.allDays();var mathNext=mathAll.length>0?mathAll[0].globalDay:1;currentTrack='math';
  for(var j=0;j<mathAll.length;j++){var md=mathAll[j].globalDay;if(!Store.isDayDone(md)){mathNext=md;break}else mathNext=md}
  var mathDayData=MATH_TRACK.getDay(mathNext);
  var mtc=document.getElementById('ov-math-title');if(mtc)mtc.textContent=(mathDayData?'Day '+mathNext+': '+mathDayData.title:'暂无数据');
  var mtm=document.getElementById('ov-math-meta');if(mtm)mtm.textContent='';
  // Streak banner
  var mainStreak=Store.getStreak();currentTrack='math';var mathStreak=Store.getStreak();currentTrack=tempTrack;
  document.getElementById('ov-streak-main-num').textContent=mainStreak;
  document.getElementById('ov-streak-math-num').textContent=mathStreak;

  // Mind map — 分轨渲染
  var ol=document.getElementById('ov-outline');if(!ol)return;
  var bridges={main:['↓ 会写代码了，怎么处理真实金融数据？','↓ 管道通了，工程稳了，补上金融数学基础','↓ 技术有了，但做什么产品？AI怎么帮你？','↓ 会用AI了，回到量化：策略怎么评估？','↓ 策略有了，怎么让它每天自动跑？','↓ 部署好了，能不能让AI自己管？'],math:['↓ 有了描述不确定性的语言，如何从数据推断规律？','↓ 数据在高维空间长什么样？AI内部算什么？','↓ 数学地基打好，回到量化：那些数字的本质是什么？','↓ 工具箱齐全。还有些高阶概念需要知道它们存在。']};
  var html='<div class="ov-outline-hd">课程大纲</div><div class="mindmap">';
  var maxRows=Math.max(MAIN_PLAN.stages.length,MATH_TRACK.modules.length),bridgeIdx=0;
  for(var i=0;i<maxRows;i++){
    html+='<div class="mm-row">';
    if(i<MAIN_PLAN.stages.length){currentTrack='main';var stage=MAIN_PLAN.stages[i],totalDays=0,l2='';stage.sections.forEach(function(sec){var secDays=0,l3='';sec.daysData.forEach(function(day){totalDays++;secDays++;var st=Store.isDayDone(day.globalDay)?'st2':(Store.isTaskDone(day.globalDay,0)?'st1':'st0');l3+='<div class="mm-l3-item '+st+'" onclick="event.stopPropagation();setHash(\'read-main-'+day.globalDay+'\')">D'+day.globalDay+': '+day.title+'</div>';});l2+='<div class="mm-l2-item" onclick="event.stopPropagation();setHash(\'read-main-'+sec.daysData[0].globalDay+'\')">'+sec.name+' ('+secDays+'天)</div><div class="mm-l3">'+l3+'</div>';});html+='<div class="mm-left"><div class="mm-parent" onclick="goTrack(\'main\')">'+stage.name+'<span class="mm-parent-meta">'+totalDays+'天</span></div><div class="mm-l2">'+l2+'</div></div>';}else{html+='<div class="mm-left"></div>'}
    html+='<div class="mm-dot '+(i<MAIN_PLAN.stages.length?'main':'math')+'"></div>';
    if(i<MATH_TRACK.modules.length){currentTrack='math';var mod=MATH_TRACK.modules[i],children='';mod.daysData.forEach(function(day){var st=Store.isDayDone(day.globalDay)?'st2':(Store.isTaskDone(day.globalDay,0)?'st1':'st0');children+='<div class="mm-child '+st+'" onclick="event.stopPropagation();setHash(\'read-math-'+day.globalDay+'\')">M'+day.globalDay+': '+day.title+'</div>';});html+='<div class="mm-right"><div class="mm-parent" onclick="goTrack(\'math\')">'+mod.name+'<span class="mm-parent-meta">'+mod.daysData.length+'天</span></div><div class="mm-children">'+children+'</div></div>';}else{html+='<div class="mm-right"></div>'}
    html+='</div>';
    if(i<maxRows-1){var bm=bridges.main[bridgeIdx]||'',bmt=bridges.math[bridgeIdx]||'';html+='<div class="mm-bridge"><div class="mm-bridge-l">'+(bm?'<span class="mm-bridge-text">'+bm+'</span>':'')+'</div><div class="mm-bridge-r">'+(bmt?'<span class="mm-bridge-text">'+bmt+'</span>':'')+'</div></div>';bridgeIdx++;}
  }
  html+='</div>';ol.innerHTML=html;
  currentTrack=tempTrack;
}
