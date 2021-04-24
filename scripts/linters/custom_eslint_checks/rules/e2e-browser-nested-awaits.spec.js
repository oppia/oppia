// Copyright 2021 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Tests for the e2e-browser-nested-awaits.js file.
 */

'use strict';

var rule = require('./e2e-browser-nested-awaits');
var RuleTester = require('eslint').RuleTester;

/*  Note: parser options added in order to parse
 *  `async` and `await` in the test code snippets
 */
var ruleTester = new RuleTester({
  parserOptions: {
    ecmaVersion: 2017
  }
});

/*  All error messages are the same --
 *  it's defined here to reduce code duplication
 */
var errorMsg = '`browser.switchTo().activeElement()` ' +
  'is not wrapped in an `await` statement';

ruleTester.run('e2e-browser-nested-awaits', rule, {
  valid: [
    {
      code: `
          async function func() {
            await browser.switchTo().activeElement();
            await browser.switchTo(param).activeElement(param);
            await browser.switchTo(param).activeElement();
            await browser.switchTo().activeElement(param);
          }
          `
    },
    {
      code: `
          async function func() {
            await(
              await browser.switchTo().activeElement()
            ).sendKeys(solution.explanation);
            await(
              await browser.switchTo().activeElement()
            ).sendKeys();
            await(
              await browser.switchTo().activeElement()
            ).callback(args).chain()[index];
            await(await browser.switchTo().activeElement());
            await(await(await (browser.switchTo().activeElement())));
            await(await(await (browser.switchTo()).activeElement()));
          }
          `
    },
    {
      code: `
          async function func() {
            await expression;
            await getPage().sendKeys(args.attr);
            await page.switchTo().activeElement();
            await page.switchTo().activeElement().sendKeys();
            await page.frame().activeElement().sendKeys();
          }
          `
    },
    {
      code: `
          page.switchTo().activeElement();
          page.switchTo().activeElement().sendKeys();
          page.frame().activeElement().sendKeys();
          browser.activeElement().switchTo();
          `
    },
    {
      code: `
          async function func() {
            await browser.activeElement().switchTo();
            await (await browser.activeElement().switchTo());
          }
          `
    }
  ],
  invalid: [
    {
      code: `
          browser.switchTo().activeElement();
           `,
      errors: [{ message: errorMsg }]
    },
    {
      code: `
          browser.switchTo().activeElement().sendKeys(args);
           `,
      errors: [{ message: errorMsg }]
    },
    {
      code: `
          async function func() {
              await browser.switchTo().activeElement().sendKeys(args);
          }
           `,
      errors: [{ message: errorMsg }]
    },
    {
      code: `
          async function func() {
              await browser.switchTo().activeElement().sendKeys();
          }
           `,
      errors: [{ message: errorMsg }]
    },
    {
      code: `
          async function func() {
              await browser.switchTo().activeElement().callback(args).chain();
          }
           `,
      errors: [{ message: errorMsg }]
    },
    {
      code: `
          async function func() {
              await(
                await browser.switchTo().activeElement().sendKeys()
              ).callback();
          }
           `,
      errors: [{ message: errorMsg }]
    }]
});
