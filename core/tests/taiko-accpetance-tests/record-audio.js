const {
  openBrowser,
  goto,
  click,
  textBox,
  into,
  write,
  button,
  below,
  listItem,
  setConfig,
  press,
  closeBrowser,
} = require("taiko");

// TAIKO_BROWSER_ARGS = "--use-fake-ui-for-media-stream"; // add fake media stream for avoiding browser microphone permission issue while recording audio!
(async () => {
  try {
    await openBrowser();
    await goto("localhost:8181");
    await click("SIGN IN");
    await write("testadmin@example.com", into(textBox("enter an email")));
    await click(button("Sign In", below("Emulator Mode Sign In")));
    await goto("http://localhost:8181/creator-dashboard");
    await click("+ CREATE EXPLORATION");
    await click(listItem({ class: "e2e-test-translation-tab" }));
    await click(
      button({ class: "e2e-test-accessibility-translation-start-record" })
    );
    await setConfig({ observeTime: 3000 });
    await press("R");
    await click(button({ class: "e2e-test-confirm-record" }));
  } catch (error) {
    console.error(error);
  } finally {
    await closeBrowser();
  }
})();
