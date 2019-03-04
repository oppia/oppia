"use strict";
// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Page object for the exploration editor's settings tab, for
 * use in Protractor tests.
 */
var protractor_1 = require("protractor");
var forms = require('./forms.js');
var waitFor = require('./waitFor.js');
var ExplorationEditorSettingsTab = function () {
    /*
     * Interactive elements
     */
    var editParamChanges = protractor_1.element(protractor_1.by.css('.protractor-test-exploration-edit-param-changes'));
    var explorationCategoryInput = protractor_1.element(protractor_1.by.css('.protractor-test-exploration-category-input'));
    var explorationObjectiveInput = protractor_1.element(protractor_1.by.css('.protractor-test-exploration-objective-input'));
    var explorationSummaryTile = protractor_1.element(protractor_1.by.css('.protractor-test-exploration-summary-tile'));
    var explorationTitleInput = protractor_1.element(protractor_1.by.css('.protractor-test-exploration-title-input'));
    var initialStateSelect = protractor_1.element(protractor_1.by.css('.protractor-test-initial-state-select'));
    var initialStateSelectOption = function (stateName) {
        return initialStateSelect.element(protractor_1.by.cssContainingText('option', stateName));
    };
    /*
     * Buttons
     */
    var addParamButton = protractor_1.element(protractor_1.by.css('.protractor-test-add-param-button'));
    var closePreviewSummaryButton = protractor_1.element(protractor_1.by.css('.protractor-test-close-preview-summary-modal'));
    var enableParametersSwitch = protractor_1.element(protractor_1.by.css('.protractor-test-enable-parameters'));
    var openPreviewSummaryButton = protractor_1.element(protractor_1.by.css('.protractor-test-open-preview-summary-modal'));
    var saveParamChangesButton = protractor_1.element(protractor_1.by.css('.protractor-test-save-param-changes-button'));
    var deleteExplorationButton = protractor_1.element(protractor_1.by.css('.protractor-test-delete-exploration-button'));
    var confirmDeleteExplorationButton = protractor_1.element(protractor_1.by.css('.protractor-test-really-delete-exploration-button'));
    /*
     * Workflows
     */
    // PARAMETERS
    // This function adds a exploration level parameter change, creating
    // the parameter if necessary.
    this.addExplorationLevelParameterChange = function (paramName, paramValue) {
        editParamChanges.click();
        addParamButton.click();
        var editorRowElem = protractor_1.element.all(protractor_1.by.css('.protractor-test-param-changes-list')).last();
        forms.AutocompleteDropdownEditor(editorRowElem).setValue(paramName);
        /* Setting parameter value is difficult via css since input fields
          are dynamically generated. We isolate it as the last input in the
          current parameter changes UI. */
        var item = editorRowElem.all(protractor_1.by.tagName('input')).last();
        item.clear();
        item.sendKeys(paramValue);
        saveParamChangesButton.click();
    };
    this.deleteExploration = function () {
        waitFor.elementToBeClickable(deleteExplorationButton, 'Delete Exploration button is not clickable');
        deleteExplorationButton.click();
        waitFor.elementToBeClickable(confirmDeleteExplorationButton, 'Confirm Delete Exploration button is not clickable');
        confirmDeleteExplorationButton.click();
        waitFor.invisibilityOf(confirmDeleteExplorationButton, 'Delete Exploration modal takes too long to disappear');
        // Returning to /creator_dashboard.
        waitFor.pageToFullyLoad();
    };
    this.enableParameters = function () {
        enableParametersSwitch.click();
    };
    this.expectAvailableFirstStatesToBe = function (names) {
        initialStateSelect.all(protractor_1.by.tagName('option')).map(function (elem) {
            return elem.getText();
        }).then(function (options) {
            expect(options.sort()).toEqual(names.sort());
        });
    };
    this.openAndClosePreviewSummaryTile = function () {
        openPreviewSummaryButton.click();
        waitFor.visibilityOf(explorationSummaryTile, 'Summary Tile takes too long to appear');
        expect(explorationSummaryTile.isPresent()).toBeTruthy();
        closePreviewSummaryButton.click();
        waitFor.invisibilityOf(explorationSummaryTile, 'Summary Tile takes too long to disappear');
        expect((explorationSummaryTile.isPresent())).toBeFalsy();
    };
    this.setCategory = function (category) {
        forms.AutocompleteDropdownEditor(explorationCategoryInput).setValue(category);
    };
    this.setFirstState = function (stateName) {
        initialStateSelectOption(stateName).click();
    };
    this.setLanguage = function (language) {
        protractor_1.element(protractor_1.by.css('.protractor-test-exploration-language-select')).
            element(protractor_1.by.cssContainingText('option', language)).click();
    };
    this.setObjective = function (objective) {
        explorationObjectiveInput.clear();
        explorationObjectiveInput.sendKeys(objective);
    };
    this.setTitle = function (title) {
        explorationTitleInput.clear();
        explorationTitleInput.sendKeys(title);
    };
};
exports.ExplorationEditorSettingsTab = ExplorationEditorSettingsTab;
