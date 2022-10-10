const puppeteer = require("puppeteer");

//adding headless flag to false and maximizing browser height-width
puppeteer
  .launch({
    headless: false,
    args: ["--start-fullscreen", "--use-fake-ui-for-media-stream"], // giving microphone and other browser permissions
  })
  .then(async (browser) => {
    //browser new page
    const page = await browser.newPage();
    await page.setViewport({ width: 0, height: 0 }); // for maximizing page height-width

    // logging into dev server!
    await page.goto("http://localhost:8181/", {waitUntil: "networkidle0"});
    await page.waitForSelector("button.e2e-mobile-test-login");
    await page.click("button.e2e-mobile-test-login");
    let selector = "input.e2e-test-sign-in-email-input";
    await page.waitForSelector(selector);
    await page.type(selector, "testadmin@example.com");
    selector = "button.e2e-test-sign-in-button";
    // does puppeteer waits until the typing is completed?
    await page.evaluate(() => {
      document.querySelector('.e2e-test-sign-in-button').click();
    });
    selector = ".oppia-learner-dashboard-main-content";
    await page.waitForSelector(selector);

    // creating a new exploration
    await page.goto("http://localhost:8181/creator-dashboard", {waitUntil: "networkidle0"});
    selector = "button.e2e-test-create-new-exploration-button";
    await page.waitForSelector(selector);
    await page.click(selector);

    // going into the Translations Tab
    selector = "li#tutorialTranslationTab";
    await page.waitForSelector(selector);
    await page.click(selector);

    // recording a 3sec audio
    selector = "button.e2e-test-accessibility-translation-start-record";
    await page.waitForSelector(selector);
    await page.click(selector);
    selector = "button.e2e-test-stop-record-button";
    await page.waitForSelector(selector);
    await page.waitForTimeout(3000);
    await page.keyboard.press('R');
    selector = "button.e2e-test-confirm-record";
    await page.waitForSelector(selector);
    await page.click(selector);

    console.log("Successfully tested recording of audio!");
    await browser.close();
  });
