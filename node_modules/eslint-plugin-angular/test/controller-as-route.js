'use strict';

// ------------------------------------------------------------------------------
// Requirements
// ------------------------------------------------------------------------------

var rule = require('../rules/controller-as-route');
var RuleTester = require('eslint').RuleTester;

// ------------------------------------------------------------------------------
// Tests
// ------------------------------------------------------------------------------

var eslintTester = new RuleTester();
eslintTester.run('controller-as-route', rule, {
    valid: [
        '$routeProvider.when("/myroute", {controller: "MyController", controllerAs: "vm"})',
        '$routeProvider.when("/myroute2", {template: "<div></div>"})',
        '$stateProvider.state("mystate", {controller: "MyController", controllerAs: "vm"})',
        '$stateProvider.state("mystate2", {controller: "MyController as vm"})',
        '$stateProvider.state("mystate2", {template: "<div></div>"})',
        'something.when("string", {controller: "MyController"})',
        'when("string", {controller: "MyController"})',
        'state("mystate2", {})',
        'var state = "mystate2"',
        'something[type][changeType][state](test)',
        'var when = "mystate2"',
        'something[type][changeType][when](test)'
    ],
    invalid: [
        {code: '$routeProvider.when("/myroute", {controller: "MyController"})',
            errors: [{message: 'Route "/myroute" should use controllerAs syntax'}]},
        {code: '$routeProvider.when("/myroute", {controller: "MyController", controllerAs: "vm"}).when("/myroute2", {controller: "MyController"})',
            errors: [{message: 'Route "/myroute2" should use controllerAs syntax'}]},
        {code: '$stateProvider.state("mystate", {controller: "MyController"})',
            errors: [{message: 'State "mystate" should use controllerAs syntax'}]},
        {code: '$stateProvider.state("mystate", {controller: "MyController", controllerAs: "vm"}).state("mystate2", {controller: "MyController"})',
            errors: [{message: 'State "mystate2" should use controllerAs syntax'}]},
        {code: '$stateProvider.state({name: "myobjstate", controller: "MyController"})',
            errors: [{message: 'State "myobjstate" should use controllerAs syntax'}]}
    ]
});
