// Copyright 2026 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Tests for the no-view-encapsulation-none.js file.
 */

'use strict';

const path = require('path');

const rule = require('./no-view-encapsulation-none');
const RuleTester = require('eslint').RuleTester;

const ruleTester = new RuleTester({
  parserOptions: {
    ecmaVersion: 2015,
    sourceType: 'module',
  },
});

ruleTester.run('no-view-encapsulation-none', rule, {
  valid: [
    {
      code: `
        const componentDefinition = {
          encapsulation: ViewEncapsulation.Emulated,
        };
      `,
      filename:
        'core/templates/pages/topic-viewer-page/topic-viewer-page.component.ts',
    },
    {
      code: `
        const componentDefinition = {
          // We need ViewEncapsulation.None because this component styles projected content globally.
          encapsulation: ViewEncapsulation.None,
        };
      `,
      filename:
        'core/templates/pages/topic-viewer-page/topic-viewer-page.component.ts',
    },
    {
      code: `
        const componentDefinition = {
          encapsulation: ViewEncapsulation.None,
        };
      `,
      filename: path.join(
        process.cwd(),
        'core/templates/pages/story-viewer-page/story-viewer-page-root.component.ts'
      ),
    },
    {
      code: `
        const componentDefinition = {
          /*
           * We need ViewEncapsulation.None because this component styles projected content globally.
           */
          encapsulation: ViewEncapsulation.None,
        };
      `,
      filename:
        'core/templates/pages/topic-viewer-page/topic-viewer-page.component.ts',
    },
    {
      code: `
        const componentDefinition = {
          encapsulation: ThemeEncapsulation.None,
        };
      `,
      filename:
        'core/templates/pages/topic-viewer-page/topic-viewer-page.component.ts',
    },
    {
      code: `
        const componentDefinition = {
          encapsulation: ViewEncapsulation['None'],
        };
      `,
      filename:
        'core/templates/pages/topic-viewer-page/topic-viewer-page.component.ts',
    },
  ],

  invalid: [
    {
      code: `
        const componentDefinition = {
          encapsulation: ViewEncapsulation.None,
        };
      `,
      filename:
        'core/templates/pages/topic-viewer-page/topic-viewer-page.component.ts',
      errors: [
        {
          message:
            'Avoid ViewEncapsulation.None. Add a comment immediately above this usage in the format "We need ViewEncapsulation.None because ...".',
        },
      ],
    },
    {
      code: `
        const componentDefinition = {
          // This is needed for styling.
          encapsulation: ViewEncapsulation.None,
        };
      `,
      filename:
        'core/templates/pages/topic-viewer-page/topic-viewer-page.component.ts',
      errors: [
        {
          message:
            'Avoid ViewEncapsulation.None. Add a comment immediately above this usage in the format "We need ViewEncapsulation.None because ...".',
        },
      ],
    },
    {
      code: `
        const componentDefinition = {
          // We need ViewEncapsulation.None because this component styles projected content globally.

          encapsulation: ViewEncapsulation.None,
        };
      `,
      filename:
        'core/templates/pages/topic-viewer-page/topic-viewer-page.component.ts',
      errors: [
        {
          message:
            'Avoid ViewEncapsulation.None. Add a comment immediately above this usage in the format "We need ViewEncapsulation.None because ...".',
        },
      ],
    },
  ],
});
