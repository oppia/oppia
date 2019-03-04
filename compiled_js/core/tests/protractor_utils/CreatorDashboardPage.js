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
 * @fileoverview Page object for the creator dashboard, for use in Protractor
 * tests.
 */
var protractor_1 = require("protractor");
var waitFor = require('./waitFor.js');
var CreatorDashboardPage = function () {
    var CREATOR_DASHBOARD_URL = '/creator_dashboard';
    var activityCreationModal = protractor_1.element(protractor_1.by.css('.protractor-test-creation-modal'));
    var explorationFeedbackCount = protractor_1.element(protractor_1.by.css('.protractor-test-exploration-feedback-count'));
    var explorationDashboardCard = protractor_1.element(protractor_1.by.css('.protractor-test-exploration-dashboard-card'));
    var collectionCard = protractor_1.element(protractor_1.by.css('.protractor-test-collection-card'));
    var subscriptionTab = protractor_1.element(protractor_1.by.css('.protractor-test-subscription-tab'));
    var createActivityButton = protractor_1.element(protractor_1.by.css('.protractor-test-create-activity'));
    var createCollectionButton = protractor_1.element(protractor_1.by.css('.protractor-test-create-collection'));
    var createExplorationButton = protractor_1.element(protractor_1.by.css('.protractor-test-create-exploration'));
    var createNewExplorationButton = protractor_1.element(protractor_1.by.css('.protractor-test-create-new-exploration-button'));
    // Returns a promise of all explorations with the given name.
    var _getExplorationElements = function (explorationTitle) {
        var allExplorationDashboardCard = protractor_1.element.all(protractor_1.by.css('.protractor-test-exploration-dashboard-card'));
        return allExplorationDashboardCard.filter(function (tile) {
            return tile.element(protractor_1.by.css('.protractor-test-exp-summary-tile-title')).
                getText().then(function (tileTitle) {
                return (tileTitle === explorationTitle);
            });
        });
    };
    this.get = function () {
        protractor_1.browser.get(CREATOR_DASHBOARD_URL);
        return waitFor.pageToFullyLoad();
    };
    this.getNumberOfFeedbackMessages = function () {
        return explorationFeedbackCount.getText().then(function (text) {
            return parseInt(text);
        });
    };
    this.navigateToExplorationEditor = function () {
        explorationDashboardCard.click();
        waitFor.pageToFullyLoad();
    };
    this.clickCreateActivityButton = function () {
        waitFor.elementToBeClickable(createActivityButton, 'Create Activity button takes too long to be clickable');
        createActivityButton.click();
        waitFor.pageToFullyLoad();
    };
    this.clickCreateCollectionButton = function () {
        waitFor.visibilityOf(activityCreationModal, 'Activity Creation modal is not visible');
        waitFor.elementToBeClickable(createCollectionButton, 'Create Collection button takes too long to be clickable');
        createCollectionButton.click();
        waitFor.pageToFullyLoad();
    };
    this.clickCreateExplorationButton = function () {
        waitFor.elementToBeClickable(createExplorationButton, 'Create Exploration button takes too long to be clickable');
        createExplorationButton.click();
        waitFor.pageToFullyLoad();
    };
    this.clickCreateNewExplorationButton = function () {
        waitFor.elementToBeClickable(createNewExplorationButton, 'Create Exploration button on the creator' +
            'dashboard page takes too long to be clickable');
        createNewExplorationButton.click();
        waitFor.pageToFullyLoad();
    };
    this.navigateToCollectionEditor = function () {
        waitFor.elementToBeClickable(collectionCard, 'Collection Card tab takes too long to be clickable');
        collectionCard.click();
        waitFor.pageToFullyLoad();
    };
    this.navigateToSubscriptionDashboard = function () {
        waitFor.elementToBeClickable(subscriptionTab, 'Subscription Dashboard tab takes too long to be clickable');
        subscriptionTab.click();
        waitFor.pageToFullyLoad();
    };
    this.editExploration = function (explorationTitle) {
        _getExplorationElements(explorationTitle).then(function (elems) {
            if (elems.length === 0) {
                throw 'Could not find exploration tile with name ' + explorationTitle;
            }
            var explorationElement = elems[0].element(protractor_1.by.css('.protractor-test-title-mask'));
            waitFor.elementToBeClickable(explorationElement, 'Unable to click on exploration: ' + explorationTitle);
            explorationElement.click();
            waitFor.pageToFullyLoad();
        });
    };
};
exports.CreatorDashboardPage = CreatorDashboardPage;
