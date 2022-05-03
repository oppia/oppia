const { remote } = require('webdriverio');

describe('Oppia HomePage', () => {
  it('should opne the oppia on local server', async() => {
    const browser = await remote({
      capabilities: {
        browserName: 'chrome'
      }
    });
    await browser.url('https//localhost:8181');
    await expect(browser).toHaveTitle(
      'WebdriverIO · Next-gen browser and mobile' +
      'automation test framework for Node.js | WebdriverIO');
    await browser.deleteSession();
  });
});
