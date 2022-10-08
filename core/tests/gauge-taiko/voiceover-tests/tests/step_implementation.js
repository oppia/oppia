/* globals gauge*/
"use strict";
const path = require('path');
const {
    openBrowser,
    write,
    closeBrowser,
    goto,
    press,
    screenshot,
    above,
    click,
    checkBox,
    listItem,
    toLeftOf,
    link,
    text,
    into,
    textBox,
    evaluate,
    // beforeSuite,
    // afterSuite,
    step,
} = require('taiko');
const assert = require("assert");
// const { async } = require('q');
// const headless = process.env.headless_chrome.toLowerCase() === 'true';

// opens browser at first everytime the testSuite runs
// beforeSuite(async () => {
    // await openBrowser({
    //     headless: headless
    // });
// });

// closes browser at the end of testSuite
// afterSuite(async () => {
    // await closeBrowser();
// });

// SignIn flow
step("Sign-in to the dev server", async function() {
    await openBrowser({
        headless: headless
    });
	await goto("http://localhost:8181");
	await click("OK");
	await write("testadmin@example.com", into(textBox({id: "mat-input-0"})));
	await click(button("Sign In", below("Emulator Mode Sign in")));
});

step("Create a new Exploration", async function() {
    await goto("http://localhost:8181/creator-dashboard");
    await click("+ CREATE EXPLORATION");
});

step("Go to the Translations tab", async function() {
    await click(listItem({class:'e2e-test-translation-tab'}));
});

step("Record new audio", async function() {
    await click(button({class: 'e2e-test-accessibility-translation-start-record'}));
    await setConfig({ observeTime: 3000 });
    await click(button({class: 'e2e-test-stop-record-button'}));
    await click(button({class: 'e2e-test-confirm-record'}));

    await closeBrowser();
});
