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
 * @fileoverview Tests for the disallow-httpclient.js file.
 */

'use strict';

var rule = require('./disallow-httpclient');
var RuleTester = require('eslint').RuleTester;

var ruleTester = new RuleTester({
  parserOptions: {
    ecmaVersion: 2016,
    sourceType: 'module'
  },
  parser: require.resolve('@typescript-eslint/parser')
});

ruleTester.run('disallow-httpclient', rule, {
  valid: [
    {
      code:
      `import { HttpClient } from '@angular/common/http';
      describe('Service', () => {
        let httpClient: HttpClient = null;
      });`,
      filename: 'foo/bar.backend-api.service.ts'
    }
  ],

  invalid: [
    {
      code:
      `import { HttpClient } from '@angular/common/http';
      describe('Service', () => {
        let httpClient: HttpClient = null;
      });`,
      filename: 'foo/bar.js',
      errors: [{
        message: (
          'An instance of HttpClient is found in this file. You are not' +
          ' allowed to create http requests from files that are not backend' +
          ' api services.')
      }],
    },
  ]
});
