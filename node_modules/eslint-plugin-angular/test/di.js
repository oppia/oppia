'use strict';

// ------------------------------------------------------------------------------
// Requirements
// ------------------------------------------------------------------------------

var rule = require('../rules/di');
var RuleTester = require('eslint').RuleTester;


var angularNamedObjectList = ['value', 'factory', 'service', 'provider', 'controller', 'filter', 'directive'];
var angularObjectList = ['run', 'config'];


var valid = [];
var invalid = [];

angularObjectList.forEach(function(object) {
    valid.push({
        code: 'angular.' + object + '(function() {});',
        options: ['function']
    }, {
        code: 'angular.' + object + '([function() {}]);',
        options: ['array']
    }, {
        code: 'angular.' + object + '(["Service1", function(Service1) {}]);',
        options: ['array']
    }, {
        code: 'angular.' + object + '(myFunction);function MyFunction() {}',
        options: ['function']
    });

    invalid.push({
        code: 'angular.' + object + '(function() {});',
        options: ['array'],
        errors: [{message: 'You should use the array syntax for DI'}]
    }, {
        code: 'angular.' + object + '([function() {}]);',
        options: ['function'],
        errors: [{message: 'You should use the function syntax for DI'}]
    }, {
        code: 'angular.' + object + '(["Service1", function() {}]);',
        options: ['array'],
        errors: [{message: 'The signature of the method is incorrect'}]
    }, {
        code: 'angular.' + object + '([function(Service1) {}]);',
        options: ['array'],
        errors: [{message: 'The signature of the method is incorrect'}]
    });
});

angularNamedObjectList.forEach(function(object) {
    valid.push({
        code: 'angular.' + object + '("name", function() {});',
        options: ['function']
    }, {
        code: 'angular.' + object + '("name", [function() {}]);',
        options: ['array']
    }, {
        code: 'angular.' + object + '("name", ["Service1", function(Service1) {}]);',
        options: ['array']
    }, {
        code: 'angular.' + object + '("name", myFunction);function MyFunction() {}',
        options: ['function']
    });

    invalid.push({
        code: 'angular.' + object + '("name", function() {});',
        options: ['array'],
        errors: [{message: 'You should use the array syntax for DI'}]
    }, {
        code: 'angular.' + object + '("name", [function() {}]);',
        options: ['function'],
        errors: [{message: 'You should use the function syntax for DI'}]
    }, {
        code: 'angular.' + object + '("name", ["Service1", function() {}]);',
        options: ['array'],
        errors: [{message: 'The signature of the method is incorrect'}]
    }, {
        code: 'angular.' + object + '("name", [function(Service1) {}]);',
        options: ['array'],
        errors: [{message: 'The signature of the method is incorrect'}]
    });
});


valid.push({
    code: 'vm.navRoutes = states.filter(x).sort(y);',
    options: ['function']
}, {
    code: 'vm.navRoutes = states.filter(x).sort(y);',
    options: ['array']
}, {
    code: 'mocha.run();',
    options: ['array']
});
// ------------------------------------------------------------------------------
// Tests
// ------------------------------------------------------------------------------

var eslintTester = new RuleTester();
eslintTester.run('di', rule, {
    valid: valid,
    invalid: invalid
});
