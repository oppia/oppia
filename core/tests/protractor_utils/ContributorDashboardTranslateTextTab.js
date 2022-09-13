// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * for use in Protractor tests.
 */

var action = require('./action.js');
var waitFor = require('./waitFor.js');

var ContributorDashboardTranslateTextTab = function() {
  var selectorContainer = element(
    by.css('.e2e-test-language-selector'));
  var selectedLanguageElement = selectorContainer.element(
    by.css('.e2e-test-language-selector-selected'));
  var featuredLanguageContainer = selectorContainer.element(
    by.css('.e2e-test-featured-language-container'));
  var featuredLanguageElements = selectorContainer.all(
    by.css('.e2e-test-featured-language'));
  var featuredLanguageTooltipElements = selectorContainer.all(
    by.css('.e2e-test-featured-language-tooltip'));
  var featuredLanguageExplanation = selectorContainer.element(
    by.css('.e2e-test-language-selector-featured-explanation'));

  var _openLanguageSelector = async function() {
    await action.click('Test Language Selector Container', selectorContainer);
  };

  var _selectLanguage = async function(language) {
    await _openLanguageSelector();
    var selectorOption = selectorContainer.element(
      by.cssContainingText(
        '.e2e-test-language-selector-option',
        language
      ));
    await action.click('Test Language Selector Option', selectorOption);
  };

  this.changeLanguage = async function(language) {
    await _selectLanguage(language);
    await waitFor.pageToFullyLoad();
  };

  this.mouseoverFeaturedLanguageTooltip = async function(index) {
    await _openLanguageSelector();
    await waitFor.visibilityOf(
      featuredLanguageContainer,
      'Featured languages took too long to display'
    );
    await browser.actions().mouseMove(
      featuredLanguageTooltipElements.get(index)
    ).perform();
  };

  this.expectFeaturedLanguagesToBe = async function(languages) {
    await _openLanguageSelector();
    await waitFor.visibilityOf(
      featuredLanguageContainer,
      'Featured languages took too long to display'
    );
    await waitFor.visibilityOf(
      featuredLanguageElements.first(),
      'Featured language elements taking too long to appear'
    );
    var displayedFeaturedLanguages = await featuredLanguageElements
      .map(async function(featuredLanguageElement) {
        return (await featuredLanguageElement.getText()).replace('info\n', '');
      });
    expect(displayedFeaturedLanguages).toEqual(languages);
  };

  this.expectFeaturedLanguageExplanationToBe = async function(explanation) {
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
    expect(await selectedLanguageElement.getAttribute('innerText'))
      .toEqual(language);
  };
};

exports.ContributorDashboardTranslateTextTab =
  ContributorDashboardTranslateTextTab;
