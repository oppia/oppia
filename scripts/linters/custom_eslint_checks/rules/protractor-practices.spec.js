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

var ruleTester = new RuleTester();
ruleTester.run('protractor-practices', rule, {
  valid: [{
    code:
    `action.click(elem);
    action.sleep();`,
  }, {
    code:
    `action.click(elem);
    browser.action.sleep();`,
  }, {
    code: 'card.then = 3;',
  }, {
    code: 'prevAge = then.age();',
  }, {
    code: 'then().age;',
  }, {
    code: 'sam.then.age;',
  }],

  invalid: [
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
      `toPromise.then(function() {
        numLessons = 3;
      });`,
      errors: [{
        message: 'Please do not use .then(), consider async/await instead',
      }],
    },
  ]
});
