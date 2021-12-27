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
 * @fileoverview Rule to have nested awaits for
 * await (await browser.switchTo().activeElement()).sendKeys(explanation);
 * with no exceptions.
 */

'use strict';

var rule = require('./nested-awaits');
var RuleTester = require('eslint').RuleTester;

const ruleTester = new RuleTester({
  parserOptions: {
    ecmaVersion: 2018
  }
});

ruleTester.run('nested-awaits', rule, {
  valid: [
    {
      code:
      `var alpha = async function() {
        await (await browser.switchTo().activeElement()).sendKeys(explanation);
      };
      `
    }
  ],

  invalid: [
    {
      code:
        `var alpha = async function() {
           await (browser.switchTo().activeElement()).sendKeys(explanation);
         };
         `,
      errors: [{
        message: 'Please use nested awaits like: '+
        'await (await browser.switchTo().activeElement()).sendKeys(explanation);'
      }]
    },
    {
      code:
        `var alpha = async function() {
           (await browser.switchTo().activeElement()).sendKeys(explanation);
         };
         `,
      errors: [{
        message: 'Please use nested awaits like: '+
        'await (await browser.switchTo().activeElement()).sendKeys(explanation);'
      }]
    },
    {
      code:
        `var alpha = function() {
           (browser.switchTo().activeElement()).sendKeys(explanation);
         };
         `,
      errors: [{
        message: 'Please use nested awaits like: '+
        'await (await browser.switchTo().activeElement()).sendKeys(explanation);'
      }]
    }
  ]
});
