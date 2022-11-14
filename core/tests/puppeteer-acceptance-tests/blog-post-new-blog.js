const acceptanceTests = require("./utility-functions/puppeteer_utils.js");
const testConstants = require("./utility-functions/testConstants.js");


const blogTitleInput = "input.e2e-test-blog-post-title-field";
const blogBodyInput = "div.e2e-test-rte";
const thumbnailPhotoBox = "e2e-test-photo-clickable";



async function publishBlog_journey() {
  const obj = await new acceptanceTests();
  const page = await obj.init();

  await page.goto(testConstants.URLs.home);
  await obj.clickOn("button", "OK");
  await obj.clickOn("span", "Sign in");
  await obj.type(testConstants.SignInDetails.inputField, "testadmin@example.com");
  await obj.clickOn("span", "Sign In");
  
  await page.waitForSelector(testConstants.Dashboard.MainDashboard);
  await page.goto(testConstants.URLs.BlogDashboard);

  // creating new blog
  try{
    await obj.clickOn("span", "NEW POST");
  } catch {
    // condition when there is no blog in draft/published section.
    await obj.clickOn("span", " CREATE NEW BLOG POST ");
  }
  await obj.type(blogTitleInput, "random title");
  await obj.type(blogBodyInput, "my blog body content");

  // uploading thumbnail image
  await obj.clickOn("div", thumbnailPhotoBox);
  const inputUploadHandle = await page.$('input[type=file]');
  let fileToUpload = 'collection.svg';
  inputUploadHandle.uploadFile(fileToUpload);
  await obj.clickOn("button", " Add Thumbnail Image ");
  await page.waitForTimeout(500);

  // adding tags
  await obj.clickOn("span", " International ");
  await obj.clickOn("span", " DONE ");
  
  // publishing blog
  await obj.clickOn("span", "PUBLISH");
  await obj.clickOn("button", " Confirm ");
  
  console.log("Successfully published a blog!");
  await obj.browser.close();
}

publishBlog_journey();