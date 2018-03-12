'use strict';

// ------------------------------------------------------------------------------
// Requirements
// ------------------------------------------------------------------------------

var rule = require('../rules/typecheck-object');
var RuleTester = require('eslint').RuleTester;

// ------------------------------------------------------------------------------
// Tests
// ------------------------------------------------------------------------------

var eslintTester = new RuleTester();
eslintTester.run('typecheck-object', rule, {
    valid: [
        'angular.isObject({})'
    ],
    invalid: [
        {code: 'typeof variable === "object"', errors: [{message: 'You should use the angular.isObject method'}]},
        {code: '"object" === typeof variable', errors: [{message: 'You should use the angular.isObject method'}]},
        {code: 'variable === "object"', errors: [{message: 'You should use the angular.isObject method'}]},
        {code: '"object" === variable', errors: [{message: 'You should use the angular.isObject method'}]},
        {code: 'typeof variable !== "object"', errors: [{message: 'You should use the angular.isObject method'}]},
        {code: '"object" !== typeof variable', errors: [{message: 'You should use the angular.isObject method'}]},
        {code: 'variable !== "object"', errors: [{message: 'You should use the angular.isObject method'}]},
        {code: '"object" !== variable', errors: [{message: 'You should use the angular.isObject method'}]},

        {code: 'Object.prototype.toString.call(variable) === "[object Object]"', errors: [{message: 'You should use the angular.isObject method'}]},
        {code: '"[object Object]" === Object.prototype.toString.call(variable)', errors: [{message: 'You should use the angular.isObject method'}]},
        {code: 'variable === "[object Object]"', errors: [{message: 'You should use the angular.isObject method'}]},
        {code: '"[object Object]" === variable', errors: [{message: 'You should use the angular.isObject method'}]},
        {code: 'Object.prototype.toString.call(variable) !== "[object Object]"', errors: [{message: 'You should use the angular.isObject method'}]},
        {code: '"[object Object]" !== Object.prototype.toString.call(variable)', errors: [{message: 'You should use the angular.isObject method'}]},
        {code: 'variable !== "[object Object]"', errors: [{message: 'You should use the angular.isObject method'}]},
        {code: '"[object Object]" !== variable', errors: [{message: 'You should use the angular.isObject method'}]}
    ]
});
