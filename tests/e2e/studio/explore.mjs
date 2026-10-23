// SR-52 eksplorasi: login dua peran, simpan tangkapan + snapshot aria tiap halaman (bantu menyusun selektor).
import { writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { launch, newContext } from "./lib/browser.mjs";
import { newRun, createUsers, cleanup, residue } from "./lib/fixtures.mjs";

const OUT = resolve(import.meta.dirname, "out/explore");
mkdirSync(OUT, { recursive: true });
const run = newRun();
const sink = [];
const pages = (process.env.SR52_PAGES || "/studio,/studio/documents,/studio/templates").split(",");
let browser;
try {
  console.log("users", await createUsers(run));
  browser = await launch();
  for (const role of ["user", "admin"]) {
    const ctx = await newContext(browser, role, sink);
    const page = await ctx.newPage();
    await page.goto("/studio");
    await page.waitForURL(/\/login/);
    console.log(role, "redirect", page.url());
    await page.locator('input:not([type=password])').first().fill(run[role].username);
    await page.locator('input[type=password]').fill(run[role].password);
    await page.locator('button[type=submit]').click();
    await page.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 20000 });
    console.log(role, "after login", page.url());
    for (const p of pages) {
      await page.goto(p);
      await page.waitForLoadState("networkidle").catch(() => {});
      await page.waitForTimeout(1500);
      const name = `${role}_${p.replace(/[^a-z0-9]+/gi, "_")}`;
      await page.screenshot({ path: resolve(OUT, name + ".png"), fullPage: true });
      writeFileSync(resolve(OUT, name + ".aria.txt"), await page.locator("main").first().ariaSnapshot().catch(async () => page.locator("body").ariaSnapshot()));
    }
    await ctx.close();
  }
} finally {
  await browser?.close();
  console.log("cleanup", await cleanup(run));
  console.log("residue", await residue(run));
  console.log("console", JSON.stringify(sink, null, 1).slice(0, 4000));
}
