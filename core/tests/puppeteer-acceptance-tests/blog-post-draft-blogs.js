const puppeteer = require("puppeteer");
const basicFunctions = require("./utility-functions/basicFunctions");
const Sizzle = require("sizzle");

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

    await page.goto("http://localhost:8181/");
    await basicFunctions.goes(page, "http://localhost:8181/");
    // const [button] = await page.$x("//button[contains(., 'OK')]");
    // await button.click();

    await basicFunctions.clicks(page, "button.e2e-mobile-test-login");
    // const [button] = await page.$x("//button[contains(., 'SIGN IN')]");
    // if (button) {
    //   await button.click();
    //   await console.log(button);
    // }
    // await page.$x("//button[contains(., 'SIGN IN')]").then(async(b) => {
    //   await console.log(b, "b");
    // }).catch((err) => {console.log(err, "errr")});
    await basicFunctions.types(page, "input.e2e-test-sign-in-email-input", "testadmin@example.com");
    await page.evaluate(() => {
      document.querySelector('.e2e-test-sign-in-button').click();
    });
    
    await page.waitForSelector(".oppia-learner-dashboard-main-content");
    await page.goto("http://localhost:8181/blog-dashboard");
    
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
