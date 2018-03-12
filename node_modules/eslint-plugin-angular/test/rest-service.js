'use strict';

// ------------------------------------------------------------------------------
// Requirements
// ------------------------------------------------------------------------------

var rule = require('../rules/rest-service');
var RuleTester = require('eslint').RuleTester;

// ------------------------------------------------------------------------------
// Tests
// ------------------------------------------------------------------------------

var eslintTester = new RuleTester();

var angularObjectList = ['controller', 'filter', 'directive', 'service', 'factory', 'provider'];
var possibleValues = ['$http', '$resource', 'Restangular'];
var valid = [];
var invalid = [];


angularObjectList.forEach(function(object) {
    possibleValues.forEach(function(value) {
        valid.push({
            code: 'app.' + object + '("name", function(Service1) {});',
            options: [value]
        }, {
            code: 'app.' + object + '("name", function(Service1) {});'
        }, {
            code: 'app.' + object + '("name", ["Service1", function(Service1) {}]);',
            options: [value]
        }, {
            code: '"use strict";app.' + object + '("name", ["Service1", function(Service1) {}]);',
            options: [value]
        });
    });

    possibleValues.forEach(function(value) {
        possibleValues.filter(function(v) {
            return v !== value;
        }).forEach(function(badValue) {
            invalid.push({
                code: 'app.' + object + '("name", function(' + badValue + ') {});',
                options: [value],
                errors: [{message: 'You should use the same service (' + value + ') for REST API calls'}]
            }, {
                code: 'app.' + object + '("name", ["' + badValue + '", function(' + badValue + ') {}]);',
                options: [value],
                errors: [{message: 'You should use the same service (' + value + ') for REST API calls'}]
            });
        });
    });
});

// ------------------------------------------------------------------------------
// Tests
// ------------------------------------------------------------------------------

eslintTester.run('rest-service', rule, {
    valid: valid,
    invalid: invalid
});
