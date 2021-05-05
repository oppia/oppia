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
 * @fileoverview Add lint check to ensure that all private functions
 *      /variables names
 *      start with _,and that all functions/variables that
 *      start with _ are tagged as private.
 */

'use strict';

const console = require("node:console");
const { isVariableDeclaration } = require("typescript");
const { global } = require("yargs");

// TODO(#10479): Implement this rule using the nodes instead of tokens.

module.exports = {
    meta: {
        type: "suggestion",
        docs: {
          description: (
            'Add lint check to ensure that all private functions/' +
            'variables names start with _, and that all functions/variables' +
            'that start with _ are tagged as private'),
            category: "Possible Errors",
            recommended: true,
            url: "https://eslint.org/docs/rules/no-extra-semi"
        },
        fixable: "code",
        schema: [], 
        messages: {
          expectedPriv: 'Functions/Variables starting with _ should be private',
          expected_ : 'Private functions/variables should start with _'
        }
    },
    create: function(context) {
      var checkPrivWith_ = function(testVarNode, testVar) {
        if (!testVar.startsWith('_') && testVar.getScope() != 'global') {
          context.report({
            testVarNode,
            loc: testVarNode.loc,
            messageId: 'Private variables should start with _'
          });
        }
      };

      var checkvar = function(node, testVar) {
        checkPrivWith_(node, testVar);
        //check_WithPriv(node, testvar);
      };
      
      var getvar = function(node) {
        return getDeclaredVariables(node);
      };
      
      return {
        CallExpression(node) {
            const testVarNode = node.arguments[0];
            var testVar = getvar(testVarNode);
            checkvar(testVarNode, testVar);
        }
      };
    },
};
