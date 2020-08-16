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
 * @fileoverview There should be a break after parenthesis
 * @author Oppia
 */
'use strict';

// -----------------------------------------------------------------------------
// Requirements
// -----------------------------------------------------------------------------

var rule = require('../../../lib/rules/break-after-parens'),

  RuleTester = require('eslint').RuleTester;


// -----------------------------------------------------------------------------
// Tests
// -----------------------------------------------------------------------------

var ruleTester = new RuleTester();
ruleTester.run('break-after-parens', rule, {

  valid: [

    // Give me some code that won't trigger a warning.
  ],

  invalid: [
    {
      code: '',
      errors: [{
        message: 'Fill me in.',
        type: 'Me too'
      }]
    }
  ]
});
