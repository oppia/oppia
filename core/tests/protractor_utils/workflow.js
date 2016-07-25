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
var editor = require('./editor.js');
var general = require('./general.js');

// Creates an exploration and opens its editor.
var createExploration = function() {
  createExplorationAndStartTutorial();
  editor.exitTutorialIfNecessary();
};

// Creates a new exploration and wait for the exploration tutorial to start.
var createExplorationAndStartTutorial = function() {
  browser.get(general.LIBRARY_URL_SUFFIX);
  element(by.css('.protractor-test-create-activity')).click();

  // Wait for the dashboard to transition the creator into the editor page.
  browser.waitForAngular();
};

// This will only work if all changes have been saved and there are no
// outstanding warnings; run from the editor.
var publishExploration = function() {
  element(by.css('.protractor-test-publish-exploration')).click();
  browser.waitForAngular();
  general.waitForSystem();

  var prePublicationButtonElem = element(by.css(
    '.protractor-test-confirm-pre-publication'));
  prePublicationButtonElem.isPresent().then(function() {
    prePublicationButtonElem.click();
    general.waitForSystem();
  });

  element(by.css('.protractor-test-confirm-publish')).click();
};

// Creates and publishes a minimal exploration
var createAndPublishExploration = function(
    title, category, objective, language) {
  createExploration();
  editor.setContent(forms.toRichText('new exploration'));
  editor.setInteraction('TextInput');
  editor.setDefaultOutcome(null, 'final state', true);
  editor.setTitle(title);
  editor.setCategory(category);
  editor.setObjective(objective);
  if (language) {
    editor.setLanguage(language);
  }
  editor.setInteraction('Continue');

  // Setup a terminating state
  editor.moveToState('final state');
  editor.setInteraction('EndExploration');
  editor.saveChanges();

  publishExploration();
};

// Run from the editor, requires user to be a moderator / admin.
var markExplorationAsFeatured = function() {
  editor.runFromSettingsTab(function() {
    element(by.css('.protractor-test-mark-exploration-featured')).click();
    general.waitForSystem();
    element(by.css('.protractor-test-feature-exploration-button')).click();
  });
};

// Role management (state editor settings tab)

// Here, 'roleName' is the user-visible form of the role name (e.g. 'Manager').
var _addExplorationRole = function(roleName, username) {
  editor.runFromSettingsTab(function() {
    element(by.css('.protractor-test-edit-roles')).click();
    element(by.css('.protractor-test-role-username')).sendKeys(username);
    element(by.css('.protractor-test-role-select')).
      element(by.cssContainingText('option', roleName)).click();
    element(by.css('.protractor-test-save-role')).click();
  });
};

var addExplorationManager = function(username) {
  _addExplorationRole('Manager', username);
};

var addExplorationCollaborator = function(username) {
  _addExplorationRole('Collaborator', username);
};

var addExplorationPlaytester = function(username) {
  _addExplorationRole('Playtester', username);
};

// Here, roleName is the server-side form of the name (e.g. 'owner').
var _getExplorationRoles = function(roleName) {
  var result = editor.runFromSettingsTab(function() {
    var itemName = roleName + 'Name';
    var listName = roleName + 'Names';
    return element.all(by.repeater(
      itemName + ' in explorationRightsService.' + listName + ' track by $index'
    )).map(function(elem) {
      return elem.getText();
    });
  });
  return result;
};

var getExplorationManagers = function() {
  return _getExplorationRoles('owner');
};

var getExplorationCollaborators = function() {
  return _getExplorationRoles('editor');
};

var getExplorationPlaytesters = function() {
  return _getExplorationRoles('viewer');
};

exports.createExploration = createExploration;
exports.createExplorationAndStartTutorial = createExplorationAndStartTutorial;
exports.publishExploration = publishExploration;
exports.createAndPublishExploration = createAndPublishExploration;
exports.markExplorationAsFeatured = markExplorationAsFeatured;

exports.addExplorationManager = addExplorationManager;
exports.addExplorationCollaborator = addExplorationCollaborator;
exports.addExplorationPlaytester = addExplorationPlaytester;
exports.getExplorationManagers = getExplorationManagers;
exports.getExplorationCollaborators = getExplorationCollaborators;
exports.getExplorationPlaytesters = getExplorationPlaytesters;
