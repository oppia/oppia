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

var forms = require('./forms.js');
var general = require('./general.js');
var waitFor = require('./waitFor.js');

var AdminPage = function() {
  var ADMIN_URL_SUFFIX = '/admin';
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
  var removeReviewerForm = element(by.css(
    '.protractor-test-remove-reviewer-form'));
  var languageSelectCss = by.css('.protractor-test-form-language-select');
  var reviewerUsernameCss = by.css('.protractor-test-form-reviewer-username');
  var reviewCategorySelectCss = by.css(
    '.protractor-test-form-review-category-select');
  var reviewerFormSubmitButtonCss = by.css(
    '.protractor-test-reviewer-form-submit-button');
  var userReviewRightsTable = by.css(
    '.protractor-test-user-review-rights-table');
  var userTranslationReviewerLanguageCss = by.css(
    '.protractor-test-translation-reviewer-language');
  var userVoiceoverReviewerLanguageCss = by.css(
    '.protractor-test-voiceover-reviewer-language');
  var userQuestionReviewerCss = by.css('.protractor-test-question-reviewer');
  var viewReviewerMethodInputCss = by.css(
    '.protractor-test-view-reviewer-method');

  var REVIEW_CATEGORY_TRANSLATION = 'TRANSLATION';
  var REVIEW_CATEGORY_VOICEOVER = 'VOICEOVER';
  var REVIEW_CATEGORY_QUESTION = 'QUESTION';

  // Viewing roles can be done by two methods: 1. By roles 2. By username
  var roleDropdown = element(by.css('.protractor-test-role-method'));
  var roleValueOption = element(by.css('.protractor-test-role-value'));
  var roleUsernameOption = element(by.css(
    '.protractor-test-username-value'));
  var viewRoleButton = element(by.css('.protractor-test-role-success'));
  var oneOffJobRows = element.all(by.css('.protractor-test-one-off-jobs-rows'));
  var unfinishedOneOffJobRows = element.all(by.css(
    '.protractor-test-unfinished-one-off-jobs-rows'));
  var unfinishedOffJobIDs = element.all(by.css(
    '.protractor-test-unfinished-one-off-jobs-id'));

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

    this.reloadCollection = function(collectionId) {
      this.get();
      reloadCollectionButtons.get(collectionId).click();
      general.acceptAlert();
      // Time is needed for the reloading to complete.
      waitFor.textToBePresentInElement(
        statusMessage, 'Data reloaded successfully.',
        'Collection could not be reloaded');
      return true;
    };

    // The name should be as given in the admin page (including '.yaml' if
    // necessary).
    this.reloadExploration = function(name) {
      this.get();
      explorationElements.map(function(explorationElement) {
        getExplorationTitleElement(explorationElement)
          .getText().then(function(title) {
          // We use match here in case there is whitespace around the name
            if (title.match(name)) {
              getExplorationElementReloadButton(explorationElement).click();
              general.acceptAlert();
              // Time is needed for the reloading to complete.
              waitFor.textToBePresentInElement(
                statusMessage, 'Data reloaded successfully.',
                'Exploration could not be reloaded');
              return true;
            }
          });
      });
    };
  }

  var _switchToRolesTab = function() {
    waitFor.elementToBeClickable(
      adminRolesTab, 'Admin Roles tab is not clickable');
    adminRolesTab.click();
    waitFor.pageToFullyLoad();

    expect(adminRolesTab.getAttribute('class')).toMatch('active');
    waitFor.visibilityOf(
      adminRolesTabContainer, 'Roles tab page is not visible.');
  };

  var saveConfigProperty = function(
      configProperty, propertyName, objectType, editingInstructions) {
    return configProperty.element(by.css('.protractor-test-config-title'))
      .getText()
      .then(function(title) {
        if (title.match(propertyName)) {
          editingInstructions(forms.getEditor(objectType)(configProperty));
          saveAllConfigs.click();
          general.acceptAlert();
          // Waiting for success message.
          waitFor.textToBePresentInElement(
            statusMessage, 'saved successfully',
            'New config could not be saved');
          return true;
        }
      });
  };

  this.get = function() {
    browser.get(ADMIN_URL_SUFFIX);
    return waitFor.pageToFullyLoad();
  };

  this.getJobsTab = function() {
    browser.get(ADMIN_URL_SUFFIX + '#/jobs');
    return waitFor.pageToFullyLoad();
  };

  this.editConfigProperty = function(
      propertyName, objectType, editingInstructions) {
    this.get();
    configTab.click();
    waitFor.elementToBeClickable(saveAllConfigs);
    configProperties.map(function(x) {
      return saveConfigProperty(
        x, propertyName, objectType, editingInstructions);
    }).then(function(results) {
      var success = null;
      for (var i = 0; i < results.length; i++) {
        success = success || results[i];
      }
      if (!success) {
        throw new Error('Could not find config property: ' + propertyName);
      }
    });
  };

  this.startOneOffJob = function(jobName) {
    this._startOneOffJob(jobName, 0);
  };

  this._startOneOffJob = function(jobName, i) {
    waitFor.visibilityOf(oneOffJobRows.first(),
      'Starting one off jobs taking too long to appear.');
    oneOffJobRows.get(i).getText().then((text) => {
      if (text.toLowerCase().startsWith(jobName.toLowerCase())) {
        oneOffJobRows.get(i).element(
          by.css('.protractor-test-one-off-jobs-start-btn')).click();
      } else {
        this._startOneOffJob(jobName, ++i);
      }
    });
  };

  this.stopOneOffJob = function(jobName) {
    this._stopOneOffJob(jobName, 0);
  };

  this._stopOneOffJob = function(jobName, i) {
    unfinishedOneOffJobRows.get(i).getText().then((text) => {
      if (text.toLowerCase().startsWith(jobName.toLowerCase())) {
        unfinishedOneOffJobRows.get(i).element(
          by.css('.protractor-test-one-off-jobs-stop-btn')).click();
      } else {
        this._stopOneOffJob(jobName, ++i);
      }
    });
  };

  this.expectNumberOfRunningOneOffJobs = function(count) {
    element.all(by.css(
      '.protractor-test-unfinished-one-off-jobs-id')).count().then((len) =>{
      expect(len).toEqual(count);
    });
  };

  this.expectJobToBeRunning = function(jobName) {
    browser.refresh();
    waitFor.pageToFullyLoad();
    waitFor.visibilityOf(element(
      by.css('.protractor-test-unfinished-jobs-card')),
    'Unfinished Jobs taking too long to appear');
    let unfinishedJobs = unfinishedOffJobIDs.filter((element) => {
      return element.getText().then((job) => {
        return job.toLowerCase().startsWith(jobName.toLowerCase());
      });
    });
    unfinishedJobs.get(0).getText((job) => {
      expect(job.toLowerCase().startsWith(jobName.toLowerCase())).toBeTrue();
    });
  };

  this.updateRole = function(name, newRole) {
    _switchToRolesTab();

    // Change values for "update role" form, and submit it.
    waitFor.visibilityOf(updateFormName, 'Update Form Name is not visible');
    updateFormName.sendKeys(name);
    var roleOption = roleSelect.element(
      by.cssContainingText('option', newRole));
    roleOption.click();
    updateFormSubmit.click();
    waitFor.visibilityOf(statusMessage, 'Confirmation message not visible');
    waitFor.textToBePresentInElement(
      statusMessage, 'successfully updated to',
      'Could not set role successfully');
  };

  this.getUsersAsssignedToRole = function(role) {
    waitFor.visibilityOf(roleDropdown,
      'View role dropdown taking too long to be visible');
    roleDropdown.sendKeys('By Role');

    roleValueOption.click();
    roleValueOption.sendKeys(role);

    viewRoleButton.click();
  };

  this.viewRolesbyUsername = function(username) {
    waitFor.visibilityOf(roleDropdown,
      'View role dropdown taking too long to be visible');
    roleDropdown.sendKeys('By Username');

    roleUsernameOption.click();
    roleUsernameOption.sendKeys(username);

    viewRoleButton.click();
  };

  this.expectUsernamesToMatch = function(expectedUsernamesArray) {
    var foundUsersArray = [];
    element.all(by.css('.protractor-test-roles-result-rows'))
      .map(function(elm) {
        return elm.getText();
      })
      .then(function(texts) {
        texts.forEach(function(name) {
          foundUsersArray.push(name);
        });
        expect(foundUsersArray.length).toEqual(expectedUsernamesArray.length);

        expectedUsernamesArray.sort();
        foundUsersArray.sort();
        foundUsersArray.forEach(function(name, ind) {
          expect(name).toEqual(expectedUsernamesArray[ind]);
        });
      });
  };

  var _assignReviewer = function(
      username, reviewCategory, languageDescription = null) {
    _switchToRolesTab();

    waitFor.visibilityOf(
      assignReviewerForm, 'Assign reviewer form is not visible');

    var usernameInputField = assignReviewerForm.element(reviewerUsernameCss);
    waitFor.visibilityOf(
      usernameInputField,
      'Username input field is not visible in assign reviewer form');
    usernameInputField.sendKeys(username);

    var reviewCategorySelectField = assignReviewerForm.element(
      reviewCategorySelectCss);
    waitFor.visibilityOf(
      reviewCategorySelectField,
      'Review category options are not visible in assign reviewer form');
    var reviewCategoryOption = reviewCategorySelectField.element(
      by.cssContainingText('option', reviewCategory));
    reviewCategoryOption.click();

    if (languageDescription !== null) {
      var languageSelectField = assignReviewerForm.element(languageSelectCss);
      waitFor.visibilityOf(
        languageSelectField,
        'Language options are not visible in assign reviewer form');
      var languageOption = languageSelectField.element(
        by.cssContainingText('option', languageDescription));
      languageOption.click();
    }

    var submitButton = assignReviewerForm.element(reviewerFormSubmitButtonCss);
    waitFor.elementToBeClickable(
      submitButton, 'Submit assign reviewer button is not clickable');
    submitButton.click();

    waitFor.textToBePresentInElement(
      statusMessage, 'Successfully added',
      'Could not add translation reviewer successfully');
  };

  var _getUserReviewRights = function(username) {
    _switchToRolesTab();

    waitFor.visibilityOf(
      viewReviewerForm, 'View reviewer form is not visible');

    var viewMethodInput = viewReviewerForm.element(viewReviewerMethodInputCss);
    waitFor.visibilityOf(
      viewMethodInput, 'View method dropdown taking too long to be visible');
    viewMethodInput.sendKeys('By Username');

    var usernameInputField = viewReviewerForm.element(reviewerUsernameCss);

    waitFor.visibilityOf(
      usernameInputField,
      'Username input field is not visible in view reviewer form');
    usernameInputField.click();
    usernameInputField.sendKeys(username);

    var submitButton = viewReviewerForm.element(reviewerFormSubmitButtonCss);
    waitFor.elementToBeClickable(
      submitButton, 'View role button is not clickable');
    submitButton.click();

    waitFor.textToBePresentInElement(
      statusMessage, 'Success',
      'Could not view reviewer rights successfully');

    var reviewRightsTable = viewReviewerForm.element(userReviewRightsTable);

    var translationReviewRightsLanguages = element.all(
      userTranslationReviewerLanguageCss);

    var voiceoverReviewRightsLanguages = element.all(
      userVoiceoverReviewerLanguageCss);

    var questionRevieweRights = element(userQuestionReviewerCss).getText();

    var reviewRights = {
      [REVIEW_CATEGORY_TRANSLATION]: [],
      [REVIEW_CATEGORY_VOICEOVER]: [],
      [REVIEW_CATEGORY_QUESTION]: false
    };

    if (questionRevieweRights === 'Allowed') {
      reviewRights[REVIEW_CATEGORY_QUESTION] = true;
    }

    reviewRights[REVIEW_CATEGORY_TRANSLATION] = (
      translationReviewRightsLanguages.map(async function(languageElement) {
        return await languageElement.getText();
      }));

    reviewRights[REVIEW_CATEGORY_VOICEOVER] = (
      voiceoverReviewRightsLanguages.map(async function(languageElement) {
        return await languageElement.getText();
      }));
    return reviewRights;
  };

  this.assignTranslationReviewer = function(username, languageDescription) {
    _assignReviewer(username, REVIEW_CATEGORY_TRANSLATION, languageDescription);
  };

  this.assignVoiceoverReviewer = function(username, languageDescription) {
    _assignReviewer(username, REVIEW_CATEGORY_VOICEOVER, languageDescription);
  };

  this.assignQuestionReviewer = function(username) {
    _assignReviewer(username, REVIEW_CATEGORY_QUESTION);
  };

  this.expectUserToBeTranslationReviewer = function(
      username, languageDescription) {
    var reviewRights = _getUserReviewRights(username);
    expect(reviewRights[REVIEW_CATEGORY_TRANSLATION]).toContain(
      languageDescription);
  };

  this.expectUserToBeVoiceoverReviewer = function(
      username, languageDescription) {
    var reviewRights = _getUserReviewRights(username);
    expect(reviewRights[REVIEW_CATEGORY_VOICEOVER]).toContain(
      languageDescription);
  };

  this.expectUserToBeQuestionReviewer = function(username) {
    var reviewRights = _getUserReviewRights(username);
    expect(reviewRights[REVIEW_CATEGORY_QUESTION]).toBeTrue();
  };
};

exports.AdminPage = AdminPage;
