// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Page object for the exploration editor's translation tab, for
 * use in Protractor tests.
 */
var waitFor = require('../protractor_utils/waitFor.js');

var ExplorationEditorTranslationTab = function() {
  var contentTabButton = element(by.css('protractor-test-content-tab'));
  var feedbackTabButton = element(by.css('protractor-test-feedback-tab'));
  var hintsTabButton = element(by.css('protractor-test-hints-tab'));
  var solutionTabButton = element(by.css('protractor-test-solution-tab'));
  var contentTabText = element(by.css('protractor-test-content-text'));
  var _selectLanguage = function(language) {
    element(by.css('.protractor-test-translation-language-selector')).
      element(by.cssContainingText('option', language)).click();
  };

  this.expectContentTabContentToMatch = function(content) {
    waitFor.pageToFullyLoad();
    expect(contentTabText.getAttribute('textContent')).toMatch(content);
  };

  this.expectFeedbackTabContentsToMatch = function() {
    feedbackTabButton.click();
  };

  this.expectHintsTabContentsToMatch = function() {
    hintsTabButton.click();
  };

  this.expectSolutionTabContentToMatch = function() {
    solutionTabButton.click();
  };

  this.changeTranslationLanguage = function(language) {
    _selectLanguage(language);
    waitFor.pageToFullyLoad();
  };
};
exports.ExplorationEditorTranslationTab = ExplorationEditorTranslationTab;
