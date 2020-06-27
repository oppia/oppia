/**
 * @param {puppeteer.Browser} browser
 * @param {{url: string, options: LHCI.CollectCommand.Options}} context
 */
module.exports = async (browser, context) => {
    const page = await browser.newPage();
    await page.setDefaultNavigationTimeout(0);
    await page.goto(context.url);
    try {
    await page.click('#admin');
    await Promise.all([
      page.waitForNavigation(), // The promise resolves after navigation has finished
      page.click('#submit-login')
    ]);
  
    await page.type('#username', 'username1');
    await page.click('#terms-checkbox');
    await page.waitFor(5000);
    await page.evaluate(() => document.querySelector('#signup-submit').scrollIntoView());
  
    await Promise.all([
      page.waitForNavigation(), // The promise resolves after navigation has finished
      await page.click('#signup-submit')
    ]);
  
    // await page.screenshot({path: 'example1.png'});
    await page.screenshot({path: 'example.png'});
  
    await page.close();
    }
    catch(e) {
  
    }
  };