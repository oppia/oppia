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
 * @fileoverview Page object for the topic and story viewer page, for use
 * in WebdriverIO tests.
 */

var waitFor = require('./waitFor.js');
var action = require('./action.js');

var SubTopicViewerPage = function() {
  var conceptCardExplanation = $('.e2e-test-concept-card-explanation');
  var conceptCardListItem = $('.e2e-test-concept-card-link');
  var conceptCardListSelector = function() {
    return $$('.e2e-test-concept-card-link');
  };
  var subTopicTileListItem = $('.e2e-test-subtopic-tile');
  var subTopicTileListSelector = function() {
    return $$('.e2e-test-subtopic-tile');
  };

  this.get = async function(subTopicName) {
    await waitFor.pageToFullyLoad();
    var subTopicTile = $(`.e2e-test-subtopic-tile=${subTopicName}`);
    await waitFor.presenceOf(
      subTopicTile, 'Sub topic ' + subTopicName + ' card is not present,');
    await action.click(subTopicName, subTopicTile);
    await waitFor.pageToFullyLoad();
  };

  this.expectRevisionCardCountToBe = async function(count) {
    var subTopicTileList = await subTopicTileListSelector();
    if (count === 0) {
      expect(subTopicTileList.length).toEqual(0);
    } else {
      await waitFor.visibilityOf(
        subTopicTileListItem,
        'Revisions cards take too long to be visible.');
      var subTopicTileList = await subTopicTileListSelector();
      expect(subTopicTileList.length).toEqual(count);
    }
  };

  this.expectConceptCardCountToBe = async function(count) {
    var conceptCardList = await conceptCardListSelector();
    if (count === 0) {
      expect(conceptCardList.length).toEqual(0);
    } else {
      await waitFor.visibilityOf(
        conceptCardListItem,
        'Concept cards take too long to be visible.');
      var conceptCardList = await conceptCardListSelector();
      expect(conceptCardList.length).toEqual(count);
    }
  };

  this.getConceptCard = async function() {
    var conceptCardList = await conceptCardListSelector();
    var conceptCardElement = conceptCardList[0];
    await action.click('Concept card link', conceptCardElement);
    await waitFor.pageToFullyLoad();
  };

  this.expectConceptCardInformationToBe = async function(description) {
    await waitFor.visibilityOf(
      conceptCardExplanation,
      'Concept card explanation takes too long to be visible.');
    var text = await action.getText(
      'Concept Card Explanation', conceptCardExplanation);
    expect(text).toEqual(description);
  };
};

exports.SubTopicViewerPage = SubTopicViewerPage;
