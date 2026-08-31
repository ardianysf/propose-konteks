import { chromium } from '@playwright/test'
import { spawn } from 'node:child_process'
const preview=spawn('npx',['vite','preview','--port','4184','--strictPort'],{stdio:'ignore',detached:true})
async function wait(u,n=40){for(let i=0;i<n;i++){try{if((await fetch(u)).ok)return}catch{}await new Promise(r=>setTimeout(r,500))}throw new Error('x')}
try{
 await wait('http://localhost:4184/v2');const b=await chromium.launch();const p=await b.newPage({viewport:{width:1440,height:900}})
 await p.goto('http://localhost:4184/v2');await p.waitForLoadState('networkidle')
 await p.click('[data-testid="v2-sidebar-toggle"]');await p.waitForTimeout(350)
 // sessions = clock icon, navigates
 const clock=await p.locator('[data-testid="v2-sessions-rail"] [data-icon="clock"]').count()
 const chev=await p.locator('.kx-v2-sessions-row [data-icon="chevron-down"]').count()
 await p.click('[data-testid="v2-sessions-rail"]');await p.waitForTimeout(300)
 const hist=await p.getByRole('heading',{name:'Session history'}).isVisible()
 console.log('RAIL SESSIONS: clock icon:',clock===1,'| chevron gone:',chev===0,'| navigates:',hist)
 // search at bottom: above account avatar, below every menu icon
 const pos=await p.evaluate(()=>{const s=document.querySelector('[data-testid="v2-search-rail-trigger"]').getBoundingClientRect();const a=document.querySelector('[data-testid="v2-account-trigger"]').getBoundingClientRect();const menu=[...document.querySelectorAll('.kx-v2-menuitem__icon')].pop().getBoundingClientRect();return{searchBelowMenu:Math.round(s.top-menu.bottom),searchAboveAvatar:Math.round(a.top-s.bottom),searchX:Math.round(s.x),avatarX:Math.round(a.x)}})
 console.log('RAIL SEARCH: below last menu icon by',pos.searchBelowMenu,'px | above avatar by',pos.searchAboveAvatar,'px | aligned x:',Math.abs(pos.searchX-pos.avatarX)<6)
 await p.click('[data-testid="v2-search-rail-trigger"]');await p.waitForTimeout(250)
 console.log('RAIL SEARCH opens palette:',await p.locator('[data-testid="v2-search-palette"]').count()===1)
 await p.keyboard.press('Escape')
 // forced band 761-1280: same rail DOM
 await p.setViewportSize({width:1000,height:800});await p.waitForTimeout(400)
 const bandClock=await p.locator('[data-testid="v2-sessions-rail"]').count()
 const bandSearch=await p.locator('[data-testid="v2-search-rail-trigger"]').count()
 console.log('BAND 1000px: rail clock:',bandClock===1,'| bottom search:',bandSearch===1)
 await p.click('[data-testid="v2-sessions-rail"]');await p.waitForTimeout(250)
 console.log('BAND clock navigates:',await p.getByRole('heading',{name:'Session history'}).isVisible())
 await b.close()
}finally{try{process.kill(-preview.pid)}catch{}}
