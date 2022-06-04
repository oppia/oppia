// Copyright 2022 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Tests for the end-to-end-action-checks.js file.
 */

 'use strict';

 var rule = require('./e2e-action-webdriverio');
 var RuleTester = require('eslint').RuleTester;
 
 var ruleTester = new RuleTester();
 ruleTester.run('e2e-action-webdriverio', rule, {
   valid: [
     {
       code:
       `it('should test a feature', function() {
         action.click("Element", elem);
       });`,
     },
     {
       code:
       `it('should test a feature', function() {
         action.keys("Element", elem, "keys");
       });`,
     },
     {
       code:
       `it('should test a feature', function() {
         console.log(elem.click);
       });`,
     },
     {
       code:
       `it('should test a feature', function() {
         console.log(elem.keys);
       });`,
     },
   ],
 
   invalid: [
     {
       code:
       `it('should test a feature', function() {
         elem.click();
       });`,
       errors: [{
         message: 'elem.click() is called instead of using action.click()',
         type: 'MemberExpression',
       }],
     },
     {
       code:
       `it('should test a feature', function() {
         elem.keys("keys");
       });`,
       errors: [{
         message: 'elem.keys() is called instead of using action.keys()',
         type: 'MemberExpression',
       }],
     },
     {
       code:
       `it('should test a feature', function() {
         $('.webdriverio-test').click();
       });`,
       errors: [{
         message: (
           '(some expression).click() is called instead of using ' +
           'action.click()'),
         type: 'MemberExpression',
       }],
     },
     {
       code:
       `it('should test a feature', function() {
        $('.webdriverio-test').keys("keys");
       });`,
       errors: [{
         message: (
           '(some expression).keys() is called instead of using ' +
           'action.keys()'),
         type: 'MemberExpression',
       }],
     },
   ]
 });
 