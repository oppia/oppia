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
 * @fileoverview Lint to ensure that naming of asynchronous functions is
 * correct.
 */
'use strict';

let rule = require('./async-func-name-checks');
let RuleTester = require('eslint').RuleTester;

let ruleTester = new RuleTester();
ruleTester.run('async-func-name-checks', rule, {
  valid: [
      {
          code:
          `async function fooAsync(): {
          }`,
      },
      {
          code:
          `const funcAsync = async function() {
          }`,
      },
      {
          code:
          `var funcAsync = async() => {
          }`,
      },
      {
          code:
          `foo() {
              async function fooAsync() {
              }
          }`,
      },
  ],

  invalid: [
      {
        code:
        `async function foo() {
        }`,
        errors: [{
          message: 'Please use "Async" suffix for asynchronous function name.',
          type: 'FunctionExpression'
        }]
      },
      {
        code:
        `const bar = async() => {
            let foo = () => {
            }
          }`,
        errors: [{
          message: 'Please use "Async" suffix for asynchronous function name.',
          type: null
        }]
      },
      {
        code:
        `const barAsync = async() => {
            let foo = async() => {
            }
          }`,
        errors: [{
          message: 'Please use "Async" suffix for asynchronous function name.',
          type: null
        }]
      },
      {
        code:
        `async bar(): Promise<void> {
          python -m scripts.run_custom_eslint_tests }`,
        errors: [{
          message: 'Please use "Async" suffix for asynchronous function name.',
          type: 'FunctionExpression'
        }]
      }
  ]
});
