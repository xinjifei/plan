// ===== 初始化 & 全局事件 =====
var _toastTimer=null;
function showToast(msg){let t=document.getElementById('toast');t.textContent=msg;t.classList.add('show');if(_toastTimer)clearTimeout(_toastTimer);_toastTimer=setTimeout(()=>t.classList.remove('show'),2400);}

function copyPrompt(){let text=document.getElementById('prompt-body').textContent;navigator.clipboard.writeText(text).then(()=>{let btn=document.getElementById('copy-btn');btn.classList.add('copied');btn.innerHTML='<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> Copied!';showToast('✓ Prompt 已复制');setTimeout(()=>{btn.classList.remove('copied');btn.innerHTML='<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Copy'},2000);}).catch(()=>showToast('复制失败'));}

function toggleSidebar(){document.getElementById('sidebar').classList.toggle('open-mobile');}

// 浮动 tooltip
var _tipEl=document.getElementById('float-tip');
document.addEventListener('mouseover',function(e){var cell=e.target.closest('.day-cell');if(!cell)return;var tip=cell.getAttribute('data-tip');if(!tip)return;_tipEl.textContent=tip;_tipEl.classList.add('show');});
document.addEventListener('mousemove',function(e){if(!_tipEl.classList.contains('show'))return;_tipEl.style.left=(e.clientX+16)+'px';_tipEl.style.top=(e.clientY-40)+'px';});
document.addEventListener('mouseout',function(e){var cell=e.target.closest('.day-cell');if(cell&&e.relatedTarget&&cell.contains(e.relatedTarget))return;_tipEl.classList.remove('show');});

// 键盘
document.addEventListener('keydown',function(e){
  if((e.ctrlKey||e.metaKey)&&e.key==='Enter'){e.preventDefault();var dd=getPlan().getDay(currentDay);if(dd){for(var i=0;i<dd.tasks.length;i++){if(!Store.isTaskDone(currentDay,i)){document.querySelectorAll('#task-list .task-item')[i]?.click();break;}}}}
  if(e.key==='Escape')goHome();
});

// 启动
document.addEventListener('DOMContentLoaded',function(){
  if(!location.hash)location.hash='overview';
  // 进度读进来之后再渲染。这里不要再补一行裸 route()
  Store.init(function(){route();});
});
