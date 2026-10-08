// ===== 状态管理：内存为真相，落盘到 progress/current.json =====
//
// 旧版是每次读写都直连 localStorage。现在改成：
//   启动时一次性从文件读进内存 -> 之后所有读接口同步返回（render.js 是同步调用的）
//   写接口改内存 -> 防抖 400ms -> PUT 回文件
// 服务不可达时自动降级：只写 localStorage，顶部徽章变黄提示。
// localStorage 三个 key 与旧版逐字节同构，既是离线安全网，也让旧的 index_old.html 仍能读。
//
// 直接双击 main/index.html（file://）也能用 —— 那种情况不可能写文件，直接进降级模式。

var currentTrack='main',currentDay=1;
var KEY_MAIN='plan_tracker_main',KEY_MATH='plan_tracker_math',KEY_STREAK='plan_streak';
// 本浏览器有"还没写进文件"的进度 —— 下次连上服务时用来问要不要覆盖
var KEY_PENDING='plan_pending_sync';

var API_BASE='';          // 同源；将来页面与 API 分开部署时改这里即可
var API_TIMEOUT=2000;
var SYNC_DEBOUNCE=400;
var SYNC_RETRY=3000;

var Store={
  // ---- 内部状态 ----
  _mem:{main:{},math:{},streak:{}},
  _rev:0,
  _ready:false,
  _degraded:false,
  _dirty:false,
  _inflight:false,
  _conflictTried:false,
  _timer:null,
  _retryTimer:null,
  _bound:false,

  // ---- 基础 ----
  trackKey(){return currentTrack==='math'?'math':'main'},
  key(){return currentTrack==='math'?KEY_MATH:KEY_MAIN},
  ready(){return this._ready},
  degraded(){return this._degraded},

  // 返回**活对象**（不是副本）—— toggleTask 里 d[dk].tasks[idx]=… 改的就是它
  load(){return this._mem[this.trackKey()]},
  save(){this._touch()},   // 数据本来就在内存里，这里只负责触发回写

  // ---- 读接口（逻辑与旧版一致，背后改成读内存） ----
  isTaskDone(day,idx){var d=this.load(),dk='d'+day;return!!(d[dk]&&d[dk].tasks&&d[dk].tasks[idx])},
  isDayDone(day){var d=this.load(),dk='d'+day;if(!d[dk])return false;var tasks=d[dk].tasks;if(!tasks||tasks.length===0)return!!d[dk].reviewed;var plan=getPlan(),dd=plan.getDay(day);var expectedN=dd&&dd.tasks?dd.tasks.length:tasks.length;for(var i=0;i<expectedN;i++){if(!tasks[i])return false}return true},
  getLevel(day){var d=this.load(),dk='d'+day;if(!d[dk]||!d[dk].tasks)return 0;var done=d[dk].tasks.filter(function(t){return t}).length,total=d[dk].tasks.length;if(done===total)return 4;if(done>=total*0.66)return 3;if(done>=total*0.33)return 2;return done>0?1:0},
  getDoneCount(){var c=0;if(currentTrack==='math'){MATH_TRACK.allDays().forEach(function(day){if(this.isDayDone(day.globalDay))c++}.bind(this))}else{MAIN_PLAN.allDays().forEach(function(gd){if(this.isDayDone(gd))c++}.bind(this))}return c},
  getStreak(){
    // 总连胜：合并主线+数学，按日期记录事实（严格：错过一整天就断）
    var st=this._mem.streak||{};
    if(!st.lastDate)return 0;
    var today=fmtDay(_todayOnly()),yesterday=fmtDay(_daysAgo(1));
    if(st.lastDate===today||st.lastDate===yesterday)return st.streak||0;  // 今天已学，或今天还没过完
    return 0;                                                             // 错过一整天 → 断
  },

  // ---- 写接口 ----
  toggleTask(day,idx){var d=this.load(),dk='d'+day;if(!d[dk]){var plan=getPlan(),dd=plan.getDay(day);var n=dd&&dd.tasks?dd.tasks.length:3;d[dk]={tasks:new Array(n).fill(false)}}var was=this.isDayDone(day);d[dk].tasks[idx]=!d[dk].tasks[idx];this._touch();this._syncStreak(day,was)},
  markReviewed(day){var d=this.load(),dk='d'+day;if(!d[dk])d[dk]={tasks:[],reviewed:false};var was=this.isDayDone(day);d[dk].reviewed=!d[dk].reviewed;this._touch();this._syncStreak(day,was);return d[dk].reviewed},

  // ---- 连胜：勾满要记账，由完成变未完成要退账 ----
  // 进度记录里只有 tasks，没有日期，所以"哪天学的"只能靠 streak 这个计数器记。
  // 只写不退的话，把当天全点灭，连胜还会赖着不走。
  _syncStreak(day,wasDone){
    var key=this.trackKey()+':'+day;          // 如 'main:71'
    if(this.isDayDone(day))this.recordCompletion(key);
    else if(wasDone)this._revokeCompletion(key);   // 只有"本来完成、现在不完成"才退账
  },
  _todayDone(st){st=st||this._mem.streak||{};if(!Array.isArray(st.todayDone))st.todayDone=[];return st.todayDone},
  _keyDone(key){                              // 'main:71' 那天现在还完成着吗
    var p=String(key||'').split(':'),day=parseInt(p[1],10);
    if(!day)return false;
    var saved=currentTrack;currentTrack=(p[0]==='math')?'math':'main';
    var r=this.isDayDone(day);
    currentTrack=saved;
    return r;
  },
  recordCompletion(key){
    // 某天从"未完成"变"完成"时调用；同一天内幂等
    var st=this._mem.streak||(this._mem.streak={});
    var today=fmtDay(_todayOnly()),yesterday=fmtDay(_daysAgo(1));
    if(st.lastDate===today){                                // 今天已记过：只补记"今天完成的天"
      if(key&&this._todayDone(st).indexOf(key)<0)st.todayDone.push(key);
      this._touch();return;
    }
    st.prevStreak=st.streak||0;                             // 记一笔改之前的样子，撤勾时好还原
    st.prevLastDate=st.lastDate||'';
    if(st.lastDate===yesterday)st.streak=(st.streak||0)+1;  // 连续
    else st.streak=1;                                       // 断过或首次，重新起算
    st.lastDate=today;
    st.todayDone=key?[key]:[];                              // 今天完成的天，撤光了就退账
    this._touch();
  },
  _revokeCompletion(key){
    // 撤勾：今天完成的天全撤光了，就把今天这一笔整个退掉（历史连胜不动）
    var st=this._mem.streak;
    if(!st||st.lastDate!==fmtDay(_todayOnly()))return;      // 今天本来就没记账
    var list=this._todayDone(st),self=this;
    if(key){var i=list.indexOf(key);if(i>=0)list.splice(i,1)}
    else{
      // 启动自检（key 为空）：账上记着"今天完成过"的天，逐个核对现在还完成着没有
      for(var j=list.length-1;j>=0;j--)if(!self._keyDone(list[j]))list.splice(j,1);
    }
    if(list.length)return;                                  // 今天还有别的天完成 → 今天算学过
    st.streak=st.prevStreak||0;
    st.lastDate=st.prevLastDate||'';
    delete st.prevStreak;delete st.prevLastDate;delete st.todayDone;
    this._touch();
  },
  _reconcileStreak(){
    // 启动自检：文件里记着"今天完成过"，但今天完成的天现在一个都不在了 → 把那一笔退掉。
    // （老数据没有 todayDone 这本账，无从判断，就不动它）
    var st=this._mem.streak;
    if(!st||!st.lastDate||st.lastDate!==fmtDay(_todayOnly()))return;
    if(!Array.isArray(st.todayDone))return;
    var self=this;
    if(st.todayDone.some(function(k){return self._keyDone(k)}))return;
    this._revokeCompletion(null);
  },

  // ---- 回写 ----
  _touch(){
    this._dirty=true;
    this._mirror();
    this._schedule();
  },
  _mirror(){
    // 与旧版格式逐字节同构：离线安全网 + index_old.html 仍可读
    try{
      localStorage.setItem(KEY_MAIN,JSON.stringify(this._mem.main||{}));
      localStorage.setItem(KEY_MATH,JSON.stringify(this._mem.math||{}));
      localStorage.setItem(KEY_STREAK,JSON.stringify(this._mem.streak||{}));
      localStorage.setItem(KEY_PENDING,'1');   // 写成功了 flush 会清掉
    }catch(e){}
  },
  _doc(){
    return {version:1,rev:this._rev,main:this._mem.main||{},math:this._mem.math||{},streak:this._mem.streak||{}};
  },
  _schedule(){
    var self=this;
    if(this._timer)clearTimeout(this._timer);
    this._timer=setTimeout(function(){self._timer=null;self.flush()},SYNC_DEBOUNCE);
    this._armRetry();
  },
  _armRetry(){
    var self=this;
    if(this._retryTimer||!this._degraded||!this._dirty)return;
    this._retryTimer=setTimeout(function(){
      self._retryTimer=null;
      if(self._dirty)self.flush();
    },SYNC_RETRY);
  },
  flushNow(){
    // 关标签/切后台时立刻写，兜住防抖那 400ms 的窗口
    if(this._timer){clearTimeout(this._timer);this._timer=null}
    this.flush();
  },
  flush(){
    var self=this;
    if(this._inflight||!this._dirty)return;
    if(location.protocol==='file:'){this._setDegraded(true);return}
    this._inflight=true;
    fetch(API_BASE+'/api/progress',{
      method:'PUT',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify(this._doc()),
      keepalive:true,
      cache:'no-store'
    }).then(function(r){
      if(r.status===409){
        return r.json().then(function(server){
          self._inflight=false;
          var d=self._normalize(server);
          // 只问一次：万一别的设备一直在写，不能变成连环弹窗
          var ask=!self._conflictTried&&typeof window!=='undefined'&&!!window.confirm;
          self._conflictTried=true;
          var keepLocal=ask&&window.confirm(
            '进度文件已被其他设备修改。\n\n'+
            '【确定】用本机这份覆盖文件\n'+
            '【取消】放弃本机这份，改用文件里的进度');
          if(keepLocal){
            self._rev=d.rev;          // 拿最新版本号再推一次
            self._dirty=true;
            self._setDegraded(false);
            self._schedule();
            return;
          }
          self._adopt(d);
          self._dirty=false;
          self._setDegraded(false);
          if(ask){
            // 用户明确选了"放弃本机这份"：localStorage 跟着对齐，别留 pending 下次又问一遍。
            // 没问过（弹不出窗 / 已经问过一次）就不动它 —— 本机这份继续躺在 localStorage 里当安全网。
            self._mirror();
            try{localStorage.removeItem(KEY_PENDING)}catch(e){}
          }
          if(typeof showToast==='function')showToast('已载入文件里的进度');
          if(typeof route==='function')route();
        });
      }
      if(!r.ok)throw new Error('HTTP '+r.status);
      return r.json().then(function(saved){
        self._inflight=false;
        self._dirty=false;
        self._conflictTried=false;    // 这次顺利写成了，下次冲突可以再问
        self._rev=typeof saved.rev==='number'?saved.rev:self._rev;
        self._setDegraded(false);
        try{localStorage.removeItem(KEY_PENDING)}catch(e){}
      });
    }).catch(function(){
      self._inflight=false;
      self._setDegraded(true);
      self._armRetry();          // 3 秒后自动重试，服务回来了自己转绿
    });
  },
  _setDegraded(v){
    if(this._degraded===v){this._renderBadge();return}
    this._degraded=v;
    this._renderBadge();
  },
  _renderBadge(){
    var el=document.getElementById('conn-badge');
    if(el){
      el.classList.toggle('on',!this._degraded);
      el.textContent=this._degraded
        ?'● 未连接 · 进度仅存本浏览器'
        :'● 已连接 · 进度存于 progress/current.json';
      el.title=this._degraded
        ?'没连上本地服务，填写的内容只在这个浏览器里。双击「启动学习计划」后会自动同步过来。'
        :'进度实时写入仓库的 progress/current.json';
    }
    this._renderWarn();
  },
  _renderWarn(){
    // 角落那个小徽章太容易被忽略：进度读不到时页面就是一片 0，
    // 分不清是"没连上"还是"真没学"。这里把原因直接说在页面上。
    var box=document.getElementById('conn-warn');
    if(!this._degraded){if(box)box.style.display='none';return}   // 连上了 → 什么都不显示
    if(!document.body)return;                                      // 理论上到不了（init 在 DOMContentLoaded 里）
    var isFile=location.protocol==='file:';
    if(!box){
      box=document.createElement('div');
      box.id='conn-warn';
      box.className='conn-warn';
      box.innerHTML='<div class="cw-icon">!</div>'+
        '<div class="cw-body"><span class="cw-title"></span><span class="cw-text"></span></div>'+
        '<button class="cw-close" title="知道了">✕</button>';
      box.querySelector('.cw-close').addEventListener('click',function(){box.style.display='none'});
      document.body.appendChild(box);
    }
    box.querySelector('.cw-title').textContent=
      isFile?'进度没读出来 —— 这样打开是错的':'连不上本地服务，进度没存进文件';
    box.querySelector('.cw-text').innerHTML=isFile
      ?'你是<b>直接双击网页文件</b>打开的（地址栏是 <code>file://…</code>），它够不着 '+
       '<b>progress/current.json</b>，所以进度只会显示 0。<b>关掉这个标签页</b>，改双击根目录的 '+
       '<b>启动学习计划.command</b> —— 它会自己开好浏览器，用那个 <code>http://127.0.0.1</code> 的地址看。'
      :'你勾的东西暂时只存在这个浏览器里。请双击根目录的 <b>启动学习计划.command</b>，'+
       '<b>并保持弹出的终端窗口开着</b>（关掉窗口服务就停了）。服务一回来 3 秒内会自动同步。';
    box.style.display='flex';
  },

  // ---- 启动 ----
  init(cb){
    var self=this,done=false;
    function finish(){
      if(done)return;             // 超时和 abort 会双触发，这里挡一下
      done=true;
      self._ready=true;
      self._reconcileStreak();    // 上次关页面时留下的烂账，这次开页面时对一遍
      self._renderBadge();
      cb();
    }

    this._mem=this._readLocal();
    this._bindLifecycle();

    if(location.protocol==='file:'){
      // 双击打开的静态页，够不着文件 —— 不等超时，首屏零延迟
      this._degraded=true;
      finish();
      return;
    }

    var ctl=(typeof AbortController!=='undefined')?new AbortController():null;
    var to=setTimeout(function(){if(ctl)ctl.abort()},API_TIMEOUT);
    fetch(API_BASE+'/api/progress',{signal:ctl?ctl.signal:undefined,cache:'no-store'})
      .then(function(r){
        var ct=r.headers.get('Content-Type')||'';
        // 三个条件缺一即降级 —— 误用 python -m http.server（返回 404 HTML）也能安全落回本地
        if(!r.ok||ct.indexOf('json')<0)throw new Error('not the plan server');
        return r.json();
      })
      .then(function(doc){clearTimeout(to);self._onServerDoc(doc);finish()})
      .catch(function(){clearTimeout(to);self._degraded=true;finish()});
  },

  _readLocal(){
    return {main:this._readKey(KEY_MAIN),math:this._readKey(KEY_MATH),streak:this._readKey(KEY_STREAK)};
  },
  _readKey(k){try{var v=JSON.parse(localStorage.getItem(k));return this._plainObj(v)?v:{}}catch(e){return{}}},
  _plainObj(v){return!!v&&typeof v==='object'&&!Array.isArray(v)},
  _normalize(doc){
    doc=this._plainObj(doc)?doc:{};
    return {
      version:typeof doc.version==='number'?doc.version:1,
      rev:typeof doc.rev==='number'?doc.rev:0,
      main:this._plainObj(doc.main)?doc.main:{},
      math:this._plainObj(doc.math)?doc.math:{},
      streak:this._plainObj(doc.streak)?doc.streak:{},
      updatedAt:doc.updatedAt||doc.exportedAt||null   // 旧备份是 exportedAt
    };
  },
  _adopt(doc){
    this._rev=doc.rev||0;
    this._mem.main=doc.main||{};
    this._mem.math=doc.math||{};
    this._mem.streak=doc.streak||{};
  },
  _isEmpty(doc){
    if(!doc)return true;
    return Object.keys(doc.main||{}).length===0&&Object.keys(doc.math||{}).length===0;
  },
  _onServerDoc(raw){
    var d=this._normalize(raw);
    var serverEmpty=this._isEmpty(d);
    var localEmpty=this._isEmpty(this._mem);
    var pending=false;
    try{pending=localStorage.getItem(KEY_PENDING)==='1'}catch(e){}

    if(serverEmpty&&!localEmpty){
      // 关键：文件还是空的，但本浏览器有进度 —— 推上去，别让空文件把真实进度冲掉
      this._rev=d.rev;
      this._dirty=true;
      this._setDegraded(false);
      this.flush();
      if(typeof showToast==='function')showToast('已将本浏览器进度写入 progress/current.json');
      return;
    }
    if(!serverEmpty&&pending&&!localEmpty){
      var take=window.confirm('本浏览器有还没写进文件的进度。\n\n【确定】用本浏览器的进度覆盖文件\n【取消】加载文件里的进度（本浏览器这份仍留在 localStorage）');
      if(take){
        this._rev=d.rev;
        this._dirty=true;
        this._setDegraded(false);
        this.flush();
        return;
      }
      try{localStorage.removeItem(KEY_PENDING)}catch(e){}
    }
    this._adopt(d);
    this._setDegraded(false);
  },
  _bindLifecycle(){
    if(this._bound)return;this._bound=true;
    var self=this;
    window.addEventListener('pagehide',function(){self.flushNow()});
    document.addEventListener('visibilitychange',function(){if(document.visibilityState==='hidden')self.flushNow()});
    // 多标签：别的标签写了我就跟着更新（注意别 _touch，否则两会互相弹）
    window.addEventListener('storage',function(e){
      if(e.key===KEY_STREAK){self._mem.streak=self._readKey(KEY_STREAK)}
      else if(e.key===KEY_MAIN){self._mem.main=self._readKey(KEY_MAIN)}
      else if(e.key===KEY_MATH){self._mem.math=self._readKey(KEY_MATH)}
      else return;
      if(self._ready&&typeof route==='function')route();
    });
  }
};

function getPlan(){return currentTrack==='math'?MATH_TRACK:MAIN_PLAN}

// ===== 总连胜：日期工具 =====
function fmtDay(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function _todayOnly(){var t=new Date();return new Date(t.getFullYear(),t.getMonth(),t.getDate())}
function _daysAgo(n){var d=_todayOnly();d.setDate(d.getDate()-n);return d}
