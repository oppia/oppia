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
 * @fileoverview Utilities for exploration creation, publication ect. when
 * carrrying out end-to-end testing with webdriverio.
 */

var forms = require('./forms.js');
var path = require('path');
var waitFor = require('./waitFor.js');
var action = require('./action.js');
var CreatorDashboardPage = require('./CreatorDashboardPage.js');
var ExplorationEditorPage = require('./ExplorationEditorPage.js');

// Creates an exploration, opens its editor and skips the tutorial.
var createExploration = async function(welcomeModalIsShown) {
  await createExplorationAndStartTutorial(false);
  var explorationEditorPage = new ExplorationEditorPage.ExplorationEditorPage();
  var explorationEditorMainTab = explorationEditorPage.getMainTab();
  if (welcomeModalIsShown) {
    await explorationEditorMainTab.exitTutorial();
  }
};

// Creates a new exploration and wait for the exploration tutorial to start.
var createExplorationAndStartTutorial = async function(isCollectionEditor) {
  var creatorDashboardPage = new CreatorDashboardPage.CreatorDashboardPage;
  await creatorDashboardPage.get();

  await creatorDashboardPage.clickCreateActivityButton();
  if (isCollectionEditor) {
    await waitFor.visibilityOf(
      activityCreationModal,
      'ActivityCreationModal takes too long to be visible.');
    await action.click('Create Exploration Button', createExplorationButton);
  }

  await waitFor.pageToFullyLoad();
  await waitFor.visibilityOf(
    stateNameText, 'State name text takes too long to appear.');
};

// This will only work if all changes have been saved and there are no
// outstanding warnings; run from the editor.
var publishExploration = async function() {
  await waitFor.elementToBeClickable(await $(
    '.protractor-test-publish-exploration'));
  await $('.protractor-test-publish-exploration').isDisplayed();
  var testPublishExploration = await $('.protractor-test-publish-exploration');
  await action.click('Test Publish Exploration', testPublishExploration);
  var prePublicationButtonElem = await $(
    '.protractor-test-confirm-pre-publication');
  await action.click(
    'Pre Publication Button Element', prePublicationButtonElem);

  await waitFor.invisibilityOf(
    prePublicationButtonElem,
    'prePublicationButtonElem taking too long to disappear while publishing');
  var testConfirmPublish = await $('.protractor-test-confirm-publish');
  await action.click('Test Confirm Publish', testConfirmPublish);

  var sharePublishModal = await $('.protractor-test-share-publish-modal');
  var closePublishModalButton = await $('.protractor-test-share-publish-close');
  await waitFor.visibilityOf(
    sharePublishModal, 'Share Publish Modal takes too long to appear');
  await action.click('Close Publish Modal Button', closePublishModalButton);
};

// Creates and publishes a minimal exploration.
var createAndPublishExploration = async function(
    title, category, objective, language, welcomeModalIsShown) {
  await createExploration(welcomeModalIsShown);
  var explorationEditorPage = new ExplorationEditorPage.ExplorationEditorPage();
  var explorationEditorMainTab = explorationEditorPage.getMainTab();
  await explorationEditorMainTab.setContent(
    await forms.toRichText('new exploration'));
  await explorationEditorMainTab.setInteraction('EndExploration');

  var explorationEditorSettingsTab = explorationEditorPage.getSettingsTab();
  await explorationEditorPage.navigateToSettingsTab();
  await explorationEditorSettingsTab.setTitle(title);
  await explorationEditorSettingsTab.setCategory(category);
  await explorationEditorSettingsTab.setObjective(objective);
  if (language) {
    await explorationEditorSettingsTab.setLanguage(language);
  }
  await explorationEditorPage.saveChanges();
  await publishExploration();
};

exports.createAndPublishExploration = createAndPublishExploration;
