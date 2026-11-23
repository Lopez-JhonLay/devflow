import { chromium } from 'playwright';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { createServer } from 'vite';
import { user, session, projects, snippets, projectFiles } from './screenshot-fixtures.mjs';

const clientRoot = fileURLToPath(new URL('../', import.meta.url));
const outputRoot = process.env.DEVFLOW_SCREENSHOT_OUTPUT_DIR || path.join(clientRoot, 'src/assets/screenshots');
const desktopHeight = Number(process.env.DEVFLOW_SCREENSHOT_DESKTOP_HEIGHT || 1080);
const server = await createServer({ root: clientRoot, server: { host: '127.0.0.1', port: 5178, strictPort: true } });
let browser;
const manifest = [];
const errors = [];
const success = (data) => ({ success: true, data });

const only = process.argv.find((arg) => arg.startsWith('--only='))?.slice(7).split(',');
const scenarios = [
  { name: 'landing', route: '/', ready: 'h1' },
  { name: 'sign-in', route: '/login', ready: 'h1' },
  { name: 'sign-up', route: '/register', ready: 'h1' },
  { name: 'forgot-password', route: '/forgot-password', ready: 'h1' },
  { name: 'dashboard', route: '/dashboard', ready: 'h1' },
  { name: 'projects', route: '/projects', ready: 'h1' },
  { name: 'projects-archived', route: '/projects', ready: 'h1', prepare: async (page) => page.getByRole('button', { name: /^Archived/ }).click() },
  { name: 'project-create', route: '/projects', ready: 'h1', prepare: async (page) => {
    await page.getByRole('button', { name: 'New project', exact: true }).click();
    await page.locator('#create-project-name').fill('Weekend journal');
    await page.locator('#create-project-description').fill('A place for small discoveries and weekend ideas.');
  } },
  { name: 'project-overview', route: '/projects/personal-website', ready: 'h1' },
  { name: 'project-edit', route: '/projects/personal-website', ready: 'h1', prepare: async (page) => page.getByRole('button', { name: 'Edit', exact: true }).click() },
  { name: 'project-documentation', route: '/projects/personal-website', ready: 'h1', prepare: async (page) => page.getByRole('button', { name: 'Open docs', exact: true }).click() },
  { name: 'project-documentation-preview', route: '/projects/personal-website', ready: 'h1', prepare: async (page) => { await page.getByRole('button', { name: 'Open docs', exact: true }).click(); await page.locator('.markdown-preview').scrollIntoViewIfNeeded(); } },
  { name: 'project-assets', route: '/projects/personal-website', ready: 'h1', prepare: async (page) => page.getByText('Project Assets', { exact: true }).scrollIntoViewIfNeeded() },
  { name: 'snippets', route: '/snippets', ready: 'h1' },
  { name: 'snippets-favorites', route: '/snippets', ready: 'h1', prepare: async (page) => page.getByRole('button', { name: 'Favorites', exact: true }).click() },
  { name: 'snippet-create', route: '/snippets', ready: 'h1', prepare: async (page) => {
    await page.getByRole('button', { name: 'New snippet', exact: true }).click();
    await page.locator('#snippet-title').fill('A centered page layout');
    await page.locator('#snippet-description').fill('A little breathing room for content on any screen.');
    await page.locator('#snippet-language').fill('css');
    await page.locator('#snippet-tags').fill('layout, responsive');
    await page.locator('#snippet-code').fill('.container {\n  width: min(100% - 2rem, 1120px);\n  margin-inline: auto;\n}');
    await page.locator('#snippet-title').scrollIntoViewIfNeeded();
  } },
  { name: 'snippet-edit', route: '/snippets', ready: 'h1', prepare: async (page) => page.getByRole('button', { name: 'Edit snippet', exact: true }).first().click() },
  { name: 'files', route: '/files', ready: 'h1' },
  { name: 'files-diagrams', route: '/files', ready: 'h1', prepare: async (page) => page.getByRole('button', { name: 'Diagrams', exact: true }).click() },
  { name: 'settings', route: '/settings', ready: '#currentPassword' },
  { name: 'settings-appearance', route: '/settings', ready: '#currentPassword', prepare: async (page) => page.getByText('Appearance', { exact: true }).scrollIntoViewIfNeeded() },
  { name: 'settings-password', route: '/settings', ready: '#currentPassword', prepare: async (page) => page.locator('#currentPassword').scrollIntoViewIfNeeded() },
];

try {
  await server.listen();
  browser = await chromium.launch({ channel: 'chrome', headless: true });
  for (const [device, viewport] of Object.entries({ desktop: { width: 1440, height: desktopHeight }, mobile: { width: 390, height: 844 } })) {
    for (const theme of ['light', 'dark']) {
      const context = await browser.newContext({ viewport, deviceScaleFactor: 1, locale: 'en-US', timezoneId: 'Asia/Manila', colorScheme: theme, reducedMotion: 'reduce' });
      await context.addInitScript((theme) => {
        localStorage.setItem('devflow-ui', JSON.stringify({ state: { theme }, version: 0 }));
      }, theme);
      // Intercept every request: fixture all API responses, allow only the local app.
      await context.route('**/*', async (route) => {
        const request = route.request();
        const url = new URL(request.url());
        const pathname = url.pathname;
        if (url.origin === 'http://127.0.0.1:5178' && !['fetch', 'xhr'].includes(request.resourceType())) return route.continue();
        const json = async (data) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(data) });
        if (pathname.startsWith('/api/auth/')) return json(pathname.endsWith('/get-session') ? session : {});
        if (pathname === '/workspace/activity') return json({ recentProjects: projects.filter((p) => p.status === 'ACTIVE'), recentSnippets: snippets, recentUploads: projectFiles });
        if (pathname === '/settings/account') return json(success({ hasPassword: true, providers: ['credential', 'google', 'github'] }));
        if (pathname === '/projects/files') return json(success(projectFiles));
        if (pathname === '/projects') return json(success(projects));
        if (pathname.startsWith('/projects/')) return json(success(projects.find((p) => p.id === pathname.split('/')[2]) ?? projects[0]));
        if (pathname === '/snippets') return json(success(snippets));
        if (url.origin === 'http://127.0.0.1:5178') return route.continue();
        return route.abort();
      });
      const page = await context.newPage();
      page.on('pageerror', (error) => errors.push(`${device}/${theme}: ${error.message}`));
      for (const scenario of scenarios.filter((scenario) => !only || only.includes(scenario.name))) {
        await page.goto(`http://127.0.0.1:5178${scenario.route}`, { waitUntil: 'networkidle' });
        await page.locator(scenario.ready).first().waitFor();
        await page.evaluate(() => document.fonts.ready);
        if (scenario.prepare) await scenario.prepare(page);
        await page.addStyleTag({ content: '*, *::before, *::after { animation: none !important; transition: none !important; caret-color: transparent !important; }' });
        await page.evaluate(async () => {
          await Promise.all([...document.images].map((image) => image.complete ? Promise.resolve() : new Promise((resolve) => { image.onload = resolve; image.onerror = resolve; })));
          if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
        });
        const relative = `${device}/${theme}/${scenario.name}.png`;
        await mkdir(path.dirname(path.join(outputRoot, relative)), { recursive: true });
        await page.screenshot({ path: path.join(outputRoot, relative), fullPage: true, animations: 'disabled' });
        manifest.push({ file: relative, route: scenario.route, viewport, theme, mockData: true });
        console.log(`Saved ${relative}`);
      }
      if (device === 'mobile' && (!only || only.includes('navigation-menu'))) {
        await page.goto('http://127.0.0.1:5178/dashboard', { waitUntil: 'networkidle' });
        await page.getByRole('button', { name: 'Toggle menu' }).click();
        await page.addStyleTag({ content: '*, *::before, *::after { animation: none !important; transition: none !important; }' });
        const relative = `${device}/${theme}/navigation-menu.png`;
        await page.screenshot({ path: path.join(outputRoot, relative), animations: 'disabled' });
        manifest.push({ file: relative, route: '/dashboard', viewport, theme, mockData: true });
        console.log(`Saved ${relative}`);
      }
      await context.close();
    }
  }
  if (only) {
    const previous = JSON.parse(await readFile(path.join(outputRoot, 'manifest.json'), 'utf8').catch((error) => {
      if (error.code === 'ENOENT') return '{"screenshots":[]}';
      throw error;
    }));
    const replacedFiles = new Set(manifest.map((item) => item.file));
    manifest.unshift(...previous.screenshots.filter((item) => !replacedFiles.has(item.file)));
  }
  await writeFile(path.join(outputRoot, 'manifest.json'), JSON.stringify({ description: 'DevFlow screenshots with fictional local data', screenshots: manifest }, null, 2) + '\n');
  if (errors.length) throw new Error([...new Set(errors)].join('\n'));
  console.log(`Completed ${manifest.length} screenshots. No page errors.`);
} finally {
  await browser?.close();
  await server.close();
}
