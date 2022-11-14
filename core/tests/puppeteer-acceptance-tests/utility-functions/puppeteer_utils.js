const puppeteer = require("puppeteer");
module.exports = class acceptanceTests {
  page;
  browser;
  
  async init(){
    // currently, headless is set to false and the page viewport
    // is maximized so that it would be easy for the developers
    // to debug easily while testing.
    // We can remove these settings before merging as we have
    // to run the tests in headless mode.
    await puppeteer
      .launch({
        headless: false,
        args: ["--start-fullscreen", "--use-fake-ui-for-media-stream"]
      })
      .then(async (browser) => {
        this.browser = await browser;
        this.page = await browser.newPage();
        await (this.page).setViewport({ width: 0, height: 0 });
      });

      return await this.page;
  }

  async clickOn(selector, time = 0) {
    await (this.page).waitForSelector(selector);
    await (this.page).waitForTimeout(time);
    await (this.page).click(selector);
  }
  
  async clickText(tag, text, time = 0) {
    await (this.page).waitForXPath('//' + tag);
    await (this.page).waitForTimeout(time);
    const [button] = await (this.page).$x('//' + tag + '[contains(text(), "' + text + '")]');
    await button.click();
  }

  async type(selector, text) {
    await (this.page).waitForSelector(selector);
    await (this.page).type(selector, text);
  }

  async goto(url) {
    await (this.page).goto(url, {waitUntil: "networkidle0"});
  }
};


// module.exports = {
//   clicks: async (page, selector, time = 0) => {
//     await page.waitForSelector(selector);
//     await page.waitForTimeout(time);
//     await page.click(selector);
//   },
  
//   types: async (page, selector, text) => {
//     await page.waitForSelector(selector);
//     await page.type(selector, text);
//   },

//   goes: async(page, url) => {
//     await page.goto(url, {waitUntil: "networkidle0"});
//   },

//   clickByText: async(page, tag, text, time = 0) => {
//     await page.waitForXPath('//' + tag);
//     await page.waitForTimeout(time);
//     const [button] = await page.$x('//' + tag + '[contains(text(), "' + text + '")]');
//     await button.click();
//   }
// };