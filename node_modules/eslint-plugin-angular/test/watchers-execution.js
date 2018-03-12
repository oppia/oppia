'use strict';

// ------------------------------------------------------------------------------
// Requirements
// ------------------------------------------------------------------------------

var rule = require('../rules/watchers-execution');
var RuleTester = require('eslint').RuleTester;

// ------------------------------------------------------------------------------
// Tests
// ------------------------------------------------------------------------------

var eslintTester = new RuleTester();
eslintTester.run('watchers-execution', rule, {
    valid: [
        {code: '$scope.$apply(function() {})', options: ['$apply']},
        {code: '$rootScope.$apply(function() {})', options: ['$apply']},
        {code: '$scope.$digest()', options: ['$digest']},
        {code: '$rootScope.$digest()', options: ['$digest']}
    ],
    invalid: [
        {code: '$scope.$apply(function() {})', options: ['$digest'], errors: [{message: 'Instead of using the $apply() method, you should prefer $digest()'}]},
        {code: '$rootScope.$apply(function() {})', options: ['$digest'], errors: [{message: 'Instead of using the $apply() method, you should prefer $digest()'}]},
        {code: '$scope.$digest()', options: ['$apply'], errors: [{message: 'Instead of using the $digest() method, you should prefer $apply()'}]},
        {code: '$rootScope.$digest()', options: ['$apply'], errors: [{message: 'Instead of using the $digest() method, you should prefer $apply()'}]}
    ]
});
