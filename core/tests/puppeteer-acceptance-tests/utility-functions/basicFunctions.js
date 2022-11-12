// TODO: make a global class with page objects that can be used with many utility functions with passing that object class.

module.exports = {
  clicks: async (page, selector, time = 0) => {
    await page.waitForSelector(selector);
    await page.waitForTimeout(time);
    await page.click(selector);
  },
  
  types: async (page, selector, mess) => {
    await page.waitForSelector(selector);
    await page.type(selector, mess);
  },

  goes: async(page, url) => {
    await page.goto(url, {waitUntil: "networkidle0"})
  },

  clickByText: async(page, tag, text, time = 0) => {
    await page.waitForXPath('//' + tag);
    await page.waitForTimeout(time);
    const [button] = await page.$x('//' + tag + '[contains(text(), "' + text + '")]');
    await button.click();
  },

  // typeByText: async(page, placeholder, text) => {
  //   await page.waitForXPath('//input');
  //   await page.type('input[placeholder="' + placeholder +'], "' + text +'"');  //type by selector not available?
  // }
};