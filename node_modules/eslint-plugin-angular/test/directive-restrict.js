'use strict';

// ------------------------------------------------------------------------------
// Requirements
// ------------------------------------------------------------------------------

var rule = require('../rules/directive-restrict');
var RuleTester = require('eslint').RuleTester;

// ------------------------------------------------------------------------------
// Tests
// ------------------------------------------------------------------------------

var eslintTester = new RuleTester();
eslintTester.run('directive-restrict', rule, {
    valid: [
        // Non directive components
        'app.factory("", function() {return {restrict:"ACEM"}})',
        'app.directive("")',
        'app.directive()',
        // Allowed with default configuration
        'app.directive("", function() {})',
        'app.directive("", function() {return {anotherProperty:"anotherValue"}})',
        'app.directive("", function() {return {restrict:"A"}})',
        'app.directive("", function() {return {restrict:"E"}})',
        // Allowed with custom restrict
        {
            code: 'app.directive("", function() {return {restrict:"A"}})',
            options: [{restrict: 'A'}]
        }, {
            code: 'app.directive("", function() {return {restrict:"E"}})',
            options: [{restrict: 'EA'}]
        },
        // Allowed with explicit restrict
        {
            code: 'app.directive("", function() {return {restrict:"AE"}})',
            options: [{explicit: 'always'}]
        }, {
            code: 'app.directive("", function() {return {restrict:"EA"}})',
            options: [{restrict: 'EA', explicit: 'always'}]
        }, {
            code: 'app.directive("", function() {directive = {restrict:"A"}; return directive})',
            options: [{explicit: 'always'}]
        }, {
            code: 'app.directive("", function() {directive = {}; directive.restrict = "A"; return directive})',
            options: [{explicit: 'always'}]
        }, {
            code: 'app.directive("", function() {directive = {}; directive.restrict = restrict; return directive})'
        }, {
            code: 'app.directive("", function() {directive = {}; directive.custom = "A"; return directive})'
        }
    ],
    invalid: [
        // Disallowed with default configuration
        {
            code: 'app.directive("", function() {return {restrict:"C"}})',
            errors: [{message: 'Disallowed directive restriction. It must be one of AE in that order'}]
        }, {
            code: 'app.directive("", function() {return {restrict:"M"}})',
            errors: [{message: 'Disallowed directive restriction. It must be one of AE in that order'}]
        }, {
            code: 'app.directive("", function() {var directive = {restrict:"M"};return directive;})',
            errors: [{message: 'Disallowed directive restriction. It must be one of AE in that order'}]
        },
        // Disallowed with custom restrict
        {
            code: 'app.directive("", function() {return {restrict:"M"}})',
            options: [{restrict: 'EA'}],
            errors: [{message: 'Disallowed directive restriction. It must be one of EA in that order'}]
        }, {
            code: 'app.directive("", function() {return {restrict:"E"}})',
            options: [{restrict: 'A'}],
            errors: [{message: 'Disallowed directive restriction. It must be one of A in that order'}]
        },
        // Disallowed with wrong order
        {
            code: 'app.directive("", function() {return {restrict:"EA"}})',
            options: [{restrict: 'AE', explicit: 'always'}],
            errors: [{message: 'Disallowed directive restriction. It must be one of AE in that order'}]
        },
        // Disallowed with explicit restrict
        {
            code: 'app.directive("", function() {return {restrict:"EA"}})',
            errors: [{message: 'No need to explicitly specify a default directive restriction'}]
        }, {
            code: 'app.directive("", function() {return {restrict:"AE"}})',
            errors: [{message: 'No need to explicitly specify a default directive restriction'}]
        },
        // Missing restrict with explicit set to always
        {
            code: 'app.directive("", function() {})',
            errors: [{message: 'Missing directive restriction'}],
            options: [{explicit: 'always'}]
        }
    ]
});
