'use strict';

module.exports = function(context) {
    var httpMethods = [
        'delete',
        'get',
        'head',
        'jsonp',
        'patch',
        'post',
        'put'
    ];

    function isHttpCall(node) {
        if (node.callee.type === 'MemberExpression') {
            return httpMethods.indexOf(node.callee.property.name) !== -1 ||
                (node.callee.object.type === 'CallExpression' && isHttpCall(node.callee.object));
        }
        if (node.callee.type === 'Identifier') {
            return node.callee.name === '$http';
        }
    }

    return {
        CallExpression: function(node) {
            if (node.callee.type !== 'MemberExpression') {
                return;
            }
            if (node.callee.property.name === 'success' && isHttpCall(node)) {
                return context.report(node, '$http success is deprecated. Use then instead');
            }
            if (node.callee.property.name === 'error' && isHttpCall(node)) {
                context.report(node, '$http error is deprecated. Use then or catch instead');
            }
        }
    };
};
