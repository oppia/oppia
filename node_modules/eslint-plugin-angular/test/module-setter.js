'use strict';

// ------------------------------------------------------------------------------
// Requirements
// ------------------------------------------------------------------------------

var rule = require('../rules/module-setter');
var RuleTester = require('eslint').RuleTester;

// ------------------------------------------------------------------------------
// Tests
// ------------------------------------------------------------------------------

var eslintTester = new RuleTester();
eslintTester.run('module-setter', rule, {
    valid: [
        'angular.module("module", []);'
    ],
    invalid: [
        {
            code: 'var app = angular.module("module", []);',
            errors: [{message: 'Declare modules without a variable using the setter syntax.'}]
        }, /* {
            code: 'let app = angular.module("module", []);',
            errors: [{message: 'Declare modules without a variable using the setter syntax.'}]
        }, {
            code: 'const app = angular.module("module", []);',
            errors: [{message: 'Declare modules without a variable using the setter syntax.'}]
        } */ {
            code: 'app = angular.module("module", []);',
            errors: [{message: 'Declare modules without a variable using the setter syntax.'}]
        }
    ]
});
