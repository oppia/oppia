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
 * @fileoverview Tests for the no-testonly.js file.
 */

'use strict';

var rule = require('./no-testonly');
var RuleTester = require('eslint').RuleTester;

var ruleTester = new RuleTester();
ruleTester.run('no-testonly', rule, {
  valid: [
    'otherFunction()',
    'function testOnly(){}'
  ],

  invalid: [
    {
      code: 'testOnlySomething();',
      errors: [{
        message: 'Please do not call a testOnly function from a ' +
        'non-test file.',
        type: null
      }]
    },
    {
      code: 'somethingTestOnly();',
      errors: [{
        message: 'Please do not call a testOnly function from a ' +
        'non-test file.',
        type: null
      }]
    },
    {
      code: 'somethingtestOnlySomething();',
      errors: [{
        message: 'Please do not call a testOnly function from a ' +
        'non-test file.',
        type: null
      }]
    },
  ]
});
