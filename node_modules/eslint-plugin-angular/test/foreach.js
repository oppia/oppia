'use strict';

// ------------------------------------------------------------------------------
// Requirements
// ------------------------------------------------------------------------------

var rule = require('../rules/foreach');
var RuleTester = require('eslint').RuleTester;

// ------------------------------------------------------------------------------
// Tests
// ------------------------------------------------------------------------------

var eslintTester = new RuleTester();
eslintTester.run('foreach', rule, {
    valid: [
        'angular.forEach(variable, function() {})'
    ],
    invalid: [
        {code: 'variable.forEach(function() {})', errors: [{message: 'You should use the angular.forEach method'}]}
    ]
});
