"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @fileoverview Page object for the admin page, for use in Protractor
 * tests.
 */
var protractor_1 = require("protractor");
var forms = require('./forms.js');
var general = require('./general.js');
var waitFor = require('./waitFor.js');
var AdminPage = function () {
    var ADMIN_URL_SUFFIX = '/admin';
    var configTab = protractor_1.element(protractor_1.by.css('.protractor-test-admin-config-tab'));
    var saveAllConfigs = protractor_1.element(protractor_1.by.css('.protractor-test-save-all-configs'));
    var configProperties = protractor_1.element.all(protractor_1.by.css('.protractor-test-config-property'));
    var adminRolesTab = protractor_1.element(protractor_1.by.css('.protractor-test-admin-roles-tab'));
    var updateFormName = protractor_1.element(protractor_1.by.css('.protractor-update-form-name'));
    var updateFormSubmit = protractor_1.element(protractor_1.by.css('.protractor-update-form-submit'));
    var roleSelect = protractor_1.element(protractor_1.by.css('.protractor-update-form-role-select'));
    var statusMessage = protractor_1.element(protractor_1.by.css('[ng-if="statusMessage"]'));
    // The reload functions are used for mobile testing
    // done via Browserstack. These functions may cause
    // a problem when used to run tests directly on Travis.
    if (general.isInDevMode()) {
        var explorationElements = protractor_1.element.all(protractor_1.by.css('.protractor-test-reload-exploration-row'));
        var reloadAllExplorationsButtons = protractor_1.element.all(protractor_1.by.css('.protractor-test-reload-all-explorations-button'));
        var reloadCollectionButtons = protractor_1.element.all(protractor_1.by.css('.protractor-test-reload-collection-button'));
        var getExplorationTitleElement = function (explorationElement) {
            return explorationElement.element(protractor_1.by.css('.protractor-test-reload-exploration-title'));
        };
        var getExplorationElementReloadButton = function (explorationElement) {
            return explorationElement.element(protractor_1.by.css('.protractor-test-reload-exploration-button'));
        };
        this.reloadCollection = function (collectionId) {
            this.get();
            reloadCollectionButtons.get(collectionId).click();
            general.acceptAlert();
            // Time is needed for the reloading to complete.
            waitFor.textToBePresentInElement(statusMessage, 'Data reloaded successfully.', 'Collection could not be reloaded');
            return true;
        };
        // The name should be as given in the admin page (including '.yaml' if
        // necessary).
        this.reloadExploration = function (name) {
            this.get();
            explorationElements.map(function (explorationElement) {
                getExplorationTitleElement(explorationElement)
                    .getText().then(function (title) {
                    // We use match here in case there is whitespace around the name
                    if (title.match(name)) {
                        getExplorationElementReloadButton(explorationElement).click();
                        general.acceptAlert();
                        // Time is needed for the reloading to complete.
                        waitFor.textToBePresentInElement(statusMessage, 'Data reloaded successfully.', 'Exploration could not be reloaded');
                        return true;
                    }
                });
            });
        };
    }
    var saveConfigProperty = function (configProperty, propertyName, objectType, editingInstructions) {
        return configProperty.element(protractor_1.by.css('.protractor-test-config-title'))
            .getText()
            .then(function (title) {
            if (title.match(propertyName)) {
                editingInstructions(forms.getEditor(objectType)(configProperty));
                saveAllConfigs.click();
                general.acceptAlert();
                // Waiting for success message.
                waitFor.textToBePresentInElement(statusMessage, 'saved successfully', 'New config could not be saved');
                return true;
            }
        });
    };
    this.get = function () {
        protractor_1.browser.get(ADMIN_URL_SUFFIX);
        return waitFor.pageToFullyLoad();
    };
    this.editConfigProperty = function (propertyName, objectType, editingInstructions) {
        this.get();
        configTab.click();
        configProperties.map(function (x) {
            return saveConfigProperty(x, propertyName, objectType, editingInstructions);
        }).then(function (results) {
            var success = false;
            for (var i = 0; i < results.length; i++) {
                success = success || results[i];
            }
            if (!success) {
                throw Error('Could not find config property: ' + propertyName);
            }
        });
    };
    this.updateRole = function (name, newRole) {
        waitFor.elementToBeClickable(adminRolesTab, 'Admin Roles tab is not clickable');
        adminRolesTab.click();
        // Change values for "update role" form, and submit it.
        waitFor.visibilityOf(updateFormName, 'Update Form Name is not visible');
        updateFormName.sendKeys(name);
        var roleOption = roleSelect.element(protractor_1.by.cssContainingText('option', newRole));
        roleOption.click();
        updateFormSubmit.click();
        waitFor.textToBePresentInElement(statusMessage, 'successfully updated to', 'Could not set role successfully');
        return true;
    };
};
exports.AdminPage = AdminPage;
