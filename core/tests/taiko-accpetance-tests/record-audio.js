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
} = require('taiko');

(async () => {
  try {
    await openBrowser({args: [
      '--start-fullscreen',
      '--use-fake-ui-for-media-stream',
    ]});
    await goto('localhost:8181');
    await click('SIGN IN');
    await write('testadmin@example.com', into(textBox('enter an email')));
    await click(button('Sign In', below('Emulator Mode Sign In')));
    await goto('http://localhost:8181/creator-dashboard');
    // await click('CREATE EXPLORATION');
    await click(button({class: 'e2e-test-create-new-exploration-button' }));
    await click(listItem({ class: 'e2e-test-translation-tab' }));
    await click(
      button({ class: 'e2e-test-accessibility-translation-start-record' })
    );
    await setConfig({ observeTime: 3000 });
    await press('R');
    await click(button({ class: 'e2e-test-confirm-record' }));
  } catch (error) {
    console.error(error);
  } finally {
    await closeBrowser();
  }
})();
