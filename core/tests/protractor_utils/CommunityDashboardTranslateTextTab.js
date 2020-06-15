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
 * @fileoverview Page object for the community dashboard's translate text tab,
 * for use in Protractor tests.
 */

var waitFor = require('../protractor_utils/waitFor.js');

var CommunityDashboardTranslateTextTab = function() {
  var selectableLanguageElements = element(
    by.css('.protractor-test-language-selector'));
  var selectedLanguageElement = selectableLanguageElements.element(
    by.css('option:checked'));

  var _selectLanguage = async function(language) {
    await selectableLanguageElements.element(
      by.cssContainingText('option', language)).click();
  };

  this.changeLanguage = async function(language) {
    await _selectLanguage(language);
    await waitFor.pageToFullyLoad();
  };

  this.expectSelectedLanguageToBe = async function(language) {
    expect(await selectedLanguageElement.getText()).toMatch(language);
  };
};
exports.CommunityDashboardTranslateTextTab = CommunityDashboardTranslateTextTab;
