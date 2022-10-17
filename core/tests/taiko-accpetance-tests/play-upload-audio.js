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

(async () => {
  try {
    await openBrowser({args: [
      "--start-fullscreen",
      "--use-fake-ui-for-media-stream",
    ]})
    await goto("localhost:8181");
    await click("SIGN IN");
    await write("testadmin@example.com", into(textBox("enter an email")));
    await click(button("Sign In", below("Emulator Mode Sign In")));
    await goto("http://localhost:8181/creator-dashboard");
  
    await click(button({class: "e2e-test-create-new-exploration-button" }));
    await click(listItem({ class: "e2e-test-translation-tab" }));
    await click(
      button({ class: "e2e-test-accessibility-translation-upload-audio" })
    );
    
    await attach("./A4.mp3", 
        fileField(above(button('Cancel'))));
    await click(
      button({ class: "e2e-test-save-uploaded-audio-button" })
    );

    await click(button({class: 'e2e-test-play-pause-audio-button'}));

  } catch (error) {
    console.error(error);
  } finally {
    await closeBrowser();
  }
})();
