// Copyright 2017 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Page object for the admin page, for use in Protractor
 * tests.
 */

var action = require('./action.js');
var forms = require('./forms.js');
var general = require('./general.js');
var waitFor = require('./waitFor.js');
var path = require('path');

var AdminPage = function() {
  var ADMIN_URL_SUFFIX = '/admin';
  var numExtractionHandles = 0;
  var REVIEW_CATEGORY_TRANSLATION = 'TRANSLATION';
  var REVIEW_CATEGORY_VOICEOVER = 'VOICEOVER';
  var REVIEW_CATEGORY_QUESTION = 'QUESTION';

  var configTab = element(by.css('.protractor-test-admin-config-tab'));
  var saveAllConfigs = element(by.css('.protractor-test-save-all-configs'));
  var configProperties = element.all(by.css(
    '.protractor-test-config-property'
  ));
  var adminRolesTab = element(by.css('.protractor-test-admin-roles-tab'));
  var adminRolesTabContainer = element(
    by.css('.protractor-test-roles-tab-container'));
  var updateFormName = element(by.css('.protractor-update-form-name'));
  var updateFormSubmit = element(by.css('.protractor-update-form-submit'));
  var roleSelect = element(by.css('.protractor-update-form-role-select'));
  var statusMessage = element(by.css('.protractor-test-status-message'));

  var assignReviewerForm = element(
    by.css('.protractor-test-assign-reviewer-form'));
  var viewReviewerForm = element(by.css('.protractor-test-view-reviewer-form'));
  var languageSelectCss = by.css('.protractor-test-form-language-select');
  var reviewerUsernameCss = by.css('.protractor-test-form-reviewer-username');
  var reviewCategorySelectCss = by.css(
    '.protractor-test-form-review-category-select');
  var reviewerFormSubmitButtonCss = by.css(
    '.protractor-test-reviewer-form-submit-button');
  var userTranslationReviewerLanguageCss = by.css(
    '.protractor-test-translation-reviewer-language');
  var userVoiceoverReviewerLanguageCss = by.css(
    '.protractor-test-voiceover-reviewer-language');
  var userQuestionReviewerCss = by.css('.protractor-test-question-reviewer');
  var viewReviewerMethodInputCss = by.css(
    '.protractor-test-view-reviewer-method');

  var roleDropdown = element(by.css('.protractor-test-role-method'));
  var roleValueOption = element(by.css('.protractor-test-role-value'));
  var roleUsernameOption = element(by.css(
    '.protractor-test-username-value'));
  var viewRoleButton = element(by.css('.protractor-test-role-success'));
  var oneOffJobRows = element.all(by.css('.protractor-test-one-off-jobs-rows'));
  var unfinishedOneOffJobRows = element.all(by.css(
    '.protractor-test-unfinished-one-off-jobs-rows'));
  var unfinishedOffJobIDClassName = (
    '.protractor-test-unfinished-one-off-jobs-id');

  var miscTabButton = element(by.css('.protractor-test-misc-tab'));
  var chooseSimilarityFileInput = element(
    by.css('.protractor-test-similarities-input'));
  var similarityFileUploadButton = element(
    by.css('.protractor-test-similarity-upload-button'));
  var similarityDownloadButton = element(
    by.css('.protractor-test-similarity-download-button'));
  var searchIndexClearButton = element(
    by.css('.protractor-test-clear-search-index-button'));
  var flushMigrationBotContributionsButton = element(
    by.css('.protractor-test-migration-bot-flush-contributions-button'));
  var extractDataExplorationIdInput = element(
    by.css('.protractor-test-extract-data-exploration-id'));
  var extractDataExplorationVersionInput = element(
    by.css('.protractor-test-extract-data-exploration-version'));
  var extractDataStateNameInput = element(
    by.css('.protractor-test-extract-data-state-name'));
  var extractDataNumAnswersInput = element(
    by.css('.protractor-test-extract-data-number-of-answers'));
  var extractDataFormSubmitButton = element(
    by.css('.protractor-test-extract-data-submit-button'));
  var extractDataStatusMessage = element(
    by.css('.protractor-test-extract-data-status-message'));
  var regenerateContributionsTopicIdInput = element(
    by.css('.protractor-test-regen-contributions-topic-id'));
  var regenerateContributionsSubmitButton = element(
    by.css('.protractor-test-regen-contributions-form-submit-button'));
  var sendEmailButton = element(
    by.css('.protractor-test-send-test-mail-button'));
  var oldUsernameInput = element(
    by.css('.protractor-test-old-username-input'));
  var newUsernameInput = element(
    by.css('.protractor-test-new-username-input'));
  var usernameChangeSubmitButton = element(
    by.css('.protractor-test-username-change-submit-button'));
  var regenerationMessage = element(
    by.css('.protractor-test-regeneration-error-message'));
  var usernameSection = element(
    by.css('.protractor-test-dropdown-username-section'));
  // Adding a new community reviewer.
  var addReviewerName = element(by.css(
    '.protractor-test-add-reviewer-username'));
  var selectReviewerRole = element(by.css(
    '.protractor-test-select-reviewer-role'));
  var addReviewerFormSubmitButton = element(by.css(
    '.protractor-test-add-reviewer-form-submit-button'));

  // Viewing community reviewers by role.
  var reviewerMethodDropdown = element(by.css(
    '.protractor-test-reviewer-role-method'));
  var reviewerRoleValueOption = element(by.css(
    '.protractor-test-reviewer-role-value'));
  var viewReviewerRoleButton = element(by.css(
    '.protractor-test-view-reviewer-role-button'));
  var reviewerUsernamesResult = element(by.css(
    '.protractor-test-reviewer-roles-result'));

  // The reload functions are used for mobile testing
  // done via Browserstack. These functions may cause
  // a problem when used to run tests directly on Travis.
  if (general.isInDevMode()) {
    var explorationElements = element.all(by.css(
      '.protractor-test-reload-exploration-row'
    ));

    var reloadCollectionButtons = element.all(by.css(
      '.protractor-test-reload-collection-button'));

    var getExplorationTitleElement = function(explorationElement) {
      return explorationElement.element(
        by.css('.protractor-test-reload-exploration-title')
      );
    };

    var getExplorationElementReloadButton = function(explorationElement) {
      return explorationElement.element(
        by.css('.protractor-test-reload-exploration-button')
      );
    };

    this.reloadCollection = async function(collectionId) {
      this.get();
      await (
        await reloadCollectionButtons.get(collectionId)
      ).click();
      await general.acceptAlert();
      // Time is needed for the reloading to complete.
      await waitFor.textToBePresentInElement(
        statusMessage, 'Data reloaded successfully.',
        'Collection could not be reloaded');
      return true;
    };

    // The name should be as given in the admin page (including '.yaml' if
    // necessary).
    this.reloadExploration = async function(name) {
      await this.get();
      explorationElements.map(async function(explorationElement) {
        var title = await getExplorationTitleElement(explorationElement)
          .getText();

        // We use match here in case there is whitespace around the name.
        if (title.match(name)) {
          await getExplorationElementReloadButton(explorationElement).click();
          await general.acceptAlert();
          // Time is needed for the reloading to complete.
          await waitFor.textToBePresentInElement(
            statusMessage, 'Data reloaded successfully.',
            'Exploration could not be reloaded');
          return true;
        }
      });
    };
  }

  var _switchToRolesTab = async function() {
    await action.click('Admin roles tab button', adminRolesTab);
    await waitFor.pageToFullyLoad();

    await expect(adminRolesTab.getAttribute('class')).toMatch('active');
    await waitFor.visibilityOf(
      adminRolesTabContainer, 'Roles tab page is not visible.');
  };

  var saveConfigProperty = async function(
      configProperty, propertyName, objectType, editingInstructions) {
    var title = await configProperty.element(
      by.css('.protractor-test-config-title')).getText();
    if (title.match(propertyName)) {
      await editingInstructions(
        await forms.getEditor(objectType)(configProperty));
      await saveAllConfigs.click();
      await general.acceptAlert();
      // Waiting for success message.
      await waitFor.textToBePresentInElement(
        statusMessage, 'saved successfully',
        'New config could not be saved');
      return true;
    }
  };

  this.get = async function() {
    await browser.get(ADMIN_URL_SUFFIX);
    await waitFor.pageToFullyLoad();
  };

  this.getJobsTab = async function() {
    await browser.get(ADMIN_URL_SUFFIX + '#/jobs');
    await waitFor.pageToFullyLoad();
  };

  this.editConfigProperty = async function(
      propertyName, objectType, editingInstructions) {
    await this.get();
    await configTab.click();
    await waitFor.elementToBeClickable(saveAllConfigs);

    const results = [];
    for (let configProperty of (await configProperties)) {
      results.push(
        await saveConfigProperty(
          configProperty, propertyName, objectType, editingInstructions)
      );
    }
    var success = null;
    for (var i = 0; i < results.length; i++) {
      success = success || results[i];
    }
    if (!success) {
      throw new Error('Could not find config property: ' + propertyName);
    }
  };

  this.startOneOffJob = async function(jobName) {
    await this._startOneOffJob(jobName, 0);
  };

  this._startOneOffJob = async function(jobName, i) {
    await waitFor.visibilityOf(
      await oneOffJobRows.first(),
      'Starting one off jobs taking too long to appear.');
    var text = await (await oneOffJobRows.get(i)).getText();
    if (text.toLowerCase().startsWith(jobName.toLowerCase())) {
      await (await oneOffJobRows.get(i)).element(
        by.css('.protractor-test-one-off-jobs-start-btn')).click();
    } else {
      await this._startOneOffJob(jobName, ++i);
    }
  };

  this.stopOneOffJob = async function(jobName) {
    await this._stopOneOffJob(jobName, 0);
  };

  this._stopOneOffJob = async function(jobName, i) {
    var text = await (await unfinishedOneOffJobRows.get(i)).getText();
    if (text.toLowerCase().startsWith(jobName.toLowerCase())) {
      await (await unfinishedOneOffJobRows.get(i)).element(
        by.css('.protractor-test-one-off-jobs-stop-btn')).click();
    } else {
      await this._stopOneOffJob(jobName, ++i);
    }
  };

  this.expectNumberOfRunningOneOffJobs = async function(count) {
    var len = await element.all(by.css(
      '.protractor-test-unfinished-one-off-jobs-id')).count();
    expect(len).toEqual(count);
  };

  this.expectJobToBeRunning = async function(jobName) {
    await browser.refresh();
    await waitFor.pageToFullyLoad();
    await waitFor.visibilityOf(element(
      by.css('.protractor-test-unfinished-jobs-card')),
    'Unfinished Jobs taking too long to appear');
    let regex = new RegExp(`^${jobName.toLowerCase()}.*`, 'i');
    let unfinishedJob = element(
      by.cssContainingText(unfinishedOffJobIDClassName, regex));
    var unfinishedJobName = await unfinishedJob.getText();
    expect(unfinishedJobName.toLowerCase().startsWith(
      jobName.toLowerCase())).toEqual(true);
  };

  this.updateRole = async function(name, newRole) {
    await waitFor.elementToBeClickable(
      adminRolesTab, 'Admin Roles tab is not clickable');
    await adminRolesTab.click();

    // Change values for "update role" form, and submit it.
    await waitFor.visibilityOf(
      updateFormName, 'Update Form Name is not visible');
    await updateFormName.sendKeys(name);
    var roleOption = roleSelect.element(
      by.cssContainingText('option', newRole));
    await waitFor.visibilityOf(roleOption, 'Admin role option is not visible');
    await roleOption.click();
    await updateFormSubmit.click();
    await waitFor.visibilityOf(
      statusMessage, 'Confirmation message not visible');
    await waitFor.textToBePresentInElement(
      statusMessage, 'successfully updated to',
      'Could not set role successfully');
  };

  this.getUsersAsssignedToRole = async function(role) {
    await waitFor.visibilityOf(
      roleDropdown, 'View role dropdown taking too long to be visible');
    await roleDropdown.sendKeys('By Role');

    await roleValueOption.click();
    await roleValueOption.sendKeys(role);

    await viewRoleButton.click();
  };

  this.viewRolesbyUsername = async function(username) {
    await waitFor.visibilityOf(
      roleDropdown, 'View role dropdown taking too long to be visible');
    await roleDropdown.sendKeys('By Username');

    await roleUsernameOption.click();
    await roleUsernameOption.sendKeys(username);

    await viewRoleButton.click();
  };

  this.expectUsernamesToMatch = async function(expectedUsernamesArray) {
    var foundUsersArray = [];
    var usernames = await element.all(
      by.css('.protractor-test-roles-result-rows'))
      .map(async function(elm) {
        var text = await elm.getText();
        return text;
      });

    for (i = 0; i < usernames.length; i++) {
      var name = usernames[i];
      foundUsersArray.push(name);
    }
    expect(foundUsersArray.length).toEqual(expectedUsernamesArray.length);

    expectedUsernamesArray.sort();
    foundUsersArray.sort();
    for (j = 0; j < foundUsersArray.length; j++) {
      var name = foundUsersArray[j];
      expect(name).toEqual(expectedUsernamesArray[j]);
    }
  };

  this.getMiscTab = async function() {
    await action.click('Misc Tab Button', miscTabButton);
    await waitFor.pageToFullyLoad();
  };

  this.expectStatusMessageToBe = async function(text) {
    await waitFor.visibilityOf(
      statusMessage, 'Status message taking too long to appear');
    expect(await statusMessage.getText()).toBe(text);
  };

  this.uploadTopicSimilarities = async function(
    relativePathToSimilaritiesFile) {
      var absPath = path.resolve(__dirname, relativePathToSimilaritiesFile);
      await waitFor.visibilityOf(
        chooseSimilarityFileInput,
        'Similarity upload form taking too long to appear');
      await chooseSimilarityFileInput.sendKeys(absPath);
      await action.click(
        'Similarity file upload button', similarityFileUploadButton);
    };

  this.expectSimilarityUploadSuccess = async function() {
    var text = 'Topic similarities uploaded successfully.';
    await waitFor.visibilityOf(
      statusMessage, 'Status message not visible');
    await waitFor.textToBePresentInElement(
      statusMessage, text, 'Text taking too long to appear in status message');
  };

  this.expectSimilarityUploadFailure = async function() {
    var text = 'Server error: \'ascii\' codec can\'t encode characters' +
      ' in position 1024-1025: ordinal not in range(128)';
    await waitFor.visibilityOf(
      statusMessage, 'Status message not visible');
    await waitFor.textToBePresentInElement(
      statusMessage, text, 'Text taking too long to appear in status message');
  };

  this.downloadSimilarityFile = async function() {
    await action.click(
      'Download Similarity File Button', similarityDownloadButton);
  };

  this.clearSearchIndex = async function() {
    await action.click('Clear search index button', searchIndexClearButton);
    await general.acceptAlert();
  };

  this.flushMigrationBotContributions = async function() {
    await action.click(
      'Migration bot flush contributions button',
      flushMigrationBotContributionsButton);
    await general.acceptAlert();
    await waitFor.textToBePresentInElement(
      statusMessage, 'Migration bot contributions successfully flushed.',
      'Success message for migration bot contributions flushing not visible.');
  };

  this.regenerateContributionsForTopic = async function(topicId) {
    await action.sendKeys(
      'Regenerate contributions topic ID input',
      regenerateContributionsTopicIdInput, topicId);
    await action.click(
      'Regenerate contributions form submit button',
      regenerateContributionsSubmitButton);
    await general.acceptAlert();
    await waitFor.visibilityOf(
      regenerateContributionsTopicIdInput,
      'Regenerate contributions topic ID input taking too long to appear.');
    await action.clear(
      'Regenerate contributions topic ID input',
      regenerateContributionsTopicIdInput);
  };

  this.expectContributionRegenerationFailure = async function() {
    var text = 'Server error: Entity for class TopicModel with id 0 not found';
    await waitFor.visibilityOf(
      regenerationMessage, 'Regeneration message not visible');
    await waitFor.textToBePresentInElement(regenerationMessage, text);
  };

  this.expectContributionRegenerationSuccess = async function() {
    var text = 'No. of opportunities model created: 0';
    await waitFor.visibilityOf(
      regenerationMessage, 'Regeneration message not visible');
    await waitFor.textToBePresentInElement(regenerationMessage, text);
  };

  this.changeUsername = async function(oldUsername, newUsername) {
    await action.sendKeys(
      'Current username input', oldUsernameInput, oldUsername);
    await action.sendKeys('New username input', newUsernameInput, newUsername);
    await action.click('Username change submit button',
      usernameChangeSubmitButton);
    var text = 'Successfully renamed ' + oldUsername + ' to ' + newUsername;
    await waitFor.textToBePresentInElement(
      statusMessage, text, 'Username was not successfully changed');
  };

  this.expectUsernameToBeChanged = async function(newUsername) {
    expect(usernameSection.getText()).toEqual(newUsername);
  };

  this.extractData = async function(
    expID, expVersion, stateName, numberOfAnswers, isMeantToFail) {
      await browser.refresh();
      await waitFor.pageToFullyLoad();
      await action.sendKeys(
        'Extract Data Exploration ID Input', extractDataExplorationIdInput,
        expID);
      await action.sendKeys(
        'Extract Data Exploration Version Input',
        extractDataExplorationVersionInput, expVersion);
      await action.sendKeys(
        'Extract Data State Name Input', extractDataStateNameInput,
        stateName);
      await action.sendKeys(
        'Extract Data Number Of Answers Input', extractDataNumAnswersInput,
        numberOfAnswers);
      await action.click(
        'Extract Data Form Submit Button', extractDataFormSubmitButton);
      if (isMeantToFail) {
        numExtractionHandles = await browser.driver.getAllWindowHandles();
        numExtractionHandles = numExtractionHandles.length;
        await action.click(
          'Extract Data Submit Button', extractDataFormSubmitButton);
        await waitFor.pageToFullyLoad();
      } else {
        await waitFor.visibilityOf(
          extractDataStatusMessage,
          'Data extraction status message taking too long to appear.');
        await waitFor.textToBePresentInElement(
          extractDataStatusMessage,
          'Status: Data extraction query has been submitted. Please wait.');
      }
    };

  this.expectExtractionFailure = async function() {
    var newNumExtractionHandles = await browser.driver.getAllWindowHandles();
    newNumExtractionHandles = newNumExtractionHandles.length;
    expect(newNumExtractionHandles).toEqual(
      numExtractionHandles + 1);
    browser.driver.close();
  };

  this.expectExtractionSuccess = async function() {
    await waitFor.fileToBeDownloaded('oppia-attachment.txt');
  };

  this.sendTestEmailToAdminAndExpectError = async function() {
    await action.click('Send Email Button', sendEmailButton);
    await waitFor.visibilityOf(
      statusMessage, 'Status message not visible');
    await waitFor.textToBePresentInElement(
      statusMessage, 'Server error: This app cannot send emails.',
      'Text in status message is wrong!');
  };

  this.addReviewer = async function(name, newRole) {
    await action.click('Admin Roles Tab', adminRolesTab);
    // Change values for "add reviewer for community" form, and submit it.
    await action.sendKeys('Add reviewer name', addReviewerName, name);
    await action.sendKeys('Select reviewer role', selectReviewerRole, newRole);
    await action.click('Add Reviewer button', addReviewerFormSubmitButton);
  };

  var _assignReviewer = async function(
      username, reviewCategory, languageDescription = null) {
    await _switchToRolesTab();

    await waitFor.visibilityOf(
      assignReviewerForm, 'Assign reviewer form is not visible');

    var usernameInputField = assignReviewerForm.element(reviewerUsernameCss);
    await action.sendKeys(
      'Username input field', usernameInputField, username);

    var reviewCategorySelectField = assignReviewerForm.element(
      reviewCategorySelectCss);
    await action.select(
      'Review category selector', reviewCategorySelectField, reviewCategory);

    if (languageDescription !== null) {
      var languageSelectField = assignReviewerForm.element(languageSelectCss);
      await action.select(
        'Language selector', languageSelectField, languageDescription);
    }

    var submitButton = assignReviewerForm.element(reviewerFormSubmitButtonCss);
    await action.click('Submit assign reviewer button', submitButton);

    await waitFor.textToBePresentInElement(
      statusMessage, 'Successfully added', (
        'Status message for assigning ' + reviewCategory + ' reviewer takes ' +
        'too long to appear'));
  };

  var _getUserReviewRightsElement = async function(username, reviewCategory) {
    await _switchToRolesTab();

    await waitFor.visibilityOf(
      viewReviewerForm, 'View reviewer form is not visible');

    var viewMethodInput = viewReviewerForm.element(viewReviewerMethodInputCss);
    await action.select(
      'Reviewer view method dropdown', viewMethodInput, 'By Username');

    var usernameInputField = viewReviewerForm.element(reviewerUsernameCss);
    await action.sendKeys(
      'Username input field', usernameInputField, username);

    var submitButton = viewReviewerForm.element(reviewerFormSubmitButtonCss);
    await action.click('View reviewer role button', submitButton);

    await waitFor.textToBePresentInElement(
      statusMessage, 'Success',
      'Could not view reviewer rights successfully');

    if (reviewCategory === REVIEW_CATEGORY_TRANSLATION) {
      return element.all(userTranslationReviewerLanguageCss);
    } else if (reviewCategory === REVIEW_CATEGORY_VOICEOVER) {
      return element.all(userVoiceoverReviewerLanguageCss);
    } else if (reviewCategory === REVIEW_CATEGORY_QUESTION) {
      return element(userQuestionReviewerCss);
    }
  };

  this.assignTranslationReviewer = async function(
      username, languageDescription) {
    await _assignReviewer(
      username, REVIEW_CATEGORY_TRANSLATION, languageDescription);
  };

  this.assignVoiceoverReviewer = async function(username, languageDescription) {
    await _assignReviewer(
      username, REVIEW_CATEGORY_VOICEOVER, languageDescription);
  };

  this.assignQuestionReviewer = async function(username) {
    await _assignReviewer(username, REVIEW_CATEGORY_QUESTION);
  };

  this.expectUserToBeTranslationReviewer = async function(
      username, languageDescription) {
    var reviewRights = await _getUserReviewRightsElement(
      username, REVIEW_CATEGORY_TRANSLATION);
    var languageList = await Promise.all(
      reviewRights.map(function(languageElem) {
        return languageElem.getText();
      }));
    expect(languageList).toContain(languageDescription);
  };

  this.expectUserToBeVoiceoverReviewer = async function(
      username, languageDescription) {
    var reviewRights = await _getUserReviewRightsElement(
      username, REVIEW_CATEGORY_VOICEOVER);
    var languageList = await Promise.all(reviewRights.map(
      function(languageElem) {
        return languageElem.getText();
      }));
    expect(languageList).toContain(languageDescription);
  };

  this.expectUserToBeQuestionReviewer = async function(username) {
    var reviewRight = await _getUserReviewRightsElement(
      username, REVIEW_CATEGORY_QUESTION);
    expect(await reviewRight.getText()).toBe('Allowed');
  };
};

exports.AdminPage = AdminPage;
