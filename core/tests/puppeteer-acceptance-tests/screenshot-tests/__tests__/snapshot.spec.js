const puppeteer = require('puppeteer');
const {toMatchImageSnapshot} = require('jest-image-snapshot');

expect.extend({toMatchImageSnapshot});
describe('Screenshot Visual Regression', () => {
  let browser;
  let page;

  beforeAll(async function () {
    browser = await puppeteer.launch({headless: true});
    page = await browser.newPage();
  });

  afterAll(async function () {
    await browser.close();
  });

  it('Home Page Screenshot', async function () {
    await page.goto('http://93days.me', {
      waitUntil: 'networkidle0',
    });

    const screenshot = await page.screenshot();
    expect(screenshot).toMatchImageSnapshot({
      failureThresholdType: 'pixel',
      failureThreshold: 250,
    });
  });
});

//visual.test.js

// const { toMatchImageSnapshot } = require('jest-image-snapshot');
// expect.extend({ toMatchImageSnapshot });
// describe('Visual Testing', () => {
//     jest.setTimeout(50000);
//     beforeAll(async () => {
//            await page.goto('https://www.browserstack.com')
//     })

//     it('Visual Regression Test', async () => {
//         const image = await page.screenshot();

//         expect(image).toMatchImageSnapshot({
//             failureThreshold: '0.10',
//             failureThresholdType: 'percent'
//         });
//     })
// })
