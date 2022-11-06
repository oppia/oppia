const puppeteer = require("puppeteer");
const basicFunctions = require("../utility-functions/basicFunctions");

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
    await basicFunctions.clicks(page, selector);
    await basicFunctions.clicks(page, "button.e2e-mobile-test-login");
    
    selector = "input.e2e-test-sign-in-email-input";
    await basicFunctions.types(page, selector, "testadmin@example.com");
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
    await basicFunctions.clicks(page, selector);

    // going into the Translations Tab
    selector = "li#tutorialTranslationTab";
    await basicFunctions.clicks(page, selector);

    // uploading the audio
    selector = 'button.e2e-test-accessibility-translation-upload-audio';
    await basicFunctions.clicks(page, selector);

    const inputUploadHandle = await page.$('input[type=file]');
    let fileToUpload = 'A4.mp3';
    inputUploadHandle.uploadFile(fileToUpload);

    selector = 'button.e2e-test-save-uploaded-audio-button';
    await basicFunctions.clicks(page, selector);

    selector = 'button.e2e-test-play-pause-audio-button';
    await basicFunctions.clicks(page, selector, 500);
    
    // checking that uploaded audio also plays!
    selector = 'i.fa-pause';
    await basicFunctions.clicks(page, selector, 1000);

    console.log("Successfully played uploaded audio!");
    await browser.close();
  });
