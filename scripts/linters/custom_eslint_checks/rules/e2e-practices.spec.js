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
 * @fileoverview Tests for the e2e-practices.js file.
 */

'use strict';

var rule = require('./e2e-practices');
var RuleTester = require('eslint').RuleTester;

var ruleTester = new RuleTester({
  parserOptions: {
    ecmaVersion: 2016,
  },
  parser: require.resolve('@typescript-eslint/parser'),
});

ruleTester.run('e2e-practices', rule, {
  valid: [
    {
      code: `expSummaryRowTitleElements.first()
    conversationContent.los.last()
    var text = unfinishedOneOffJobRows.get(i);`,
    },
    {
      code: 'browser.switchTo()',
    },
    {
      code: `action.click(elem);
    action.sleep();`,
    },
    {
      code: `action.click(elem);
    browser.action.waitForAngular();`,
    },
    {
      code: `action.click(elem);
    browser.action.explore();`,
    },
    {
      code: `action.click(elem);
    browser.action.pause();`,
    },
    {
      code: 'card.then = 3;',
    },
    {
      code: 'prevAge = then.age();',
    },
    {
      code: 'then().age;',
    },
    {
      code: 'sam.then.age;',
    },
    {
      code: `var profileLink = element(by.css(
          '.e2e-test-profile-link'));`,
    },
    {
      code: `var profileLink = $(
          '.e2e-test-profile-link');`,
    },
    {
      code: 'const SKILL_DESCRIPTIONS = 1;',
    },
    {
      code: 'var modal = element.all(by.css(".modal-dialog")).last();',
    },
    {
      code: 'var modal = $(".modal-dialog")[0];',
    },
    {
      code: 'var modal = element(by.css("option:checked"));',
    },
    {
      code: 'var modal = $("option:checked");',
    },
    {
      code: ` var items = ['item1', 'item2', 'item3'];
            for (let i=0; i < items.length; i++) {
              console.log(items[i])
            };
            //[].forEach(item);`,
    },
  ],

  invalid: [
    {
      code: `var hideHeightWarningIcon = element(
        by.css('.oppia-hide-card-height-warning-icon'));`,
      errors: [
        {
          message:
            'Please use “.e2e-test-” prefix classname selector instead ' +
            'of “.oppia-hide-card-height-warning-icon”',
        },
      ],
    },
    {
      code: `var hideHeightWarningIcon = $(
        '.oppia-hide-card-height-warning-icon');`,
      errors: [
        {
          message:
            'Please use “.e2e-test-” prefix classname selector instead ' +
            'of “.oppia-hide-card-height-warning-icon”',
        },
      ],
    },
    {
      code: `it('should test a feature', function() {
        browser.switchTo().activeElement();
      });`,
      errors: [
        {
          message:
            'Please do not use browser.switchTo().activeElement()' +
            ' in e2e files',
          type: 'MemberExpression',
        },
      ],
    },
    {
      code: `it('should test a feature', function() {
        browser.sleep();
      });`,
      errors: [
        {
          message: 'Please do not use browser.sleep() in e2e files',
          type: 'CallExpression',
        },
      ],
    },
    {
      code: `it('should test a feature', function() {
        browser.explore();
      });`,
      errors: [
        {
          message: 'Please do not use browser.explore() in e2e files',
          type: 'CallExpression',
        },
      ],
    },
    {
      code: `it('should test a feature', function() {
        browser.pause();
      });`,
      errors: [
        {
          message: 'Please do not use browser.pause() in e2e files',
          type: 'CallExpression',
        },
      ],
    },
    {
      code: `it('should test a feature', function() {
        browser.debug();
      });`,
      errors: [
        {
          message: 'Please do not use browser.debug() in e2e files',
          type: 'CallExpression',
        },
      ],
    },
    {
      code: `it('should test a feature', function() {
        browser.waitForAngular();
      });`,
      errors: [
        {
          message: 'Please do not use browser.waitForAngular() in e2e files',
          type: 'CallExpression',
        },
      ],
    },
    {
      code: `toPromise.then(function() {
        numLessons = 3;
      });`,
      errors: [
        {
          message: 'Please do not use .then(), consider async/await instead',
        },
      ],
    },
    {
      code: 'const Value = 5;',
      errors: [
        {
          message:
            'Please make sure that constant name “Value” are in all-caps',
        },
      ],
    },
    {
      code: `await element.all(
      by.css(".e2e-test-collection-exploration")).first()`,
      errors: [
        {
          message: 'Please do not use await for "first()"',
        },
      ],
    },
    {
      code: `var oneOffJob = element.all(
      by.css('.e2e-test-one-off-jobs-rows'));
      await oneOffJob.get()
      await invalid.get()`,
      errors: [
        {
          message: 'Please do not use await for "get()"',
        },
      ],
    },
    {
      code: `var books = ['book1', 'book2', 'book3'];
      books.forEach(function(book) {
        console.log(book)
      });`,
      errors: [
        {
          message:
            'Please do not use .forEach(), consider using a "for loop" instead',
        },
      ],
    },
  ],
});
