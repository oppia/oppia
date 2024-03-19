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
 * @fileoverview Lint check to disallow usage of ddescribe
 * fdescribe, xdescribe, fit, xit.
 */

'use strict';

var rule = require('./no-test-blockers');
var RuleTester = require('eslint').RuleTester;

var ruleTester = new RuleTester();
ruleTester.run('no-test-blockers', rule, {
  valid: [
    {
      code: `it('should test a feature', function() {
        console.log(elem.click);
      });`,
    },
    {
      code: `describe('Testing apply-validation directive', function() {
        except(5).toBe(true);
      });`,
    },
  ],

  invalid: [
    {
      code: `xit('should test a feature', function() {
        element(by.css('.e2e-test')).click();
      });`,
      errors: [
        {
          message: 'Please use "it" instead of "xit".',
          type: 'CallExpression',
        },
      ],
    },
    {
      code: `xdescribe('Testing apply-validation directive', function() {
        except(5).toBe(true);
      });`,
      errors: [
        {
          message: 'Please use "describe" instead of "xdescribe".',
          type: 'CallExpression',
        },
      ],
    },
  ],
});
