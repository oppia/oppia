const puppeteer = require("puppeteer");
const basicFunctions = require("./utility-functions/basicFunctions");

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

    // blog-dashboard drafts
    await page.goto("http://localhost:8181/blog-dashboard", {waitUntil: "networkidle0"});
    await basicFunctions.clicks(page, "div#mat-tab-label-0-1");
    await page.waitForTimeout(1000);
    
    // deleting a draft if present
    try{
      await basicFunctions.clicks(page, "button.e2e-test-blog-post-edit-box");
      await basicFunctions.clicks(page, "button.e2e-test-unpublish-blog-post-button", 100);
      await basicFunctions.clicks(page, "button.e2e-test-confirm-button");
    } catch {
      console.log("no published blog post");
    }
    
    console.log("Successfully unpublished a published blogs!");
    await browser.close();
  });
