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
var TopicsAndSkillsDashboardPage = require('./TopicsAndSkillsDashboardPage.js');

var imageUploadInput = element(
  by.css('.protractor-test-photo-upload-input'));
var imageSubmitButton = element(
  by.css('.protractor-test-photo-upload-submit'));
var thumbnailResetButton = element(by.css(
  '.protractor-thumbnail-reset-button'));

// Check if the save roles button is clickable.
var canAddRolesToUsers = async function() {
  return await element(by.css('.protractor-test-save-role')).isEnabled();
};

// Check if the warning message is visible when the title is ''.
var checkForAddTitleWarning = async function() {
  return await element(
    by.className('protractor-test-title-warning')).isDisplayed();
};

// Trigger onblur event for title.
var triggerTitleOnBlurEvent = async function() {
  var testExplorationTitleInput = element(by.css('.protractor-test-exploration-title-input'));
  await action.click('Test Exploration Title Input', testExplorationTitleInput);
  var testExplorationObjectiveInput = element(by.css('.protractor-test-exploration-objective-input'));
  await action.click('Test Exploration Objective Input', testExplorationObjectiveInput);
};

// Open edit roles.
var openEditRolesForm = async function() {
  var testEditRoles = element(by.css('.protractor-test-edit-roles'));
  await action.click('Test Edit Roles', testEditRoles);
  var testRoleUsername = element(by.css('.protractor-test-role-username'));
  await action.sendKeys('testRoleUsername', testRoleUsername, 'Chuck Norris')
};

// Creates an exploration, opens its editor and skips the tutorial.
var createExploration = async function() {
  await createExplorationAndStartTutorial();
  var explorationEditorPage = new ExplorationEditorPage.ExplorationEditorPage();
  var explorationEditorMainTab = explorationEditorPage.getMainTab();
  await explorationEditorMainTab.exitTutorial();
};

// Creates a new exploration and wait for the exploration tutorial to start.
var createExplorationAndStartTutorial = async function() {
  var creatorDashboardPage = new CreatorDashboardPage.CreatorDashboardPage;
  await creatorDashboardPage.get();
  // Wait for the dashboard to transition the creator into the editor page.
  var isAdmin = await users.isAdmin();

  await creatorDashboardPage.clickCreateActivityButton();
  if (isAdmin) {
    var activityCreationModal = element(
      by.css('.protractor-test-creation-modal'));
    await waitFor.visibilityOf(
      activityCreationModal,
      'ActivityCreationModal takes too long to be visible.');
    var createExplorationButton = element(
      by.css('.protractor-test-create-exploration'));
    await action.click("createExplorationButton", createExplorationButton)
  }
};

/**
 * Only Admin users can create collections.
 */
var createCollectionAsAdmin = async function() {
  var creatorDashboardPage = new CreatorDashboardPage.CreatorDashboardPage;
  await creatorDashboardPage.get();
  await creatorDashboardPage.clickCreateActivityButton();
  var activityCreationModal = element(
    by.css('.protractor-test-creation-modal'));
  await waitFor.visibilityOf(
    activityCreationModal, 'Activity Creation modal takes too long to appear');
  await creatorDashboardPage.clickCreateCollectionButton();
};

/**
 * Creating exploration for Admin users.
 */
var createExplorationAsAdmin = async function() {
  var creatorDashboardPage = new CreatorDashboardPage.CreatorDashboardPage;
  await creatorDashboardPage.get();
  await creatorDashboardPage.clickCreateActivityButton();
  var activityCreationModal = element(
    by.css('.protractor-test-creation-modal'));
  await waitFor.visibilityOf(
    activityCreationModal, 'Activity Creation modal takes too long to appear');
  await creatorDashboardPage.clickCreateExplorationButton();
};

// This will only work if all changes have been saved and there are no
// outstanding warnings; run from the editor.
var publishExploration = async function() {
  await element(by.css('.protractor-test-publish-exploration')).isDisplayed();

  var testPublishExplorationButton = element(by.css('.protractor-test-publish-exploration'));
  await action.click("testPublishExplorationButton", testPublishExplorationButton);

  var prePublicationButtonElem = element(by.css(
    '.protractor-test-confirm-pre-publication'));
  await prePublicationButtonElem.isPresent();
  await action.click("prePublicationButtonElem", prePublicationButtonElem)

  await waitFor.invisibilityOf(
    prePublicationButtonElem,
    'prePublicationButtonElem taking too long to disappear while publishing');
  var testConfirmPublishButton = element(by.css('.protractor-test-confirm-publish'));
  await action.click("testConfirmPublishButton", testConfirmPublishButton);

  var sharePublishModal = element(
    by.css('.protractor-test-share-publish-modal'));
  var closePublishModalButton = element(
    by.css('.protractor-test-share-publish-close'));
  await waitFor.visibilityOf(
    sharePublishModal, 'Share Publish Modal takes too long to appear');
  await action.click("closePublishModalButton", closePublishModalButton);
};

// Creates and publishes a minimal exploration.
var createAndPublishExploration = async function(
    title, category, objective, language) {
  await createExploration();
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

var createAddExpDetailsAndPublishExp = async function(
    title, category, objective, language, tags) {
  await createExploration();
  var explorationEditorPage = new ExplorationEditorPage.ExplorationEditorPage();
  var explorationEditorMainTab = explorationEditorPage.getMainTab();
  await explorationEditorMainTab.setContent(
    await forms.toRichText('new exploration'));
  await explorationEditorMainTab.setInteraction('EndExploration');
  await explorationEditorPage.saveChanges('Save the changes');
  await explorationEditorPage.publishCardExploration(
    title, objective, category, language, tags);
};

// Creates and publishes a exploration with two cards.
var createAndPublishTwoCardExploration = async function(
    title, category, objective, language) {
  await createExploration();
  var explorationEditorPage = new ExplorationEditorPage.ExplorationEditorPage();
  var explorationEditorMainTab = explorationEditorPage.getMainTab();
  await explorationEditorMainTab.setContent(await forms.toRichText('card 1'));
  await explorationEditorMainTab.setInteraction('Continue');
  var responseEditor = await explorationEditorMainTab.getResponseEditor(
    'default');
  await responseEditor.setDestination('second card', true, null);
  await explorationEditorMainTab.moveToState('second card');
  await explorationEditorMainTab.setContent(await forms.toRichText('card 2'));
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

// ---- Role management (state editor settings tab) ----

// Here, 'roleName' is the user-visible form of the role name (e.g. 'Manager').
var _addExplorationRole = async function(roleName, username) {
  var testEditRoles = element(by.css('.protractor-test-edit-roles'));
  await action.click(testEditRoles);
  var testRoleUsername = element(by.css('.protractor-test-role-username'));
  await action.sendKeys('testRoleUsername', testRoleUsername, username)
  await element(by.css('.protractor-test-role-select')).
    element(by.cssContainingText('option', roleName)).click();
  var testSaveRole = element(by.css('.protractor-test-save-role'));
  await action.click("testSaveRole", testSaveRole);
};

var addExplorationManager = async function(username) {
  await _addExplorationRole('Manager', username);
};

var addExplorationCollaborator = async function(username) {
  await _addExplorationRole('Collaborator', username);
};

var addExplorationVoiceArtist = async function(username) {
  await _addExplorationRole('Voice Artist', username);
};

var addExplorationPlaytester = async function(username) {
  await _addExplorationRole('Playtester', username);
};

// Here, roleName is the server-side form of the name (e.g. 'owner').
var _getExplorationRoles = async function(roleName) {
  var itemName = roleName + 'Name';
  var listName = roleName + 'Names';
  return await element.all(by.repeater(
    itemName + ' in $ctrl.ExplorationRightsService.' + listName +
    ' track by $index'
  )).map(async function(elem) {
    return await elem.getText();
  });
};

var getExplorationManagers = async function() {
  return await _getExplorationRoles('owner');
};

var getExplorationCollaborators = async function() {
  return await _getExplorationRoles('editor');
};

var getExplorationVoiceArtists = async function() {
  return await _getExplorationRoles('voiceArtist');
};

var getExplorationPlaytesters = async function() {
  return await _getExplorationRoles('viewer');
};

var createSkillAndAssignTopic = async function(
    skillDescription, material, topicName) {
  var topicsAndSkillsDashboardPage = (
    new TopicsAndSkillsDashboardPage.TopicsAndSkillsDashboardPage());
  await topicsAndSkillsDashboardPage.get();
  await topicsAndSkillsDashboardPage.createSkillWithDescriptionAndExplanation(
    skillDescription, material, true);
  await topicsAndSkillsDashboardPage.get();
  await topicsAndSkillsDashboardPage.navigateToSkillsTab();
  await topicsAndSkillsDashboardPage.filterSkillsByStatus('Unassigned');
  await topicsAndSkillsDashboardPage.searchSkillByName(skillDescription);
  await topicsAndSkillsDashboardPage.assignSkillToTopic(
    skillDescription, topicName);
};

var getImageSource = async function(customImageElement) {
  await waitFor.visibilityOf(
    customImageElement,
    'Image element is taking too long to appear.');
  return await customImageElement.getAttribute('src');
};

var uploadImage = async function(
  imageClickableElement, imgPath, resetExistingImage) {
  await imageClickableElement.click();

  if (resetExistingImage) {
    expect(await thumbnailResetButton.isPresent()).toBe(true);
    await action.click("thumbnailResetButton", thumbnailResetButton);
  } else {
    expect(await thumbnailResetButton.isPresent()).toBe(false);
  }

  absPath = path.resolve(__dirname, imgPath);
  return await action.sendKeys('imageUploadInput', imageUploadInput, absPath)
};

var submitImage = async function(
    imageClickableElement, imageContainer, imgPath, resetExistingImage) {
  await waitFor.visibilityOf(
    imageClickableElement,
    'Image element is taking too long to appear.');
  await uploadImage(imageClickableElement, imgPath, resetExistingImage);
  await waitFor.visibilityOf(
    imageContainer, 'Image container is taking too long to appear');
  await action.click("imageSubmitButton", imageSubmitButton);
  await waitFor.invisibilityOf(
    imageUploadInput,
    'Image uploader is taking too long to disappear');
  await waitFor.invisibilityOf(
    imageContainer,
    'Image container is taking too long to disappear');
  return await waitFor.pageToFullyLoad();
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
