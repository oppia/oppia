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
 * @fileoverview Tests for the no-bypass-security-phrase.js file.
 */

'use strict';

var rule = require('./no-bypass-security-phrase');
var RuleTester = require('eslint').RuleTester;

var ruleTester = new RuleTester();
ruleTester.run('no-bypass-security-phrase', rule, {
  valid: [
    {
      code: 'SecurityTrustResourceUrl()',
    },
  ],

  invalid: [
    {
      code: 'this.sanitizer.bypassSecurityTrustResourceUrl(base64ImageData)',
      errors: [
        {
          message: 'Please do not use phrase "bypassSecurity"',
        },
      ],
    },
  ],
});
