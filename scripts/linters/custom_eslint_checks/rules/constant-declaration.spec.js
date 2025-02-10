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

var ruleTester = new RuleTester({
  parserOptions: {
    ecmaVersion: 2016,
    sourceType: 'module',
  },
  parser: require.resolve('@typescript-eslint/parser'),
});

ruleTester.run('constant-declaration', rule, {
  valid: [
    {
      code: `angular.module('oppia').constant(
    'DEFAULT_SKILL', QuestionsListConstants.MODE_SELECT_SKILL);
    angular.module('oppia').constant(
    'MODE_SELECT_DIFFICULTY', QuestionsListConstants.MODE_SELECT_SKILL);`,
      filename: 'foo/bar.constants.ajs.ts',
    },
    {
      code: `export const SampleConstants = {
      PythonProgramTokenType: {
        COMMENT: 'COMMENT',
        NL: 'NL',
        STRING: 'STRING',
      }
    } as const;`,
      filename: 'foo/bar.constants.ts',
    },
  ],

  invalid: [
    {
      code: `angular.module('oppia').constant(
      'DEFAULT_SKILL_DIFFICULTY', QuestionListConstants.DEFAULT_SKILL_DIFFIC);`,
      filename: 'foo/bar.js',
      errors: [
        {
          message: 'Constant is used in non constant file.',
        },
      ],
    },
    {
      code: `angular.module('oppia').constant(
      'MODE_SELECT_DIFFICULTY', QuestionsListConstants.MODE_SELECT_DIFFICULT);
      angular.module('oppia').constant(
      'MODE_SELECT_DIFFICULTY', QuestionsListConstants.MODE_SELECT_DIFFICULT);`,
      filename: 'foo/bar.constants.ajs.ts',
      errors: [
        {
          message: 'There are mutliple constants in this file.',
        },
      ],
    },
    {
      code: `export const InteractionSpecsConstants = {
        INTERACTION_SPECS: INTERACTION_SPECS
      } ;`,
      filename: 'foo/bar.constants.ts',
      errors: [
        {
          message:
            "Please add 'as const' at the end of the constant " +
            'declaration. A constants file should have the following ' +
            'structure:\n export const SomeConstants = { ... } as const;',
        },
      ],
    },
  ],
});
