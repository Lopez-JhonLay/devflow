import { chromium } from 'playwright';
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import path from 'node:path';

const clientRoot = fileURLToPath(new URL('../', import.meta.url));
const outputRoot = path.join(clientRoot, 'src/assets/device-mockups');
const sourceRoot = await mkdtemp(path.join(tmpdir(), 'devflow-device-captures-'));
const only = process.argv.find((arg) => arg.startsWith('--only='));
const manifest = [];
const pairedPages = new Set(['landing', 'dashboard', 'projects', 'project-overview', 'project-documentation', 'snippets', 'files', 'settings']);
let browser;

const css = `
* { box-sizing: border-box; }
html, body { margin: 0; }
body { font-family: Arial, sans-serif; }
.stage { position: relative; width: 1800px; height: 1260px; overflow: hidden; background: #eeefef; }
.stage.mobile { width: 1100px; }
.stage.dark { background: #26282b; }
.device { position: absolute; transform-origin: top left; }
.laptop { width: 1600px; height: 1026px; }
.laptop .lid { position: relative; width: 1486px; margin-inline: auto; padding: 26px 22px 22px; border: 1px solid #777b80; border-radius: 28px 28px 12px 12px; background: #202124; box-shadow: inset 0 0 0 3px #34363a, 0 30px 55px -30px #0008; }
.camera { position: absolute; top: 10px; left: calc(50% - 3px); width: 6px; height: 6px; border: 1px solid #454a51; border-radius: 50%; background: #090b0f; }
.laptop .screen { width: 1440px; overflow: hidden; border-radius: 8px; background: #fff; }
.browser { display: flex; align-items: center; gap: 7px; height: 36px; padding: 0 14px; border-bottom: 1px solid #dedede; background: #f3f3f3; }
.browser > i { width: 8px; height: 8px; border-radius: 50%; background: #c5c5c5; }
.address { display: flex; align-items: center; justify-content: center; gap: 8px; width: 500px; height: 23px; margin: auto; padding-right: 45px; border: 1px solid #e3e3e3; border-radius: 6px; background: #fff; color: #777; font-size: 12px; }
.address svg { width: 10px; height: 10px; }
.laptop .capture { width: 1440px; height: 900px; overflow: hidden; }
.capture img { display: block; width: 100%; height: auto; }
.laptop .base { position: relative; width: 1600px; height: 39px; margin-top: -1px; border-top: 2px solid #b6b9bd; background: #8e9298; clip-path: polygon(0 0, 100% 0, 99% 66%, 96% 100%, 4% 100%, 1% 66%); box-shadow: inset 0 -8px 0 #656a71; }
.laptop .base::before { content: ''; position: absolute; top: -1px; left: 650px; width: 300px; height: 13px; border-radius: 0 0 14px 14px; background: #646970; border-bottom: 1px solid #c1c3c6; }
.laptop .ground { position: absolute; bottom: -8px; left: 70px; width: 1460px; height: 20px; border-radius: 50%; background: #0003; filter: blur(14px); }
.phone { width: 414px; padding: 10px; border: 2px solid #898d92; border-radius: 55px; background: #191a1d; box-shadow: inset 0 0 0 3px #303237, 14px 24px 40px -20px #0008; }
.phone::before { content: ''; position: absolute; left: -5px; top: 140px; width: 3px; height: 55px; border-radius: 3px 0 0 3px; background: #72767c; box-shadow: 0 72px #72767c; }
.phone::after { content: ''; position: absolute; right: -5px; top: 190px; width: 3px; height: 85px; border-radius: 0 3px 3px 0; background: #72767c; }
.phone .screen { width: 390px; border-radius: 43px; overflow: hidden; background: #fff; }
.statusbar { position: relative; display: flex; align-items: center; justify-content: space-between; height: 39px; padding-inline: 28px; color: #171717; font-size: 13px; font-weight: 600; }
.island { position: absolute; top: 8px; left: 150px; width: 90px; height: 23px; border-radius: 15px; background: #101113; }
.island::after { content: ''; position: absolute; top: 8px; right: 10px; width: 6px; height: 6px; border-radius: 50%; background: #202632; }
.phone .capture { width: 390px; height: 844px; overflow: hidden; }
.phone .home { display: flex; justify-content: center; align-items: center; height: 20px; }
.phone .home::after { content: ''; display: block; width: 120px; height: 4px; border-radius: 4px; background: #222; }
.signal { display: flex; align-items: center; gap: 5px; }
.signal svg { width: 16px; height: 12px; }
.screen.dark, .screen.dark .home { background: #090909; }
.screen.dark .statusbar { color: #eee; }
.screen.dark .home::after { background: #eee; }
.screen.dark .browser { border-color: #333; background: #242424; }
.screen.dark .browser > i { background: #5c5c5c; }
.screen.dark .address { border-color: #3b3b3b; background: #171717; color: #aaa; }
.desktop .laptop { top: 170px; left: 196px; transform: scale(.88); }
.mobile .phone { top: 118px; left: 322px; transform: scale(1.1); }
.paired .laptop { top: 270px; left: 62px; transform: scale(.79); }
.paired .phone { top: 300px; left: 1280px; transform: scale(.84); }
`;

const lock = '<svg viewBox="0 0 12 12" fill="none" stroke="currentColor"><rect x="2" y="5" width="8" height="6" rx="1"/><path d="M4 5V3a2 2 0 0 1 4 0v2"/></svg>';
const icons = '<span class="signal"><svg viewBox="0 0 18 12" fill="currentColor"><rect x="0" y="8" width="3" height="4" rx="1"/><rect x="5" y="5" width="3" height="7" rx="1"/><rect x="10" y="2" width="3" height="10" rx="1"/><rect x="15" width="3" height="12" rx="1"/></svg><svg viewBox="0 0 20 12" fill="none" stroke="currentColor" stroke-width="1.2"><rect x="1" y="1" width="16" height="10" rx="2"/><rect x="3" y="3" width="12" height="6" rx=".5" fill="currentColor" stroke="none"/><path d="M19 4v4"/></svg></span>';
const pngUrl = async (file) => `data:image/png;base64,${(await readFile(path.join(sourceRoot, file))).toString('base64')}`;
const laptop = (src, theme) => `<div class="device laptop"><div class="ground"></div><div class="lid"><span class="camera"></span><div class="screen ${theme}"><div class="browser"><i></i><i></i><i></i><span class="address">${lock}devflow · workspace preview</span></div><div class="capture"><img src="${src}" alt="DevFlow desktop screenshot" /></div></div></div><div class="base"></div></div>`;
const phone = (src, theme) => `<div class="device phone"><div class="screen ${theme}"><div class="statusbar"><span>9:41</span><span class="island"></span>${icons}</div><div class="capture"><img src="${src}" alt="DevFlow mobile screenshot" /></div><div class="home"></div></div></div>`;

try {
  console.log('Capturing laptop and phone viewports with mock data...');
  await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [path.join(clientRoot, 'scripts/capture-screenshots.mjs'), ...(only ? [only] : [])], {
      cwd: clientRoot, windowsHide: true, stdio: 'inherit',
      env: { ...process.env, DEVFLOW_SCREENSHOT_OUTPUT_DIR: sourceRoot, DEVFLOW_SCREENSHOT_DESKTOP_HEIGHT: '900' },
    });
    child.on('error', reject);
    child.on('exit', (code) => code === 0 ? resolve() : reject(new Error(`Capture exited with code ${code}`)));
  });
  const sources = JSON.parse(await readFile(path.join(sourceRoot, 'manifest.json'), 'utf8')).screenshots;
  browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ deviceScaleFactor: 1, reducedMotion: 'reduce' });
  const render = async (relative, type, theme, devices, sourceFiles) => {
    const viewport = { width: type === 'mobile' ? 1100 : 1800, height: 1260 };
    await page.setViewportSize(viewport);
    await page.setContent(`<!doctype html><html><head><meta charset="utf-8"/><style>${css}</style></head><body><div class="stage ${type} ${theme}">${devices}</div></body></html>`);
    await page.evaluate(async () => { await Promise.all([...document.images].map((image) => image.decode())); });
    await mkdir(path.dirname(path.join(outputRoot, relative)), { recursive: true });
    await page.screenshot({ path: path.join(outputRoot, relative), animations: 'disabled' });
    manifest.push({ file: relative, device: type === 'desktop' ? 'laptop' : type === 'mobile' ? 'phone' : 'laptop-and-phone', theme, dimensions: viewport, sources: sourceFiles, mockData: true });
    console.log(`Rendered ${relative}`);
  };
  for (const source of sources) {
    const [device, theme, filename] = source.file.split('/');
    const src = await pngUrl(source.file);
    await render(source.file, device, theme, device === 'desktop' ? laptop(src, theme) : phone(src, theme), [source.file]);
    const name = filename.replace(/\.png$/, '');
    if (device === 'desktop' && pairedPages.has(name)) {
      const mobileFile = `mobile/${theme}/${filename}`;
      if (sources.some((item) => item.file === mobileFile)) {
        await render(`paired/${theme}/${filename}`, 'paired', theme, laptop(src, theme) + phone(await pngUrl(mobileFile), theme), [source.file, mobileFile]);
      }
    }
  }
  await writeFile(path.join(outputRoot, 'manifest.json'), JSON.stringify({ description: 'DevFlow screenshots in original CSS-rendered device frames', mockData: true, desktopViewport: { width: 1440, height: 900 }, mobileViewport: { width: 390, height: 844 }, mockups: manifest }, null, 2) + '\n');
  console.log(`Completed ${manifest.length} device mockups.`);
} finally {
  await browser?.close();
  // Delete only the specific temporary directory created by this process.
  const resolvedSource = path.resolve(sourceRoot);
  const resolvedTemp = path.resolve(tmpdir()) + path.sep;
  if (resolvedSource.startsWith(resolvedTemp) && path.basename(resolvedSource).startsWith('devflow-device-captures-')) {
    await rm(resolvedSource, { recursive: true, force: true });
  }
}
