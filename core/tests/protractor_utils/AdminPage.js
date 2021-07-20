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
  var updateFormName = element(by.css('.protractor-test-update-form-name'));
  var updateFormSubmit = element(by.css('.protractor-test-update-form-submit'));
  var roleSelect = element(by.css('.protractor-test-update-form-role-select'));
  var statusMessage = element(by.css('.protractor-test-status-message'));

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
      await this.get();
      var reloadCollectionButton = reloadCollectionButtons.get(collectionId);
      await action.click('Reload Collection Buttons', reloadCollectionButton);
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
        await waitFor.visibilityOf(
          getExplorationTitleElement(
            explorationElement,
            'Exploration title taking too long to appear'));
        var title = await getExplorationTitleElement(
          explorationElement).getText();

        // We use match here in case there is whitespace around the name.
        if (title.match(name)) {
          var explorationElementReloadButton =
            getExplorationElementReloadButton(explorationElement);
          await action.click(
            'Exploration Element Reload Button',
            explorationElementReloadButton);
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

    expect(await adminRolesTab.getAttribute('class')).toMatch('active');
    await waitFor.visibilityOf(
      adminRolesTabContainer, 'Roles tab page is not visible.');
  };

  var saveConfigProperty = async function(
      configProperty, propertyName, objectType, editingInstructions) {
    await waitFor.visibilityOf(
      configProperty.element(
        by.css('.protractor-test-config-title')),
      'Config Title taking too long too appear');
    var title = await configProperty.element(
      by.css('.protractor-test-config-title')).getText();
    if (title.match(propertyName)) {
      await editingInstructions(
        await forms.getEditor(objectType)(configProperty));
      await action.click('Save All Configs Button', saveAllConfigs);
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

  this.getFeaturesTab = async function() {
    await this.get();
    var featuresTab = element(by.css('.protractor-test-admin-features-tab'));
    await action.click('Admin features tab', featuresTab);
    var featureFlagElements = element.all(
      by.css('.protractor-test-feature-flag'));
    await waitFor.visibilityOf(
      featureFlagElements.first(), 'Feature flags not showing up');
  };

  this.getDummyFeatureElement = async function() {
    var featureFlagElements = element.all(
      by.css('.protractor-test-feature-flag'));

    var count = await featureFlagElements.count();
    for (let i = 0; i < count; i++) {
      var elem = featureFlagElements.get(i);
      if ((await elem.element(
        by.css('.protractor-test-feature-name')).getText()) ===
          'dummy_feature') {
        return elem;
      }
    }

    return null;
  };

  this.removeAllRulesOfFeature = async function(featureElement) {
    while (!await featureElement.isElementPresent(
      by.css('.protractor-test-no-rule-indicator'))) {
      await action.click(
        'Remove feature rule button',
        featureElement
          .element(by.css('.protractor-test-remove-rule-button'))
      );
    }
  };

  this.saveChangeOfFeature = async function(featureElement) {
    await action.click(
      'Save feature button',
      featureElement
        .element(by.css('.protractor-test-save-button'))
    );

    await general.acceptAlert();
    await waitFor.visibilityOf(statusMessage);
  };

  this.enableFeatureForDev = async function(featureElement) {
    await this.removeAllRulesOfFeature(featureElement);

    await action.click(
      'Add feature rule button',
      featureElement
        .element(by.css('.protractor-test-feature-add-rule-button'))
    );

    await action.sendKeys(
      'Rule value selector',
      featureElement
        .element(by.css('.protractor-test-value-selector')),
      'Enabled');

    await action.click(
      'Add condition button',
      featureElement
        .element(by.css('.protractor-test-add-condition-button'))
    );

    await this.saveChangeOfFeature(featureElement);
  };

  this.editConfigProperty = async function(
      propertyName, objectType, editingInstructions) {
    await this.get();
    await action.click('Config Tab', configTab);
    await waitFor.elementToBeClickable(saveAllConfigs);

    var results = [];
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
      oneOffJobRows.first(),
      'Starting one off jobs taking too long to appear.');
    await waitFor.visibilityOf(
      oneOffJobRows.get(i), 'Could not get One Off Jobs');
    var text = await oneOffJobRows.get(i).getText();
    if (text.toLowerCase().startsWith(jobName.toLowerCase())) {
      var oneOffJobRowsButton = oneOffJobRows.get(i).element(
        by.css('.protractor-test-one-off-jobs-start-btn'));
      await action.click('One Off Job Rows Button', oneOffJobRowsButton);
    } else {
      await this._startOneOffJob(jobName, ++i);
    }
  };

  this.stopOneOffJob = async function(jobName) {
    await this._stopOneOffJob(jobName, 0);
  };

  this._stopOneOffJob = async function(jobName, i) {
    await waitFor.visibilityOf(
      unfinishedOneOffJobRows.get(i),
      'Could not get Unfinished Off Job');
    var text = await unfinishedOneOffJobRows.get(i).getText();
    if (text.toLowerCase().startsWith(jobName.toLowerCase())) {
      var unfinishedOffJobRowsButton = (
        unfinishedOneOffJobRows.get(i)
      ).element(
        by.css('.protractor-test-one-off-jobs-stop-btn'));
      await action.click(
        'UnfinishedOffJobRowsButton', unfinishedOffJobRowsButton);
      await browser.refresh();
      await waitFor.pageToFullyLoad();
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
    await _switchToRolesTab();

    // Change values for "update role" form, and submit it.
    await waitFor.visibilityOf(
      updateFormName, 'Update Form name taking too long to appear.');
    await action.sendKeys('Update Form Name', updateFormName, name);
    await action.select('Role Drop Down', roleSelect, newRole);
    await action.click('Update Form Submit', updateFormSubmit);
    await waitFor.visibilityOf(
      statusMessage, 'Confirmation message not visible');
    await waitFor.textToBePresentInElement(
      statusMessage, 'successfully updated to',
      'Could not set role successfully');
  };

  this.getUsersAsssignedToRole = async function(role) {
    await action.select('Role Drop Down', roleDropdown, 'By Role');
    await action.select('Role Value Option', roleValueOption, role);
    await action.click('View Role Button', viewRoleButton);
  };

  this.viewRolesByUsername = async function(username, expectResults) {
    await action.select('Role Drop Down', roleDropdown, 'By Username');
    await action.sendKeys('Role Username Option', roleUsernameOption, username);
    await action.click('View Role Button', viewRoleButton);
    if (expectResults) {
      await waitFor.textToBePresentInElement(
        statusMessage, 'Success.',
        'Toast with "Success." taking too long to appear');
    } else {
      await waitFor.textToBePresentInElement(
        statusMessage, 'No results.',
        'Toast with "No results." taking too long to appear');
    }
  };

  this.expectUsernamesToMatch = async function(expectedUsernamesArray) {
    var foundUsersArray = [];
    if (expectedUsernamesArray.length !== 0) {
      await waitFor.visibilityOf(element(
        by.css('.protractor-test-roles-result-rows')));
    }
    var usernames = await element.all(
      by.css('.protractor-test-roles-result-rows'))
      .map(async function(elm) {
        var text = await action.getText(
          'Username in roles list on admin page', elm);
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
};

exports.AdminPage = AdminPage;
