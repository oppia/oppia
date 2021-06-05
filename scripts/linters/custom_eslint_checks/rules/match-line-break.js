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
 * @fileoverview Lint check to ensure that  the line breaks between the
 * dependencies listed in the controller of a directive or service exactly
 * match those between the arguments of the controller function.
 */

'use strict';

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: (
        'Lint check to ensure that  the line breaks between the dependencies' +
        ' listed in the controller of a directive or service exactly' +
        'match those between the arguments of the controller function'),
      category: 'Possible Errors',
      recommended: true,
    },
    fixable: null,
    schema: [],
    messages: {
      matchLineBreak: (
        'Please ensure that the line breaks pattern between the dependencies' +
        ' mentioned as strings and the dependencies mentioned as function' +
        ' parameters for the corresponding controller should exactly match.')
    },
  },

  create: function(context) {
    var getDepLiteralLines = function(controllerArg, nameIn) {
      var con = {};
      var startLine = 1000000;
      controllerArg.forEach(function(Literal) {
        var lineNo = Literal.loc.start.line;
        if (startLine > lineNo) {
          startLine = lineNo;
        }
        con[Literal[nameIn]] = lineNo - startLine;
      });
      return con;
    };
    return {
      'CallExpression[callee.property.name=directive]': function(node) {
        var arg = node.arguments;
        if (arg.length !== 2 || arg[1].type !== 'ArrayExpression') {
          return;
        }
        var lengthOfElements = arg[1].elements.length;
        var functionNode = arg[1].elements[lengthOfElements - 1];
        if (functionNode.body.body[0].type !== 'ReturnStatement') {
          return;
        }
        var returnDictProp = functionNode.body.body[0].argument.properties;
        returnDictProp.forEach(function(property) {
          if (property.key.name === 'controller') {
            var lenPropElements = property.value.elements.length;
            var controllerFun = property.value.elements[lenPropElements - 1];
            var controllerArg = (
              property.value.elements.slice(0, lenPropElements - 1));
            var literalLines = getDepLiteralLines(controllerArg, 'value');
            var funcParamsLine = (
              getDepLiteralLines(controllerFun.params, 'name'));
            if (
              JSON.stringify(literalLines) !== JSON.stringify(funcParamsLine)) {
              context.report({
                node: property,
                messageId: 'matchLineBreak'
              });
            }
          }
        });
      }
    };
  }
};
