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
 * @fileoverview Tests for the import-lodash.js file.
 */

'use strict';

var rule = require('./import-lodash');
var RuleTester = require('eslint').RuleTester;

var ruleTester = new RuleTester({
  parserOptions: {
    ecmaVersion: 2016,
  },
  parser: require.resolve('@typescript-eslint/parser'),
});
ruleTester.run('import-lodash', rule, {
  valid: [
    {
      code: 'import cloneDeep from "lodash/cloneDeep";',
    },
  ],

  invalid: [
    {
      code: 'import { cloneDeep }  from "lodash";',
      errors: [
        {
          message:
            'Please do not use "import { someFunction } from \'lodash\'" and' +
            ' "import _ from \'lodash\'". Use "import someFunction from' +
            " 'lodash/someFunction'\" instead.",
        },
      ],
    },
    {
      code: 'import _ from "lodash";',
      errors: [
        {
          message:
            'Please do not use "import { someFunction } from \'lodash\'" and' +
            ' "import _ from \'lodash\'". Use "import someFunction from' +
            " 'lodash/someFunction'\" instead.",
        },
      ],
    },
  ],
});
