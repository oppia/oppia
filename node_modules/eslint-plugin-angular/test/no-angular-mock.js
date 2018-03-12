'use strict';

// ------------------------------------------------------------------------------
// Requirements
// ------------------------------------------------------------------------------

var rule = require('../rules/no-angular-mock');
var RuleTester = require('eslint').RuleTester;

// ------------------------------------------------------------------------------
// Tests
// ------------------------------------------------------------------------------

var eslintTester = new RuleTester();
eslintTester.run('no-angular-mock', rule, {
    valid: [
        'dump();',
        'inject();',
        'module();'
    ],
    invalid: [{
        code: 'angular.mock.dump();',
        errors: [{message: 'You should use the "dump" method available in the window object.'}]
    }, {
        code: 'angular.mock.inject();',
        errors: [{message: 'You should use the "inject" method available in the window object.'}]
    }, {
        code: 'angular.mock.module();',
        errors: [{message: 'You should use the "module" method available in the window object.'}]
    }
    ]
});
