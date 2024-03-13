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
 * @fileoverview Tests for the test-message-style.js file.
 */

'use strict';

var rule = require('./test-message-style');
var RuleTester = require('eslint').RuleTester;

var ruleTester = new RuleTester();
ruleTester.run('test-message-style', rule, {
  valid: [
    `it('should transform all key value pairs to angular constants',
    function() {
    for (var constantName in constants) {
        expect($injector.has(constantName)).toBe(true);
        expect($injector.get(constantName)).toEqual(constants[constantName]);
    }
    });`,
    `it('should transform all key value ' + 'pairs to angular constants',
    function() {
    for (var constantName in constants) {
        expect($injector.has(constantName)).toBe(true);
        expect($injector.get(constantName)).toEqual(constants[constantName]);
    }
    });`,
    `it('should transform all ' + 'key value ' + 'pairs to angular constants',
    function() {
    for (var constantName in constants) {
        expect($injector.has(constantName)).toBe(true);
        expect($injector.get(constantName)).toEqual(constants[constantName]);
    }
    });`,
  ],

  invalid: [
    {
      code: `it('should transform all key value  pairs to angular constants',
        function() {
        for (var constantName in constants) {
            expect($injector.has(constantName)).toBe(true);
            expect($injector.get(constantName)).toEqual(
                constants[constantName]);
        }
        });`,
      errors: [
        {
          message:
            'Please remove multiple consecutive spaces in the test message',
          type: null,
        },
      ],
    },
    {
      code: `it('should transform all key value pairs to angular constants ',
        function() {
        for (var constantName in constants) {
            expect($injector.has(constantName)).toBe(true);
            expect($injector.get(constantName)).toEqual(
                constants[constantName]);
        }
        });`,
      errors: [
        {
          message: 'Please remove space from the end of the test message',
          type: null,
        },
      ],
    },
    {
      code: `it('hould transform all key value pairs to angular constants',
        function() {
        for (var constantName in constants) {
            expect($injector.has(constantName)).toBe(true);
            expect($injector.get(constantName)).toEqual(
                constants[constantName]);
        }
        });`,
      errors: [
        {
          message: "Test message should start with 'should'",
          type: null,
        },
      ],
    },
    {
      code: `it('hould transform all key' + ' value pairs to ' + 'angular constants',
        function() {
        for (var constantName in constants) {
            expect($injector.has(constantName)).toBe(true);
            expect($injector.get(constantName)).toEqual(
                constants[constantName]);
        }
        });`,
      errors: [
        {
          message: "Test message should start with 'should'",
          type: null,
        },
      ],
    },
  ],
});
