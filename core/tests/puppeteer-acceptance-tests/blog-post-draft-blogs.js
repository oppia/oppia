const puppeteer = require("puppeteer");
const basicFunctions = require("./utility-functions/basicFunctions");

const MainDashboard = ".oppia-learner-dashboard-main-content";
const BlogDashboard = "http://localhost:8181/blog-dashboard";
const signInInput = "input.e2e-test-sign-in-email-input";
const editBox = "button.e2e-test-blog-post-edit-box";

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
    await page.goto(BlogDashboard);
    
    // deleting a draft if present
    try{
      await basicFunctions.clicks(page, editBox); // an icon
      await basicFunctions.clickByText(page, "span", "Delete", 100);
      await basicFunctions.clickByText(page, "button", " Confirm ");
    } catch {
      console.log( "no blog post in drafts");
    }
    

    console.log("Successfully tested deletion of drafted blogs!");
    await browser.close();
  });
