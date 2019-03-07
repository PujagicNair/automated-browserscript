import { app, BrowserWindow, ipcMain } from 'electron';
import { Page, Browser } from 'puppeteer';
const puppeteer = require('./pupp2');

(async () => {
  // declare vars
  let lastView: string;

  // wait for app to be ready
  await new Promise(resolve => app.on('ready', resolve));

  // create frame window
  let win = new BrowserWindow({ width: 1300, height: 1000 });

  // decrlare loader function
  let winLoaded = () => new Promise(resolve => win.webContents.on('did-finish-load', resolve));

  // load setup content
  win.loadURL('http://localhost:3334');
  await winLoaded();

  // wait for client to submit a form
  function askWs() {
    return new Promise<string>(resolve => {
      return ipcMain.on('setup', (_event, data: any) => {
        return resolve(data.url);
      });
    });
  }

  // connect to remote browser
  let browser: Browser;
  function connectBrowser() {
    return new Promise(async resolve => {
      let ws = await askWs();
      try {
        let browser = await puppeteer.connect({ browserWSEndpoint: ws });
        return resolve(browser);
      } catch (error) {
        console.log('failed to connect');
        
        let newConn = await connectBrowser();
        return resolve(newConn);
      }
    });
  }
  browser = await connectBrowser();

  // load frame content
  win.loadURL('http://localhost:3334/frame.html');
  await winLoaded();

  // setup remote browser data
  let page: MyPage;

  // send initial data to client
  async function initClient() {
    let mappedPages = await getMappedPages();
    win.webContents.send('tabs', mappedPages);
    if (lastView) {
      win.webContents.send('data', lastView);
    }
  }

  function getMappedPages() {
    return new Promise(async resolve => {
      let pages = await browser.pages();
      let mappedPages = [];
      for (let index in pages) {
        let pmap = {
          index,
          title: await pages[index].title(),
          url: await pages[index].evaluate(() => window.location.href)
        }
        mappedPages.push(pmap);
      }
      return resolve(mappedPages);
    });
  }

  // load a tab
  async function loadPage(tab: MyPage) {
    page = tab;

    // init client
    let [ width, height ] = win.getSize();
    await page.setViewport({ width, height });
    win.webContents.send('viewport', { width, height });

    // redirect screen
    page.on('screencastframe', async (frame: any) => {
      await page.screencastFrameAck(frame.sessionId);
      lastView = `data:image/jpeg;base64,${frame.data}`;
      win.webContents.send('data', lastView);
    });

    // start screen recording
    await page.startScreencast({
      format: 'jpeg',
      everyNthFrame: 1
    });

    let pages = await browser.pages();
    win.webContents.send('changepage', pages.indexOf(page));
  }

  // load initial page
  await loadPage((await browser.pages())[0]);

  // reinit client on reload
  win.webContents.on('dom-ready', initClient);

  // init client
  await initClient();

  // handle window interaction
  let resizeTime: NodeJS.Timeout;
  win.on('resize', () => {
    if (resizeTime) {
      clearTimeout(resizeTime);
    }
    resizeTime = setTimeout(() => {
      let [ width, height ] = win.getSize();
      win.webContents.send('viewport', { width, height });
      page.setViewport({ width, height });
    }, 200);
  });

  // redirect client events
  ipcMain.on('scroll', (_event, yPos: number) => page.evaluate(yPos => window.scrollTo(window.scrollX, window.scrollY + yPos), yPos));
  ipcMain.on('mousemove', (_event, { x, y }) => page.mouse.move(x, y));
  ipcMain.on('mousedown', () => page.mouse.down());
  ipcMain.on('mouseup', () => page.mouse.up());
  ipcMain.on('click', (_event, { x, y }) => page.mouse.click(x, y));
  ipcMain.on('keypress', (_event, key: string) => page.keyboard.sendCharacter(key));

  // handle client actions
  ipcMain.on('reload', () => page.reload());
  ipcMain.on('back', () => page.goBack());
  ipcMain.on('forward', () => page.goForward());
  ipcMain.on('newtab', async () => {
    let tab = await browser.newPage();
    loadPage(tab);
    initClient();
  });
  ipcMain.on('closetab', async (_event, index) => {
    let pages = await browser.pages();
    let i = Number(index);
    let newi;
    if (i === 0) {
      newi = 1;
    } else {
      newi = i - 1;
    }
    (pages[index] as MyPage).stopScreencast();
    loadPage(pages[newi]);
    pages[index].close();
  });
  ipcMain.on('switchtab', async (_event, index: number) => {
    await page.stopScreencast();
    let pages = await browser.pages();
    loadPage(pages[index]);
  });
  ipcMain.on('navigate', (_event, url: string) => {
    page.goto(url);
  });

  // keep clients updated
  setInterval(async () => {
    let mappedPages = await getMappedPages();
    console.log(mappedPages);
    // ws://91.210.224.201:9221/devtools/browser/2a7f3170-c94f-4054-8943-8dbcadfe6ed6



    
    win.webContents.send('pages', mappedPages);
  }, 1000);
  
  // handle events
  win.on('closed', async () => {
    browser.disconnect();
    win = null;
    process.exit(0);
  });
})();

interface MyPage extends Page {
  on(action: string, callback: any): any;
  [key: string]: any;
}