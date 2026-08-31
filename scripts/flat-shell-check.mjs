import { chromium } from '@playwright/test'
import { spawn } from 'node:child_process'
const preview=spawn('npx',['vite','preview','--port','4177','--strictPort'],{stdio:'ignore',detached:true})
async function wait(url,n=40){for(let i=0;i<n;i++){try{if((await fetch(url)).ok)return}catch{}await new Promise(r=>setTimeout(r,500))}throw new Error('no server')}
try{
 await wait('http://localhost:4177/v2');const b=await chromium.launch();const p=await b.newPage({viewport:{width:1440,height:900}});await p.goto('http://localhost:4177/v2');await p.waitForLoadState('networkidle')
 const out=await p.evaluate(()=>{
  const qs=s=>document.querySelector(s), css=(s,p)=>getComputedStyle(qs(s))[p]
  return {
   appBg:css('.kx-v2-root','backgroundColor'), sidebarBg:css('.kx-v2-sidebar','backgroundColor'),
   mainRadius:css('.kx-main','borderRadius'),
   shadows:{workspace:css('.kx-v2-context','boxShadow'),composer:css('.kx-composer','boxShadow'),popover:null,search:null}
  }
 })
 await p.click('[data-testid="v2-account-trigger"]');out.shadows.popover=await p.locator('.kx-v2-pop__panel').evaluate(el=>getComputedStyle(el).boxShadow);await p.keyboard.press('Escape')
 await p.click('[data-testid="v2-search-trigger"]');out.shadows.search=await p.locator('.kx-v2-search__panel').evaluate(el=>getComputedStyle(el).boxShadow)
 console.log(out)
 console.log('BACKING matches sidebar:',out.appBg===out.sidebarBg,'| main radius 32px:',out.mainRadius.startsWith('32px'),'| all shadows none:',Object.values(out.shadows).every(x=>x==='none'))
 await b.close()
}finally{try{process.kill(-preview.pid)}catch{}}
