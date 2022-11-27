const acceptanceTests = require("./utility-functions/puppeteer_utils.js");
const testConstants = require("./utility-functions/testConstants.js");


const blogTitleInput = "input.e2e-test-blog-post-title-field";
const blogBodyInput = "div.e2e-test-rte";
const thumbnailPhotoBox = "e2e-test-photo-clickable";



async function publishBlogAsBlogAdmin() {
  const user = await new acceptanceTests();
  const page = await user.init();

  await user.goto(testConstants.URLs.home);
  await user.clickOn("button", "OK");
  await user.clickOn("span", "Sign in");
  await user.type(testConstants.SignInDetails.inputField, "testadmin@example.com");
  await user.clickOn("span", "Sign In");
  
  await user.goto(testConstants.URLs.BlogDashboard, testConstants.Dashboard.MainDashboard);

  // creating new blog
  try{
    await user.clickOn("span", "NEW POST");
  } catch {
    // condition when there is no blog in draft/published section.
    await user.clickOn("span", " CREATE NEW BLOG POST ");
  }
  await user.type(blogTitleInput, "random title");
  await user.type(blogBodyInput, "my blog body content");

  // uploading thumbnail image
  await user.clickOn("div", thumbnailPhotoBox);
  const inputUploadHandle = await page.$('input[type=file]');
  let fileToUpload = 'collection.svg';
  inputUploadHandle.uploadFile(fileToUpload);
  await user.clickOn("button", " Add Thumbnail Image ");
  await page.waitForTimeout(500);

  // adding tags
  await user.clickOn("span", " International ");
  await user.clickOn("span", " DONE ");
  
  // publishing blog
  await user.clickOn("span", "PUBLISH");
  await user.clickOn("button", " Confirm ");
  
  console.log("Successfully published a blog!");
  await user.browser.close();
}

publishBlogAsBlogAdmin();
