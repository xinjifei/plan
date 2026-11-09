import {Browser} from '/Users/lyuchanghe/.codex/skills/design-taste-frontend/scripts/lib/cdp.mjs';
const browser=await Browser.launch();
try {
 const p=await browser.newPage();
 await p.goto('http://127.0.0.1:4173/#home/math');
 if(!await p.eval(()=>document.querySelector('.linked-next').textContent.includes('本日关联主计划')))throw Error('数学首页关联轨道错误');
 for(const [label,width,height]of [['desktop',1440,900],['tablet',768,1024],['mobile',390,844]]){
  await p.setViewport({width,height,mobile:width===390});
  await p.screenshot({path:`.impeccable/review/math-home-${label}.png`,format:'png',fullPage:true});
  await p.eval(()=>document.querySelector('#demo-dialog').showModal());
  await p.screenshot({path:`.impeccable/review/dialog-${label}.png`,format:'png',fullPage:false});
  await p.eval(()=>document.querySelector('#demo-dialog').close());
 }
 console.log('Math home relationship labels and all three captures passed.');
}finally{await browser.close();}
