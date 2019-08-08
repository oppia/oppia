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
 * @fileoverview End-to-end tests for the core features of the exploration
 * editor and player. Core features include the features without which an
 * exploration cannot be published. These include state content, answer groups,
 * oppia's feedback and customization_args.
 */

var forms = require('../protractor_utils/forms.js');
var general = require('../protractor_utils/general.js');
var users = require('../protractor_utils/users.js');
var workflow = require('../protractor_utils/workflow.js');


var AdminPage = require('../protractor_utils/AdminPage.js');
var CreatorDashboardPage =
  require('../protractor_utils/CreatorDashboardPage.js');
var ExplorationEditorPage =
  require('../protractor_utils/ExplorationEditorPage.js');
var ExplorationPlayerPage =
  require('../protractor_utils/ExplorationPlayerPage.js');
var LibraryPage = require('../protractor_utils/LibraryPage.js');


describe('Core exploration functionality', function() {
  var explorationPlayerPage = null;
  var explorationEditorPage = null;
  var explorationEditorMainTab = null;
  var explorationEditorSettingsTab = null;
  var userNumber = 1;

  beforeEach(function() {
    explorationEditorPage = new ExplorationEditorPage.ExplorationEditorPage();
    explorationEditorMainTab = explorationEditorPage.getMainTab();
    explorationEditorSettingsTab = explorationEditorPage.getSettingsTab();
    explorationPlayerPage = new ExplorationPlayerPage.ExplorationPlayerPage();

    users.createUser(
      `user${userNumber}@stateEditor.com`, `user${userNumber}StateEditor`);
    users.login(`user${userNumber}@stateEditor.com`);
    workflow.createExploration();

    userNumber++;
  });



  it('should show warnings when the length of goal < 15', function() {
    explorationEditorPage.navigateToSettingsTab();

    // Color grey when there is no warning, red when there is a warning
    explorationEditorSettingsTab.expectWarningsColorToBe(
      'rgba(115, 115, 115, 1)');
    explorationEditorSettingsTab.setObjective('short goal');
    explorationEditorSettingsTab.expectWarningsColorToBe(
      'rgba(169, 68, 66, 1)');
  });

  it('should be able to select category from the dropdown menu', function() {
    explorationEditorPage.navigateToSettingsTab();

    explorationEditorSettingsTab.expectCategoryToBe('');
    explorationEditorSettingsTab.setCategory('Biology');
    explorationEditorPage.navigateToMainTab();
    explorationEditorPage.navigateToSettingsTab();
    explorationEditorSettingsTab.expectCategoryToBe('Biology');
  });

  it('should be able to create new category which is not' +
  ' in the dropdown menu', function() {
    explorationEditorPage.navigateToSettingsTab();

    explorationEditorSettingsTab.expectCategoryToBe('');
    explorationEditorSettingsTab.setCategory('New');
    explorationEditorPage.navigateToMainTab();
    explorationEditorPage.navigateToSettingsTab();
    explorationEditorSettingsTab.expectCategoryToBe('New');
  });

  it('should be able to select language from the dropdown menu', function() {
    explorationEditorPage.navigateToSettingsTab();

    explorationEditorSettingsTab.expectLanguageToBe('English');
    explorationEditorSettingsTab.setLanguage('italiano (Italian)');
    explorationEditorPage.navigateToMainTab();
    explorationEditorPage.navigateToSettingsTab();
    explorationEditorSettingsTab.expectLanguageToBe('italiano (Italian)');
  });

  it('should change the first card of the exploration', function() {
    explorationEditorMainTab.setStateName('card 1');
    explorationEditorMainTab.setContent(forms.toRichText('this is card 1'));
    explorationEditorMainTab.setInteraction('Continue');
    explorationEditorMainTab.getResponseEditor('default').setDestination(
      'card 2', true, null);

    explorationEditorPage.navigateToSettingsTab();
    explorationEditorSettingsTab.expectFirstStateToBe('card 1');
    explorationEditorSettingsTab.setFirstState('card 2');
    explorationEditorPage.navigateToMainTab();
    explorationEditorPage.navigateToSettingsTab();
    explorationEditorSettingsTab.expectFirstStateToBe('card 2');
  });

  afterEach(function() {
    general.checkForConsoleErrors([]);
    users.logout();
  });
});
