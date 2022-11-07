const puppeteer = require("puppeteer");
const basicFunctions = require("../utility-functions/basicFunctions");

//adding headless flag to false and maximizing browser height-width
puppeteer
  .launch({
    headless: false,
    args: ["--start-fullscreen", "--use-fake-ui-for-media-stream"], // giving microphone and other browser permissions
  })
  .then(async (browser) => {
    const page = await browser.newPage();
    await page.setViewport({ width: 0, height: 0 }); // for maximizing page height-width
    await page.goto("http://localhost:8181/", {waitUntil: "networkidle0"});
    await basicFunctions.clicks(page, "button.e2e-test-oppia-cookie-banner-accept-button");
    await basicFunctions.clicks(page, "button.e2e-mobile-test-login");
    await basicFunctions.types(page, "input.e2e-test-sign-in-email-input", "testadmin@example.com");
    await page.evaluate(() => {
      document.querySelector('.e2e-test-sign-in-button').click();
    });
    await page.waitForSelector(".oppia-learner-dashboard-main-content");

    // creating a new exploration
    await page.goto("http://localhost:8181/creator-dashboard", {waitUntil: "networkidle0"});
    await basicFunctions.clicks(page, "button.e2e-test-create-new-exploration-button");
    await basicFunctions.clicks(page, "li#tutorialTranslationTab");

    // recording a 3sec audio
    await basicFunctions.clicks(page, "button.e2e-test-accessibility-translation-start-record");
    await page.waitForSelector("button.e2e-test-stop-record-button");
    await page.waitForTimeout(3000);
    await page.keyboard.press('R');
    await basicFunctions.clicks(page, "button.e2e-test-confirm-record");

    console.log("Successfully tested recording of audio!");
    await browser.close();
  });
