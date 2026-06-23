// Copyright 2026 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Tests for the no-view-encapsulation-none.js file.
 */

'use strict';

var rule = require('./no-view-encapsulation-none');
var RuleTester = require('eslint').RuleTester;

var ruleTester = new RuleTester({
  parserOptions: {
    ecmaVersion: 2015,
    sourceType: 'module',
  },
});

var ERROR_MESSAGE =
  'Avoid ViewEncapsulation.None. Add a comment immediately above' +
  ' this usage in the format "We need ViewEncapsulation.None' +
  ' because ..."';

ruleTester.run('no-view-encapsulation-none', rule, {
  valid: [
    {
      code: [
        'var x = {',
        '  // We need ViewEncapsulation.None because this component styles children.',
        '  encapsulation: ViewEncapsulation.None',
        '};',
      ].join('\n'),
    },
    {
      code: [
        'var x = {',
        '  /* We need ViewEncapsulation.None because of global styles. */',
        '  encapsulation: ViewEncapsulation.None',
        '};',
      ].join('\n'),
    },
    {
      code: 'var x = { encapsulation: ViewEncapsulation.None };',
      filename:
        'oppia/core/templates/components/button-directives/' +
        'create-activity-button.component.ts',
    },
    {
      code: 'var x = { encapsulation: ViewEncapsulation.None };',
      filename:
        '/home/runner/work/oppia/oppia/core/templates/components/' +
        'button-directives/create-activity-button.component.ts',
    },
    {
      code: 'var x = { encapsulation: ViewEncapsulation.Emulated };',
    },
    {
      code: 'var x = { encapsulation: SomeOtherEnum.None };',
    },
    {
      code: 'var x = { encapsulation: ViewEncapsulation.None };',
      filename:
        'oppia/core/templates/pages/splash-page/' +
        'splash-page.component.ts',
    },
  ],

  invalid: [
    {
      code: 'var x = { encapsulation: ViewEncapsulation.None };',
      errors: [
        {
          message: ERROR_MESSAGE,
          type: 'MemberExpression',
        },
      ],
    },
    {
      code: [
        'var x = {',
        '  // This uses None for styling reasons.',
        '  encapsulation: ViewEncapsulation.None',
        '};',
      ].join('\n'),
      errors: [
        {
          message: ERROR_MESSAGE,
          type: 'MemberExpression',
        },
      ],
    },
    {
      code: 'var x = { encapsulation: ViewEncapsulation.None };',
      filename: 'oppia/core/templates/pages/some-new-page/new.component.ts',
      errors: [
        {
          message: ERROR_MESSAGE,
          type: 'MemberExpression',
        },
      ],
    },
  ],
});
