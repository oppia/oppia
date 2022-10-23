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

    // accepting the cookie permission
    let selector = "button.e2e-test-oppia-cookie-banner-accept-button";
    await page.waitForSelector(selector);
    await page.click(selector);

    await page.waitForSelector("button.e2e-mobile-test-login");
    await page.click("button.e2e-mobile-test-login");
    selector = "input.e2e-test-sign-in-email-input";
    await page.waitForSelector(selector);
    await page.type(selector, "testadmin@example.com");
    selector = "button.e2e-test-sign-in-button";
    // does puppeteer waits until the typing is completed?
    await page.evaluate(() => {
      document.querySelector('.e2e-test-sign-in-button').click();
    });
    selector = ".oppia-learner-dashboard-main-content";
    await page.waitForSelector(selector);

    // blog-dashboard drafts
    await page.goto("http://localhost:8181/blog-dashboard", {waitUntil: "networkidle0"});
    
    // creating new blog
    selector = "button.e2e-test-create-blog-post-button";
    await page.waitForSelector(selector);
    await page.click(selector);
    selector = "input.e2e-test-blog-post-title-field";
    await page.waitForSelector(selector);
    await page.type(selector, "random title");
    selector = "div.e2e-test-rte";
    await page.waitForSelector(selector);
    await page.type(selector, "my blog body content");

    // uploading thumbnail image
    selector = "div.e2e-test-photo-clickable";
    await page.waitForSelector(selector);
    await page.click(selector);
    const inputUploadHandle = await page.$('input[type=file]');
    let fileToUpload = 'collection.svg';
    inputUploadHandle.uploadFile(fileToUpload);
    selector = "button.e2e-test-photo-upload-submit";
    await page.waitForSelector(selector);
    await page.click(selector);
    await page.waitForTimeout(500);

    // adding tags
    selector = "button#mat-button-toggle-13-button";
    await page.waitForSelector(selector);
    await page.click(selector);
    selector = "button.e2e-test-save-blog-post-content";
    await page.waitForSelector(selector);
    await page.click(selector);

    // publishing blog
    selector = "button.e2e-test-publish-blog-post-button"
    await page.waitForSelector(selector);
    await page.click(selector);
    selector = "button.e2e-test-confirm-button";
    await page.waitForSelector(selector);
    await page.click(selector);

    console.log("Successfully published a blog!");
    await browser.close();
  });
