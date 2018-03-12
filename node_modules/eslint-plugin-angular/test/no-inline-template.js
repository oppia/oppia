'use strict';

// ------------------------------------------------------------------------------
// Requirements
// ------------------------------------------------------------------------------

var rule = require('../rules/no-inline-template');
var RuleTester = require('eslint').RuleTester;

// ------------------------------------------------------------------------------
// Tests
// ------------------------------------------------------------------------------

var eslintTester = new RuleTester();
eslintTester.run('no-inline-template', rule, {
    valid: [
        'function foo() {return {template:"<div></div>"};}',
        'function foo() {return {template:getTemplate()};}',
        'function foo() {return {bar:"baz"};}',
        'function foo() {return {template:"<img/>"};}'
    ],
    invalid: [
        {
            code: 'function foo() {return {template:"<div><div></div></div>"};}',
            errors: [{message: 'Inline template is too complex. Use an external template instead'}]
        }, {
            code: 'function foo() {return {template:"<img/><img/>"};}',
            errors: [{message: 'Inline template is too complex. Use an external template instead'}]
        }, {
            code: 'function foo() {return {template:"<div ng-class=\'{\\\'error\\\':vm.error}\'></div>"};}',
            errors: [{message: 'Inline template is too complex. Use an external template instead'}]
        }, {
            code: 'function foo() {return {template:"<img ng-src=\\"\\\'logo.png\\\'\\"/>"};}',
            errors: [{message: 'Inline template is too complex. Use an external template instead'}]
        },
        // disallow simple
        {
            code: 'function foo() {return {template:""};}',
            options: [{allowSimple: false}],
            errors: [{message: 'Inline templates are not allowed. Use an external template instead'}]
        }
    ]
});
