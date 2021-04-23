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

// Note: parser options added in order to parse
// `async` and `await` in the test code snippets
var ruleTester = new RuleTester({
  parserOptions: {
    ecmaVersion: 2017
  }
});

ruleTester.run('e2e-browser-nested-awaits', rule, {
  valid: [
  {
    code: `
        async function def() {
            await page;
            await getPage().sendKeys(solution.explanation);
            await page.frame().activeElement().sendKeys();
            await(await browser.switchTo().activeElement()).sendKeys(solution.explanation);
        }
        `
  }],
  invalid: [
  {
    code: `
        async function def() {
            await browser.switchTo().activeElement().sendKeys(solution.explanation);
        }
        `,
    errors: [
    {
      message: 'should have a nested `await` for `browser.switchTo().activeElement()`'
    }]
  },
  {
    code: `
        async function def() {
            await browser.switchTo().activeElement().sendKeys();
            await browser.switchTo().activeElement().sendKeys(array[0].attr);
        }
        `,
    errors: [
    {
      message: 'should have a nested `await` for `browser.switchTo().activeElement()`'
    },
    {
      message: 'should have a nested `await` for `browser.switchTo().activeElement()`'
    }]
  }]
});
