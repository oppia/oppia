// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * carrrying out end-to-end testing with protractor.
 */

var forms = require('./forms.js');
var general = require('./general.js');
var CreatorDashboardPage = require('./CreatorDashboardPage.js');
var ExplorationEditorPage = require('./ExplorationEditorPage.js');
var LibraryPage = require('./LibraryPage.js');
var until = protractor.ExpectedConditions;

// Creates an exploration, opens its editor and skip the tutorial.
var createExploration = function() {
  createExplorationAndStartTutorial();
  var explorationEditorPage = new ExplorationEditorPage.ExplorationEditorPage();
  var explorationEditorMainTab = explorationEditorPage.getMainTab();
  explorationEditorMainTab.exitTutorial();
};

// Creates a new exploration and wait for the exploration tutorial to start.
var createExplorationAndStartTutorial = function() {
  creatorDashboardPage = new CreatorDashboardPage.CreatorDashboardPage;
  creatorDashboardPage.get();
  // Wait for the dashboard to transition the creator into the editor page.
  creatorDashboardPage.clickCreateActivityButton();
};

/**
 * Only Admin users can create collections.
 */
var createCollectionAsAdmin = function() {
  creatorDashboardPage = new CreatorDashboardPage.CreatorDashboardPage;
  creatorDashboardPage.get();
  creatorDashboardPage.clickCreateActivityButton();
  var activityCreationModal = element(
    by.css('.protractor-test-creation-modal'));
  browser.wait(until.visibilityOf(activityCreationModal), 5000,
    'Activity Creation modal takes too long to appear')
    .then(function(isVisible) {
      if (isVisible) {
        creatorDashboardPage.clickCreateCollectionButton();
      }
    });
};

/**
 * Creating exploration for Admin users.
 */
var createExplorationAsAdmin = function() {
  creatorDashboardPage = new CreatorDashboardPage.CreatorDashboardPage;
  creatorDashboardPage.get();
  creatorDashboardPage.clickCreateActivityButton();
  var activityCreationModal = element(
    by.css('.protractor-test-creation-modal'));
  browser.wait(until.visibilityOf(activityCreationModal), 5000,
    'Activity Creation modal takes too long to appear')
    .then(function(isVisible) {
      if (isVisible) {
        creatorDashboardPage.clickCreateExplorationButton();
      }
    });
};

// This will only work if all changes have been saved and there are no
// outstanding warnings; run from the editor.
var publishExploration = function() {
  element(by.css('.protractor-test-publish-exploration')).isDisplayed().then(
    function() {
      element(by.css('.protractor-test-publish-exploration')).click();
    });
  var prePublicationButtonElem = element(by.css(
    '.protractor-test-confirm-pre-publication'));
  prePublicationButtonElem.isPresent().then(function() {
    prePublicationButtonElem.click();
  });
  var until = protractor.ExpectedConditions;
  browser.wait(until.invisibilityOf(prePublicationButtonElem), 5000,
    'prePublicationButtonElem taking too long to disappear while publishing');
  element(by.css('.protractor-test-confirm-publish')).click().then(function(){
    var sharePublishModal = element(
      by.css('.protractor-test-share-publish-modal'));
    var closePublishModalButton = element(
      by.css('.protractor-test-share-publish-close'));
    browser.wait(until.visibilityOf(sharePublishModal), 5000,
      'Share Publish Modal takes too long to appear').then(function(isVisible){
      if (isVisible) {
        browser.wait(until.elementToBeClickable(closePublishModalButton), 5000
          , 'Close Publish Modal button is not clickable')
          .then(function(isClickable) {
            if (isClickable) {
              closePublishModalButton.click();
            }
          });
      }
    });
  });
};

// Creates and publishes a minimal exploration
var createAndPublishExploration = function(
    title, category, objective, language) {
  createExploration();
  var explorationEditorPage = new ExplorationEditorPage.ExplorationEditorPage();
  var explorationEditorMainTab = explorationEditorPage.getMainTab();
  explorationEditorMainTab.setContent(forms.toRichText('new exploration'));
  explorationEditorMainTab.setInteraction('EndExploration');

  var explorationEditorSettingsTab = explorationEditorPage.getSettingsTab();
  explorationEditorPage.navigateToSettingsTab();
  explorationEditorSettingsTab.setTitle(title);
  explorationEditorSettingsTab.setCategory(category);
  explorationEditorSettingsTab.setObjective(objective);
  if (language) {
    explorationEditorSettingsTab.setLanguage(language);
  }
  explorationEditorPage.saveChanges();
  publishExploration();
};

// Role management (state editor settings tab)

// Here, 'roleName' is the user-visible form of the role name (e.g. 'Manager').
var _addExplorationRole = function(roleName, username) {
  element(by.css('.protractor-test-edit-roles')).click();
  element(by.css('.protractor-test-role-username')).sendKeys(username);
  element(by.css('.protractor-test-role-select')).
    element(by.cssContainingText('option', roleName)).click();
  element(by.css('.protractor-test-save-role')).click();
};

var addExplorationManager = function(username) {
  _addExplorationRole('Manager', username);
};

var addExplorationCollaborator = function(username) {
  _addExplorationRole('Collaborator', username);
};

var addExplorationTranslator = function(username) {
  _addExplorationRole('Translator', username);
};

var addExplorationPlaytester = function(username) {
  _addExplorationRole('Playtester', username);
};

// Here, roleName is the server-side form of the name (e.g. 'owner').
var _getExplorationRoles = function(roleName) {
  var itemName = roleName + 'Name';
  var listName = roleName + 'Names';
  return element.all(by.repeater(
    itemName + ' in ExplorationRightsService.' + listName + ' track by $index'
  )).map(function(elem) {
    return elem.getText();
  });
};

var getExplorationManagers = function() {
  return _getExplorationRoles('owner');
};

var getExplorationCollaborators = function() {
  return _getExplorationRoles('editor');
};

var getExplorationTranslators = function() {
  return _getExplorationRoles('translator');
};

var getExplorationPlaytesters = function() {
  return _getExplorationRoles('viewer');
};

exports.createExploration = createExploration;
exports.createExplorationAndStartTutorial = createExplorationAndStartTutorial;
exports.publishExploration = publishExploration;
exports.createAndPublishExploration = createAndPublishExploration;
exports.createCollectionAsAdmin = createCollectionAsAdmin;
exports.createExplorationAsAdmin = createExplorationAsAdmin;

exports.addExplorationManager = addExplorationManager;
exports.addExplorationCollaborator = addExplorationCollaborator;
exports.addExplorationTranslator = addExplorationTranslator;
exports.addExplorationPlaytester = addExplorationPlaytester;
exports.getExplorationManagers = getExplorationManagers;
exports.getExplorationCollaborators = getExplorationCollaborators;
exports.getExplorationTranslators = getExplorationTranslators;
exports.getExplorationPlaytesters = getExplorationPlaytesters;
