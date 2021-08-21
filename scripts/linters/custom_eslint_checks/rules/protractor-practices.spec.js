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
 * @fileoverview Tests for the protractor-practices.js file.
 */

'use strict';

var rule = require('./protractor-practices');
var RuleTester = require('eslint').RuleTester;

var ruleTester = new RuleTester({
  parserOptions: {
    ecmaVersion: 2016,
  },
  parser: require.resolve('@typescript-eslint/parser')
});

ruleTester.run('protractor-practices', rule, {
  valid: [{
    code:
    `expSummaryRowTitleElements.first()
    conversationContent.los.last()
    var text = unfinishedOneOffJobRows.get(i);`
  }, {
    code:
    `action.click(elem);
    action.sleep();`,
  }, {
    code:
    `action.click(elem);
    browser.action.waitForAngular();`,
  }, {
    code:
    `action.click(elem);
    browser.action.explore();`,
  }, {
    code:
    `action.click(elem);
    browser.action.pause();`,
  }, {
    code: 'card.then = 3;',
  }, {
    code: 'prevAge = then.age();',
  }, {
    code: 'then().age;',
  }, {
    code: 'sam.then.age;',
  }, {
    code: `var profileLink = element(by.css(
          '.protractor-test-profile-link'));`
  }, {
    code: 'const SKILL_DESCRIPTIONS = 1;'
  }, {
    code: 'var modal = element.all(by.css(".modal-dialog")).last();'
  }, {
    code: 'var modal = element(by.css("option:checked"));'
  }],

  invalid: [
    {
      code:
      `var hideHeightWarningIcon = element(
        by.css('.oppia-hide-card-height-warning-icon'));`,
      errors: [{
        message: (
          'Please use “.protractor-test-” prefix classname selector instead ' +
          'of “.oppia-hide-card-height-warning-icon”'),
      }],
    },
    {
      code:
      `it('should test a feature', function() {
        browser.sleep();
      });`,
      errors: [{
        message: 'Please do not use browser.sleep() in protractor files',
        type: 'CallExpression',
      }],
    },
    {
      code:
      `it('should test a feature', function() {
        browser.explore();
      });`,
      errors: [{
        message: 'Please do not use browser.explore() in protractor files',
        type: 'CallExpression',
      }],
    },
    {
      code:
      `it('should test a feature', function() {
        browser.pause();
      });`,
      errors: [{
        message: 'Please do not use browser.pause() in protractor files',
        type: 'CallExpression',
      }],
    },
    {
      code:
      `it('should test a feature', function() {
        browser.waitForAngular();
      });`,
      errors: [{
        message: (
          'Please do not use browser.waitForAngular() in protractor files'),
        type: 'CallExpression',
      }],
    },
    {
      code:
      `toPromise.then(function() {
        numLessons = 3;
      });`,
      errors: [{
        message: 'Please do not use .then(), consider async/await instead',
      }],
    },
    {
      code:
      'const Value = 5;',
      errors: [{
        message: 'Please make sure that constant name “Value” are in all-caps',
      }],
    },
    {
      code:
      `await element.all(
      by.css(".protractor-test-collection-exploration")).first()`,
      errors: [{
        message: 'Please do not use await for "first()"',
      }],
    },
    {
      code:
      `var oneOffJob = element.all(
      by.css('.protractor-test-one-off-jobs-rows'));
      await oneOffJob.get()
      await invalid.get()`,
      errors: [{
        message: 'Please do not use await for "get()"',
      }],
    },
  ]
});
