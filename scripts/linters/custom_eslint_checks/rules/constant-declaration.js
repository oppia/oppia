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
 * @fileoverview Lint check to ensure that constants are not declared in files
 * other than *.constants.ajs.ts and there are no multiple constants.
 */

'use strict';

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Lint check to ensure that constants are not declared in files other' +
        ' than *.constants.ajs.ts and there are no multiple constants',
      category: 'Possible Errors',
      recommended: true,
    },
    fixable: null,
    schema: [],
    messages: {
      nonConstantFile: 'Constant is used in non constant file.',
      multipleConstant: 'There are mutliple constants in this file.',
      notFoundAsConst:
        "Please add 'as const' at the end of the constant " +
        'declaration. A constants file should have the following ' +
        'structure:\n export const SomeConstants = { ... } as const;',
    },
  },

  create: function (context) {
    var constantsDeclarations = [];
    var args;
    var filename = context.getFilename();

    var selector =
      'CallExpression[callee.property.name=constant]' +
      '[callee.object.callee.object.name=angular]';

    if (filename.endsWith('constants.ts')) {
      return {
        VariableDeclarator: function (node) {
          if (
            node.init.type !== 'TSAsExpression' ||
            node.init.typeAnnotation.typeName.name !== 'const'
          ) {
            context.report({
              node: node,
              messageId: 'notFoundAsConst',
            });
          }
        },
      };
    }

    return {
      [selector]: function (node) {
        if (!filename.endsWith('.constants.ajs.ts')) {
          context.report({
            node: node,
            messageId: 'nonConstantFile',
          });
        }
        args = node.arguments[0].value;
        if (!constantsDeclarations.includes(args)) {
          constantsDeclarations.push(args);
        } else {
          context.report({
            node: node.arguments[0],
            messageId: 'multipleConstant',
          });
        }
      },
    };
  },
};
