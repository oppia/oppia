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
 * @fileoverview Lint check to disallow
 * identifier phrase
 */

'use strict';

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: (
        'Lint check to disallow usage of identifier phrase'),
      category: 'Best Practices',
      recommended: true,
    },
    fixable: null,
    schema: [{
      type: 'object',
      properties: {
        disallowedPhrases: {
          type: 'array'
        }
      },
      additionalProperties: false
    }],
    messages: {
      disallowMessage: (
        'Please do not use word "{{identifierWord}}"')
    },
  },

  create: function(context) {
    var disallowedPhrases = [];
    if (context.options[0] && context.options[0].disallowedPhrases) {
      disallowedPhrases = context.options[0].disallowedPhrases;
    }

    return {
      Identifier: function(node) {
        var identifierName = node.name.toLowerCase();
        for (var i = 0; i < disallowedPhrases.length; i++) {
          if (identifierName.includes(disallowedPhrases[i])) {
            context.report({
              node: node,
              messageId: 'disallowMessage',
              data: {
                identifierWord: disallowedPhrases[i]
              }
            });
          }
        }
      }
    };
  }
};
