// ===== 状态管理 & localStorage 持久化 =====
// 使用与旧版 app.js 完全一致的 key，自动继承已有学习记录
var currentTrack='main',currentDay=1;
var KEY_MAIN='plan_tracker_main',KEY_MATH='plan_tracker_math';

var Store={
  key(){return currentTrack==='math'?KEY_MATH:KEY_MAIN},
  load(){try{return JSON.parse(localStorage.getItem(this.key()))||{}}catch(e){return{}}},
  save(d){localStorage.setItem(this.key(),JSON.stringify(d))},
  toggleTask(day,idx){var d=this.load(),dk='d'+day;if(!d[dk]){var plan=getPlan(),dd=plan.getDay(day);var n=dd&&dd.tasks?dd.tasks.length:3;d[dk]={tasks:new Array(n).fill(false)}}d[dk].tasks[idx]=!d[dk].tasks[idx];this.save(d);if(this.isDayDone(day))this.recordCompletion()},
  markReviewed(day){var d=this.load(),dk='d'+day;if(!d[dk])d[dk]={tasks:[],reviewed:false};d[dk].reviewed=!d[dk].reviewed;this.save(d);if(this.isDayDone(day))this.recordCompletion();return d[dk].reviewed},
  isTaskDone(day,idx){var d=this.load(),dk='d'+day;return!!(d[dk]&&d[dk].tasks&&d[dk].tasks[idx])},
  isDayDone(day){var d=this.load(),dk='d'+day;if(!d[dk])return false;var tasks=d[dk].tasks;if(!tasks||tasks.length===0)return!!d[dk].reviewed;var plan=getPlan(),dd=plan.getDay(day);var expectedN=dd&&dd.tasks?dd.tasks.length:tasks.length;for(var i=0;i<expectedN;i++){if(!tasks[i])return false}return true},
  getLevel(day){var d=this.load(),dk='d'+day;if(!d[dk]||!d[dk].tasks)return 0;var done=d[dk].tasks.filter(function(t){return t}).length,total=d[dk].tasks.length;if(done===total)return 4;if(done>=total*0.66)return 3;if(done>=total*0.33)return 2;return done>0?1:0},
  getDoneCount(){var c=0;if(currentTrack==='math'){MATH_TRACK.allDays().forEach(function(day){if(this.isDayDone(day.globalDay))c++}.bind(this))}else{MAIN_PLAN.allDays().forEach(function(gd){if(this.isDayDone(gd))c++}.bind(this))}return c},
  getStreak(){
    // 总连胜：合并主线+数学，按日期记录事实（严格：错过一整天就断）
    var st={};try{st=JSON.parse(localStorage.getItem(KEY_STREAK))||{}}catch(e){st={}}
    if(!st.lastDate)return 0;
    var today=fmtDay(_todayOnly()),yesterday=fmtDay(_daysAgo(1));
    if(st.lastDate===today||st.lastDate===yesterday)return st.streak||0;  // 今天已学，或今天还没过完
    return 0;                                                             // 错过一整天 → 断
  },
  recordCompletion(){
    // 某天从"未完成"变"完成"时调用；同一天内幂等
    var today=fmtDay(_todayOnly()),yesterday=fmtDay(_daysAgo(1));
    var st={};try{st=JSON.parse(localStorage.getItem(KEY_STREAK))||{}}catch(e){st={}}
    if(st.lastDate===today)return;                          // 今天已记过
    if(st.lastDate===yesterday)st.streak=(st.streak||0)+1;  // 连续
    else st.streak=1;                                       // 断过或首次，重新起算
    st.lastDate=today;
    localStorage.setItem(KEY_STREAK,JSON.stringify(st));
  }
};

function getPlan(){return currentTrack==='math'?MATH_TRACK:MAIN_PLAN}

// ===== 总连胜：日期工具 =====
var KEY_STREAK='plan_streak';
function fmtDay(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function _todayOnly(){var t=new Date();return new Date(t.getFullYear(),t.getMonth(),t.getDate())}
function _daysAgo(n){var d=_todayOnly();d.setDate(d.getDate()-n);return d}
