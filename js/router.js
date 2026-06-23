// ===== Hash 路由 =====
function getHash(){return location.hash.replace('#','')||'overview'}
function setHash(h){if(location.hash!=='#'+h)location.hash=h}

function route(){
  var h=getHash();
  var isOverview=(h==='overview');
  document.getElementById('sidebar').style.display=isOverview?'none':'';
  document.querySelector('.tb-center').style.display=isOverview?'none':'';
  document.querySelector('.tb-r').style.display=isOverview?'none':'';
  document.querySelector('.tb-back').style.display=isOverview?'none':'';
  if(isOverview){document.getElementById('tb-badge').textContent='总览'}

  document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
  document.getElementById('overlay').classList.remove('show');

  if(isOverview){
    document.getElementById('view-overview').classList.add('active');
    currentDay=null;renderOverview();
  } else if(h==='main'){
    currentTrack='main';currentDay=null;
    document.getElementById('view-home').classList.add('active');
    renderAll();
  } else if(h==='math'){
    currentTrack='math';currentDay=null;
    document.getElementById('view-home').classList.add('active');
    renderAll();
  } else if(h.startsWith('main-')){
    currentTrack='main';
    var d=parseInt(h.replace('main-',''));
    if(MAIN_PLAN.getDay(d)){currentDay=d;renderDay(d);renderSidebar();updateStats();document.getElementById('view-day').classList.add('active')}
    else{setHash('main')}
  } else if(h.startsWith('math-')){
    currentTrack='math';
    var d=parseInt(h.replace('math-',''));
    if(MATH_TRACK.getDay(d)){currentDay=d;renderDay(d);renderSidebar();updateStats();document.getElementById('view-day').classList.add('active')}
    else{setHash('math')}
  } else if(h.startsWith('read-')){
    var parts=h.split('-');
    currentTrack=parts[1];
    var d=parseInt(parts[2]);
    var dd=currentTrack==='math'?MATH_TRACK.getDay(d):MAIN_PLAN.getDay(d);
    if(dd){
      currentDay=d;
      document.getElementById('sidebar').style.display='none';
      document.querySelector('.tb-center').style.display='none';
      document.querySelector('.tb-r').style.display='none';
      document.querySelector('.tb-back').style.display='';
      document.getElementById('tb-badge').textContent='阅读';
      renderDay(d);renderSidebar();updateStats();
      document.getElementById('view-day').classList.add('active');
      document.getElementById('btn-home').onclick=function(){setHash('overview')};
    } else {setHash('overview')}
  } else {
    setHash('overview');
  }
  updateStats();
}

window.addEventListener('hashchange',route);

function goHome(){var h=getHash();if(h.startsWith('read-')){setHash('overview')}else{setHash(currentTrack)}}
function goDay(d){var h=getHash();var prefix=h.startsWith('read-')?'read-'+currentTrack+'-':currentTrack+'-';setHash(prefix+d);}
function navDay(dir){var plan=getPlan();var next=dir>0?(currentTrack==='math'?MATH_TRACK.getNextDay(currentDay):plan.getNextDay(currentDay)):(currentTrack==='math'?MATH_TRACK.getPrevDay(currentDay):plan.getPrevDay(currentDay));if(next)goDay(next);}
function switchTrack(track){setHash(track)}
function switchTrackUI(){updateStats()}
function goTrack(track){setHash(track)}
function goNextDay(track){
  var prevTrack=currentTrack;currentTrack=track;
  var plan=getPlan(),nextDay=1;
  if(track==='math'){
    var all=MATH_TRACK.allDays();
    for(var i=0;i<all.length;i++){var gd=all[i].globalDay;if(!Store.isDayDone(gd)){nextDay=gd;break}else nextDay=gd}
  } else {
    for(var i=1;i<=plan.totalDays;i++){if(!Store.isDayDone(i)){nextDay=i;break}else nextDay=i}
    if(nextDay>plan.totalDays)nextDay=plan.totalDays;
  }
  currentTrack=prevTrack;
  setHash(track+'-'+nextDay);
}
