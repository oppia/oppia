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
 * @fileoverview Page object for the creator dashboard, for use in WebdriverIO
 * tests.
 */

var waitFor = require('./waitFor.js');
var action = require('./action.js');

var CreatorDashboardPage = function() {
  var CREATOR_DASHBOARD_URL = '/creator-dashboard';

  var allExplorationCardsSelector = function() {
    return $$('.e2e-test-exploration-dashboard-card');
  };
  var activityCreationModal = $('.e2e-test-creation-modal');
  var averageRating = $('.e2e-test-oppia-average-rating');
  var collectionCard = $('.e2e-test-collection-card');
  var collectionEditorContainer = $(
    '.e2e-test-collection-editor-cards-container');
  var createActivityButton = $('.e2e-test-create-activity');
  var createCollectionButton = $('.e2e-test-create-collection');
  var createExplorationButton = $('.e2e-test-create-exploration');
  var createNewExplorationButton = $('.e2e-test-create-new-exploration-button');
  var explorationDashboardCard = $('.e2e-test-exploration-dashboard-card');
  var explorationFeedbackCount = $('.e2e-test-exp-summary-tile-open-feedback');
  var expSummaryRowFeedbackElementsSelector = function() {
    return $$('.e2e-test-exp-summary-row-open-feedback');
  };
  var expSummaryRowRatingElementsSelector = function() {
    return $$('.e2e-test-exp-summary-row-rating');
  };
  var expSummaryRowTitleElementsSelector = function() {
    return $$('.e2e-test-exp-summary-row-title');
  };
  var expSummaryRowViewsElementsSelector = function() {
    return $$('.e2e-test-exp-summary-row-num-views');
  };
  var expSummaryTileFeedbackElementsSelector = function() {
    return $$('.e2e-test-exp-summary-tile-open-feedback');
  };
  var expSummaryTileRatingElementsSelector = function() {
    return $$('.e2e-test-exp-summary-tile-rating');
  };
  var expSummaryTileTitleElementsSelector = function() {
    return $$('.e2e-test-exp-summary-tile-title');
  };
  var expSummaryTileViewsElementsSelector = function() {
    return $$('.e2e-test-exp-summary-tile-num-views');
  };
  var listViewButton = $('.e2e-test-oppia-list-view-btn');
  // Dashboard stat elements.
  var openFeedbacks = $('.e2e-test-oppia-open-feedback');
  var subscriptionTab = $('.e2e-test-subscription-tab');
  var subscribers = $('.e2e-test-oppia-total-subscribers');
  var totalPlays = $('.e2e-test-oppia-total-plays');

  // Returns all exploration card elements with the given name.
  var _getExplorationElements = async function(explorationTitle) {
    await waitFor.visibilityOf(explorationDashboardCard);
    var allExplorationCards = allExplorationCardsSelector();
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
    await browser.url(CREATOR_DASHBOARD_URL);
    await waitFor.pageToFullyLoad();
  };

  this.getNumberOfFeedbackMessages = async function() {
    var feedbackCount = await explorationFeedbackCount.getText();
    return parseInt(feedbackCount);
  };

  this.navigateToExplorationEditor = async function() {
    await action.click('Exploration Dashboard Card', explorationDashboardCard);
    await waitFor.pageToFullyLoad();
  };

  this.clickCreateActivityButton = async function() {
    await action.click('Create Activity Button', createActivityButton);
    await waitFor.pageToFullyLoad();
  };

  this.clickCreateCollectionButton = async function() {
    await waitFor.visibilityOf(
      activityCreationModal, 'Activity Creation modal is not visible');
    await action.click('Create Collection Button', createCollectionButton);
    await waitFor.pageToFullyLoad();
    await waitFor.visibilityOf(collectionEditorContainer);
  };

  this.clickCreateExplorationButton = async function() {
    await action.click('Create Exploration Button', createExplorationButton);
    await waitFor.pageToFullyLoad();
  };

  this.clickCreateNewExplorationButton = async function() {
    await action.click(
      'Create New Exploration Button', createNewExplorationButton);
    await waitFor.pageToFullyLoad();
  };

  this.navigateToCollectionEditor = async function() {
    await action.click('Collection Card', collectionCard);
    await waitFor.pageToFullyLoad();
  };

  this.navigateToSubscriptionDashboard = async function() {
    await action.click('Subscription Tab', subscriptionTab);
    await waitFor.pageToFullyLoad();
  };

  this.editExploration = async function(explorationTitle) {
    var elems = await _getExplorationElements(explorationTitle);
    if (elems.length === 0) {
      throw new Error(
        'Could not find exploration tile with name ' + explorationTitle);
    }
    var explorationElement = elems[0].$('.e2e-test-title-mask');
    await action.click('Exploration Element', explorationElement);
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
    await action.click('List View Button', listViewButton);
  };

  // Returns titles of each explorations in grid view.
  this.getExpSummaryTileTitles = async function() {
    var expSummaryTileTitleElements = (
      await expSummaryTileTitleElementsSelector());
    await waitFor.visibilityOf(
      expSummaryTileTitleElements[0],
      'Unable to find exploration titles');
    return expSummaryTileTitleElements;
  };

  // Returns ratings of each explorations in grid view.
  this.getExpSummaryTileRatings = async function() {
    var expSummaryTileRatingElements = (
      await expSummaryTileRatingElementsSelector());
    await waitFor.visibilityOf(
      expSummaryTileRatingElements[0],
      'Unable to find exploration ratings');
    return expSummaryTileRatingElements;
  };

  // Returns open feedback count of each exploration in grid view.
  this.getExpSummaryTileOpenFeedbackCount = async function() {
    var expSummaryTileFeedbackElements = (
      await expSummaryTileFeedbackElementsSelector());
    await waitFor.visibilityOf(
      expSummaryTileFeedbackElements[0],
      'Unable to find exploration feedbacks');
    return expSummaryTileFeedbackElements;
  };

  // Returns total views count of each exploration in grid view.
  this.getExpSummaryTileViewsCount = async function() {
    var expSummaryTileViewsElements = (
      await expSummaryTileViewsElementsSelector());
    await waitFor.visibilityOf(
      expSummaryTileViewsElements[0],
      'Unable to find exploration views');
    return expSummaryTileViewsElements;
  };

  // Returns titles of each explorations in list view.
  this.getExpSummaryRowTitles = async function() {
    var expSummaryRowTitleElements = (
      await expSummaryRowTitleElementsSelector());
    await waitFor.visibilityOf(
      expSummaryRowTitleElements[0],
      'Unable to find exploration titles');
    return expSummaryRowTitleElements;
  };

  // Returns ratings of each explorations in list view.
  this.getExpSummaryRowRatings = async function() {
    var expSummaryRowRatingElements = (
      await expSummaryRowRatingElementsSelector());
    await waitFor.visibilityOf(
      expSummaryRowRatingElements[0],
      'Unable to find exploration ratings');
    return expSummaryRowRatingElements;
  };

  // Returns open feedback count of each exploration in list view.
  this.getExpSummaryRowOpenFeedbackCount = async function() {
    var expSummaryRowFeedbackElements = (
      await expSummaryRowFeedbackElementsSelector());
    await waitFor.visibilityOf(
      expSummaryRowFeedbackElements[0],
      'Unable to find exploration feedbacks');
    return expSummaryRowFeedbackElements;
  };

  // Returns total views count of each exploration in list view.
  this.getExpSummaryRowViewsCount = async function() {
    var expSummaryRowViewsElements = await expSummaryRowViewsElementsSelector();
    await waitFor.visibilityOf(
      expSummaryRowViewsElements[0],
      'Unable to find exploration views');
    return expSummaryRowViewsElements;
  };

  this.expectToHaveExplorationCard = async function(explorationName) {
    var explorationCards = await _getExplorationElements(explorationName);
    if (explorationCards.length === 0) {
      throw new Error(
        'Could not find exploration title with name ' + explorationName);
    }
    expect(explorationCards.length).toBeGreaterThanOrEqual(1);
  };
};

exports.CreatorDashboardPage = CreatorDashboardPage;
