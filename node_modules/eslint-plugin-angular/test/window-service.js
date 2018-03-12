'use strict';

// ------------------------------------------------------------------------------
// Requirements
// ------------------------------------------------------------------------------

var rule = require('../rules/window-service');
var RuleTester = require('eslint').RuleTester;

// ------------------------------------------------------------------------------
// Tests
// ------------------------------------------------------------------------------

var eslintTester = new RuleTester();
eslintTester.run('window-service', rule, {
    valid: [
        '$window.location.href = ""',
        '$window.alert("")',
        'window.setInterval(function() {}, 0)',
        'window.setTimeout(function() {}, 0)',
        'window.document',
        'window.document.title'
    ],
    invalid: [
        {code: 'window.alert("")', errors: [{message: 'You should use the $window service instead of the default window object'}]},
        {code: 'window.location.href = ""', errors: [{message: 'You should use the $window service instead of the default window object'}]}
    ]
});
