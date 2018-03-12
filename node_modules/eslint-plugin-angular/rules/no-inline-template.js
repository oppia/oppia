'use strict';

module.exports = function(context) {
    // Extracts any HTML tags.
    var regularTagPattern = /<(.+?)>/g;
    // Extracts self closing HTML tags.
    var selfClosingTagPattern = /<(.+?)\/>/g;

    var allowSimple = (context.options[0] && context.options[0].allowSimple) !== false;

    function reportComplex(node) {
        context.report(node, 'Inline template is too complex. Use an external template instead');
    }

    return {
        Property: function(node) {
            if (node.key.name !== 'template' || node.value.type !== 'Literal') {
                return;
            }
            if (!allowSimple) {
                context.report(node, 'Inline templates are not allowed. Use an external template instead');
            }
            if ((node.value.value.match(regularTagPattern) || []).length > 2) {
                return reportComplex(node);
            }
            if ((node.value.value.match(selfClosingTagPattern) || []).length > 1) {
                return reportComplex(node);
            }
            if (node.value.raw.indexOf('\\') !== -1) {
                reportComplex(node);
            }
        }
    };
};

module.exports.schema = [{
    allowSimple: {
        type: 'boolean'
    }
}];
