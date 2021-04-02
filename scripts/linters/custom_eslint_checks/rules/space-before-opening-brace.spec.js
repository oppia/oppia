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

 var rule = require('./space-before-opening-brace');
 var RuleTester = require('eslint').RuleTester;
 
 var ruleTester = new RuleTester();
 ruleTester.run('space-before-opening-brace', rule, {
   valid: [
     `
     var a= 's';
     function A() {
         console.log('test function');
     }`,
     `var a= 's';
     function A () {console.log('test function');
     }`
    ],

   invalid: [
     {
       code:
       `function A(){
        console.log('test function');
    }`,
       errors: [{
         message: 'There should be only one space before opening brace of function',
         type: null
       }]
     },
     {
      code:
      `function A()  {
        console.log('test function');
   }`,
      errors: [{
        message: 'There should be only one space before opening brace of function',
        type: null
      }]
    },
    {
      code:
      `function A()
      {
       console.log('test function');
   }`,
      errors: [{
        message: 'There should be only one space before opening brace of function',
        type: null
      }]
    },
   ]
 });
 