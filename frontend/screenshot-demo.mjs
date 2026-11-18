/* 演示截图脚本：桌面 1366px / 移动 390px 关键页面截图（配合 Mock 数据） */
import { chromium } from 'playwright-core'
import { mkdirSync } from 'node:fs'

const EXE = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const OUT = '../docs/演示截图'
mkdirSync(OUT, { recursive: true })

const browser = await chromium.launch({ executablePath: EXE, headless: true })

async function shot(page, name) {
  await page.waitForTimeout(1300)
  const overflow = await page.evaluate(() => {
    const de = document.documentElement
    return { sw: de.scrollWidth, iw: window.innerWidth, ok: de.scrollWidth <= window.innerWidth + 1 }
  })
  await page.screenshot({ path: `${OUT}/${name}.png` })
  console.log(`${name}  横向溢出:${overflow.ok ? '无' : `有(sw=${overflow.sw}, iw=${overflow.iw})`}`)
}

async function login(page) {
  await page.locator('input').nth(0).fill('student2026')
  await page.locator('input').nth(1).fill('Passw0rd!')
  await page.getByRole('button', { name: /登\s*录/ }).first().click()
  await page.waitForTimeout(1800)
}

/* ---------- 桌面 1366 ---------- */
const dc = await browser.newContext({ viewport: { width: 1366, height: 900 } })
const d = await dc.newPage()
await d.goto('http://localhost:5173/')
await shot(d, '桌面-01-首页')
await d.goto('http://localhost:5173/login')
await shot(d, '桌面-02-登录')
await login(d)
await d.goto('http://localhost:5173/posts')
await shot(d, '桌面-03-信息广场')
await d.goto('http://localhost:5173/posts/30000000-0000-4000-8000-000000000013')
await shot(d, '桌面-04-详情页')
await d.goto('http://localhost:5173/publish')
await shot(d, '桌面-05-发布信息')
await d.goto('http://localhost:5173/me')
await shot(d, '桌面-06-个人中心')

/* ---------- 移动 390 ---------- */
const mc = await browser.newContext({ viewport: { width: 390, height: 844 } })
const m = await mc.newPage()
await m.goto('http://localhost:5173/')
await shot(m, '移动-01-首页')
await m.goto('http://localhost:5173/posts')
await shot(m, '移动-02-信息广场')
await m.goto('http://localhost:5173/login')
await login(m)
await m.goto('http://localhost:5173/posts/30000000-0000-4000-8000-000000000013')
await shot(m, '移动-03-详情页')
await m.goto('http://localhost:5173/me')
await shot(m, '移动-04-个人中心')

await browser.close()
console.log('ALL DONE')
