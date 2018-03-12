'use strict';

// ------------------------------------------------------------------------------
// Requirements
// ------------------------------------------------------------------------------

var rule = require('../rules/di-unused');
var RuleTester = require('eslint').RuleTester;

// ------------------------------------------------------------------------------
// Tests
// ------------------------------------------------------------------------------

var eslintTester = new RuleTester();
eslintTester.run('di-unused', rule, {
    valid: [
        'app.controller("", function($q) {return $q;});',
        'app.directive("", function($q) {return $q;});',
        'app.factory("", function($q) {return $q;});',
        'app.factory("", function($q) {return function() {return $q;};});',
        'app.factory("", function() {var myVar;});',
        'app.filter("", function($q) {return $q;});',
        'app.provider("", function($httpProvider) {return $httpProvider;});',
        'app.service("", function($q) {return $q;});',
        'app.config(function($httpProvider) {$httpProvider.defaults.headers.post.answer="42"})',
        'app.run(function($q) {$q()})',
        'inject(function($q) {_$q_ = $q;});',
        'this.$get = function($q) {return $q;};'
    ],
    invalid: [{
        code: 'app.controller("", function($q) {});',
        errors: [{message: 'Unused injected value $q'}]
    }, {
        code: 'app.directive("", function($q) {});',
        errors: [{message: 'Unused injected value $q'}]
    }, {
        code: 'app.factory("", function($q) {});',
        errors: [{message: 'Unused injected value $q'}]
    }, {
        code: 'app.factory("", function($http, $q) {});',
        errors: [
            {message: 'Unused injected value $http'},
            {message: 'Unused injected value $q'}
        ]
    }, {
        code: 'app.factory("", function($http, $q) {return $q.resolve()});',
        errors: [
            {message: 'Unused injected value $http'}
        ]
    }, {
        code: 'app.filter("", function($q) {});',
        errors: [{message: 'Unused injected value $q'}]
    }, {
        code: 'app.provider("", function($httpProvider) {});',
        errors: [{message: 'Unused injected value $httpProvider'}]
    }, {
        code: 'app.service("", function($q) {});',
        errors: [{message: 'Unused injected value $q'}]
    }, {
        code: 'app.config(function($httpProvider) {})',
        errors: [{message: 'Unused injected value $httpProvider'}]
    }, {
        code: 'app.run(function($q) {});',
        errors: [{message: 'Unused injected value $q'}]
    }, {
        code: 'inject(function($q) {});',
        errors: [{message: 'Unused injected value $q'}]
    }, {
        code: 'this.$get = function($q) {};',
        errors: [{message: 'Unused injected value $q'}]
    }]
});
