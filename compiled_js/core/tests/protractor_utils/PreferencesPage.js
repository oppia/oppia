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
 * @fileoverview Page object for the preferences page, for use in Protractor
 * tests.
 */
var protractor_1 = require("protractor");
var waitFor = require('./waitFor.js');
var PreferencesPage = function () {
    var USER_PREFERENCES_URL = '/preferences';
    var editorRoleEmailsCheckbox = protractor_1.element(protractor_1.by.css('.protractor-test-editor-role-email-checkbox'));
    var feedbackMessageEmailsCheckbox = protractor_1.element(protractor_1.by.css('.protractor-test-feedback-message-email-checkbox'));
    var languageOptionsList = protractor_1.element.all(protractor_1.by.css('.select2-results'));
    var pageHeader = protractor_1.element(protractor_1.by.css('.protractor-test-preferences-title'));
    var preferredAudioLanguageSelector = protractor_1.element(protractor_1.by.css('.protractor-test-preferred-audio-language-selector'));
    var selectedAudioLanguageElement = preferredAudioLanguageSelector.element(protractor_1.by.css('.select2-selection__rendered'));
    var subscriptions = protractor_1.element.all(protractor_1.by.css('.protractor-test-subscription-name'));
    var systemLanguageSelector = protractor_1.element.all(protractor_1.by.css('.protractor-test-system-language-selector')).first();
    this.get = function () {
        protractor_1.browser.get(USER_PREFERENCES_URL);
        return waitFor.pageToFullyLoad();
    };
    this.toggleEditorRoleEmailsCheckbox = function () {
        editorRoleEmailsCheckbox.click();
    };
    this.toggleFeedbackEmailsCheckbox = function () {
        feedbackMessageEmailsCheckbox.click();
    };
    this.selectSystemLanguage = function (language) {
        systemLanguageSelector.click();
        var options = protractor_1.element.all(protractor_1.by.css('.select2-dropdown li')).filter(function (elem) {
            return elem.getText().then(function (text) {
                return text === language;
            });
        });
        options.first().click();
    };
    this.selectPreferredAudioLanguage = function (language) {
        preferredAudioLanguageSelector.click();
        var correctOptions = languageOptionsList.all(protractor_1.by.tagName('li')).filter(function (elem) {
            return elem.getText().then(function (text) {
                return text === language;
            });
        });
        correctOptions.first().click();
    };
    this.isFeedbackEmailsCheckboxSelected = function () {
        return feedbackMessageEmailsCheckbox.isSelected();
    };
    this.isEditorRoleEmailsCheckboxSelected = function () {
        return editorRoleEmailsCheckbox.isSelected();
    };
    // This function only compares the text displayed on the subscription (which
    // might be abbreviated), rather than the text on the popover that appears
    // when hovering over the tile.
    this.expectDisplayedFirstSubscriptionToBe = function (name) {
        expect(subscriptions.first().getText()).toMatch(name);
    };
    // This function only compares the text displayed on the subscription (which
    // might be abbreviated), rather than the text on the popover that appears
    // when hovering over the tile.
    this.expectDisplayedLastSubscriptionToBe = function (name) {
        expect(subscriptions.last().getText()).toMatch(name);
    };
    this.expectPageHeaderToBe = function (text) {
        expect(pageHeader.getText()).toEqual(text);
    };
    this.expectPreferredSiteLanguageToBe = function (language) {
        var selectedLanguageElement = systemLanguageSelector.element(protractor_1.by.css('.select2-selection__rendered'));
        expect(selectedLanguageElement.getText()).toEqual(language);
    };
    this.expectPreferredAudioLanguageToBe = function (language) {
        expect(selectedAudioLanguageElement.getText()).toEqual(language);
    };
    this.expectPreferredAudioLanguageNotToBe = function (language) {
        expect(selectedAudioLanguageElement.getText()).not.toEqual(language);
    };
    this.expectSubscriptionCountToEqual = function (value) {
        expect(subscriptions.count()).toEqual(value);
    };
};
exports.PreferencesPage = PreferencesPage;
