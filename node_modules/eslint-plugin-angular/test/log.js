'use strict';

// ------------------------------------------------------------------------------
// Requirements
// ------------------------------------------------------------------------------

var rule = require('../rules/log');
var RuleTester = require('eslint').RuleTester;

// ------------------------------------------------------------------------------
// Tests
// ------------------------------------------------------------------------------

var eslintTester = new RuleTester();
eslintTester.run('log', rule, {
    valid: [
        '$log.log("log")',
        '$log.info("log")',
        '$log.warn("log")',
        '$log.error("log")',
        '$log.debug("log")'
    ],
    invalid: [
        {code: 'console.log("log")', errors: [{message: 'You should use the "log" method of the AngularJS Service $log instead of the console object'}]},
        {code: 'console.debug("log")', errors: [{message: 'You should use the "debug" method of the AngularJS Service $log instead of the console object'}]},
        {code: 'console.error("log")', errors: [{message: 'You should use the "error" method of the AngularJS Service $log instead of the console object'}]},
        {code: 'console.info("log")', errors: [{message: 'You should use the "info" method of the AngularJS Service $log instead of the console object'}]},
        {code: 'console.warn("log")', errors: [{message: 'You should use the "warn" method of the AngularJS Service $log instead of the console object'}]}
    ]
});
