(() => {
  const {tracks, all, byId, today, dateOffset, initialState} = Curriculum;
  const KEY = 'dual-track-ui-demo-v1';
  const app = document.querySelector('#app');
  let storageError = '';
  let state;
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || 'null');
    if(saved && (saved.version !== 1 || !all.every(d => saved.records?.[d.id]?.checked?.length === d.tasks.length && saved.records[d.id].checked.every(v => typeof v === 'boolean') && (!saved.records[d.id].completed || /^\d{4}-\d{2}-\d{2}$/.test(saved.records[d.id].completed)) && (!saved.records[d.id].completed || saved.records[d.id].checked.every(Boolean))))) throw Error('记录格式不兼容');
    state = saved || initialState();
  } catch {state = initialState(); storageError = '本地记录无法读取，已载入初始演示。';}
  let route, filter = 'all', query = '', selectedStage = null, lastCatalogTrack = null;
  const icons = {
    home:'<path d="m3 10 9-7 9 7v10H3Z"/><path d="M9 20v-7h6v7"/>',
    book:'<path d="M12 5v15M3 4c4-1 7 0 9 2 2-2 5-3 9-2v15c-4-1-7 0-9 2-2-2-5-3-9-2Z"/>',
    arrow:'<path d="M4 12h16m-6-6 6 6-6 6"/>',
    back:'<path d="M20 12H4m6-6-6 6 6 6"/>',
    check:'<path d="m5 12 4 4L19 6"/>',
    clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    link:'<path d="m9 15 6-6m-7 8-1 1a4 4 0 0 1-6-6l4-4a4 4 0 0 1 6 0m2-1 1-1a4 4 0 0 1 6 6l-4 4a4 4 0 0 1-6 0" transform="translate(1 0)"/>',
    search:'<circle cx="10" cy="10" r="6"/><path d="m15 15 5 5"/>',
    menu:'<path d="M4 6h16M4 12h16M4 18h16"/>',
    copy:'<rect x="8" y="8" width="12" height="13" rx="2"/><path d="M16 8V3H3v13h5"/>',
    chevron:'<path d="m9 5 7 7-7 7"/>',
    circle:'<circle cx="12" cy="12" r="8"/>',
    play:'<path d="m9 5 10 7-10 7Z"/>',
    layers:'<path d="m3 7 9-4 9 4-9 4Zm0 5 9 4 9-4M3 17l9 4 9-4"/>',
  };
  const icon = n => `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[n] || icons.circle}</svg>`;
  const escape = s => String(s).replace(/[&<>"']/g,c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const rec = d => state.records[d.id];
  const doneCount = days => days.filter(d => rec(d).completed).length;
  const next = t => tracks[t].days.find(d => !rec(d).completed);
  const fraction = t => `${doneCount(tracks[t].days)} / ${tracks[t].days.length}`;
  const percent = t => Math.round(doneCount(tracks[t].days) / tracks[t].days.length * 100);
  const checkedCount = d => rec(d).checked.filter(Boolean).length;
  const status = d => rec(d).completed ? 'done' : checkedCount(d) ? 'active' : 'todo';
  const labels = {done:'已完成',active:'学习中',todo:'未开始'};
  const statusHtml = d => `<span class="status ${status(d)}">${icon(status(d)==='done'?'check':status(d)==='active'?'play':'circle')}${labels[status(d)]}</span>`;
  const dayUrl = d => `#day/${d.track}/${d.n}`;
  const linkDay = (d, content, cls='') => `<a class="${cls}" href="${dayUrl(d)}">${content}</a>`;
  const progress = (done,total,label) => `<div class="progress" role="progressbar" aria-label="${label}" aria-valuenow="${done}" aria-valuemin="0" aria-valuemax="${total}"><span style="width:${total ? done/total*100 : 0}%"></span></div>`;
  function save() {
    try {localStorage.setItem(KEY,JSON.stringify(state));storageError='';}
    catch {storageError='浏览器未允许保存；当前操作仅保留到本次页面关闭。'; toast(storageError);}
  }
  let toastTimer;
  function toast(text) {const node=document.querySelector('#notice');node.textContent=text;node.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>node.classList.remove('visible'),4500);}
  function readRoute() {
    const [view='home',t='main',n] = (location.hash.slice(1) || 'home/main').split('/');
    const track=tracks[t]?t:'main';
    if(view==='day') return byId[`${track}-${Number(n)}`] ? {view,track,day:byId[`${track}-${Number(n)}`]} : {view:'missing',track};
    return {view:['home','outline','courses'].includes(view)?view:'missing',track};
  }
  function shell() {
    const t=route.track;
    const brand=`<a class="brand" href="#home/${t}" aria-label="双轨，返回今日学习"><svg viewBox="0 0 30 30" fill="none" aria-hidden="true"><path d="M6 5v20M24 5v20M6 10h18M6 20h18" stroke="currentColor" stroke-width="2"/><circle cx="6" cy="10" r="3" fill="currentColor"/><circle cx="24" cy="20" r="3" fill="currentColor"/></svg><span>双轨<span class="brand-sub">个人学习计划</span></span></a>`;
    app.innerHTML=`<header class="mobile-header">${brand}<button class="icon-btn" data-action="menu" aria-label="打开导航" aria-expanded="false">${icon('menu')}</button></header>
      <aside class="sidebar" aria-label="主导航"><div class="desktop-brand">${brand}</div>
      <div class="workspace">我的学习空间</div>
      <nav class="primary-nav"><a href="#home/${t}" ${route.view==='home'?'aria-current="page"':''}>${icon('home')}今日学习</a><a href="#outline/${t}" ${route.view==='outline'?'aria-current="page"':''}>${icon('book')}课程目录</a></nav>
      <div class="nav-section"><span class="nav-label">学习轨道</span>${Object.values(tracks).map(track=>`<a href="#${route.view==='courses'?'courses':route.view==='outline'?'outline':'home'}/${track.id}" class="track-nav" ${t===track.id?'aria-current="true"':''}><span>${track.label}</span><span class="nav-fraction">${fraction(track.id)}</span></a>`).join('')}</div>
      <div class="sidebar-note">把应用做出来，<br>也把原理弄明白。</div>
      <div class="sidebar-bottom"><span class="small muted">本地练习空间</span><button class="text-btn" data-action="demo">演示数据与状态 ${icon('chevron')}</button></div></aside>
      <main id="main" tabindex="-1"></main>`;
    const main=document.querySelector('#main');
    main.innerHTML=(storageError?`<p role="alert" class="error-note">${escape(storageError)}</p>`:'')+(route.view==='home'?home():route.view==='outline'?outline():route.view==='courses'?courses():route.view==='day'?day():`<h1>找不到这个学习日</h1><p>该编号不在演示课程中。</p><a class="btn" href="#outline/${t}">返回课程目录</a>`);
    const taskPanel=main.querySelector('.tasks-panel');
    if(taskPanel) taskPanel.parentElement.prepend(taskPanel);
    const selected=main.querySelector('.stage-nav [aria-current]');
    if(selected && innerWidth<=700) selected.parentElement.scrollLeft=Math.max(0,selected.offsetLeft-selected.parentElement.offsetLeft-12);
    document.title=`${route.view==='day'?route.day.title:route.view==='outline'||route.view==='courses'?'课程目录':'今日学习'} · 双轨`;
  }
  function tabs() {const view=route.view==='courses'||route.view==='outline'?route.view:'home';return `<nav class="track-tabs" aria-label="选择轨道">${Object.values(tracks).map(t=>`<a href="#${view}/${t.id}" ${t.id===route.track?'aria-current="page"':''}>${t.label}</a>`).join('')}</nav>`;}
  function home() {
    const t=route.track, track=tracks[t], d=next(t), other=t==='main'?'math':'main';
    const recent=all.filter(d=>rec(d).completed).sort((a,b)=>rec(b).completed.localeCompare(rec(a).completed)||b.n-a.n).slice(0,4);
    const dates=new Set(all.map(d=>rec(d).completed).filter(Boolean));
    const end=dates.has(today)?0:-1;
    let streak=0;while(dates.has(dateOffset(end-streak)))streak++;
    return `<div class="page-head"><div><h1>今日学习</h1><p class="muted">2026 年 10 月 29 日，星期四</p></div><a class="btn secondary" href="#courses/${t}">${icon('search')}定位学习日</a></div>
      ${tabs()}
      <div class="home-grid"><section class="focus-panel" aria-labelledby="continue-title">
      <div class="section-head"><h2 id="continue-title">${d?'继续你的学习':'这一轨，已走完'}</h2>${d?statusHtml(d):`<span class="status done">${icon('check')}全部完成</span>`}</div>
      ${d?`<div class="lesson-heading"><span class="day-number">第 ${d.n} 天</span><h3>${d.title}</h3></div><p class="lesson-description">${d.goals[0]}</p><div class="lesson-meta"><span>${icon('layers')}${track.stages[d.stage].title}</span><span>${icon('clock')}${d.minutes} 分钟</span></div><div class="task-preview"><span>本次任务</span><span>${checkedCount(d)} / ${d.tasks.length} 项完成</span>${progress(checkedCount(d),d.tasks.length,'当前任务进度')}</div><div class="focus-action">${linkDay(d,`${checkedCount(d)?'继续学习':'开始学习'} ${icon('arrow')}`,'btn primary')}<span class="small muted">${checkedCount(d)?'从上次停下的地方继续':'按自己的节奏完成'}</span></div>`:`<h3 class="finish-title">${track.days.length} 个学习日，<br>都留下了自己的答案。</h3><p class="lesson-description">回顾笔记，或挑一个项目再做一遍。</p><a class="btn primary" href="#courses/${t}">回顾课程 ${icon('arrow')}</a>`}
      <div class="linked-next">${icon('link')}<div><span class="small muted">${d?.related?`本日关联${tracks[byId[d.related].track].label}`:'另一条学习轨道'}</span>${linkDay(d?.related?byId[d.related]:next(other)||tracks[other].days.at(-1),`${d?.related?`第 ${byId[d.related].n} 天 · ${byId[d.related].title}`:`${tracks[other].label} · ${next(other)?`第 ${next(other).n} 天`:'已全部完成'}`} ${icon('arrow')}`)}</div></div>
      </section>
      <section class="overview-panel" aria-labelledby="progress-title"><div class="section-head"><h2 id="progress-title">双轨进度</h2><span class="small muted">按已完成学习日</span></div>${Object.values(tracks).map(tr=>`<div class="track-progress"><div class="section-head"><a href="#courses/${tr.id}">${tr.label} ${icon('chevron')}</a><span class="percent">${percent(tr.id)}<small>%</small></span></div>${progress(doneCount(tr.days),tr.days.length,tr.label)}<div class="progress-caption"><span>${fraction(tr.id)} 天</span><span>${tr.days.length-doneCount(tr.days)} 天待完成</span></div></div>`).join('')}
      <div class="study-rhythm"><div><span class="small muted">连续学习</span><p><strong>${streak}</strong> 天 <span class="small muted">${streak ? dates.has(today)?'含今天':'截至昨天':'从今天开始'}</span></p></div><div class="week" aria-label="近七天完成记录">${Array.from({length:7},(_,i)=>{const dt=dateOffset(i-6),active=dates.has(dt);return `<span class="week-day ${active?'studied':''} ${i===6?'today':''}" title="${dt}：${active?'有完成学习日':'尚无完成记录'}"><span>${['五','六','日','一','二','三','四'][i]}</span><span class="week-mark">${active?icon('check'):i===6?'今':'·'}</span></span>`;}).join('')}</div></div></section></div>
      <div class="lower-grid"><section class="stage-section"><div class="section-head"><h2>当前阶段</h2><a class="text-link" href="#courses/${t}">浏览全部 ${icon('arrow')}</a></div>${stageSummary(track,d||track.days.at(-1))}</section>
      <section class="recent-section"><div class="section-head"><h2>近期完成</h2><span class="small muted">两个轨道</span></div>${recent.length?`<div class="recent-list">${recent.map(d=>linkDay(d,`<span class="completion-mark">${icon('check')}</span><span class="recent-title">${d.title}<small>${tracks[d.track].label} · 第 ${d.n} 天</small></span><time datetime="${rec(d).completed}">${rec(d).completed.slice(5).replace('-',' / ')}</time>`,'recent-row')).join('')}</div>`:`<div class="empty"><p>还没有完成记录</p><span>完成第一个学习日后，它会出现在这里。</span></div>`}</section></div>
      <footer class="page-foot">学习进度保存在当前浏览器。<button class="text-btn" data-action="demo">模拟数据 · 切换状态</button></footer>`;
  }
  function stageSummary(t,d) {
    const days=t.days.filter(x=>x.stage===d.stage), done=doneCount(days);
    return `<div class="stage-heading"><span class="stage-index">${d.stage+1}</span><div><h3>${t.stages[d.stage].title}</h3><p class="small muted">第 ${days[0].n}–${days.at(-1).n} 天 · ${done} / ${days.length} 天完成</p></div></div><div class="day-map" aria-label="当前阶段学习日">${days.map(x=>`<a href="${dayUrl(x)}" class="day-cell ${rec(x).completed?'done':x.id===d.id?'current':'todo'}" aria-label="第 ${x.n} 天，${x.title}，${labels[status(x)]}" ${x.id===d.id?'aria-current="step"':''}>${x.n}</a>`).join('')}</div><div class="map-legend"><span><i class="done"></i>已完成</span><span><i class="current"></i>当前</span><span><i></i>待学习</span></div>`;
  }
  function outline() {
    const mapTrack=track=>{const current=next(track.id);return `<section class="plan-map-track ${track.id} ${track.id===route.track?'is-selected':''}" aria-labelledby="${track.id}-map-title"><header class="plan-map-track-head"><div><h2 id="${track.id}-map-title">${track.label}</h2><p>${track.stages.length} 个阶段 · ${track.sections.length} 个小节 · ${fraction(track.id)} 天完成</p></div><a class="text-link" href="#courses/${track.id}">列表浏览 ${icon('arrow')}</a></header><div class="plan-map-stages">${track.stages.map((stage,index)=>{const stageDays=track.days.filter(day=>day.stage===index);return `<section class="plan-map-stage ${current?.stage===index?'is-current':''}"><a class="plan-map-stage-head" href="#courses/${track.id}" data-map-stage="${index}" data-map-track="${track.id}"><span>${index+1}</span><strong>${stage.title}</strong><small>第 ${stageDays[0].n}–${stageDays.at(-1).n} 天 · ${doneCount(stageDays)} / ${stageDays.length}</small></a><div class="plan-map-sections">${stage.sections.map(sectionIndex=>{const section=track.sections[sectionIndex],days=section.days.map(id=>byId[id]);return `<section class="plan-map-section"><a href="${dayUrl(days[0])}" class="plan-map-section-head">${section.title}<small>${days.length} 天</small></a><div class="plan-map-days">${days.map(day=>`<a href="${dayUrl(day)}" class="plan-map-day ${status(day)} ${current?.id===day.id?'is-current':''}" ${current?.id===day.id?'aria-current="step"':''}><span>第 ${day.n} 天</span><strong>${day.title}</strong></a>`).join('')}</div></section>`;}).join('')}</div></section>`;}).join('')}</div></section>`;};
    return `<div class="page-head outline-page-head"><div><h1>课程大纲</h1><p class="muted">从阶段到学习日，沿着两条轨道找到下一步。</p></div><a class="btn secondary" href="#courses/${route.track}">${icon('search')}列表中搜索</a></div>${tabs()}<div class="plan-map-legend" aria-label="学习状态说明"><span><i class="done"></i>已完成</span><span><i class="active"></i>学习中</span><span><i></i>未开始</span><span><i class="current"></i>当前学习日</span></div><div class="plan-map"><div class="plan-map-axis" aria-hidden="true"></div>${mapTrack(tracks.main)}${mapTrack(tracks.math)}</div>`;
  }
  function courses() {
    const t=tracks[route.track];
    if(lastCatalogTrack!==t.id){selectedStage=(next(t.id)||t.days.at(-1)).stage;lastCatalogTrack=t.id;query='';filter='all';}
    return `<div class="page-head"><div><h1>课程目录</h1><p class="muted">${t.stages.length} 个阶段 · ${t.sections.length} 个小节 · ${t.days.length} 个学习日</p></div>${next(t.id)?linkDay(next(t.id),`继续第 ${next(t.id).n} 天 ${icon('arrow')}`,'btn primary'):''}</div>${tabs()}
    <div class="catalog-toolbar"><label class="search-field">${icon('search')}<input id="course-search" type="search" placeholder="搜索标题或学习日编号" aria-label="搜索标题或学习日编号" value="${escape(query)}"></label><label class="status-filter">状态<select id="status-filter"><option value="all">全部状态</option><option value="done" ${filter==='done'?'selected':''}>已完成</option><option value="active" ${filter==='active'?'selected':''}>学习中</option><option value="todo" ${filter==='todo'?'selected':''}>未开始</option></select></label></div>
    <div class="catalog-layout"><nav class="stage-nav" aria-label="按阶段浏览"><button data-stage="all" ${selectedStage===null?'aria-current="true"':''}>全部阶段<span>${doneCount(t.days)} / ${t.days.length}</span></button>${t.stages.map((s,i)=>{const days=t.days.filter(d=>d.stage===i);return `<button data-stage="${i}" ${selectedStage===i?'aria-current="true"':''}><span>${i+1}. ${s.title}<small>第 ${days[0].n}–${days.at(-1).n} 天</small></span><span>${doneCount(days)} / ${days.length}</span></button>`;}).join('')}</nav><section id="course-results" aria-label="学习日列表">${courseResults()}</section></div>`;
  }
  function courseResults() {
    const t=tracks[route.track], search=query.trim().toLowerCase();
    const days=t.days.filter(d=>(search||selectedStage===null||d.stage===selectedStage)&&(filter==='all'||status(d)===filter)&&(!search||d.title.toLowerCase().includes(search)||String(d.n)===search.replace(/第|天|\s/g,'')));
    return `<div class="results-head"><h2>${query?'搜索结果':selectedStage===null?'全部课程':t.stages[selectedStage].title}</h2><span class="small muted" role="status">${days.length} 个学习日${query?' · 搜索所有阶段':''}</span></div>${days.length?t.sections.map((s,i)=>{const sectionDays=days.filter(d=>d.section===i);return sectionDays.length?`<div class="course-section"><h3>${s.title}</h3>${sectionDays.map(d=>`<a href="${dayUrl(d)}" class="course-row ${next(t.id)?.id===d.id?'is-current':''}"><span class="course-day">第 ${d.n} 天</span><span class="course-title">${d.title}${d.related?`<small>${icon('link')}关联${tracks[byId[d.related].track].label}第 ${byId[d.related].n} 天</small>`:''}</span><span class="course-time">${d.minutes} 分钟</span>${statusHtml(d)}${icon('chevron')}</a>`).join('')}</div>`:'';}).join(''):`<div class="empty search-empty">${icon('search')}<h3>没有匹配的学习日</h3><p>试试课程关键词或数字编号，也可以清除筛选。</p><button class="btn secondary" data-action="clear-search">清除筛选</button></div>`}`;
  }
  function day() {
    const d=route.day,t=tracks[d.track], r=rec(d),count=checkedCount(d),prev=t.days[d.n-2],following=t.days[d.n];
    return `<nav class="breadcrumb" aria-label="面包屑"><a href="#courses/${t.id}">${t.label}</a>${icon('chevron')}<span>${t.stages[d.stage].title}</span>${icon('chevron')}<span>第 ${d.n} 天</span></nav>
    <div class="page-head lesson-page-head"><div><h1>${d.title}</h1><p class="muted">第 ${d.n} 天 · ${t.sections[d.section].title}<span class="meta-dot">·</span>建议 ${d.minutes} 分钟</p></div>${statusHtml(d)}</div>
    <div class="lesson-layout"><div class="reading-column"><section class="goals"><h2>今天要做到</h2><ul>${d.goals.map(g=>`<li>${g}</li>`).join('')}</ul></section>
    <section class="concepts"><h2>核心概念</h2><div class="concept-list">${d.concepts.map((c,i)=>`<span>${c}${i<d.concepts.length-1?'<span class="concept-separator" aria-hidden="true">/</span>':''}</span>`).join('')}</div></section>
    ${d.related?`<section class="related-section"><div class="section-head"><h2>${d.track==='main'?'补上背后的数学':'回到应用中理解'}</h2>${icon('link')}</div><p>${d.track==='main'?'为什么检索能找到语义相近的片段？从向量和相似度开始理解。':'把向量相似度用于真实文档检索，观察它如何影响问答质量。'}</p>${linkDay(byId[d.related],`<span>${tracks[byId[d.related].track].label} · 第 ${byId[d.related].n} 天<strong>${byId[d.related].title}</strong></span>${icon('arrow')}`,'related-link')}${statusHtml(byId[d.related])}</section>`:''}
    <section class="prompt-section"><div class="section-head"><h2>学习 Prompt</h2><button class="btn secondary compact" data-action="copy">${icon('copy')}复制 Prompt</button></div><p class="muted small">交给你的 AI 学习伙伴，逐步完成今天的练习。</p><details class="prompt-disclosure" open><summary><span class="when-open">收起完整 Prompt</span><span class="when-closed">展开完整 Prompt</span>${icon('chevron')}</summary><div class="prompt-text" id="prompt-text">${escape(d.prompt)}</div></details><p class="copy-fallback small" hidden>复制未成功，请选中上方 Prompt 后手动复制。</p></section>

    </div><aside class="tasks-panel" aria-labelledby="tasks-title"><div class="section-head"><h2 id="tasks-title">今日任务</h2><span class="small" id="task-count">${count} / ${d.tasks.length}</span></div>${progress(count,d.tasks.length,'今日任务完成进度')}<div class="checklist">${d.tasks.map((task,i)=>`<label class="task-row ${r.checked[i]?'checked':''}"><input type="checkbox" data-task="${i}" ${r.checked[i]?'checked':''}><span><strong>${task.title}</strong><small>${task.detail}</small></span></label>`).join('')}</div><div id="completion-control">${completionControl(d)}</div></aside></div>
    <nav class="day-navigation" aria-label="相邻学习日">${prev?linkDay(prev,`${icon('back')}<span><small>上一天 · 第 ${prev.n} 天</small>${prev.title}</span>`):'<button disabled class="nav-disabled">已经是第一天</button>'}<a href="#courses/${t.id}" class="back-catalog">课程目录</a>${following?linkDay(following,`<span><small>下一天 · 第 ${following.n} 天</small>${following.title}</span>${icon('arrow')}`):'<button disabled class="nav-disabled">已经是最后一天</button>'}</nav>`;
  }
  function completionControl(d) {
    const r=rec(d),count=checkedCount(d);
    return r.completed?`<div class="completed-note">${icon('check')}已于 ${r.completed.slice(5).replace('-','月')}日完成</div><button class="btn secondary full" data-action="reopen">重新学习这一天</button>`:`<p class="small muted" id="complete-help">${count===d.tasks.length?'任务已全部勾选，可以完成今天的学习。':`还有 ${d.tasks.length-count} 项任务，完成后再标记学习日。`}</p><button class="btn primary full" data-action="complete" aria-describedby="complete-help" ${count<d.tasks.length?'disabled':''}>${icon('check')}标记当天完成</button>`;
  }
  function refreshTaskUI() {
    const d=route.day; const count=checkedCount(d);
    document.querySelectorAll('[data-task]').forEach(input=>input.closest('.task-row').classList.toggle('checked',input.checked));
    document.querySelector('#task-count').textContent=`${count} / ${d.tasks.length}`;
    const bar=document.querySelector('.tasks-panel .progress');bar.setAttribute('aria-valuenow',count);bar.firstElementChild.style.width=`${count/d.tasks.length*100}%`;
    document.querySelector('#completion-control').innerHTML=completionControl(d);
    document.querySelector('.lesson-page-head > .status').outerHTML=statusHtml(d);
    document.querySelectorAll('.track-nav .nav-fraction').forEach((el,i)=>el.textContent=fraction(Object.keys(tracks)[i]));
  }
  async function copyPrompt(button) {
    const text=route.day.prompt;
    button.disabled=true;
    try {
      if(navigator.clipboard?.writeText) await navigator.clipboard.writeText(text);
      else {const temp=document.createElement('textarea');temp.value=text;temp.style.position='fixed';temp.style.top='0';document.body.append(temp);temp.select();const ok=document.execCommand('copy');temp.remove();button.focus();if(!ok)throw Error();}
      toast('学习 Prompt 已复制');
    } catch {document.querySelector('.copy-fallback').hidden=false;const selection=getSelection(),range=document.createRange();document.querySelector('.prompt-disclosure').open=true;range.selectNodeContents(document.querySelector('#prompt-text'));selection.removeAllRanges();selection.addRange(range);toast('请手动复制已选中的 Prompt');}
    finally{button.disabled=false;}
  }
  app.addEventListener('click',e=>{
    const btn=e.target.closest('[data-action]');
    if(btn) {
      const action=btn.dataset.action;
      if(action==='menu'){const open=app.classList.toggle('menu-open');btn.setAttribute('aria-expanded',String(open));btn.setAttribute('aria-label',open?'关闭导航':'打开导航');}
      if(action==='demo')document.querySelector('#demo-dialog').showModal();
      if(action==='copy')copyPrompt(btn);
      if(action==='clear-search'){query='';filter='all';selectedStage=null;shell();document.querySelector('#course-search').focus();}
      if(action==='complete'&&checkedCount(route.day)===route.day.tasks.length){rec(route.day).completed=today;save();shell();document.querySelector('[data-action="reopen"]').focus();toast(`第 ${route.day.n} 天已完成，双轨进度已更新`);}
      if(action==='reopen'){rec(route.day).completed=null;save();shell();document.querySelector('[data-action="complete"]').focus();toast('已重新打开学习日，已勾选的任务保留');}
    }
    const stage=e.target.closest('[data-stage]');
    if(stage){selectedStage=stage.dataset.stage==='all'?null:Number(stage.dataset.stage);query='';shell();document.querySelector(`[data-stage="${stage.dataset.stage}"]`).focus();}
    const mapStage=e.target.closest('[data-map-stage]');
    if(mapStage){
      selectedStage=Number(mapStage.dataset.mapStage);query='';filter='all';lastCatalogTrack=mapStage.dataset.mapTrack;
      if(route.view==='courses'&&route.track===lastCatalogTrack){e.preventDefault();shell();document.querySelector(`[data-stage="${selectedStage}"]`).focus();}
    }
  });
  app.addEventListener('change',e=>{
    if(e.target.matches('[data-task]')) {const d=route.day;rec(d).checked[Number(e.target.dataset.task)]=e.target.checked;if(!e.target.checked)rec(d).completed=null;save();refreshTaskUI();toast(`${checkedCount(d)} / ${d.tasks.length} 项任务已完成`);}
    if(e.target.id==='status-filter'){filter=e.target.value;document.querySelector('#course-results').innerHTML=courseResults();}
  });
  app.addEventListener('input',e=>{if(e.target.id==='course-search'){query=e.target.value;document.querySelector('#course-results').innerHTML=courseResults();}});
  document.querySelector('.skip-link').addEventListener('click',e=>{e.preventDefault();document.querySelector('#main').focus();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&app.classList.contains('menu-open')){app.classList.remove('menu-open');const b=document.querySelector('[data-action="menu"]');b.setAttribute('aria-expanded','false');b.setAttribute('aria-label','打开导航');b.focus();}});
  document.querySelector('#apply-mode').addEventListener('click',()=>{state=initialState(document.querySelector('#demo-mode').value);save();document.querySelector('#demo-dialog').close();selectedStage=null;lastCatalogTrack=null;if(location.hash==='#home/main'){route=readRoute();shell();document.querySelector('h1').setAttribute('tabindex','-1');document.querySelector('h1').focus();}else location.hash='#home/main';toast('演示状态已应用');});
  addEventListener('hashchange',()=>{route=readRoute();shell();scrollTo(0,0);const h=document.querySelector('h1');h.tabIndex=-1;h.focus({preventScroll:true});});
  route=readRoute();shell();
})();
