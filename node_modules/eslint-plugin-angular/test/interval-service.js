'use strict';

// ------------------------------------------------------------------------------
// Requirements
// ------------------------------------------------------------------------------

var rule = require('../rules/interval-service');
var RuleTester = require('eslint').RuleTester;

// ------------------------------------------------------------------------------
// Tests
// ------------------------------------------------------------------------------

var eslintTester = new RuleTester();
eslintTester.run('interval-service', rule, {
    valid: [
        '$interval(function() {})',
        '$interval(function() {}, 1000)',
        '$interval(function() {}, 1000, 2)',
        '$interval(function() {}, 1000, true)'
    ],
    invalid: [
        {code: 'window.setInterval(function() {}, 1000)', errors: [{message: 'You should use the $interval service instead of the default window.setInterval method'}]},
        {code: 'window.setInterval(function() {}, 1000, param1)', errors: [{message: 'You should use the $interval service instead of the default window.setInterval method'}]},
        {code: 'setInterval(function() {}, 1000)', errors: [{message: 'You should use the $interval service instead of the default window.setInterval method'}]},
        {code: 'setInterval(function() {}, 1000, param1)', errors: [{message: 'You should use the $interval service instead of the default window.setInterval method'}]}
    ]
});
