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
const { async } = require('q');
// const headless = process.env.headless_chrome.toLowerCase() === 'true';

// opens browser at first everytime the testSuite runs
// beforeSuite(async () => {
    await openBrowser({
        headless: headless
    });
// });

// closes browser at the end of testSuite
// afterSuite(async () => {
    // await closeBrowser();
// });

// SignIn flow
// step("Sign-in to the dev server", async function() {
	await goto("http://localhost:8181");
	await click("OK");
	await write("testadmin@example.com", into(textBox({id: "mat-input-0"})));
	await click(button("Sign In", below("Emulator Mode Sign in")));
// });

// step("Create a new Exploration", async function() {
    await goto("http://localhost:8181/creator-dashboard");
    await click("+ CREATE EXPLORATION");
// });

// step("Go to the Translations tab", async function() {
    await click(listItem({class:'e2e-test-translation-tab'}));
// });

// step("Record new audio", async function() {
    await click(button({class: 'e2e-test-accessibility-translation-start-record'}));
    await setConfig({ observeTime: 3000 });
    await click(button({class: 'e2e-test-stop-record-button'}));
    await click(button({class: 'e2e-test-confirm-record'}));

    await closeBrowser();

// });
// Return a screenshot file name
// gauge.customScreenshotWriter = async function () {
//     const screenshotFilePath = path.join(process.env['gauge_screenshots_dir'],
//         `screenshot-${process.hrtime.bigint()}.png`);

//     await screenshot({
//         path: screenshotFilePath
//     });
//     return path.basename(screenshotFilePath);
// };

// step("Add task <item>", async (item) => {
//     await write(item, into(textBox("What needs to be done?")));
//     await press('Enter');
// });

// step("View <type> tasks", async function (type) {
//     await click(link(type));
// });

// step("Complete tasks <table>", async function (table) {
//     for (var row of table.rows) {
//         await click(checkBox(toLeftOf(row.cells[0])));
//     }
// });

// step("Clear all tasks", async function () {
//     await evaluate(() => localStorage.clear());
// });

// step("Open todo application", async function () {
//     await goto("todo.taiko.dev");
// });

// step("Must not have <table>", async function (table) {
//     for (var row of table.rows) {
//         assert.ok(!await text(row.cells[0]).exists(0, 0));
//     }
// });

// step("Must display <message>", async function (message) {
//     assert.ok(await text(message).exists(0, 0));
// });

// step("Add tasks <table>", async function (table) {
//     for (var row of table.rows) {
//         await write(row.cells[0]);
//         await press('Enter');
//     }
// });

// step("Must have <table>", async function (table) {
//     for (var row of table.rows) {
//         assert.ok(await text(row.cells[0]).exists());
//     }
// });