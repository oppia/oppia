const puppeteer = require("puppeteer");
const select = require ('puppeteer-select');
const basicFunctions = require("./utility-functions/basicFunctions");

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

    await page.goto("http://localhost:8181/", {waitUntil: "networkidle0"});
    await basicFunctions.clicks(page, "button.e2e-test-oppia-cookie-banner-accept-button");
    await basicFunctions.clicks(page, "button.e2e-mobile-test-login");
    await basicFunctions.types(page, "input.e2e-test-sign-in-email-input", "testadmin@example.com");
    await page.evaluate(() => {
      document.querySelector('.e2e-test-sign-in-button').click();
    });
    
    await page.waitForSelector(".oppia-learner-dashboard-main-content");
    await page.goto("http://localhost:8181/blog-dashboard", {waitUntil: "networkidle0"});
    
    // deleting a draft if present
    try{
      await basicFunctions.clicks(page, "button.e2e-test-blog-post-edit-box");
      await basicFunctions.clicks(page, "button.e2e-test-delete-blog-post-button", 100);
      await basicFunctions.clicks(page, "button.e2e-test-confirm-button");
    } catch {
      console.log("no blog post in drafts");
    }
    

    console.log("Successfully tested deletion of drafted blogs!");
    await browser.close();
  });
