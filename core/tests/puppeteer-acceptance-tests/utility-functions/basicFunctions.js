module.exports = {
  clicks: async (page, selector, time = 0) => {
    await page.waitForSelector(selector);
    await page.waitForTimeout(time);
    await page.click(selector);
  },
  
  types: async (page, selector, mess) => {
    await page.waitForSelector(selector);
    await page.type(selector, mess);
  }
};