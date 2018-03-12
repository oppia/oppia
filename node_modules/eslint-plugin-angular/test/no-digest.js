'use strict';

// ------------------------------------------------------------------------------
// Requirements
// ------------------------------------------------------------------------------

var rule = require('../rules/no-digest');
var RuleTester = require('eslint').RuleTester;

// ------------------------------------------------------------------------------
// Tests
// ------------------------------------------------------------------------------

var eslintTester = new RuleTester();
eslintTester.run('no-digest', rule, {
    valid: [
        '$scope.$apply(function() {})',
        '$rootScope.$apply(function() {})'
    ],
    invalid: [
        {code: '$scope.$digest()', errors: [{message: 'Instead of using the $digest() method, you should prefer $apply()'}]},
        {code: '$rootScope.$digest()', errors: [{message: 'Instead of using the $digest() method, you should prefer $apply()'}]}
    ]
});
