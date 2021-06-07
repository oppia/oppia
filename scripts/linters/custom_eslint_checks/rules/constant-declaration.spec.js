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
 * @fileoverview Tests for the constant-declaration.js file.
 */

'use strict';

var rule = require('./constant-declaration');
var RuleTester = require('eslint').RuleTester;

var ruleTester = new RuleTester();
ruleTester.run('constant-declaration', rule, {
  valid: [{
    code:
    `angular.module('oppia').constant(
    'DEFAULT_SKILL', QuestionsListConstants.MODE_SELECT_SKILL);
    angular.module('oppia').constant(
    'MODE_SELECT_DIFFICULTY', QuestionsListConstants.MODE_SELECT_SKILL);`,
    filename: 'foo/bar.constants.ajs.ts'
  }
  ],

  invalid: [
    {
      code:
      `angular.module('oppia').constant(
      'DEFAULT_SKILL_DIFFICULTY', QuestionListConstants.DEFAULT_SKILL_DIFFIC);`,
      filename: 'foo/bar.js',
      errors: [{
        message: 'constant is used in non constant file.',
      }],
    },
    {
      code:
      `angular.module('oppia').constant(
      'MODE_SELECT_DIFFICULTY', QuestionsListConstants.MODE_SELECT_DIFFICULT);
      angular.module('oppia').constant(
      'MODE_SELECT_DIFFICULTY', QuestionsListConstants.MODE_SELECT_DIFFICULT);`,
      filename: 'foo/bar.constants.ajs.ts',
      errors: [{
        message: 'There are two constants in this file.',
      }],
    },
  ]
});
