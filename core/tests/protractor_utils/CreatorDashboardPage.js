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
 * @fileoverview Page object for the creator dashboard, for use in Protractor
 * tests.
 */

var waitFor = require('./waitFor.js');
var action = require('./action.js');

var CreatorDashboardPage = function() {
  var CREATOR_DASHBOARD_URL = '/creator-dashboard';
  var activityCreationModal = element(
    by.css('.protractor-test-creation-modal'));
  var allExplorationCards = element.all(
    by.css('.protractor-test-exploration-dashboard-card'));
  var explorationFeedbackCount =
    element(by.css('.protractor-test-exp-summary-tile-open-feedback'));
  var explorationDashboardCard =
    element(by.css('.protractor-test-exploration-dashboard-card'));
  var collectionCard = element(by.css('.protractor-test-collection-card'));
  var collectionEditorContainer = element(
    by.css('.collection-editor-cards-container'));
  var subscriptionTab = element(by.css('.protractor-test-subscription-tab'));
  var createActivityButton =
    element(by.css('.protractor-test-create-activity'));
  var createCollectionButton =
    element(by.css('.protractor-test-create-collection'));
  var createExplorationButton =
    element(by.css('.protractor-test-create-exploration'));
  var createNewExplorationButton =
    element(by.css('.protractor-test-create-new-exploration-button'));
  var listViewButton = element(by.css('.protractor-test-oppia-list-view-btn'));
  // Dashboard stat elements.
  var averageRating = element(by.css('.protractor-test-oppia-average-rating'));
  var totalPlays = element(by.css('.protractor-test-oppia-total-plays'));
  var openFeedbacks = element(by.css('.protractor-test-oppia-open-feedback'));
  var subscribers = element(by.css('.protractor-test-oppia-total-subscribers'));

  // Returns all exploration card elements with the given name.
  var _getExplorationElements = async function(explorationTitle) {
    await waitFor.visibilityOf(explorationDashboardCard);
    return await allExplorationCards.filter(async function(tile) {
      var text = await tile.getText();
      // Tile text contains title, possibly followed by newline and text.
      return (
        text.startsWith(explorationTitle + '\n') ||
        text === explorationTitle
      );
    });
  };

  this.get = async function() {
    await browser.get(CREATOR_DASHBOARD_URL);
    await waitFor.pageToFullyLoad();
  };

  this.getNumberOfFeedbackMessages = async function() {
    var feedbackCount = await explorationFeedbackCount.getText();
    return parseInt(feedbackCount);
  };

  this.navigateToExplorationEditor = async function() {
    await waitFor.elementToBeClickable(explorationDashboardCard);
    await explorationDashboardCard.click();
    await waitFor.pageToFullyLoad();
  };

  this.clickCreateActivityButton = async function() {
    await action.click('Create Activity button', createActivityButton);
    await waitFor.pageToFullyLoad();
  };

  this.clickCreateCollectionButton = async function() {
    await waitFor.visibilityOf(
      activityCreationModal, 'Activity Creation modal is not visible');
    await waitFor.elementToBeClickable(
      createCollectionButton,
      'Create Collection button takes too long to be clickable');
    await createCollectionButton.click();
    await waitFor.pageToFullyLoad();
    await waitFor.visibilityOf(collectionEditorContainer);
  };

  this.clickCreateExplorationButton = async function() {
    await waitFor.elementToBeClickable(
      createExplorationButton,
      'Create Exploration button takes too long to be clickable');
    await createExplorationButton.click();
    await waitFor.pageToFullyLoad();
  };

  this.clickCreateNewExplorationButton = async function() {
    await waitFor.elementToBeClickable(
      createNewExplorationButton,
      'Create Exploration button on the creator' +
      'dashboard page takes too long to be clickable');
    await createNewExplorationButton.click();
    await waitFor.pageToFullyLoad();
  };

  this.navigateToCollectionEditor = async function() {
    await waitFor.elementToBeClickable(
      collectionCard,
      'Collection Card tab takes too long to be clickable');
    await collectionCard.click();
    await waitFor.pageToFullyLoad();
  };

  this.navigateToSubscriptionDashboard = async function() {
    await waitFor.elementToBeClickable(
      subscriptionTab,
      'Subscription Dashboard tab takes too long to be clickable');
    await subscriptionTab.click();
    await waitFor.pageToFullyLoad();
  };

  this.editExploration = async function(explorationTitle) {
    var elems = await _getExplorationElements(explorationTitle);
    if (elems.length === 0) {
      throw new Error(
        'Could not find exploration tile with name ' + explorationTitle);
    }
    var explorationElement = elems[0].element(
      by.css('.protractor-test-title-mask'));
    await waitFor.elementToBeClickable(
      explorationElement,
      'Unable to click on exploration: ' + explorationTitle);
    await explorationElement.click();
    await waitFor.pageToFullyLoad();
  };

  this.getAverageRating = async function() {
    await waitFor.visibilityOf(
      averageRating, 'Unable to find average rating');
    return await averageRating.getText();
  };

  this.getTotalPlays = async function() {
    await waitFor.visibilityOf(
      totalPlays, 'Unable to find total plays');
    return await totalPlays.getText();
  };

  this.getOpenFeedbacks = async function() {
    await waitFor.visibilityOf(
      openFeedbacks, 'Unable to find open feedbacks count');
    return await openFeedbacks.getText();
  };

  this.getSubscribers = async function() {
    await waitFor.visibilityOf(
      subscribers, 'Unable to find subscribers count');
    return await subscribers.getText();
  };

  this.getListView = async function() {
    await waitFor.visibilityOf(
      listViewButton, 'Unable to find list view button');
    await listViewButton.click();
  };

  // Returns titles of each explorations in grid view.
  this.getExpSummaryTileTitles = async function() {
    var expSummaryTileTitleElements = element.all(
      by.css('.protractor-test-exp-summary-tile-title'));
    await waitFor.visibilityOf(
      await expSummaryTileTitleElements.first(),
      'Unable to find exploration titles');
    return expSummaryTileTitleElements;
  };

  // Returns ratings of each explorations in grid view.
  this.getExpSummaryTileRatings = async function() {
    var expSummaryTileRatingElements = element.all(
      by.css('.protractor-test-exp-summary-tile-rating'));
    await waitFor.visibilityOf(
      await expSummaryTileRatingElements.first(),
      'Unable to find exploration ratings');
    return expSummaryTileRatingElements;
  };

  // Returns open feedback count of each exploration in grid view.
  this.getExpSummaryTileOpenFeedbackCount = async function() {
    var expSummaryTileFeedbackElements = element.all(
      by.css('.protractor-test-exp-summary-tile-open-feedback'));
    await waitFor.visibilityOf(
      await expSummaryTileFeedbackElements.first(),
      'Unable to find exploration feedbacks');
    return expSummaryTileFeedbackElements;
  };

  // Returns total views count of each exploration in grid view.
  this.getExpSummaryTileViewsCount = async function() {
    var expSummaryTileViewsElements = element.all(
      by.css('.protractor-test-exp-summary-tile-num-views'));
    await waitFor.visibilityOf(
      await expSummaryTileViewsElements.first(),
      'Unable to find exploration views');
    return expSummaryTileViewsElements;
  };

  // Returns titles of each explorations in list view.
  this.getExpSummaryRowTitles = async function() {
    var expSummaryRowTitleElements = element.all(
      by.css('.protractor-test-exp-summary-row-title'));
    await waitFor.visibilityOf(
      await expSummaryRowTitleElements.first(),
      'Unable to find exploration titles');
    return expSummaryRowTitleElements;
  };

  // Returns ratings of each explorations in list view.
  this.getExpSummaryRowRatings = async function() {
    var expSummaryRowRatingElements = element.all(
      by.css('.protractor-test-exp-summary-row-rating'));
    await waitFor.visibilityOf(
      await expSummaryRowRatingElements.first(),
      'Unable to find exploration ratings');
    return expSummaryRowRatingElements;
  };

  // Returns open feedback count of each exploration in list view.
  this.getExpSummaryRowOpenFeedbackCount = async function() {
    var expSummaryRowFeedbackElements = element.all(
      by.css('.protractor-test-exp-summary-row-open-feedback'));
    await waitFor.visibilityOf(
      await expSummaryRowFeedbackElements.first(),
      'Unable to find exploration feedbacks');
    return expSummaryRowFeedbackElements;
  };

  // Returns total views count of each exploration in list view.
  this.getExpSummaryRowViewsCount = async function() {
    var expSummaryRowViewsElements = element.all(
      by.css('.protractor-test-exp-summary-row-num-views'));
    await waitFor.visibilityOf(
      await expSummaryRowViewsElements.first(),
      'Unable to find exploration views');
    return expSummaryRowViewsElements;
  };

  this.expectToHaveExplorationCard = async function(explorationName) {
    var explorationCards = await _getExplorationElements(explorationName);
    if (explorationCards.length === 0) {
      throw new Error(
        'Could not find exploration title with name ' + explorationTitle);
    }
    expect(explorationCards.length).toBeGreaterThanOrEqual(1);
  };
};

exports.CreatorDashboardPage = CreatorDashboardPage;
