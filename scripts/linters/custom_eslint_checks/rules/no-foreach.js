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
 * @fileoverview Lint check to ensure that there are no foreach
 * statements.
 */

'use strict';

module.exports = {
    meta: {
      type: 'problem',
      docs: {
        description: (
          'Lint check to ensure that there are no forEach statements'),
        category: 'Possible Errors',
        recommended: true
      },
      fixable: null,
      schema: [],
      messages: {
        noForEach: 'Do not use forEach statements'
      }
    },
  
    create: function(context) {
      const sourceCode = context.getSourceCode();
  
      // var _checkNotForEach = function(node) {
        // if (comment.value.includes('.forEach')) {
        //   context.report({
        //     comment,
        //     loc: comment.loc,
        //     messageId: 'noForEach'
        //   });
        // }
      // };
  
      return {
        // Program() {
        //   const comments = sourceCode.getAllComments();
        //   comments.filter(
        //     token => token.type !== 'Shebang').forEach(
        //     _checkNotForEach);
        // }
        CallExpression(node) {
          if (node.callee.property && 
            node.callee.property.name === 'forEach') {
              context.report({
                node,
                message: "expected no forEach"
              })
            }
        }
      };
    }
  };
