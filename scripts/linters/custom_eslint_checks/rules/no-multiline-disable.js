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
 * @fileoverview Lint check to ensure that there is a break after parenthesis
 * in case of multiline hanging indentation.
 */

'use strict';

module.exports = {
  meta: {
    type: 'layout',
    docs: {
      description: (
        'Lint check to ensure that there is a break after parenthesis in case' +
        ' of multiline hanging indentation'),
      category: 'Stylistic Issues',
      recommended: true
    },
    fixable: null,
    schema: [],
    messages: {
      noMultilineDisable: 'Do not use disable statement for multilines'
    }
  },

  create: function(context) {
    const sourceCode = context.getSourceCode();
    const lines = sourceCode.lines;

    var processComment = function(comment) {
      if (comment.value.includes('eslint-disable ')) {
        const line = lines[comment.loc.start.line - 1].trim();
        if (line.startsWith('/*') || line.startsWith(line.startsWith('//'))) {
          context.report({
            comment,
            loc: comment.loc,
            messageId: 'noMultilineDisable'
          });
        }
      }
    };

    return {
      Program() {
        const comments = sourceCode.getAllComments();
        comments.filter(
          token => token.type !== 'Shebang').forEach(processComment);
      }
    };
  }
};
