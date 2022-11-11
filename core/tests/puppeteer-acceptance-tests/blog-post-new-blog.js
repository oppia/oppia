const puppeteer = require("puppeteer");
const basicFunctions = require("./utility-functions/basicFunctions");

const MainDashboard = ".oppia-learner-dashboard-main-content";
const BlogDashboard = "http://localhost:8181/blog-dashboard";
const signInInput = "input.e2e-test-sign-in-email-input";
const blogTitleInput = "input.e2e-test-blog-post-title-field";
const blogBodyInput = "div.e2e-test-rte";
const thumbnailPhotoBox = "div.e2e-test-photo-clickable";

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
    
    // creating new blog
    await basicFunctions.clickByText(page, "span", "NEW POST");
    await basicFunctions.types(page, blogTitleInput, "random title");
    await basicFunctions.types(page, blogBodyInput, "my blog body content");

    // uploading thumbnail image
    await basicFunctions.clicks(page,thumbnailPhotoBox);  // no text to click on
    const inputUploadHandle = await page.$('input[type=file]');
    let fileToUpload = 'collection.svg';
    inputUploadHandle.uploadFile(fileToUpload);
    await basicFunctions.clickByText(page, "button", " Add Thumbnail Image ");
    await page.waitForTimeout(500);

    // adding tags
    await basicFunctions.clickByText(page, "span", " International ");
    await basicFunctions.clickByText(page, "span", " DONE ");
    
    // publishing blog
    await basicFunctions.clickByText(page, "span", "PUBLISH");
    await basicFunctions.clickByText(page, "button", " Confirm ");

    console.log("Successfully published a blog!");
    await browser.close();
  });
