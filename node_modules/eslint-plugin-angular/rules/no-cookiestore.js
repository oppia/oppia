'use strict';

module.exports = function(context) {
    return {

        MemberExpression: function(node) {
            if (node.object && node.object.name === '$cookieStore') {
                context.report(node, 'Since Angular 1.4, the $cookieStore service is depreacted. Please use now the $cookies service.', {});
            }
        }
    };
};

module.exports.schema = [
    // JSON Schema for rule options goes here
];
