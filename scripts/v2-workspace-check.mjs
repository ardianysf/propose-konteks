import { chromium } from '@playwright/test'
import { spawn } from 'node:child_process'
const preview=spawn('npx',['vite','preview','--port','4179','--strictPort'],{stdio:'ignore',detached:true})
async function wait(url,n=40){for(let i=0;i<n;i++){try{if((await fetch(url)).ok)return}catch{}await new Promise(r=>setTimeout(r,500))}throw new Error('no server')}
try{
 await wait('http://localhost:4179/');const b=await chromium.launch();const p=await b.newPage({viewport:{width:1440,height:900}})
 await p.goto('http://localhost:4179/');await p.waitForLoadState('networkidle')
 await p.click('[data-testid="v2-context-trigger"]');await p.waitForTimeout(300)

 // Flyout hidden until the workspace row is tapped
 const hidden=await p.locator('[data-testid="v2-popover-workspace-list"]').count()===0
 const rowState=await p.locator('[data-testid="v2-popover-workspace"]').getAttribute('aria-expanded')
 await p.click('[data-testid="v2-popover-workspace"]');await p.waitForTimeout(250)
 const list=p.locator('[data-testid="v2-popover-workspace-list"]')
 const role=await list.getAttribute('role')
 const opts=await list.locator('[role="option"]').count()
 const selected=await list.locator('[aria-selected="true"]').count()
 const box=await list.boundingBox()
 const css=await list.evaluate(el=>{const s=getComputedStyle(el);return{s:s.maxHeight,oy:s.overflowY,pos:s.position}})
 console.log('FLYOUT: hidden until tap:',hidden,'| row expands:',rowState==='true','→',await p.locator('[data-testid="v2-popover-workspace"]').getAttribute('aria-expanded'),'| role:',role,'| options:',opts,'| selected:',selected)
 console.log('GEOMETRY: pos:',css.pos,'| max-height:',css.maxHeight,'| scroll:',css.oy,'| h:',Math.round(box.height),'px')

 // Select MPM — flyout closes, panel stays, everything re-scopes
 await p.click('[data-testid="v2-popover-workspace-ws-mpm"]');await p.waitForTimeout(250)
 const flyGone=await p.locator('[data-testid="v2-popover-workspace-list"]').count()===0
 const panelOpen=await p.locator('[data-testid="v2-context-popover"]').count()===1
 const card=await p.locator('[data-testid="v2-context-trigger"]').innerText()
 const scoped=await p.locator('.kx-v2-pop__all').innerText()
 console.log('SELECT: flyout closes:',flyGone,'| panel stays:',panelOpen,'| card:',JSON.stringify(card.replace(/\n/g,' | ')),'| scope:',JSON.stringify(scoped))

 // Search field: white bg + outline border
 const search=await p.locator('.kx-v2-pop__search').evaluate(el=>{const s=getComputedStyle(el);return{bg:s.backgroundColor,border:s.borderColor,bw:s.borderWidth}})
 await search // noop lint
 console.log('SEARCH FIELD: bg:',search.bg,'| border:',search.border,search.bw)

 // Escape nesting
 await p.click('[data-testid="v2-popover-workspace"]');await p.waitForTimeout(200)
 await p.keyboard.press('Escape');await p.waitForTimeout(150)
 const afterEsc1=await p.locator('[data-testid="v2-popover-workspace-list"]').count()===0 && await p.locator('[data-testid="v2-context-popover"]').count()===1
 await p.keyboard.press('Escape');await p.waitForTimeout(150)
 const afterEsc2=await p.locator('[data-testid="v2-context-popover"]').count()===0
 console.log('ESCAPE: first closes flyout only:',afterEsc1,'| second closes panel:',afterEsc2)
 await b.close()
}finally{try{process.kill(-preview.pid)}catch{}}
