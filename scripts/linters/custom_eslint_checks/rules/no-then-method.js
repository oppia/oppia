/**
 * @fileoverview Rule to disallow using .then() method on a variable.
 */

'use strict';

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      dexcription: 'Rule to disallow using .then() method on a variable',
      category: 'Best Practices',
      recommended: true
    },
    fixable: null,
    schema: [],
    messages: {
      avoidMethod: 'Please avoid using .then() method'
    }
  },
  create: function (context) {
    return {
      CallExpression: function (node) {
        if (node.callee.property && node.callee.property.name === 'then') {
          context.report({
            node: node.callee.property,
            loc: node.callee.property.loc,
            messageId: 'avoidMethod'
          });
        }
      }
    };
  }
};
