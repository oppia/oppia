const puppeteer = require("puppeteer");
const basicFunctions = require("./utility-functions/basicFunctions");

const MainDashboard = ".oppia-learner-dashboard-main-content";
const BlogDashboard = "http://localhost:8181/blog-dashboard";
const signInInput = "input.e2e-test-sign-in-email-input";
const editBox = "button.e2e-test-blog-post-edit-box";

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
    await page.goto(BlogDashboard);

    // published section of the blog-dashboard
    await basicFunctions.clickByText(page, "div", " PUBLISHED ");
    await page.waitForTimeout(1000);
    
    // deleting a draft if present
    try{
      await basicFunctions.clicks(page, editBox);  // an icon
      await basicFunctions.clickByText(page, "span", "Unpublish", 100);
      await basicFunctions.clickByText(page, "button", " Confirm ");
    } catch {
      console.log("no published blog post");
    }
    
    console.log("Successfully unpublished a published blogs!");
    await browser.close();
  });
