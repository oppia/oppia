const { openBrowser, goto, click, textBox, into, write, below, button, above, fileField, attach, closeBrowser } = require('taiko');
(async () => {
    try {
        await openBrowser();
        await goto("localhost:8181");
        await click("SIGN IN");
        await write("testadmin@example.com", into(textBox("enter an email")));
        await click(button("Sign In", below("Emulator Mode Sign In")));

        await goto("http://localhost:8181/blog-dashboard");
        await click("NEW POST");
        await write("random titlezcxfsdx", into(textBox({class: "e2e-test-blog-post-title-field"})));
        await write("my blog body content", into(textBox({class: "e2e-test-rte"})));
        await click("Add Thumbnail Image");
        await attach('./500px.svg', fileField(above(button('Cancel'))));
        await click("Add Thumbnail Image");
        await click("News");
        await click("Done");
        await click("Preview");
        await click(button({class: 'e2e-test-close-preview-button'}));
        await click("PUBLISH");
        await click("Confirm");
    } catch (error) {
        console.error(error);
    } finally {
        await closeBrowser();
    }
})();