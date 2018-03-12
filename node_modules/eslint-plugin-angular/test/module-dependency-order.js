'use strict';

// ------------------------------------------------------------------------------
// Requirements
// ------------------------------------------------------------------------------

var rule = require('../rules/module-dependency-order');
var RuleTester = require('eslint').RuleTester;

// ------------------------------------------------------------------------------
// Tests
// ------------------------------------------------------------------------------

var eslintTester = new RuleTester();
eslintTester.run('module-dependency-order', rule, {
    valid: [
        'angular.module("", [])',
        'angular.module("")',
        // combined mode
        {
            code: 'angular.module("", ["app.filters","ngCordova","ngMaterial","ui.router"])',
            options: [{grouped: false}]
        },
        // grouped mode
        'angular.module("", ["ng","ngAnimate","ngAria","ngCookies","ngLocale","ngMaterial","ngMessageFormat","ngMessages","ngMock","ngNewRouter","ngResource","ngRoute","ngSanitize","ngTouch"])',
        'angular.module("", ["ngAnimate","ngResource","ngCordova"])',
        {
            code: 'angular.module("", ["ngAnimate","ngResource","ngCordova","app.filters"])',
            options: [{prefix: 'app'}]
        }
    ],
    invalid: [
        {
            code: 'angular.module("", deps)',
            errors: [
                {message: 'Dependencies should be a literal array'}
            ]
        },
        // combined mode
        {
            code: 'angular.module("", [dep])',
            options: [{grouped: false}],
            errors: [
                {message: 'Unexpected non-literal value'}
            ]
        },
        {
            code: 'angular.module("", ["ngCordova","app.filters","app.resources","ngMaterial","app.user","ui.router"])',
            options: [{grouped: false}],
            errors: [
                {message: 'app.filters should be sorted before ngCordova'},
                {message: 'app.resources should be sorted before ngCordova'},
                {message: 'app.user should be sorted before ngMaterial'}
            ]
        },
        // grouped mode
        {
            code: 'angular.module("", [dep])',
            errors: [
                {message: 'Unexpected non-literal value'}
            ]
        },
        {
            code: 'angular.module("", ["ngMaterial","ngAnimate"])',
            errors: [
                {message: 'ngAnimate should be sorted before ngMaterial'}
            ]
        },
        {
            code: 'angular.module("", ["ngAnimate","ngCordova","ngMaterial"])',
            errors: [
                {message: 'ngMaterial is a standard module and should be sorted before ngCordova'}
            ]
        },
        {
            code: 'angular.module("", ["ui.router","ngCordova"])',
            errors: [
                {message: 'ngCordova should be sorted before ui.router'}
            ]
        },
        {
            code: 'angular.module("", ["app.filters","ngCordova"])',
            options: [{prefix: 'app'}],
            errors: [
                {message: 'ngCordova is a third party module and should be sorted before app.filters'}
            ]
        },
        {
            code: 'angular.module("", ["ngAnimate","ngResource","app.filters","ngCordova"])',
            options: [{prefix: 'app'}],
            errors: [
                {message: 'ngCordova is a third party module and should be sorted before app.filters'}
            ]
        },
        {
            code: 'angular.module("", ["app.filters","ngAria"])',
            options: [{prefix: 'app'}],
            errors: [
                {message: 'ngAria is a standard module and should be sorted before app.filters'}
            ]
        }
    ]
});
