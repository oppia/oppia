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
    await page.goto("http://localhost:8181/blog-dashboard", {waitUntil: "networkidle0"});
    
    // creating new blog
    await basicFunctions.clicks(page, "button.e2e-test-create-blog-post-button");
    await basicFunctions.types(page, "input.e2e-test-blog-post-title-field", "random title");
    await basicFunctions.types(page, "div.e2e-test-rte", "my blog body content");

    // uploading thumbnail image
    await basicFunctions.clicks(page, "div.e2e-test-photo-clickable");
    const inputUploadHandle = await page.$('input[type=file]');
    let fileToUpload = 'collection.svg';
    inputUploadHandle.uploadFile(fileToUpload);
    await basicFunctions.clicks(page, "button.e2e-test-photo-upload-submit");
    await page.waitForTimeout(500);

    // adding tags
    await basicFunctions.clicks(page, "button#mat-button-toggle-14-button");
    await basicFunctions.clicks(page, "button.e2e-test-save-blog-post-content");

    // publishing blog
    await basicFunctions.clicks(page, "button.e2e-test-publish-blog-post-button");
    await basicFunctions.clicks(page, "button.e2e-test-confirm-button");

    console.log("Successfully published a blog!");
    await browser.close();
  });
