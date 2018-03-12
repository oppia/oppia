'use strict';

// ------------------------------------------------------------------------------
// Requirements
// ------------------------------------------------------------------------------

var rule = require('../rules/di-order');
var RuleTester = require('eslint').RuleTester;

// ------------------------------------------------------------------------------
// Tests
// ------------------------------------------------------------------------------

var eslintTester = new RuleTester();
eslintTester.run('di-order', rule, {
    valid: [
        'app.controller("", function($http, $q) {});',
        'app.directive("", function($http, $q) {});',
        'app.factory("", function($http, $q) {});',
        'app.factory("", fsctoryName);',
        'app.filter("", function($http, $q) {});',
        'app.provider("", function($http, $q) {});',
        'app.service("", function($http, $q) {});',
        'app.config(function($httpProvider, $routeProvider) {});',
        'app.run(function($http, $q) {});',
        'inject(function($http, $q) {});',
        'it(inject(function($http, $q) {}));',
        'this.$get = function($http, $q) {};',
        'this.$get = get;',
        'it(inject(function(_$http_, _$httpBackend_) {}));',
        {
            code: 'it(inject(function(_$httpBackend_, _$http_) {}));',
            options: [false]
        }
    ],
    invalid: [{
        code: 'app.controller("", function($q, $http) {});',
        errors: [{message: 'Injected values should be sorted alphabetically'}]
    }, {
        code: 'app.directive("", function($q, $http) {});',
        errors: [{message: 'Injected values should be sorted alphabetically'}]
    }, {
        code: 'app.factory("", function($q, $http) {});',
        errors: [{message: 'Injected values should be sorted alphabetically'}]
    }, {
        code: 'app.filter("", function($q, $http) {});',
        errors: [{message: 'Injected values should be sorted alphabetically'}]
    }, {
        code: 'app.provider("", function($q, $http) {});',
        errors: [{message: 'Injected values should be sorted alphabetically'}]
    }, {
        code: 'app.service("", function($q, $http) {});',
        errors: [{message: 'Injected values should be sorted alphabetically'}]
    }, {
        code: 'app.config(function($routeProvider, $httpProvider) {});',
        errors: [{message: 'Injected values should be sorted alphabetically'}]
    }, {
        code: 'app.run(function($q, $http) {});',
        errors: [{message: 'Injected values should be sorted alphabetically'}]
    }, {
        code: 'inject(function($q, $http) {});',
        errors: [{message: 'Injected values should be sorted alphabetically'}]
    }, {
        code: 'it(inject(function($q, $http) {}));',
        errors: [{message: 'Injected values should be sorted alphabetically'}]
    }, {
        code: 'it(inject(function(_$http_, _$httpBackend_) {}));',
        options: [false],
        errors: [{message: 'Injected values should be sorted alphabetically'}]
    }, {
        code: 'it(inject(function(_$httpBackend_, _$http_) {}));',
        errors: [{message: 'Injected values should be sorted alphabetically'}]
    }, {
        code: 'this.$get = function($q, $http) {};',
        errors: [{message: 'Injected values should be sorted alphabetically'}]
    }]
});
