import { chromium } from '@playwright/test'
import { spawn } from 'node:child_process'
const preview=spawn('npx',['vite','preview','--port','4181','--strictPort'],{stdio:'ignore',detached:true})
async function wait(u,n=40){for(let i=0;i<n;i++){try{if((await fetch(u)).ok)return}catch{}await new Promise(r=>setTimeout(r,500))}throw new Error('x')}
try{
 await wait('http://localhost:4181/v2');const b=await chromium.launch();const p=await b.newPage({viewport:{width:1440,height:900}})
 await p.goto('http://localhost:4181/v2');await p.waitForLoadState('networkidle')
 await p.click('[data-testid="v2-context-trigger"]');await p.waitForTimeout(300)
 // gap between search field bottom and scope chips top
 const gap=await p.evaluate(()=>{const a=document.querySelector('.kx-v2-pop__search').getBoundingClientRect();const c=document.querySelector('.kx-v2-pop__scope').getBoundingClientRect();return Math.round(c.top-a.bottom)})
 console.log('GAP search → scope chips:',gap,'px')
 // map icon visible without hover
 const map=await p.locator('.kx-v2-pop__map').first().evaluate(el=>getComputedStyle(el).opacity)
 console.log('MAP icon opacity (no hover):',map)
 // all-systems chip
 const before=await p.locator('.kx-v2-pop__system-name').count()
 await p.click('[data-testid="v2-popover-scope-all"]');await p.waitForTimeout(200)
 const after=await p.locator('.kx-v2-pop__system-name').allInnerTexts()
 const pressed=await p.locator('[data-testid="v2-popover-scope-all"]').getAttribute('aria-pressed')
 console.log('SCOPE: workspace rows:',before,'→ all rows:',after.length,'| aria-pressed:',pressed,'| includes Hanoman:',after.includes('Hanoman'))
 // search within all scope
 await p.locator('.kx-v2-pop__search').fill('hano');await p.waitForTimeout(150)
 console.log('SEARCH across all:',JSON.stringify(await p.locator('.kx-v2-pop__system-name').allInnerTexts()))
 // workspace switch resets scope
 await p.locator('.kx-v2-pop__search').fill('');await p.waitForTimeout(100)
 await p.click('[data-testid="v2-popover-workspace"]');await p.click('[data-testid="v2-popover-workspace-ws-ardian-labs"]');await p.waitForTimeout(250)
 const chip=await p.locator('[data-testid="v2-popover-scope-workspace"]').innerText()
 const names=await p.locator('.kx-v2-pop__system-name').allInnerTexts()
 console.log('RESET after switch: chip:',JSON.stringify(chip),'| rows:',names.length,'| card:',JSON.stringify((await p.locator('[data-testid="v2-context-trigger"]').innerText()).replace(/\n/g,' | ')))
 await b.close()
}finally{try{process.kill(-preview.pid)}catch{}}
