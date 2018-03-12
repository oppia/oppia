'use strict';

// ------------------------------------------------------------------------------
// Requirements
// ------------------------------------------------------------------------------

var rule = require('../rules/service-name');
var RuleTester = require('eslint').RuleTester;

// ------------------------------------------------------------------------------
// Tests
// ------------------------------------------------------------------------------

var eslintTester = new RuleTester();
var valid = [];
var invalid = [];
['service', 'factory', 'provider', 'constant', 'value'].forEach(function(syntax) {
    valid.push({
        code: 'app.' + syntax + '("eslintService", function() {});',
        options: ['eslint']
    }, {
        code: 'app.' + syntax + '("eslintService", function() {});',
        options: [/^eslint/]
    }, {
        code: 'app.' + syntax + '("eslintService", function() {});',
        options: [undefined]
    }, {
        code: 'app.' + syntax + '("eslintService", function() {});',
        options: ['/^eslint/']
    });

    invalid.push({
        code: 'app.' + syntax + '("Service", function() {});',
        options: ['eslint'],
        errors: [{message: 'The Service service should be prefixed by eslint'}]
    }, {
        code: 'app.' + syntax + '("esLintService", function() {});',
        options: ['eslint'],
        errors: [{message: 'The esLintService service should be prefixed by eslint'}]
    }, {
        code: 'app.' + syntax + '("Service", function() {});',
        options: [/^eslint/],
        errors: [{message: 'The Service service should follow this pattern: /^eslint/'}]
    }, {
        code: 'app.' + syntax + '("Service", function() {});',
        options: ['/^eslint/'],
        errors: [{message: 'The Service service should follow this pattern: /^eslint/'}]
    }, {
        code: 'app.' + syntax + '("$Service", function() {});',
        options: [/^eslint/],
        errors: [{message: 'The $Service service should not start with "$". This is reserved for AngularJS services'}]
    });
});


eslintTester.run('service-name', rule, {
    valid: valid,
    invalid: invalid
});
