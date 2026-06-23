// ===== 状态管理 & localStorage 持久化 =====
// 使用与旧版 app.js 完全一致的 key，自动继承已有学习记录
var currentTrack='main',currentDay=1;
var KEY_MAIN='plan_tracker_main',KEY_MATH='plan_tracker_math';

var Store={
  key(){return currentTrack==='math'?KEY_MATH:KEY_MAIN},
  load(){try{return JSON.parse(localStorage.getItem(this.key()))||{}}catch(e){return{}}},
  save(d){localStorage.setItem(this.key(),JSON.stringify(d))},
  toggleTask(day,idx){var d=this.load(),dk='d'+day;if(!d[dk]){var plan=getPlan(),dd=plan.getDay(day);var n=dd&&dd.tasks?dd.tasks.length:3;d[dk]={tasks:new Array(n).fill(false)}}d[dk].tasks[idx]=!d[dk].tasks[idx];this.save(d)},
  markReviewed(day){var d=this.load(),dk='d'+day;if(!d[dk])d[dk]={tasks:[],reviewed:false};d[dk].reviewed=!d[dk].reviewed;this.save(d);return d[dk].reviewed},
  isTaskDone(day,idx){var d=this.load(),dk='d'+day;return!!(d[dk]&&d[dk].tasks&&d[dk].tasks[idx])},
  isDayDone(day){var d=this.load(),dk='d'+day;if(!d[dk])return false;var tasks=d[dk].tasks;if(!tasks||tasks.length===0)return!!d[dk].reviewed;var plan=getPlan(),dd=plan.getDay(day);var expectedN=dd&&dd.tasks?dd.tasks.length:tasks.length;for(var i=0;i<expectedN;i++){if(!tasks[i])return false}return true},
  getLevel(day){var d=this.load(),dk='d'+day;if(!d[dk]||!d[dk].tasks)return 0;var done=d[dk].tasks.filter(function(t){return t}).length,total=d[dk].tasks.length;if(done===total)return 4;if(done>=total*0.66)return 3;if(done>=total*0.33)return 2;return done>0?1:0},
  getDoneCount(){var c=0;if(currentTrack==='math'){MATH_TRACK.allDays().forEach(function(day){if(this.isDayDone(day.globalDay))c++}.bind(this))}else{for(var i=1;i<=MAIN_PLAN.totalDays;i++){if(this.isDayDone(i))c++}}return c},
  getStreak(){
    var doneCount=this.getDoneCount(),prefix=currentTrack==='math'?'math':'main';
    function fmt(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
    var today=new Date(),ss=localStorage.getItem('streakStart_'+prefix),baseline=parseInt(localStorage.getItem('streakBaseline_'+prefix))||0;
    if(!ss){if(doneCount>0){var defS=4,sd=new Date(today.getFullYear(),today.getMonth(),today.getDate()-defS+1);ss=fmt(sd);baseline=Math.max(0,doneCount-defS)}else{ss=fmt(today);baseline=0}localStorage.setItem('streakStart_'+prefix,ss);localStorage.setItem('streakBaseline_'+prefix,String(baseline))}
    var tOnly=new Date(today.getFullYear(),today.getMonth(),today.getDate()),p=ss.split('-'),sOnly=new Date(parseInt(p[0]),parseInt(p[1])-1,parseInt(p[2])),daysSince=Math.floor((tOnly-sOnly)/86400000)+1,newlyDone=doneCount-baseline;
    if(newlyDone>=daysSince-1)return Math.min(newlyDone,daysSince);return 0;
  }
};

function getPlan(){return currentTrack==='math'?MATH_TRACK:MAIN_PLAN}
