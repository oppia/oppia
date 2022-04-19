describe('Webdriverio ', () => {
    it('checking Splash Page2', async() => {
        var splashPage = await $('.protractor-test-splash-page');
        // await browser.waitUntil(
        //     splashPage, 'Splash page takes too long to appear');
        await splashPage.waitForDisplayed({ timeout: 3000, reverse: false });
        // console.log('started1')
        // console.log(await browser.getUrl());
        // await browser.url('https://www.fb.com');
        // console.log(await browser.getUrl());
        // await browser.pause(300000)
        // console.log('ended1')
        // console.log('ended2')
    });
});