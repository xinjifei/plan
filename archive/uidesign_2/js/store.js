// ===== 状态管理 & localStorage 持久化 =====
var currentTrack='main',currentDay=1;
var KEY_MAIN='lg_main_v1',KEY_MATH='lg_math_v1';

var Store={
  key(){return currentTrack==='math'?KEY_MATH:KEY_MAIN},
  load(){try{return JSON.parse(localStorage.getItem(this.key()))||{}}catch(e){return{}}},
  save(d){localStorage.setItem(this.key(),JSON.stringify(d))},
  toggleTask(day,idx){let d=this.load(),dk='d'+day;if(!d[dk])d[dk]={tasks:[false,false,false]};d[dk].tasks[idx]=!d[dk].tasks[idx];this.save(d)},
  isTaskDone(day,idx){let d=this.load(),dk='d'+day;return!!(d[dk]&&d[dk].tasks&&d[dk].tasks[idx])},
  isDayDone(day){let d=this.load(),dk='d'+day;return!!(d[dk]&&d[dk].tasks&&d[dk].tasks.every(t=>t))},
  getLevel(day){let d=this.load(),dk='d'+day;if(!d[dk]||!d[dk].tasks)return 0;let done=d[dk].tasks.filter(t=>t).length;if(done===3)return 4;if(done===2)return 3;if(done===1)return 2;return 1},
  getDoneCount(){let c=0;if(currentTrack==='math'){MATH_TRACK.allDays().forEach(day=>{if(this.isDayDone(day.d))c++})}else{for(let i=1;i<=MAIN_PLAN.totalDays;i++){if(this.isDayDone(i))c++}}return c},
  getStreak(){
    let doneCount=this.getDoneCount(),prefix=currentTrack==='math'?'lg_ms1_v1':'lg_ms2_v1';
    function fmt(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
    let today=new Date(),ss=localStorage.getItem('ss_'+prefix),baseline=parseInt(localStorage.getItem('bl_'+prefix))||0;
    if(!ss){if(doneCount>0){let defS=4,sd=new Date(today.getFullYear(),today.getMonth(),today.getDate()-defS+1);ss=fmt(sd);baseline=Math.max(0,doneCount-defS)}else{ss=fmt(today);baseline=0}localStorage.setItem('ss_'+prefix,ss);localStorage.setItem('bl_'+prefix,String(baseline))}
    let tOnly=new Date(today.getFullYear(),today.getMonth(),today.getDate()),p=ss.split('-'),sOnly=new Date(parseInt(p[0]),parseInt(p[1])-1,parseInt(p[2])),daysSince=Math.floor((tOnly-sOnly)/86400000)+1,newlyDone=doneCount-baseline;
    if(newlyDone>=daysSince-1)return Math.min(newlyDone,daysSince);return 0;
  }
};

function getPlan(){return currentTrack==='math'?MATH_TRACK:MAIN_PLAN}
