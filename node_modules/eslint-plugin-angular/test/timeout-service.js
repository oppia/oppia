'use strict';

// ------------------------------------------------------------------------------
// Requirements
// ------------------------------------------------------------------------------

var rule = require('../rules/timeout-service');
var RuleTester = require('eslint').RuleTester;

// ------------------------------------------------------------------------------
// Tests
// ------------------------------------------------------------------------------

var eslintTester = new RuleTester();

eslintTester.run('timeout-service', rule, {
    valid: [
        '$timeout(function() {})',
        '$timeout(function() {}, 1000)',
        '$timeout(function() {}, 1000, true)'
    ],
    invalid: [
        {code: 'window.setTimeout(function() {}, 1000)', errors: [{message: 'You should use the $timeout service instead of the default window.setTimeout method'}]},
        {code: 'window.setTimeout(function() {}, 1000, param1)', errors: [{message: 'You should use the $timeout service instead of the default window.setTimeout method'}]},
        {code: 'setTimeout(function() {}, 1000)', errors: [{message: 'You should use the $timeout service instead of the default window.setTimeout method'}]},
        {code: 'setTimeout(function() {}, 1000, param1)', errors: [{message: 'You should use the $timeout service instead of the default window.setTimeout method'}]}
    ]
});
