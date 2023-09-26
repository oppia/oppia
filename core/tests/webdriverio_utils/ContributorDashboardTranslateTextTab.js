// Copyright 2022 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Page object for the contributor dashboard's translate text tab,
 * for use in Webdriverio tests.
 */

var action = require('./action.js');
var waitFor = require('./waitFor.js');

var ContributorDashboardTranslateTextTab = function() {
  var selectorContainer = $('.e2e-test-language-selector');
  var selectedLanguageElement = $('.e2e-test-language-selector-selected');
  var featuredLanguageElementsSelector = function() {
    return selectorContainer.$$('.e2e-test-featured-language');
  };
  var featuredLanguageTooltipElementsSelector = function() {
    return selectorContainer.$$('.e2e-test-featured-language-tooltip');
  };

  var _openLanguageSelector = async function() {
    await action.click('Test Language Selector Container', selectorContainer);
  };

  var _selectLanguage = async function(language) {
    await _openLanguageSelector();
    var selectorOption = selectorContainer.$(
      `.e2e-test-language-selector-option=${language}`);
    await action.click('Test Language Selector Option', selectorOption);
  };

  this.changeLanguage = async function(language) {
    await _selectLanguage(language);
    await waitFor.pageToFullyLoad();
  };

  this.mouseoverFeaturedLanguageTooltip = async function(index) {
    await _openLanguageSelector();
    var featuredLanguageContainer = selectorContainer.$(
      '.e2e-test-featured-language-container');
    await waitFor.visibilityOf(
      featuredLanguageContainer,
      'Featured languages took too long to display'
    );
    var featuredLanguageTooltipElements = (
      await featuredLanguageTooltipElementsSelector());
    await featuredLanguageTooltipElements[index].moveTo();
  };

  this.expectFeaturedLanguagesToBe = async function(languages) {
    await _openLanguageSelector();
    var featuredLanguageContainer = selectorContainer.$(
      '.e2e-test-featured-language-container');
    await waitFor.visibilityOf(
      featuredLanguageContainer,
      'Featured languages took too long to display'
    );
    var featuredLanguageElement = (
      selectorContainer.$('.e2e-test-featured-language'));
    await waitFor.visibilityOf(
      featuredLanguageElement,
      'Featured language elements taking too long to appear'
    );
    var featuredLanguageElements = (
      featuredLanguageElementsSelector());
    var displayedFeaturedLanguages = await featuredLanguageElements
      .map(async function(featuredLanguageElement) {
        return (await featuredLanguageElement.getText()).replace('info\n', '');
      });
    expect(displayedFeaturedLanguages).toEqual(languages);
  };

  this.expectFeaturedLanguageExplanationToBe = async function(explanation) {
    var featuredLanguageExplanation = selectorContainer.$(
      '.e2e-test-language-selector-featured-explanation');
    await waitFor.visibilityOf(
      featuredLanguageExplanation,
      'Featured language explanation took too long to show'
    );
    expect(await featuredLanguageExplanation.getText()).toEqual(explanation);
  };

  this.expectSelectedLanguageToBe = async function(language) {
    await waitFor.visibilityOf(
      selectorContainer,
      'Selector Container took too long to load'
    );
    var selectedLanguageText = await selectedLanguageElement.getText();
    expect(selectedLanguageText).toEqual(language);
  };
};

exports.ContributorDashboardTranslateTextTab =
  ContributorDashboardTranslateTextTab;
