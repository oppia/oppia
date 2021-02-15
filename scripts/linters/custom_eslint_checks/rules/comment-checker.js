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
 * @fileoverview Lint check to ensure that comments follow correct style.
 */

'use strict';


/**
 * This is a comment
 * and this one also.
 */

 // @ts-expect-error
 // @ts-ignore
 // --params
 // http://
 // https://
 // eslint-disable
 // eslint-enable

module.exports = {
  meta: {
    type: 'layout',
    docs: {
      description: (
        'Lint check to ensure that comments follow correct style.'),
      category: 'Stylistic Issues',
      recommended: true
    },
    fixable: null,
    schema: [],
    messages: {
      invalidPunctuation: 'Use correct punctuation at the end of comment.'
    }
  },

  create: function(context) {
    const sourceCode = context.getSourceCode();

    return {
      Program() {
        var comments = [];
        const commentTokens = sourceCode.getAllComments();
        commentTokens.forEach((token) => {
          if (token.type !== 'Shebang') {
            comments.push(token);
          }
        });
      }
    };
  }
};
