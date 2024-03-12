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
 * @fileoverview Tests for the disallow-flags.js file.
 */

'use strict';

var rule = require('./disallow-flags');
var RuleTester = require('eslint').RuleTester;

var ruleTester = new RuleTester();
ruleTester.run('disallow-flags', rule, {
  valid: ['var checking = (true);'],

  invalid: [
    {
      code: `// eslint-enable-next-line camelcase
        var checkingcamel = 6;`,
      errors: [
        {
          message:
            'Please do not use eslint enable|disable for camelcase. If' +
            ' you are using this statement to define properties in an interface' +
            ' for a backend dict. Wrap the property name in single quotes' +
            ' instead.',
        },
      ],
    },
    {
      code: `// eslint @typescript-eslint/no-explicit-any
        var checkingcamel = 6;`,
      errors: [
        {
          message:
            'Please do not define "any" types. You can' +
            ' refer https://github.com/oppia/oppia/wiki/Guide-on-defining-types' +
            " if you're having trouble declaring types.",
        },
      ],
    },
  ],
});
