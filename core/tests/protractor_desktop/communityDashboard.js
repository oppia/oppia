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
 * @fileoverview End-to-end tests for the community dashboard page.
 */

var general = require('../protractor_utils/general.js');

var CommunityDashboardPage = require(
  '../protractor_utils/CommunityDashboardPage.js');

describe('Community dashboard page', function() {
  var communityDashboardPage = null;
  var communityDashboardTranslateTextTab = null;

  beforeAll(function() {
    communityDashboardPage = (
      new CommunityDashboardPage.CommunityDashboardPage());
    communityDashboardTranslateTextTab = (
      communityDashboardPage.getTranslateTextTab());
    browser.get('/community_dashboard');
  });

  it('should allow user to switch to translate text tab', function() {
    communityDashboardPage.navigateToTranslateTextTab();
    communityDashboardTranslateTextTab.changeLanguage('Hindi');
    communityDashboardTranslateTextTab.expectSelectedLanguageToBe('Hindi');
  });

  afterEach(function() {
    general.checkForConsoleErrors([]);
  });
});
