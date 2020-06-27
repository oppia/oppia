/**
 * @param {puppeteer.Browser} browser
 * @param {{url: string, options: LHCI.CollectCommand.Options}} context
 */
module.exports = async(browser, context) => {
  const page = await browser.newPage();
  await page.setDefaultNavigationTimeout(0);
  await page.goTo(context.url);
  try {
    // Sign into Oppia
    await page.click('#admin');
    await Promise.all([
      page.waitForNavigation(),
      page.click('#submit-login')
    ]);

    await page.type('#username', 'username1');
    await page.click('#terms-checkbox');
    await page.waitFor(5000);

    await Promise.all([
      page.waitForNavigation(),
      await page.click('#signup-submit')
    ]);

    await page.close();
  } catch (e) {
    // Logged in
  }
};
