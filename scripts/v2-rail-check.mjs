import { chromium } from '@playwright/test'
import { spawn } from 'node:child_process'
const preview=spawn('npx',['vite','preview','--port','4185','--strictPort'],{stdio:'ignore',detached:true})
async function wait(u,n=40){for(let i=0;i<n;i++){try{if((await fetch(u)).ok)return}catch{}await new Promise(r=>setTimeout(r,500))}throw new Error('x')}
try{
 await wait('http://localhost:4185/');const b=await chromium.launch();const p=await b.newPage({viewport:{width:1440,height:900}})
 await p.goto('http://localhost:4185/');await p.waitForLoadState('networkidle')
 // context card height (expanded)
 const ctx=await p.locator('.kx-v2-context').boundingBox()
 console.log('CONTEXT height:',Math.round(ctx.height),'px (target < 65)')
 const icon=await p.locator('[data-testid="v2-sidebar-toggle"] [data-icon="panel-collapse"]').count()
 console.log('PANEL-COLLAPSE icon on toggle:',icon===1)
 await p.click('[data-testid="v2-sidebar-toggle"]');await p.waitForTimeout(350)
 // rail: search directly below brand, above context
 const stack=await p.evaluate(()=>{const q=s=>document.querySelector(s)?.getBoundingClientRect();const brand=q('[data-testid="v2-sidebar-toggle"]'),search=q('[data-testid="v2-search-rail-trigger"]'),context=q('.kx-v2-context'),account=q('[data-testid="v2-account-trigger"]');return{brandToSearch:Math.round(search.top-brand.bottom),searchToContext:Math.round(context.top-search.bottom),searchBottomToAccount:Math.round(account.top-search.bottom)}})
 console.log('STACK: brand→search:',stack.brandToSearch,'px | search→context:',stack.searchToContext,'px | search→account:',stack.searchBottomToAccount,'px (should be LARGE)')
 // alignment: every rail icon centered on one axis
 const align=await p.evaluate(()=>{const q=s=>[...document.querySelectorAll(s)].map(el=>Math.round(el.getBoundingClientRect().x+el.getBoundingClientRect().width/2));const all=[...q('.kx-v2-brand__expand'),...q('[data-testid="v2-search-rail-trigger"]'),...q('.kx-v2-context__mark'),...q('.kx-v2-menuitem__icon'),...q('.kx-v2-sessions-rail'),...q('.kx-v2-account')];return{min:Math.min(...all),max:Math.max(...all),count:all.length}})
 console.log('ALIGN: axis spread',align.max-align.min,'px across',align.count,'icons (target ≤2)')
 // menu tiles are 40px squares
 const tile=await p.locator('.kx-v2-menuitem__icon').first().evaluate(el=>{const r=el.getBoundingClientRect();return `${Math.round(r.width)}x${Math.round(r.height)}`})
 console.log('MENU TILE:',tile)
 await p.click('[data-testid="v2-sessions-rail"]');await p.waitForTimeout(300)
 console.log('CLOCK navigates:',await p.getByRole('heading',{name:'Session history'}).isVisible())
 await p.click('[data-testid="v2-search-rail-trigger"]');await p.waitForTimeout(250)
 console.log('RAIL SEARCH opens palette:',await p.locator('[data-testid="v2-search-palette"]').count()===1)
 await p.keyboard.press('Escape')
 // band 1280: no search beside brand; rail search below brand
 await p.setViewportSize({width:1280,height:800});await p.waitForTimeout(450)
 const band=await p.evaluate(()=>({beside:document.querySelectorAll('.kx-v2-brand__search').length,below:document.querySelectorAll('[data-testid="v2-search-rail-trigger"]').length,brand:document.querySelector('.kx-v2-brand__expand')?.getBoundingClientRect().top}))
 const bandGap=await p.evaluate(()=>{const b=document.querySelector('.kx-v2-brand__expand').getBoundingClientRect();const s=document.querySelector('[data-testid="v2-search-rail-trigger"]').getBoundingClientRect();return Math.round(s.top-b.bottom)})
 console.log('BAND 1280: search beside brand:',band.beside,'| search below brand:',band.below===1,'(gap',bandGap,'px)')
 await b.close()
}finally{try{process.kill(-preview.pid)}catch{}}
