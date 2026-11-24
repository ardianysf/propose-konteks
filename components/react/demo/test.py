import sys
from playwright.sync_api import sync_playwright
url='file:///home/claude/konteks-redesign/react/demo/out/index.html'
with sync_playwright() as p:
    b=p.chromium.launch()
    for dark in [False, True]:
        c=b.new_context(viewport={'width':1100,'height':900}); pg=c.new_page()
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: errs.append(m.type+': '+m.text) if m.type in ('error','warning') else None)
        pg.goto(url); pg.wait_for_timeout(300)
        if dark: pg.evaluate("document.documentElement.classList.add('dark')"); pg.wait_for_timeout(100)
        pg.screenshot(path=f'shot-{"dark" if dark else "light"}.png', full_page=True)
        if not dark:
            # combobox: open, filter, keyboard select
            pg.click('text=Choose a System'); pg.wait_for_timeout(200)
            pg.keyboard.type('hr'); pg.keyboard.press('Enter'); pg.wait_for_timeout(150)
            print('combo value', pg.locator('button[aria-haspopup=listbox]').first.inner_text(), 'focus', pg.evaluate("document.activeElement.getAttribute('aria-haspopup')"))
            pg.click('text=HRIS Azure'); pg.wait_for_timeout(200); pg.screenshot(path='shot-combo.png'); pg.keyboard.press('Escape'); pg.wait_for_timeout(100)
            print('combo closed', pg.locator('[role=listbox]').count())
            # menu
            pg.click('#acct'); pg.wait_for_timeout(150)
            print('menu focus', pg.evaluate("document.activeElement.textContent"))
            pg.keyboard.press('ArrowDown'); pg.keyboard.press('Enter'); pg.wait_for_timeout(100)
            print('log', pg.inner_text('#log'), 'focus back', pg.evaluate("document.activeElement.id"))
            # drawer stack + escape
            pg.click('#openDrawer'); pg.wait_for_timeout(300); pg.click('#openChanges'); pg.wait_for_timeout(300)
            pg.screenshot(path='shot-drawers.png')
            print('dialogs', pg.locator('[role=dialog]').count(), 'scrims', pg.evaluate("[...document.querySelectorAll('[aria-hidden].fixed.inset-0')].map(e=>getComputedStyle(e).backgroundColor)"))
            pg.keyboard.press('Escape'); pg.wait_for_timeout(250)
            print('after esc', pg.locator('[role=dialog]').count(), 'focus', pg.evaluate("document.activeElement.id"))
            # combobox inside drawer: escape closes only list
            pg.click('[role=dialog] button[aria-haspopup=listbox]'); pg.wait_for_timeout(150); pg.keyboard.press('Escape'); pg.wait_for_timeout(200)
            print('combo esc in drawer -> dialogs', pg.locator('[role=dialog]').count())
            # tab trap
            for _ in range(8): pg.keyboard.press('Tab')
            print('focus in drawer', pg.evaluate("!!document.activeElement.closest('[role=dialog]')"))
            pg.keyboard.press('Escape'); pg.wait_for_timeout(250); print('closed all', pg.locator('[role=dialog]').count(), 'focus', pg.evaluate("document.activeElement.id"))
            # modal
            pg.click('#openModal'); pg.wait_for_timeout(300); print('modal focus', pg.evaluate("document.activeElement.tagName"))
            pg.click('[role=dialog] button[aria-haspopup=listbox]'); pg.wait_for_timeout(200); pg.screenshot(path='shot-modal.png'); pg.keyboard.press('Escape'); pg.keyboard.press('Escape'); pg.wait_for_timeout(250)
            # dialog
            pg.click('#openDialog'); pg.wait_for_timeout(300); pg.screenshot(path='shot-dialog.png')
            print('dialog focus', pg.evaluate("document.activeElement.textContent")); pg.keyboard.press('Enter'); pg.wait_for_timeout(250)
            print('log', pg.inner_text('#log'))
            # composer
            ta=pg.locator('textarea[placeholder^="Draft"]'); ta.click(); pg.keyboard.type('Please check /est'); pg.wait_for_timeout(150)
            pg.screenshot(path='shot-slash.png'); pg.keyboard.press('Enter'); pg.keyboard.type('the plan'); pg.keyboard.press('Control+Enter'); pg.wait_for_timeout(100)
            print('log', pg.inner_text('#log'), 'ta', repr(ta.input_value()))
            box=pg.locator('textarea[placeholder^="Describe"]').locator('..').bounding_box()
            pg.mouse.click(box['x']+box['width']*0.5, box['y']+box['height']-8); pg.keyboard.type('hey')
            print('compact', repr(pg.locator('textarea[placeholder^="Describe"]').input_value()))
        print('errs', errs[:6])
        c.close()
    b.close()
