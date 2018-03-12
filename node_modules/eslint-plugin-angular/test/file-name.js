'use strict';

// ------------------------------------------------------------------------------
// Requirements
// ------------------------------------------------------------------------------

var rule = require('../rules/file-name');
var RuleTester = require('eslint').RuleTester;

// ------------------------------------------------------------------------------
// Tests
// ------------------------------------------------------------------------------

var eslintTester = new RuleTester();
eslintTester.run('file-name', rule, {
    valid: [{
        // basic module
        filename: 'myModule.js',
        code: 'angular.module("myModule", []);'
    }, {
        // basic filter
        filename: 'someFilter.js',
        code: 'app.filter("someFilter", function() {});'
    }, {
        // basic controller
        filename: 'SomeController.js',
        code: 'app.controller("SomeController", function() {});'
    }, {
        // basic service
        filename: 'myUtils.js',
        code: 'app.service("myUtils", function() {});'
    }, {
        // basic factory service
        filename: 'myUtils.js',
        code: 'app.factory("myUtils", function() {});'
    }, {
        // basic directive
        filename: 'beautifulDirective.js',
        code: 'app.directive("beautifulDirective", function() {});'
    }, {
        // typeSeparator dot with filter
        filename: 'src/app/myFilter.filter.js',
        code: 'app.filter("myFilter", function() {});',
        options: [{
            typeSeparator: 'dot'
        }]
    }, {
        // ignore $provide declarations
        filename: 'src/app/myApp.module.js',
        code: '$provide.value("accountsService", accountsService);'
    }, {
        // ignore test declarations
        filename: 'src/app/fooBar.spec.js',
        code: 'it("myApp", function() {})'
    }, {
        // ignore test declarations
        filename: 'src/app/myService.spec.js',
        code: '$httpBackend.expectGET("/api/my/service").respond(200, dummyVorversicherer)'
    }, {
        // typeSeparator dash with service (factory)
        filename: 'src/app/someUtil-service.js',
        code: 'app.factory("someUtil", function() {});',
        options: [{
            typeSeparator: 'dash'
        }]
    }, {
        // typeSeparator underscore with controller
        filename: 'src/app/SomeController_controller.js',
        code: 'app.controller("SomeController", function() {});',
        options: [{
            typeSeparator: 'underscore'
        }]
    }, {
        // typeSeparator dot with controller and ignored type suffix
        filename: 'src/app/Avengers.controller.js',
        code: 'app.controller("AvengersController", function() {});',
        options: [{
            typeSeparator: 'dot',
            ignoreTypeSuffix: true
        }]
    }, {
        // typeSeparator dot with controller and ignored type suffix
        filename: 'src/app/Avengers.controller.js',
        code: 'app.controller("AvengersController", function() {});',
        options: [{
            typeSeparator: 'dot',
            ignoreTypeSuffix: true
        }]
    }, {
        // typeSeparator dot with service and ignored type suffix
        filename: 'src/app/avengers.service.js',
        code: 'app.factory("avengersService", function() {});',
        options: [{
            typeSeparator: 'dot',
            ignoreTypeSuffix: true
        }]
    }, {
        // typeSeparator dot with service and ignored type suffix
        filename: 'src/app/avengersApi.service.js',
        code: 'app.factory("avengersApi", function() {});',
        options: [{
            typeSeparator: 'dot',
            ignoreTypeSuffix: true
        }]
    }, {
        // typeSeparator dot with service and ignored type suffix (optimization: name shorter than type name)
        filename: 'src/app/utils.service.js',
        code: 'app.factory("utils", function() {});',
        options: [{
            typeSeparator: 'dot',
            ignoreTypeSuffix: true
        }]
    }, {
        // nameStyle dash and typeSeparator dash with service
        filename: 'src/app/app-utils-service.js',
        code: 'app.factory("appUtils", function() {});',
        options: [{
            typeSeparator: 'dash',
            nameStyle: 'dash'
        }]
    }, {
        // nameStyle underscore and typeSeparator dot with directive
        filename: 'src/app/my_tab.directive.js',
        code: 'app.directive("myTab", function() {});',
        options: [{
            typeSeparator: 'dot',
            nameStyle: 'underscore'
        }]
    }, {
        // ignorePrefix xp with typeSeparator dot and ignoreTypeSuffix
        filename: 'src/app/asset.service.js',
        code: 'angular.factory("xpAssetService", xpAssetService)',
        options: [{
            typeSeparator: 'dot',
            ignoreTypeSuffix: true,
            ignorePrefix: 'xp'
        }]
    }, {
        // ignorePrefix st with typeSeparator dash
        filename: 'src/app/appUtils-service.js',
        code: 'angular.factory("stAppUtils", stAppUtils)',
        options: [{
            typeSeparator: 'dash',
            ignorePrefix: 'st'
        }]
    }, {
        // test to detect false positives for ignorePrefix
        filename: 'staging_service.js',
        code: 'angular.factory("staging", staging)',
        options: [{
            typeSeparator: 'underscore',
            ignorePrefix: 'st'
        }]
    }],
    invalid: [{
        filename: 'src/app/filters.js',
        code: 'app.filter("myFilter", function() {});',
        errors: [{message: 'Filename must be "myFilter.js"'}]
    }, {
        filename: 'src/app/myFilter.js',
        code: 'app.filter("myFilter", function() {});',
        options: [{
            typeSeparator: 'dot'
        }],
        errors: [{message: 'Filename must be "myFilter.filter.js"'}]
    }, {
        // typeSeparator underscore with service
        filename: 'src/someService_controller.js',
        code: 'app.factory("someService", function() {});',
        options: [{
            typeSeparator: 'underscore'
        }],
        errors: [{message: 'Filename must be "someService_service.js"'}]
    }, {
        // typeSeparator dot with controller, but no ignored type suffix
        filename: 'src/app/Avengers.controller.js',
        code: 'app.controller("AvengersController", function() {});',
        options: [{
            typeSeparator: 'dot'
        }],
        errors: [{message: 'Filename must be "AvengersController.controller.js"'}]
    }, {
        // typeSeparator dot with controller and ignored type suffix
        filename: 'src/app/AvengersController.controller.js',
        code: 'app.controller("AvengersController", function() {});',
        options: [{
            typeSeparator: 'dot',
            ignoreTypeSuffix: true
        }],
        errors: [{message: 'Filename must be "Avengers.controller.js"'}]
    }, {
        // nameStyle dash and typeSeparator dot with directive
        filename: 'src/app/avangerProfile.directive.js',
        code: 'app.directive("avangerProfile", function() {});',
        options: [{
            typeSeparator: 'dot',
            nameStyle: 'dash'
        }],
        errors: [{message: 'Filename must be "avanger-profile.directive.js"'}]
    }, {
        // ignorePrefix xp
        filename: 'src/app/xpAsset.service.js',
        code: 'angular.factory("xpAssetService", xpAssetService)',
        options: [{
            typeSeparator: 'dot',
            ignoreTypeSuffix: true,
            ignorePrefix: 'xp'
        }],
        errors: [{message: 'Filename must be "asset.service.js"'}]
    }]
});
