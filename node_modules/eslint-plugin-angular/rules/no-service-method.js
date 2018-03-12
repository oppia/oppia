'use strict';

module.exports = function(context) {
    var utils = require('./utils/utils');

    return {

        CallExpression: function(node) {
            var prefix = context.options[0];
            if (prefix === undefined) {
                return;
            }

            if (utils.isAngularComponent(node) && node.callee.property.name === 'service') {
                context.report(node, 'You should prefer the factory() method instead of service()', {});
            }
        }
    };
};
