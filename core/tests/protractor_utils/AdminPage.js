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
  var configTab = element(by.css('.protractor-test-admin-config-tab'));
  var saveAllConfigs = element(by.css('.protractor-test-save-all-configs'));
  var configProperties = element.all(by.css(
    '.protractor-test-config-property'
  ));
  var adminRolesTab = element(by.css('.protractor-test-admin-roles-tab'));
  var updateFormName = element(by.css('.protractor-update-form-name'));
  var updateFormSubmit = element(by.css('.protractor-update-form-submit'));
  var roleSelect = element(by.css('.protractor-update-form-role-select'));
  var statusMessage = element(by.css('.protractor-test-status-message'));

  // Viewing roles can be done by two methods: 1. By roles 2. By username.
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
  var generateSVGButton = element(
    by.css('.protractor-test-fetch-svg-button'));
  var stopSVGButton = element(
    by.css('.protractor-test-stop-svg-button'));
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

    var reloadAllExplorationsButtons = element.all(by.css(
      '.protractor-test-reload-all-explorations-button'
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
    await waitFor.visibilityOf(await oneOffJobRows.first(),
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
    await waitFor.visibilityOf(roleDropdown,
      'View role dropdown taking too long to be visible');
    await roleDropdown.sendKeys('By Role');

    await roleValueOption.click();
    await roleValueOption.sendKeys(role);

    await viewRoleButton.click();
  };

  this.viewRolesbyUsername = async function(username) {
    await waitFor.visibilityOf(roleDropdown,
      'View role dropdown taking too long to be visible');
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

  this.uploadTopicSimilarities =
    async function(relativePathToSimilaritiesFile, isValidFile) {
      var absPath = path.resolve(__dirname, relativePathToSimilaritiesFile);
      await waitFor.visibilityOf(chooseSimilarityFileInput,
        'Similarity upload form is not visible');
      await chooseSimilarityFileInput.sendKeys(absPath);
      await action.click('Upload button', similarityFileUploadButton);
      if (isValidFile) {
        var text = 'Topic similarities uploaded successfully.';
        await waitFor.visibilityOf(statusMessage,
          'Status message not visible');
        await waitFor.textToBePresentInElement(statusMessage, text,
          'Text not showing up in status message');
      } else {
        var text = 'Server error: \'ascii\' codec can\'t encode characters' +
          ' in position 1024-1025: ordinal not in range(128)';
        await waitFor.visibilityOf(statusMessage,
          'Status message not visible');
        await waitFor.textToBePresentInElement(statusMessage, text,
          'Text not showing up in status message');
      }
    };

  this.expectSimilaritiesToBeUploaded = async function() {
    await waitFor.elementToBeClickable(similarityDownloadButton,
      'Similarity upload failed – download similarities button not clickable.');
  };

  this.downloadSimilarityFile = async function() {
    await action.click('Download Similarity File Button',
      similarityDownloadButton);
  };

  this.clearSearchIndex = async function() {
    await action.click('Clear search index button', searchIndexClearButton);
    await general.acceptAlert();
    await waitFor.visibilityOf(statusMessage,
      'Status message not showing up.');
    await waitFor.textToBePresentInElement(statusMessage,
      'Index successfully cleared.');
  };

  this.flushMigrationBotContributions = async function() {
    await action.click('Migration bot flush contributions button',
      flushMigrationBotContributionsButton);
    await general.acceptAlert();
    await waitFor.textToBePresentInElement(statusMessage,
      'Migration bot contributions successfully flushed.',
      'Migration bot cuntributions not flushing.');
  };

  this.regenerateContributionsForTopic =
    async function(topicId, isMeantToSucceed) {
      await waitFor.visibilityOf(regenerateContributionsTopicIdInput,
        'Regenerate contributions topic ID input not showing up.');
      await regenerateContributionsTopicIdInput.sendKeys(topicId);
      await action.click('Regenerate contributions form submit button',
        regenerateContributionsSubmitButton);
      await general.acceptAlert();
      await waitFor.visibilityOf(regenerateContributionsTopicIdInput,
        'Regenerate contributions topic ID input not showing up.');
      await regenerateContributionsTopicIdInput.clear();
      var text;
      if (!isMeantToSucceed) {
        text = 'Server error: Entity for class TopicModel with id ' +
          topicId + ' not found';
      } else {
        text = 'No. of opportunities model created: 0';
      }
      await waitFor.visibilityOf(regenerationMessage,
        'Regeneration message not visible');
      await waitFor.textToBePresentInElement(regenerationMessage, text);
    };

  this.changeUsername = async function(oldUsername, newUsername) {
    await waitFor.visibilityOf(oldUsernameInput,
      'Current username input not visible');
    await oldUsernameInput.sendKeys(oldUsername);
    await waitFor.visibilityOf(newUsernameInput,
      'New username input not visible');
    await newUsernameInput.sendKeys(newUsername);
    await waitFor.visibilityOf(usernameChangeSubmitButton,
      'Change username submit button not visible');
    await action.click('Username change submit button',
      usernameChangeSubmitButton);
    var text = 'Successfully renamed ' + oldUsername + ' to ' + newUsername;
    await waitFor.textToBePresentInElement(statusMessage, text,
      'Username was not successfully changed');
  };

  this.expectUsernameToBeChanged = async function(newUsername) {
    expect(usernameSection.getText()).toEqual(newUsername);
  };

  this.generateSVG = async function() {
    await action.click('Generate SVG Button', generateSVGButton);
    await waitFor.visibilityOf(
      statusMessage, 'Status message not visible');
    await waitFor.textToBePresentInElement(
      statusMessage, 'SVGs generated for all explorations .');
  };

  this.extractDataAndExpectExtraction = async function(expID, expVersion,
      stateName, numberOfAnswers) {
    await browser.refresh();
    await waitFor.pageToFullyLoad();
    await action.sendKeys('Extract Data Exploration ID Input',
      extractDataExplorationIdInput, expID);
    await action.sendKeys('Extract Data Exploration Version Input',
      extractDataExplorationVersionInput, expVersion);
    await action.sendKeys('Extract Data State Name Input',
      extractDataStateNameInput, stateName);
    await action.sendKeys('Extract Data Number Of Answers Input',
      extractDataNumAnswersInput, numberOfAnswers);
    await action.click('Extract Data Form Submit Button',
      extractDataFormSubmitButton);
    var handles = await browser.driver.getAllWindowHandles();
    await action.click('Extract Data Submit Button',
      extractDataFormSubmitButton);
    var newHandles = await browser.driver.getAllWindowHandles();
    expect(newHandles.length).toEqual(handles.length + 1);
    browser.driver.close();
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
    await waitFor.visibilityOf(
      statusMessage, 'Confirmation message not visible');
    await waitFor.textToBePresentInElement(
      statusMessage, 'Successfully added ',
      'Could not add reviewer successfully');
  };

  this.showReviewersAssignedToRole = async function(role) {
    await action.sendKeys(
      'Reviewer method dropdown', reviewerMethodDropdown, 'By Role');
    await action.sendKeys(
      'Reviewer role dropdown', reviewerRoleValueOption, role);
    await action.click('View reviewer role button', viewReviewerRoleButton);
  };

  this.expectReviewerUsernamesStrToMatch = async function(
      expectedUsernamesArrayStr) {
    // The reviewer usernames that are shown after a user views reviewers by
    // role in the 'view community reviewers' section. The result is displayed
    // as a 'Usernames: ["username1", "username2"]' string.
    await waitFor.visibilityOf(
      reviewerUsernamesResult, 'Reviewer usernames result not visible.');
    var reviewerUsernamesArrayStr = await reviewerUsernamesResult.getText();
    expect(reviewerUsernamesArrayStr).toEqual(expectedUsernamesArrayStr);
  };
};

exports.AdminPage = AdminPage;
