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

describe('Test solicit answer details feature', function() {
  var EXPLORATION_TITLE = 'Check';
  var EXPLORATION_OBJECTIVE = 'To explore something';
  var EXPLORATION_CATEGORY = 'Algorithms';
  var EXPLORATION_LANGUAGE = 'English';
  var adminPage = null;
  var libraryPage = null;
  var creatorDashboardPage = null;
  var explorationEditorPage = null;
  var explorationEditorImprovementsTab = null;
  var explorationEditorMainTab = null;
  var explorationEditorSettingsTab = null;
  var explorationPlayerPage = null;
  var oppiaLogo = element(by.css('.protractor-test-oppia-main-logo'));

  beforeAll(function() {
    adminPage = new AdminPage.AdminPage();
    explorationEditorPage = new ExplorationEditorPage.ExplorationEditorPage();
    explorationEditorImprovementsTab = (
      explorationEditorPage.getImprovementsTab());
    explorationEditorMainTab = explorationEditorPage.getMainTab();
    explorationEditorSettingsTab = explorationEditorPage.getSettingsTab();
    explorationPlayerPage = new ExplorationPlayerPage.ExplorationPlayerPage();
    libraryPage = new LibraryPage.LibraryPage();
    creatorDashboardPage = new CreatorDashboardPage.CreatorDashboardPage();
    explorationPlayerPage =
      new ExplorationPlayerPage.ExplorationPlayerPage();

    users.createUser(
      'learner@user.com', 'learnerUser');
    users.createAndLoginAdminUser(
      'creator@user.com', 'creatorUser');

    // Creator creates and publishes an exploration.
    workflow.createExplorationAsAdmin();
    explorationEditorMainTab.exitTutorial();

    explorationEditorPage.navigateToSettingsTab();
    explorationEditorSettingsTab.setTitle(EXPLORATION_TITLE);
    explorationEditorSettingsTab.setCategory(EXPLORATION_CATEGORY);
    explorationEditorSettingsTab.setObjective(EXPLORATION_OBJECTIVE);
    explorationEditorSettingsTab.setLanguage(EXPLORATION_LANGUAGE);

    explorationEditorPage.navigateToMainTab();
    explorationEditorMainTab.setStateName('One');
    explorationEditorMainTab.setContent(
      forms.toRichText('Please write 1 in words.'));
    explorationEditorMainTab.setInteraction('TextInput');
    explorationEditorMainTab.addResponse(
      'TextInput', forms.toRichText('Good job'), 'End', true, 'Equals',
      'One');
    explorationEditorMainTab.getResponseEditor('default').setFeedback(
      forms.toRichText('Try again'));
    explorationEditorMainTab.setSolicitAnswerDetailsFeature();
    explorationEditorMainTab.moveToState('End');
    explorationEditorMainTab.setInteraction('EndExploration');
    explorationEditorPage.saveChanges();
    workflow.publishExploration();

    adminPage.editConfigProperty(
      'Always ask learners for answer details. For testing -- do not use',
      'Boolean',
      function(elem) {
        elem.setValue(true);
      });

    adminPage.editConfigProperty(
      'Exposes the Improvements Tab for creators in the exploration editor',
      'Boolean',
      function(elem) {
        elem.setValue(true);
      });
  });

  it('checks solicit answer details feature', function() {
    users.login('learner@user.com');
    libraryPage.get();
    libraryPage.findExploration(EXPLORATION_TITLE);
    libraryPage.playExploration(EXPLORATION_TITLE);
    explorationPlayerPage.submitAnswer('TextInput', 'One');
    explorationPlayerPage.submitAnswerDetails('I liked this choice of answer');
    explorationPlayerPage.expectExplorationToNotBeOver();

    oppiaLogo.click();
    general.acceptAlert();
    users.logout();
    users.login('creator@user.com');
    creatorDashboardPage.get();
    creatorDashboardPage.navigateToExplorationEditor();
    explorationEditorPage.navigateToImprovementsTab();
    explorationEditorImprovementsTab.checkAnswerDetailsCard('One', '1');
    explorationEditorImprovementsTab.navigateReviewAnswerDetails();
    explorationEditorImprovementsTab.verifyAnswerDetails(
      'I liked this choi...');
    users.logout();
  });

  afterAll(function() {
    users.createAndLoginAdminUser('testadm@collections.com', 'testadm');
    adminPage.get();
    adminPage.editConfigProperty(
      'Always ask learners for answer details. For testing -- do not use',
      'Boolean',
      function(elem) {
        elem.setValue(false);
      });

    adminPage.editConfigProperty(
      'Exposes the Improvements Tab for creators in the exploration editor',
      'Boolean',
      function(elem) {
        elem.setValue(false);
      });
    users.logout();
    general.checkForConsoleErrors([]);
  });
});
