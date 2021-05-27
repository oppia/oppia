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
 * @fileoverview Tests for the comment-style.js file.
 */

'use strict';

var rule = require('./comment-style');
var RuleTester = require('eslint').RuleTester;

var ruleTester = new RuleTester();
ruleTester.run('test-message-style', rule, {
  valid: [
    `// We only run the e2e action checks on end-to-end test files.
    var a = 5;

    // The following must be off so that we can enable.
    `,
    `// This throws "Type '($provide) => string' is not assignable to
    // type 'string'". We need to suppress this error because typescript
    // expects the module name to be an string but a custom module is
    // needed here.
    // @ts-ignore
    var x = 5;
    `,
    `// This throws "Argument of type '() -> Promise<unknown>'
    // is not assignable to parameter of type 'PromiseLike<string>'.".
    // We need to suppress this error because we need to mock the
    // getTokenAsync function for testing purposes.
    // @ts-expect-error
    var s = 9;
    `
  ],

  invalid: [
    {
      code:
        `// We only run the e2e action checks on end-to-end test files.
        var a = 5;

        // The following must be off so that we can enable
        `,
      errors: [{
        message: (
          'Invalid punctuation used at the end of the comment'),
        type: null
      }]
    },
    {
      code:
        `// This throw "Type '($provide) => string' is not assignable to
        // type 'string'". this need to suppress because typescript
        // expects the module name to be an string but a custom module is
        // needed here.
        // @ts-ignore
        var x = 5;
        `,
      errors: [{
        message: (
          'Please add a comment above the @ts-ignore explaining the' +
          ' @ts-ignore. The format of comment should be -> This throws "...".' +
          ' We need to suppress this error because ...'),
        type: null
      }]
    },
    {
      code:
        `// This throw "Argument of type '() -> Promise<unknown>'
        // is not assignable to parameter of type 'PromiseLike<string>'.
        // this need to be suppressed because we need to mock the
        // getTokenAsync function for testing purposes.
        // @ts-expect-error
        var s = 9;
        `,
      errors: [{
        message: (
          'Please add a comment above the @ts-expect-error explaining the' +
          ' @ts-expect-error. The format of comment should be ->' +
          ' This throws "...". We need to suppress this error because ...'),
        type: null
      }]
    }
  ]
});
