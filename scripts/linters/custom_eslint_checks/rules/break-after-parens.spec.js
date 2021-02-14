// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Tests for the break-after-paren.js file.
 */

'use strict';

var rule = require('./break-after-parens');
var RuleTester = require('eslint').RuleTester;

var ruleTester = new RuleTester();
ruleTester.run('break-after-parens', rule, {
  valid: [
    'var a = (true);',
    `if (true ||
      false) {
        var a = 1 + 2;
      }`,
    `it('should' +
    'happen')`,
    `angular.module('oppia').constant('default',
    false);`,
    `var a = (
      true);`
  ],

  invalid: [
    {
      code: `var a = (true ||
        true);`,
      errors: [{
        message: 'Expected newline after \'(\'.',
        type: 'Program'
      }]
    }
  ]
});
