'use strict';

// ------------------------------------------------------------------------------
// Requirements
// ------------------------------------------------------------------------------

var rule = require('../rules/empty-controller');
var RuleTester = require('eslint').RuleTester;

// ------------------------------------------------------------------------------
// Tests
// ------------------------------------------------------------------------------

var eslintTester = new RuleTester();
eslintTester.run('empty-controller', rule, {
    valid: [{
        code: 'app.controller("ctrl", function() {console.log("ok");});'
    },
    {
        code: 'app.controller("ctrl", ["service1", function(service1) {console.log("ok");}]);'
    }],
    invalid: [
        {
            code: 'app.controller("ctrl", function() {});',
            errors: [{message: 'The ctrl controller is useless because empty. You can remove it from your Router configuration or in one of your view'}]
        },
        {
            code: 'app.controller("ctrl", ["service1", function(service1) {}]);',
            errors: [{message: 'The ctrl controller is useless because empty. You can remove it from your Router configuration or in one of your view'}]
        }
    ]
});
