/* 临时复现脚本：定位发布页点击分类后跳转的来源（跑完即删） */
import { chromium } from 'playwright-core'

const EXE = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const browser = await chromium.launch({ executablePath: EXE, headless: true })
const page = await browser.newPage({ viewport: { width: 1366, height: 900 } })

page.on('console', (m) => {
  if (m.text().startsWith('[REPRO]')) console.log(m.text())
})
page.on('pageerror', (e) => console.log('PAGEERROR', e.message))

await page.addInitScript(() => {
  const orig = history.pushState
  history.pushState = function (...args) {
    console.log('[REPRO] PUSHSTATE', args[2])
    console.log('[REPRO] STACK', String(new Error().stack).split('\n').slice(2, 7).join(' | '))
    return orig.apply(this, args)
  }
  const orig2 = history.replaceState
  history.replaceState = function (...args) {
    console.log('[REPRO] REPLACESTATE', args[2])
    console.log('[REPRO] STACK', String(new Error().stack).split('\n').slice(2, 7).join(' | '))
    return orig2.apply(this, args)
  }
})

// 1. UI 登录
await page.goto('http://localhost:5173/login')
await page.waitForTimeout(1000)
const inputs = page.locator('input')
console.log('INPUTS', await inputs.count())
await inputs.nth(0).fill('student2026')
await inputs.nth(1).fill('Passw0rd!')
await page.getByRole('button', { name: /登\s*录/ }).first().click()
await page.waitForTimeout(1500)
console.log('AFTER_LOGIN', page.url())

// 2. 打开发布页
await page.goto('http://localhost:5173/publish')
await page.waitForTimeout(1000)
console.log('AFTER_GOTO', page.url())

// 3. 点击分类 el-select
const sel = page.locator('.el-select__wrapper').first()
await sel.scrollIntoViewIfNeeded()
await sel.click()
await page.waitForTimeout(800)
console.log('AFTER_SELECT_CLICK', page.url())
console.log('DROPDOWN_ITEMS', await page.locator('.el-select-dropdown__item').count())

// 4. 若有选项点第一项
if ((await page.locator('.el-select-dropdown__item').count()) > 0) {
  await page.locator('.el-select-dropdown__item').first().click()
  await page.waitForTimeout(800)
  console.log('AFTER_OPTION_CLICK', page.url())
}

// 5. 点击日期选择器
console.log('NOW_TEST_DATE')
await page.locator('.el-date-editor').first().click()
await page.waitForTimeout(800)
console.log('AFTER_DATE_CLICK', page.url())

await browser.close()
console.log('DONE')
