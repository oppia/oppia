const puppeteer = require("puppeteer");
//browser new page
// await page.setViewport({ width: 0, height: 0 }); // for maximizing page height-width

module.exports.login = async () => {
  
  const browser = await puppeteer.;
  const page = await browser.isConnected();
    // logging into dev server!
    await page.goto("http://localhost:8181/", {waitUntil: "networkidle0"});
    await page.waitForSelector("button.e2e-mobile-test-login");
    await page.click("button.e2e-mobile-test-login");
    await page.waitForSelector("input.e2e-test-sign-in-email-input");
    await page.type(selector, "testadmin@example.com");
    await page.evaluate(() => {
      document.querySelector('.e2e-test-sign-in-button').click();
    });
    await page.waitForSelector(".oppia-learner-dashboard-main-content");
  };
