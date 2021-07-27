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
 * @fileoverview Tests for the check-element-selector-at-top.js file.
 */

'use strict';

var rule = require('./check-element-selector-at-top');
var RuleTester = require('eslint').RuleTester;

var ruleTester = new RuleTester();
ruleTester.run('check-element-selector-at-top', rule, {
  valid: [
    {
      code:
      `var action = require('./action.js');
      var forms = require('./forms.js');
      var waitFor = require('./waitFor.js');

      var LibraryPage = function() {
        var allCollectionSummaryTile = element.all(
         by.css('.protractor-test-collection-summary-tile'));
        var allExplorationSummaryTile = element.all(
         by.css('.protractor-test-exp-summary-tile'));
        var allCollectionsTitled = function(collectionName) {
          return element.all(by.cssContainingText(
          '.protractor-test-collection-summary-tile-title', collectionName));
        };

        var allExplorationsTitled = function(explorationName) {
          var allCollectionSummaryTile = element.all(
           by.css('.protractor-test-collection-summary-tile' + check));};
        };`,
    }
  ],

  invalid: [
    {
      code:
      `var action = require('./action.js');
      var forms = require('./forms.js');
      var waitFor = require('./waitFor.js');

      var LibraryPage = function() {
        var allCollectionSummaryTile = element.all(
         by.css('.protractor-test-collection-summary-tile'));
        var allExplorationSummaryTile = element.all(
         by.css('.protractor-test-exp-summary-tile'));
        var allCollectionsTitled = function(collectionName) {
          return element.all(by.cssContainingText(
          '.protractor-test-collection-summary-tile-title', collectionName));
        };

        var allExplorationsTitled = function(explorationName) {
          var allCollectionSummaryTile = element.all(
           by.css('.protractor-test-collection-summary-tile'));};
        };`,
      errors: [{
        message: (
          'Please declare element in the topmost scope of the module function.')
      }],
    },
  ]
});
