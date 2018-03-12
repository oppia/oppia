'use strict';

// ------------------------------------------------------------------------------
// Requirements
// ------------------------------------------------------------------------------

var rule = require('../rules/no-http-callback');
var RuleTester = require('eslint').RuleTester;

// ------------------------------------------------------------------------------
// Tests
// ------------------------------------------------------------------------------

var eslintTester = new RuleTester();
eslintTester.run('no-http-callback', rule, {
    valid: [
        '$http().then()',
        '$http.delete.then()',
        '$http.get().then()',
        '$http.head().then()',
        '$http.jsonp().then()',
        '$http.patch().then()',
        '$http.post().then()',
        '$http.put().then()',
        // Constructs not checked by this rule.
        'get().success()',
        '$http.get.success()',
        '$http.custom().then()'
    ],
    invalid: [
        // $http
        {
            code: '$http().success()',
            errors: [{message: '$http success is deprecated. Use then instead'}]
        }, {
            code: '$http().error()',
            errors: [{message: '$http error is deprecated. Use then or catch instead'}]
        }, {
            code: '$http().success().error()',
            errors: [
                {message: '$http error is deprecated. Use then or catch instead'},
                {message: '$http success is deprecated. Use then instead'}
            ]
        }, {
            code: '$http().error().success()',
            errors: [
                {message: '$http success is deprecated. Use then instead'},
                {message: '$http error is deprecated. Use then or catch instead'}
            ]
        },
        // delete
        {
            code: '$http.delete().success()',
            errors: [{message: '$http success is deprecated. Use then instead'}]
        }, {
            code: '$http.delete().error()',
            errors: [{message: '$http error is deprecated. Use then or catch instead'}]
        }, {
            code: '$http.delete().success().error()',
            errors: [
                {message: '$http error is deprecated. Use then or catch instead'},
                {message: '$http success is deprecated. Use then instead'}
            ]
        }, {
            code: '$http.delete().error().success()',
            errors: [
                {message: '$http success is deprecated. Use then instead'},
                {message: '$http error is deprecated. Use then or catch instead'}
            ]
        },
        // get
        {
            code: '$http.get().success()',
            errors: [{message: '$http success is deprecated. Use then instead'}]
        }, {
            code: '$http.get().error()',
            errors: [{message: '$http error is deprecated. Use then or catch instead'}]
        }, {
            code: '$http.get().success().error()',
            errors: [
                {message: '$http error is deprecated. Use then or catch instead'},
                {message: '$http success is deprecated. Use then instead'}
            ]
        }, {
            code: '$http.get().error().success()',
            errors: [
                {message: '$http success is deprecated. Use then instead'},
                {message: '$http error is deprecated. Use then or catch instead'}
            ]
        },
        // head
        {
            code: '$http.head().success()',
            errors: [{message: '$http success is deprecated. Use then instead'}]
        }, {
            code: '$http.head().error()',
            errors: [{message: '$http error is deprecated. Use then or catch instead'}]
        }, {
            code: '$http.head().success().error()',
            errors: [
                {message: '$http error is deprecated. Use then or catch instead'},
                {message: '$http success is deprecated. Use then instead'}
            ]
        }, {
            code: '$http.head().error().success()',
            errors: [
                {message: '$http success is deprecated. Use then instead'},
                {message: '$http error is deprecated. Use then or catch instead'}
            ]
        },
        // jsonp
        {
            code: '$http.jsonp().success()',
            errors: [{message: '$http success is deprecated. Use then instead'}]
        }, {
            code: '$http.jsonp().error()',
            errors: [{message: '$http error is deprecated. Use then or catch instead'}]
        }, {
            code: '$http.jsonp().success().error()',
            errors: [
                {message: '$http error is deprecated. Use then or catch instead'},
                {message: '$http success is deprecated. Use then instead'}
            ]
        }, {
            code: '$http.jsonp().error().success()',
            errors: [
                {message: '$http success is deprecated. Use then instead'},
                {message: '$http error is deprecated. Use then or catch instead'}
            ]
        },
        // patch
        {
            code: '$http.patch().success()',
            errors: [{message: '$http success is deprecated. Use then instead'}]
        }, {
            code: '$http.patch().error()',
            errors: [{message: '$http error is deprecated. Use then or catch instead'}]
        }, {
            code: '$http.patch().success().error()',
            errors: [
                {message: '$http error is deprecated. Use then or catch instead'},
                {message: '$http success is deprecated. Use then instead'}
            ]
        }, {
            code: '$http.patch().error().success()',
            errors: [
                {message: '$http success is deprecated. Use then instead'},
                {message: '$http error is deprecated. Use then or catch instead'}
            ]
        },
        // post
        {
            code: '$http.post().success()',
            errors: [{message: '$http success is deprecated. Use then instead'}]
        }, {
            code: '$http.post().error()',
            errors: [{message: '$http error is deprecated. Use then or catch instead'}]
        }, {
            code: '$http.post().success().error()',
            errors: [
                {message: '$http error is deprecated. Use then or catch instead'},
                {message: '$http success is deprecated. Use then instead'}
            ]
        }, {
            code: '$http.post().error().success()',
            errors: [
                {message: '$http success is deprecated. Use then instead'},
                {message: '$http error is deprecated. Use then or catch instead'}
            ]
        },
        // put
        {
            code: '$http.put().success()',
            errors: [{message: '$http success is deprecated. Use then instead'}]
        }, {
            code: '$http.put().error()',
            errors: [{message: '$http error is deprecated. Use then or catch instead'}]
        }, {
            code: '$http.put().success().error()',
            errors: [
                {message: '$http error is deprecated. Use then or catch instead'},
                {message: '$http success is deprecated. Use then instead'}
            ]
        }, {
            code: '$http.put().error().success()',
            errors: [
                {message: '$http success is deprecated. Use then instead'},
                {message: '$http error is deprecated. Use then or catch instead'}
            ]
        }
    ]
});
