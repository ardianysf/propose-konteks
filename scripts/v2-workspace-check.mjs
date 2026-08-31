import { chromium } from '@playwright/test'
import { spawn } from 'node:child_process'
const preview=spawn('npx',['vite','preview','--port','4178','--strictPort'],{stdio:'ignore',detached:true})
async function wait(url,n=40){for(let i=0;i<n;i++){try{if((await fetch(url)).ok)return}catch{}await new Promise(r=>setTimeout(r,500))}throw new Error('no server')}
try{
 await wait('http://localhost:4178/v2');const b=await chromium.launch();const p=await b.newPage({viewport:{width:1440,height:900}})
 await p.goto('http://localhost:4178/v2');await p.waitForLoadState('networkidle')
 await p.click('[data-testid="v2-context-trigger"]');await p.waitForTimeout(300)
 const rows=await p.locator('.kx-v2-pop__ws').count()
 const active=await p.locator('.kx-v2-pop__ws--active').innerText()
 const checks=await p.locator('.kx-v2-pop__ws-check').count()
 const listTag=await p.locator('[data-testid="v2-popover-workspace-list"]').evaluate(el=>el.tagName+' role='+(el.getAttribute('role')||'(none)'))
 const radioRoles=await p.locator('[role="radio"],[role="radiogroup"]').count()
 console.log('LIST:',rows,'rows |',listTag,'| radio roles:',radioRoles,'| active:',JSON.stringify(active.replace(/\n/g,' ').trim()),'| checks:',checks)
 await p.click('[data-testid="v2-popover-workspace-ws-mpm"]');await p.waitForTimeout(250)
 const stillOpen=await p.locator('[data-testid="v2-context-popover"]').count()===1
 const card=await p.locator('[data-testid="v2-context-trigger"]').innerText()
 const scoped=await p.locator('.kx-v2-pop__all').innerText()
 const mpmRows=await p.locator('.kx-v2-pop__system-name').allInnerTexts()
 console.log('SWITCH: panel stays open:',stillOpen,'| card:',JSON.stringify(card.replace(/\n/g,' | ')),'| systems scoped:',JSON.stringify(scoped),'| system rows:',JSON.stringify(mpmRows))
 const search=await p.locator('.kx-v2-pop__search');await search.fill('vendor');await p.waitForTimeout(150)
 const filtered=await p.locator('.kx-v2-pop__system-name').allInnerTexts()
 console.log('SEARCH within workspace:',JSON.stringify(filtered))
 await p.keyboard.press('Escape');await p.waitForTimeout(200)
 const wsCount=await p.locator('.kx-v2-pop__ws').count()
 console.log('ESCAPE closes | ws rows gone:',wsCount===0)
 await b.close()
}finally{try{process.kill(-preview.pid)}catch{}}
