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
 * @fileoverview Tests for the no-multiline-disable.js file.
 */

'use strict';

var rule = require('./no-multiline-disable');
var RuleTester = require('eslint').RuleTester;

var ruleTester = new RuleTester();
ruleTester.run('no-multiline-disable', rule, {
  valid: [
    `
    // eslint-disable-next-line max-len
    it('should' +
    'check if eslint-disable-next-line is allowed')`,
    `
    /* eslint-disable-next-line max-len */
    it('should' +
    'check if eslint-disable-next-line is allowed')`,
    `
    /* eslint-disable no-multiline-disable */
    /* eslint-disable max-len */
    it('should' +
    'check if we can disable our new lint check')`,
  ],

  invalid: [
    {
      code: `
      /* eslint-disable max-len */
      var a = (true ||
        true);`,
      errors: [
        {
          message: 'Do not use disable statement for multilines',
          type: null,
        },
      ],
    },
    {
      code: `
      // eslint-disable max-len
      var a = (true ||
        true);`,
      errors: [
        {
          message: 'Do not use disable statement for multilines',
          type: null,
        },
      ],
    },
  ],
});
