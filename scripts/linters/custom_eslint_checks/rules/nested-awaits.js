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
 * @fileoverview Rule to have nested awaits for
 * await (await browser.switchTo().activeElement()).sendKeys(explanation);
 * with no exceptions.
 */

'use strict';

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: `Use nested awaits without any exception for
       await (await browser.switchTo().activeElement()).sendKeys(explanation);`,
      category: 'Best Practices',
      recommended: true,
    },
    fixable: null,
    schema: [],
    messages: {
      nestedAwaits: `Only use nested awaits for 
       await (await browser.switchTo().activeElement()).sendKeys(explanation);`,
    },
  },

  create: function(context) {
    return {
      CallExpression(node) {
        if (node && node.callee && node.callee.property && 
          node.callee.property.name === 'activeElement' && 
          node.callee.object.callee.property.name  === 'switchTo' && 
          node.callee.object.callee.object.name === 'browser') {
          if (node.parent.type !== 'AwaitExpression') {
            context.report({
              node: node,
              message: 'Please use nested awaits like: ' + 
              'await (await browser.switchTo().activeElement()).sendKeys(explanation);'
            });
          }
        }
        if (node && node.callee && node.callee.property && 
          node.callee.property.name === 'sendKeys' && node.callee.object.type === 
          'AwaitExpression' && node.callee.object.argument.callee.property.name === 
          'activeElement' &&
          node.callee.object.argument.callee.object.callee.property.name === 
          'switchTo' && 
          node.callee.object.argument.callee.object.callee.object.name === 
          'browser') {
          if (node.parent.type !== 'AwaitExpression') {
            context.report({
              node: node,
              message: 'Please use nested awaits like: ' + 
              'await (await browser.switchTo().activeElement()).sendKeys(explanation);'
            });
          }
        }
      }
    };
  }
};
