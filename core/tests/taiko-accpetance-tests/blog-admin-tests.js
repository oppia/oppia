const { openBrowser, goto, click, textBox, into, write, below, button, dropDown, alert, closeBrowser } = require('taiko');
(async () => {
    try {
        await openBrowser();
        await goto("localhost:8181");
        await click("OK");
        await click("SIGN IN");
        await write("testadmin@example.com", into(textBox("enter an email")));
        await click(button("Sign In", below("Emulator Mode Sign In")));

        await goto("http://localhost:8181/blog-admin");
        await write("shivkant", into(textBox("enter username")));
        await dropDown({id: "label-target-update-form-role-select"}).select("blog post editor");

        await click("Update Role");
        await click("Update Role", below("Select Role"));
        await write("shivkant", textBox("enter username", below("remove blog editor")));
        await click("Remove Blog Editor", below("enter username"));
        await click("Add Element");
        await write("tag-name");
        await click("Save");
        await alert('This action is irreversible. Are you sure?', async () => await accept());
        // await alert(/^sure*$/, async () => await accept());
    } catch (error) {
        console.error(error);
    } finally {
        await closeBrowser();
    }
})();