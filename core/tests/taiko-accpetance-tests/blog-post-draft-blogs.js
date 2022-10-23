const {
  openBrowser,
  goto,
  click,
  textBox,
  into,
  write,
  below,
  button,
  setConfig,
  closeBrowser,
} = require("taiko");
(async () => {
  try {
    await openBrowser();
    await goto("localhost:8181");
    await click("SIGN IN");
    await write("testadmin@example.com", into(textBox("enter an email")));
    await click(button("Sign In", below("Emulator Mode Sign In")));

    await goto("http://localhost:8181/blog-dashboard");
    
    try {
      await click(button({ class: "e2e-test-blog-post-edit-box" }));
      await click("Delete");
      await click("Confirm");
    } catch {
      console.log("no blog post in drafts");
    }
    // await click("Confirm");
  } catch (error) {
    console.error(error);
  } finally {
    await closeBrowser();
  }
})();
