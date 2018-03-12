'use strict';

// ------------------------------------------------------------------------------
// Requirements
// ------------------------------------------------------------------------------

var rule = require('../rules/no-service-method');
var RuleTester = require('eslint').RuleTester;

// ------------------------------------------------------------------------------
// Tests
// ------------------------------------------------------------------------------

var eslintTester = new RuleTester();

var valid = [];

['factory', 'provider', 'constant', 'value'].forEach(function(syntax) {
    valid.push({
        code: 'app.' + syntax + '("eslintService", function() {});'
    }, {
        code: 'app.' + syntax + '("eslintService", function() {});'
    }, {
        code: 'app.' + syntax + '("eslintService", function() {});'
    });
});


eslintTester.run('no-service-method', rule, {
    valid: valid,
    invalid: [{
        code: 'app.service("Service", function() {});',
        options: ['eslint'],
        errors: [{message: 'You should prefer the factory() method instead of service()'}]
    }, {
        code: 'app.service("Service", [function() {}]);',
        options: [/^eslint/],
        errors: [{message: 'You should prefer the factory() method instead of service()'}]
    }]
});
