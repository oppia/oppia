const puppeteer = require("puppeteer");
const basicFunctions = require("../utility-functions/basicFunctions");

const MainDashboard = ".oppia-learner-dashboard-main-content";
const signInInput = "input.e2e-test-sign-in-email-input";
const CreatorDashboard = "http://localhost:8181/creator-dashboard";
const translationTab = "li#tutorialTranslationTab";
const startRecording = "button.e2e-test-accessibility-translation-start-record";
const stopRecording = "button.e2e-test-stop-record-button";

puppeteer
  .launch({
    headless: false,
    args: ["--start-fullscreen", "--use-fake-ui-for-media-stream"], // giving microphone and other browser permissions
  })
  .then(async (browser) => {
    const page = await browser.newPage();
    await page.setViewport({ width: 0, height: 0 }); // for maximizing page height-width
    
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

    // recording a 3sec audio
    await basicFunctions.clicks(page, startRecording);  // icon
    await page.waitForSelector(stopRecording);
    await page.waitForTimeout(3000);
    await page.keyboard.press('R');
    await basicFunctions.clickByText(page, "button", " Confirm ");

    console.log("Successfully tested recording of audio!");
    await browser.close();
  });
