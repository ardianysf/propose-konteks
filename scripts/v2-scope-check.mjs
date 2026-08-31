import { chromium } from '@playwright/test'
import { spawn } from 'node:child_process'
const preview=spawn('npx',['vite','preview','--port','4182','--strictPort'],{stdio:'ignore',detached:true})
async function wait(u,n=40){for(let i=0;i<n;i++){try{if((await fetch(u)).ok)return}catch{}await new Promise(r=>setTimeout(r,500))}throw new Error('x')}
try{
 await wait('http://localhost:4182/v2');const b=await chromium.launch();const p=await b.newPage({viewport:{width:1440,height:900}})
 await p.goto('http://localhost:4182/v2');await p.waitForLoadState('networkidle')
 await p.click('[data-testid="v2-context-trigger"]');await p.waitForTimeout(300)
 const gap=await p.evaluate(()=>{const a=document.querySelector('.kx-v2-pop__search').getBoundingClientRect();const c=document.querySelector('.kx-v2-pop__all').getBoundingClientRect();return Math.round(c.top-a.bottom)})
 console.log('GAP search → In-label:',gap,'px | label:',JSON.stringify(await p.locator('.kx-v2-pop__all').innerText()))
 const map=await p.locator('.kx-v2-pop__map').first().evaluate(el=>getComputedStyle(el).opacity)
 console.log('MAP opacity:',map)
 // All-systems row leads the list; selecting it flips card; only ONE current mark
 const first=await p.locator('.kx-v2-pop__list > li').first().innerText()
 const currentBefore=await p.locator('.kx-v2-pop__system[aria-current="true"]').count()
 await p.click('[data-testid="v2-popover-all-systems"]');await p.waitForTimeout(200)
 const card=await p.locator('[data-testid="v2-context-trigger"]').innerText()
 const currentAfter=await p.locator('.kx-v2-pop__system[aria-current="true"]').count()
 console.log('ALL ROW first:',JSON.stringify(first.replace(/\n/g,' ')),'| current marks before:',currentBefore,'→ after:',currentAfter,'| card:',JSON.stringify(card.replace(/\n/g,' | ')))
 // still scoped to workspace only
 const names=await p.locator('.kx-v2-pop__system-name').allInnerTexts()
 console.log('LIST stays workspace-scoped:',!names.includes('Hanoman'),'| rows:',JSON.stringify(names))
 // re-narrow via a system row
 await p.click('.kx-v2-pop__list li:nth-child(2) .kx-v2-pop__system');await p.waitForTimeout(400)
 const reopened=await p.locator('[data-testid="v2-context-popover"]').count()
 console.log('SYSTEM row click closes panel (existing behavior):',reopened===0)
 await b.close()
}finally{try{process.kill(-preview.pid)}catch{}}
