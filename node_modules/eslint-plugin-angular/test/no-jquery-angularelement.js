'use strict';

// ------------------------------------------------------------------------------
// Requirements
// ------------------------------------------------------------------------------

var rule = require('../rules/no-jquery-angularelement');
var RuleTester = require('eslint').RuleTester;

// ------------------------------------------------------------------------------
// Tests
// ------------------------------------------------------------------------------

var eslintTester = new RuleTester();
eslintTester.run('no-jquery-angularelement', rule, {
    valid: [
        'angular.element("#id")'
    ],
    invalid: [
        {code: '$(angular.element("#id"))', errors: [{message: 'angular.element returns already a jQLite element. No need to wrap with the jQuery object'}]},
        {code: 'jQuery(angular.element("#id"))', errors: [{message: 'angular.element returns already a jQLite element. No need to wrap with the jQuery object'}]}
    ]
});
