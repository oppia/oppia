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
var path = require('path');
var users = require('./users.js');
var waitFor = require('./waitFor.js');
var CreatorDashboardPage = require('./CreatorDashboardPage.js');
var ExplorationEditorPage = require('./ExplorationEditorPage.js');
var LibraryPage = require('./LibraryPage.js');
var TopicsAndSkillsDashboardPage = require('./TopicsAndSkillsDashboardPage.js');

var imageUploadInput = element(
  by.css('.protractor-test-photo-upload-input'));
var imageSubmitButton = element(
  by.css('.protractor-test-photo-upload-submit'));

// check if the save roles button is clickable
var canAddRolesToUsers = function() {
  return element(by.css('.protractor-test-save-role')).isEnabled();
};

// check if the warning message is visible when the title is ''
var checkForAddTitleWarning = function() {
  return element(by.className('protractor-test-title-warning')).isDisplayed();
};

// trigger onblur event for title
var triggerTitleOnBlurEvent = function() {
  element(by.css('.protractor-test-exploration-title-input')).click();
  element(by.css('.protractor-test-exploration-objective-input')).click();
};

// open edit roles
var openEditRolesForm = function() {
  element(by.css('.protractor-test-edit-roles')).click();
  element(by.css('.protractor-test-role-username')).sendKeys('Chuck Norris');
};

// Creates an exploration, opens its editor and skips the tutorial.
var createExploration = function() {
  createExplorationAndStartTutorial();
  var explorationEditorPage = new ExplorationEditorPage.ExplorationEditorPage();
  var explorationEditorMainTab = explorationEditorPage.getMainTab();
  explorationEditorMainTab.exitTutorial();
};

// Creates a new exploration and wait for the exploration tutorial to start.
var createExplorationAndStartTutorial = function() {
  var creatorDashboardPage = new CreatorDashboardPage.CreatorDashboardPage;
  creatorDashboardPage.get();
  // Wait for the dashboard to transition the creator into the editor page.
  users.isAdmin().then(function(isAdmin) {
    creatorDashboardPage.clickCreateActivityButton();
    if (isAdmin) {
      var activityCreationModal = element(
        by.css('.protractor-test-creation-modal'));
      waitFor.visibilityOf(
        activityCreationModal,
        'ActivityCreationModal takes too long to be visible.');
      var createExplorationButton = element(
        by.css('.protractor-test-create-exploration'));
      waitFor.elementToBeClickable(
        createExplorationButton,
        'createExplorationButton takes too long to be clickable.');
      createExplorationButton.click();
    }
  });
};

/**
 * Only Admin users can create collections.
 */
var createCollectionAsAdmin = function() {
  var creatorDashboardPage = new CreatorDashboardPage.CreatorDashboardPage;
  creatorDashboardPage.get();
  creatorDashboardPage.clickCreateActivityButton();
  var activityCreationModal = element(
    by.css('.protractor-test-creation-modal'));
  waitFor.visibilityOf(
    activityCreationModal, 'Activity Creation modal takes too long to appear');
  creatorDashboardPage.clickCreateCollectionButton();
};

/**
 * Creating exploration for Admin users.
 */
var createExplorationAsAdmin = function() {
  var creatorDashboardPage = new CreatorDashboardPage.CreatorDashboardPage;
  creatorDashboardPage.get();
  creatorDashboardPage.clickCreateActivityButton();
  var activityCreationModal = element(
    by.css('.protractor-test-creation-modal'));
  waitFor.visibilityOf(
    activityCreationModal, 'Activity Creation modal takes too long to appear');
  creatorDashboardPage.clickCreateExplorationButton();
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

  waitFor.invisibilityOf(
    prePublicationButtonElem,
    'prePublicationButtonElem taking too long to disappear while publishing');
  element(by.css('.protractor-test-confirm-publish')).click();

  var sharePublishModal = element(
    by.css('.protractor-test-share-publish-modal'));
  var closePublishModalButton = element(
    by.css('.protractor-test-share-publish-close'));
  waitFor.visibilityOf(
    sharePublishModal, 'Share Publish Modal takes too long to appear');
  waitFor.elementToBeClickable(
    closePublishModalButton, 'Close Publish Modal button is not clickable');
  closePublishModalButton.click();
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

var createAddExpDetailsAndPublishExp = function(
    title, category, objective, language, tags) {
  createExploration();
  var explorationEditorPage = new ExplorationEditorPage.ExplorationEditorPage();
  var explorationEditorMainTab = explorationEditorPage.getMainTab();
  explorationEditorMainTab.setContent(forms.toRichText('new exploration'));
  explorationEditorMainTab.setInteraction('EndExploration');
  explorationEditorPage.saveChanges('Save the changes');
  explorationEditorPage.publishCardExploration(
    title, objective, category, language, tags);
};

// Creates and publishes a exploration with two cards
var createAndPublishTwoCardExploration = function(
    title, category, objective, language) {
  createExploration();
  var explorationEditorPage = new ExplorationEditorPage.ExplorationEditorPage();
  var explorationEditorMainTab = explorationEditorPage.getMainTab();
  explorationEditorMainTab.setContent(forms.toRichText('card 1'));
  explorationEditorMainTab.setInteraction('Continue');
  explorationEditorMainTab.getResponseEditor('default').setDestination(
    'second card', true, null
  );
  explorationEditorMainTab.moveToState('second card');
  explorationEditorMainTab.setContent(forms.toRichText('card 2'));
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

var addExplorationVoiceArtist = function(username) {
  _addExplorationRole('Voice Artist', username);
};

var addExplorationPlaytester = function(username) {
  _addExplorationRole('Playtester', username);
};

// Here, roleName is the server-side form of the name (e.g. 'owner').
var _getExplorationRoles = function(roleName) {
  var itemName = roleName + 'Name';
  var listName = roleName + 'Names';
  return element.all(by.repeater(
    itemName + ' in $ctrl.ExplorationRightsService.' + listName +
    ' track by $index'
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

var getExplorationVoiceArtists = function() {
  return _getExplorationRoles('voiceArtist');
};

var getExplorationPlaytesters = function() {
  return _getExplorationRoles('viewer');
};

var createSkillAndAssignTopic = function(
    skillDescription, material, topicName) {
  var topicsAndSkillsDashboardPage =
      new TopicsAndSkillsDashboardPage.TopicsAndSkillsDashboardPage();
  topicsAndSkillsDashboardPage.get();
  topicsAndSkillsDashboardPage.createSkillWithDescriptionAndExplanation(
    skillDescription, material, true);
  topicsAndSkillsDashboardPage.get();
  topicsAndSkillsDashboardPage.navigateToUnusedSkillsTab();
  topicsAndSkillsDashboardPage.searchSkillByName(skillDescription);
  topicsAndSkillsDashboardPage.assignSkillWithIndexToTopicByTopicName(
    0, topicName);
};

var getImageSource = function(customImageElement) {
  waitFor.visibilityOf(
    customImageElement,
    'Image element is taking too long to appear.');
  return customImageElement.getAttribute('src');
};

var uploadImage = function(imageClickableElement, imgPath) {
  waitFor.visibilityOf(
    imageClickableElement,
    'Image element is taking too long to appear.');
  imageClickableElement.click();
  absPath = path.resolve(__dirname, imgPath);
  return imageUploadInput.sendKeys(absPath);
};

var submitImage = function(imageClickableElement, imageContainer, imgPath) {
  waitFor.visibilityOf(
    imageClickableElement,
    'Image element is taking too long to appear.');
  return this.uploadImage(
    imageClickableElement, imgPath).then(function() {
    waitFor.visibilityOf(
      imageContainer, 'Image container is taking too long to appear');
  }).then(function() {
    imageSubmitButton.click();
  }).then(function() {
    waitFor.invisibilityOf(
      imageUploadInput,
      'Image uploader is taking too long to disappear');
    return waitFor.pageToFullyLoad();
  });
};

exports.getImageSource = getImageSource;
exports.submitImage = submitImage;
exports.uploadImage = uploadImage;

exports.createExploration = createExploration;
exports.createExplorationAndStartTutorial = createExplorationAndStartTutorial;
exports.publishExploration = publishExploration;
exports.createAndPublishExploration = createAndPublishExploration;
exports.createCollectionAsAdmin = createCollectionAsAdmin;
exports.createExplorationAsAdmin = createExplorationAsAdmin;
exports.createAndPublishTwoCardExploration = createAndPublishTwoCardExploration;

exports.canAddRolesToUsers = canAddRolesToUsers;
exports.checkForAddTitleWarning = checkForAddTitleWarning;
exports.triggerTitleOnBlurEvent = triggerTitleOnBlurEvent;
exports.openEditRolesForm = openEditRolesForm;
exports.addExplorationManager = addExplorationManager;
exports.addExplorationCollaborator = addExplorationCollaborator;
exports.addExplorationVoiceArtist = addExplorationVoiceArtist;
exports.addExplorationPlaytester = addExplorationPlaytester;
exports.getExplorationManagers = getExplorationManagers;
exports.getExplorationCollaborators = getExplorationCollaborators;
exports.getExplorationVoiceArtists = getExplorationVoiceArtists;
exports.getExplorationPlaytesters = getExplorationPlaytesters;
exports.createAddExpDetailsAndPublishExp = createAddExpDetailsAndPublishExp;
exports.createSkillAndAssignTopic = createSkillAndAssignTopic;
