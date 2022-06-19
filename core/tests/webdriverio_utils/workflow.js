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

var getImageSource = async function(customImageElement) {
  await waitFor.visibilityOf(
    customImageElement,
    'Image element is taking too long to appear.');
  return await customImageElement.getAttribute('src');
};

var uploadImage = async function(
    imageClickableElement, imgPath, resetExistingImage) {
  await action.click('Image clickable element', imageClickableElement);
  var thumbnailResetButton = $(
    '.protractor-test-thumbnail-reset-button');
  if (resetExistingImage) {
    expect(await thumbnailResetButton.isExisting()).toBe(true);
    await action.click('Topic thumbnail reset button', thumbnailResetButton);
  } else {
    expect(await thumbnailResetButton.isExisting()).toBe(false);
  }

  absPath = path.resolve(__dirname, imgPath);
  var imageUploadInput = $('.protractor-test-photo-upload-input');
  return await action.keys(
    'Image Upload Input', imageUploadInput, absPath, clickInputElement = false);
};

var submitImage = async function(
    imageClickableElement, imageContainer, imgPath, resetExistingImage) {
  await waitFor.visibilityOf(
    imageClickableElement,
    'Image element is taking too long to appear.');
  await uploadImage(imageClickableElement, imgPath, resetExistingImage);
  await waitFor.visibilityOf(
    imageContainer, 'Image container is taking too long to appear');
  var imageSubmitButton = $('.protractor-test-photo-upload-submit');
  await action.click('Image submit button', imageSubmitButton);
  var imageUploadInput = $('.protractor-test-photo-upload-input');
  await waitFor.invisibilityOf(
    imageUploadInput,
    'Image uploader is taking too long to disappear');
  await waitFor.invisibilityOf(
    imageContainer,
    'Image container is taking too long to disappear');
  return await waitFor.pageToFullyLoad();
};

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
    var activityCreationModal = await $('.protractor-test-creation-modal');
    await waitFor.visibilityOf(
      activityCreationModal,
      'ActivityCreationModal takes too long to be visible.');
    var createExplorationButton = await $(
      '.protractor-test-create-exploration');
    await action.click('Create Exploration Button', createExplorationButton);
  }

  await waitFor.pageToFullyLoad();
  var stateNameText = await $('.protractor-test-state-name-text');
  await waitFor.visibilityOf(
    stateNameText, 'State name text takes too long to appear.');
};

// This will only work if all changes have been saved and there are no
// outstanding warnings; run from the editor.
var publishExploration = async function() {
  await waitFor.elementToBeClickable(
    $('.protractor-test-publish-exploration'));
  await $('.protractor-test-publish-exploration').isDisplayed();
  var testPublishExploration = $('.protractor-test-publish-exploration');
  await action.click('Test Publish Exploration', testPublishExploration);
  var prePublicationButtonElem = $(
    '.protractor-test-confirm-pre-publication');
  await action.click(
    'Pre Publication Button Element', prePublicationButtonElem);

  await waitFor.invisibilityOf(
    prePublicationButtonElem,
    'prePublicationButtonElem taking too long to disappear while publishing');
  var testConfirmPublish = $('.protractor-test-confirm-publish');
  await action.click('Test Confirm Publish', testConfirmPublish);

  var acceptCookieButton = $(
    '.protractor-test-oppia-cookie-banner-accept-button');
  var cookieButtonPresent = await acceptCookieButton.isDisplayed();
  if (cookieButtonPresent) {
    await action.click('Accept Cookie Button', acceptCookieButton);
  }

  var sharePublishModal = $('.protractor-test-share-publish-modal');
  await waitFor.visibilityOf(
    sharePublishModal, 'Share Publish Modal takes too long to appear');
  var closePublishModalButton = $('.protractor-test-share-publish-close');
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

exports.getImageSource = getImageSource;
exports.submitImage = submitImage;
exports.uploadImage = uploadImage;

exports.createAndPublishExploration = createAndPublishExploration;
