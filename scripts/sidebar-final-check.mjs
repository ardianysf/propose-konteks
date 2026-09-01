import { chromium } from '@playwright/test'
import { spawn } from 'node:child_process'
const preview = spawn('npx', ['vite', 'preview', '--port', '4176', '--strictPort'], { stdio: 'ignore', detached: true })
async function wait(url, tries=40){for(let i=0;i<tries;i++){try{const r=await fetch(url);if(r.ok)return}catch{}await new Promise(r=>setTimeout(r,500))}throw new Error('no server')}
try {
  await wait('http://localhost:4176/')
  const b=await chromium.launch(); const p=await b.newPage({viewport:{width:1440,height:900}})
  await p.goto('http://localhost:4176/'); await p.waitForLoadState('networkidle'); await p.waitForTimeout(250)

  const menu = await p.locator('.kx-v2-menuitem').evaluateAll(els => els.map(el => {
    const r=el.getBoundingClientRect(); const icon=el.querySelector('.kx-v2-menuitem__icon')?.getBoundingClientRect(); const label=el.querySelector('.kx-v2-menuitem__label')?.getBoundingClientRect(); const s=getComputedStyle(el)
    return {h:r.height, x:r.x, padL:s.paddingLeft, color:s.color, iconX:icon?.x, iconW:icon?.width, labelX:label?.x}
  }))
  console.log('MENU count=3:', menu.length===3, '| identical geometry:', menu.every(x=>JSON.stringify(x)===JSON.stringify(menu[0])), menu)

  const card=await p.locator('.kx-v2-context').boundingBox(); const avatar=await p.locator('.kx-v2-context__mark').boundingBox()
  const system=await p.locator('.kx-v2-context__system').innerText(); const workspace=await p.locator('.kx-v2-context__plan').innerText()
  console.log('WORKSPACE card:', card?.width, 'x', card?.height, '| avatar:', avatar?.width, 'x', avatar?.height, '| lines:', JSON.stringify(system), '/', JSON.stringify(workspace))

  const sessionIcons=await p.locator('.kx-v2-sessions-row svg').count(); const toggles=await p.locator('.kx-v2-sessions-toggle').count()
  console.log('SESSIONS one trailing chevron:', sessionIcons===1 && toggles===1)
  const childBefore=await p.getByText('EDP Integration Fix - Mobile').count()
  await p.click('[data-testid="v2-sessions-toggle"]'); await p.waitForTimeout(220)
  const childAfter=await p.getByText('EDP Integration Fix - Mobile').count()
  console.log('CHEVRON toggles only:', childBefore===1 && childAfter===0, '| still new-session page:', await p.locator('.kx-new-session').count()===1)
  await p.click('[data-testid="v2-sessions-trigger"]'); await p.waitForTimeout(250)
  console.log('SESSION label navigates:', await p.getByRole('heading',{name:'Session history'}).isVisible())

  await p.click('[data-testid="v2-new-session-trigger"]'); await p.click('[data-testid="v2-customize-trigger"]'); await p.waitForTimeout(300)
  console.log('CUSTOMIZE modal:', await p.locator('[data-testid="customize-modal"]').count()===1)
  await p.keyboard.press('Escape');
  console.log('CATALOG href:', await p.locator('[data-testid="v2-catalog-trigger"]').getAttribute('href'))

  await b.close()
} finally { try { process.kill(-preview.pid) } catch {} }
