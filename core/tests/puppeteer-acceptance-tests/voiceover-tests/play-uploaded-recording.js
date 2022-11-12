const puppeteer = require("puppeteer");
const basicFunctions = require("../utility-functions/basicFunctions");

const MainDashboard = ".oppia-learner-dashboard-main-content";
const signInInput = "input.e2e-test-sign-in-email-input";
const CreatorDashboard = "http://localhost:8181/creator-dashboard";
const translationTab = "li#tutorialTranslationTab";
const uploadAudio = 'button.e2e-test-accessibility-translation-upload-audio';
const audioPlay = 'button.e2e-test-play-pause-audio-button';
const audioPause = "i.fa-pause";

// currently, headless is set to false and the page viewport
// is maximized so that it would be easy for the developers
// to debug easily while testing.
// We can remove these settings before merging as we have
// to run the tests in headless mode.
puppeteer
  .launch({
    headless: false,
    args: ["--start-fullscreen", "--use-fake-ui-for-media-stream"], // giving microphone and other browser permissions
  })
  .then(async (browser) => {
    const page = await browser.newPage();
    await page.setViewport({ width: 0, height: 0 });
    
    await page.goto("http://localhost:8181/");
    await basicFunctions.clickByText(page, "button", "OK");
    await basicFunctions.clickByText(page, "span", "Sign in");
    await basicFunctions.types(page, signInInput, "testadmin@example.com");
    await basicFunctions.clickByText(page, "span", "Sign In");
    
    await page.waitForSelector(MainDashboard);

    // creating a new exploration
    await page.goto(CreatorDashboard);
    await basicFunctions.clickByText(page, "button", " + Create Exploration ");
    await basicFunctions.clicks(page, translationTab); // icon

    // uploading the audio
    await basicFunctions.clicks(page, uploadAudio);  // icon
    const inputUploadHandle = await page.$('input[type=file]');
    let fileToUpload = 'A4.mp3';
    inputUploadHandle.uploadFile(fileToUpload);
    await basicFunctions.clickByText(page, "button", " Save ");
    await basicFunctions.clicks(page, audioPlay, 500);
    await basicFunctions.clicks(page, audioPause, 1000);

    console.log("Successfully played uploaded audio!");
    await browser.close();
  });
