'use strict';

// ------------------------------------------------------------------------------
// Requirements
// ------------------------------------------------------------------------------

var rule = require('../rules/typecheck-regexp');
var RuleTester = require('eslint').RuleTester;

// ------------------------------------------------------------------------------
// Tests
// ------------------------------------------------------------------------------

var eslintTester = new RuleTester();
eslintTester.run('typecheck-regexp', rule, {
    valid: [
        'angular.isRegexp(/^T/)'
    ],
    invalid: [
        {code: 'Object.prototype.toString.call(value) === "[object RegExp]"', errors: [{message: 'You should use the angular.isRegexp method'}]},
        {code: '"[object RegExp]" === Object.prototype.toString.call(value)', errors: [{message: 'You should use the angular.isRegexp method'}]},
        {code: 'variable === "[object RegExp]"', errors: [{message: 'You should use the angular.isRegexp method'}]},
        {code: '"[object RegExp]" === variable', errors: [{message: 'You should use the angular.isRegexp method'}]},
        {code: 'Object.prototype.toString.call(value) !== "[object RegExp]"', errors: [{message: 'You should use the angular.isRegexp method'}]},
        {code: '"[object RegExp]" !== Object.prototype.toString.call(value)', errors: [{message: 'You should use the angular.isRegexp method'}]},
        {code: 'variable !== "[object RegExp]"', errors: [{message: 'You should use the angular.isRegexp method'}]},
        {code: '"[object RegExp]" !== variable', errors: [{message: 'You should use the angular.isRegexp method'}]}
    ]
});
