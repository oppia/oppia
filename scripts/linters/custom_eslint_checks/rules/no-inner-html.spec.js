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
 * @fileoverview Tests for the no-inner-html.js file.
 */

'use strict';

var rule = require('./no-inner-html');
var RuleTester = require('eslint').RuleTester;

var ruleTester = new RuleTester();
ruleTester.run('no-inner-html', rule, {
  valid: [
    `if (!('outerHTML' in SVGElement.prototype)) {
      Object.defineProperty(SVGElement.prototype, 'outerHTML', {
        get: function() {
          $node = this.cloneNode(true);
          $temp.appendChild($node);
          return $temp;
        },
      });
    }`,
  ],

  invalid: [
    {
      code: `if (!('outerHTML' in SVGElement.prototype)) {
          Object.defineProperty(SVGElement.prototype, 'outerHTML', {
            get: function() {
              $node = this.cloneNode(true);
              $temp.appendChild($node);
              return $temp.innerHTML;
            },
          });
        }`,
      errors: [
        {
          message: 'Please do not use innerHTML property.',
        },
      ],
    },
  ],
});
