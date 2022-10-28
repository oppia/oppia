// Copyright 2021 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Tests for the no-to-throw.js file.
 */

'use strict';

var rule = require('./no-to-throw');
var RuleTester = require('eslint').RuleTester;

var ruleTester = new RuleTester();
ruleTester.run('no-to-throw', rule, {
  valid: [
    `angular.module('oppia').directive('codemirrorMergeview', [
    function() {
      return {
        link: function(scope, element, attrs) {
          if (angular.isUndefined(window.CodeMirror)) {
            throw new Error('CodeMirror not found.');
          }
        }
      };
    }]
    );`,
    `describe('Url Service', function() {
      it('should correctly retrieve topic id from url', function() {
        mockLocation.pathname = '/topic_editor/abcdefgij';
        expect(function() {
          urlService.getTopicIdFromUrl();
        }).toThrowError( {
          message: 'Checking'
          }
        );
      });
    });`,
  ],

  invalid: [
    {
      code:
        `describe('Url Service', function() {
          it('should correctly retrieve topic id from url', function() {
            mockLocation.pathname = '/topic_editor/abcdefgij';
            expect(function() {
              urlService.getTopicIdFromUrl();
            }).toThrow( {
              message: 'Checking'
              }
            );
          });
        });`,
      errors: [{
        message: 'Please use “toThrowError”  instead of “toThrow”.'
      }]
    }
  ]
});
