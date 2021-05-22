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


let ruleTester = new RuleTester({
  parser: require.resolve('@typescript-eslint/parser')
});
ruleTester.run('async-func-name-checks', rule, {
  valid: [
    {
      code:
      `class MyClass {
        async getInitAsync(): Promise<void> {
          return this.initPromise;
        }
      }`
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
      `export class SomeClass {
        async getInitAsync(): Promise<void> {
          async function fooAsync() {
          }
        }
      }`,
    },
    {
      code:
      `myObj = {
        functionAsync: async () => {
          //something
        } 
      }`,
    },
    {
      code:
      `navigator.mediaDevices.getUserMedia = async function() {
        // something
      }`
    }
  ],

  invalid: [
    {
      code:
      `class MyClass {
        async getInit(): Promise<void> {
          return this.initPromise;
        }
      }`,
      errors: [{
        message: 'Please use "Async" suffix for asynchronous function name.',
        type: 'Identifier'
      }]
    },
    {
      code:
      `const func = async function() {
        return this.initPromise;
      }`,
      errors: [{
        message: 'Please use "Async" suffix for asynchronous function name.',
        type: 'Identifier'
      }]
    },
    {
      code:
      `var foo = async() => {
      return }`,
      errors: [{
        message: 'Please use "Async" suffix for asynchronous function name.',
        type: 'Identifier'
      }]
    },
    {
      code:
      `export class SomeClass {
        async getInitAsync(): Promise<void> {
          async function foo() {
          }
        }
      }`,
      errors: [{
        message: 'Please use "Async" suffix for asynchronous function name.',
        type: 'Identifier'
      }]
    },
    {
      code:
      `myObj = {
        function: async () => {
          //something
        } 
      }`,
      errors: [{
        message: 'Please use "Async" suffix for asynchronous function name.',
        type: 'Identifier'
      }]
    },
  ]
});
