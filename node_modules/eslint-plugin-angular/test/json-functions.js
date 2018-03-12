'use strict';

// ------------------------------------------------------------------------------
// Requirements
// ------------------------------------------------------------------------------

var rule = require('../rules/json-functions');
var RuleTester = require('eslint').RuleTester;

// ------------------------------------------------------------------------------
// Tests
// ------------------------------------------------------------------------------

var eslintTester = new RuleTester();
eslintTester.run('json-functions', rule, {
    valid: [
        'angular.toJson({})',
        'angular.toJson({}, true)',
        'angular.toJson({}, 2)',
        'angular.toJson([])',
        'angular.toJson([], true)',
        'angular.toJson([], 2)',
        'angular.fromJson("{}")'
    ],
    invalid: [
        {code: 'JSON.parse("{}")', errors: [{message: 'You should use the fromJson method instead of JSON.parse'}]},
        {code: 'JSON.stringify({})', errors: [{message: 'You should use the toJson method instead of JSON.stringify'}]},
        {code: 'JSON.stringify({}, function() {})', errors: [{message: 'You should use the toJson method instead of JSON.stringify'}]},
        {code: 'JSON.stringify({}, function() {}, 2)', errors: [{message: 'You should use the toJson method instead of JSON.stringify'}]}
    ]
});
