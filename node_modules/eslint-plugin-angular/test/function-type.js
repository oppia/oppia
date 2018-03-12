'use strict';

// ------------------------------------------------------------------------------
// Requirements
// ------------------------------------------------------------------------------

var rule = require('../rules/function-type');
var RuleTester = require('eslint').RuleTester;


var angularObjectList = ['controller', 'filter', 'factory', 'service'];
var valid = [];
var invalid = [];

angularObjectList.forEach(function(object) {
    valid.push({
        code: 'app.' + object + '("name", function(Service1) {});',
        options: ['anonymous']
    }, {
        code: 'app.' + object + '("name", ["Service1", function(Service1) {}]);',
        options: ['anonymous']
    });

    invalid.push({
        code: 'app.' + object + '("name", function(Service1) {});',
        options: ['named'],
        errors: [{message: 'Use named functions instead of anonymous function'}]
    }, {
        code: 'app.' + object + '("name", ["Service1", function(Service1) {}]);',
        options: ['named'],
        errors: [{message: 'Use named functions instead of anonymous function'}]
    });

    invalid.push({
        code: 'function func(Service1) {};app.' + object + '("name", func);',
        options: ['anonymous'],
        errors: [{message: 'Use anonymous functions instead of named function'}]
    }, {
        code: 'function func(Service1) {};app.' + object + '("name", ["Service1", func]);',
        options: ['anonymous'],
        errors: [{message: 'Use anonymous functions instead of named function'}]
    });

    valid.push({
        code: 'function func(Service1) {};app.' + object + '("name", func);',
        options: ['named']
    }, {
        code: 'function func(Service1) {};app.' + object + '("name", ["Service1", func]);',
        options: ['named']
    });
});

// with third param
valid.push({
    code: 'app.controller("name", function(Service1) {});',
    options: ['anonymous', ['controller']]
}, {
    code: 'app.controller("name", ["Service1", function(Service1) {}]);',
    options: ['anonymous', ['controller']]
});

valid.push({
    code: 'var cleanUp;cleanUp = $rootScope.$on("$stateChangeSuccess", function() {vm.currentHor = $state.$current.path[0].self.name;});$scope.$on("$destroy", function() {cleanUp();});',
    options: ['named']
}, {
    code: 'var cleanUp;cleanUp = $rootScope.$on("$stateChangeSuccess", function() {vm.currentHor = $state.$current.path[0].self.name;});$scope.$on("$destroy", function() {cleanUp();});',
    options: ['anonymous']
});

invalid.push({
    code: 'app.controller("name", function(Service1) {});',
    options: ['named', ['controller']],
    errors: [{message: 'Use named functions instead of anonymous function'}]
}, {
    code: 'app.controller("name", ["Service1", function(Service1) {}]);',
    options: ['named', ['controller']],
    errors: [{message: 'Use named functions instead of anonymous function'}]
});

invalid.push({
    code: 'function func(Service1) {};app.controller("name", func);',
    options: ['anonymous', ['controller']],
    errors: [{message: 'Use anonymous functions instead of named function'}]
}, {
    code: 'function func(Service1) {};app.controller("name", ["Service1", func]);',
    options: ['anonymous', ['controller']],
    errors: [{message: 'Use anonymous functions instead of named function'}]
});

valid.push({
    code: 'function func(Service1) {};app.controller("name", func);',
    options: ['named', ['controller']]
}, {
    code: 'function func(Service1) {};app.controller("name", ["Service1", func]);',
    options: ['named', ['controller']]
});

// ------------------------------------------------------------------------------
// Tests
// ------------------------------------------------------------------------------

var eslintTester = new RuleTester();
eslintTester.run('function-type', rule, {
    valid: valid,
    invalid: invalid
});
