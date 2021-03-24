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
 * @fileoverview Tests for the no-unused-dependency.js file.
 */

'use strict';

var rule = require('./alphabetical-require');
var RuleTester = require('eslint').RuleTester;

var ruleTester = new RuleTester();
ruleTester.run('alphabetical-require', rule, {
  valid: [
    {
      code: `
        require('alphabetical');
        require('order');

        require('and');
        require('directive');
        require('with-two-blocks')`,
      filename: 'test.directive.ts'
    },
    {
      code: `
        require('alphabetical');
        require('order');
        require(withmethod.Call() + 'string');`,
      filename: 'test'
    },
    {
      code: `
        require('alphabetical');
        require('order');
        require(withVariable + 'string');`,
      filename: 'test'
    },
  ],
  invalid: [
    {
      code: `
        require('out-of-alphabetical');
        require('order');

        require('and');
        require('directive');
        require('with-more-than-two-blocks')`,
      filename: 'test.directive.ts',
      errors: [{
        message: 'The require() statements should be in alphabetical order.',
        type: 'CallExpression'
      }]
    },
    {
      code: `
        require('out-of-alphabetical-order');
        require('and');
        require('its');
        require('not-a-directive')`,
      filename: 'test.js',
      errors: [{
        message: 'The require() statements should be in alphabetical order.',
        type: 'CallExpression'
      }]
    },
    {
      code: `
        require('have-two-statements-blocks');
        require('but-its-not-directive');`,
      filename: 'test.js',
      errors: [{
        message: 'The require() statements should be in alphabetical order.',
        type: 'CallExpression'
      }]
    },
  ]
});
