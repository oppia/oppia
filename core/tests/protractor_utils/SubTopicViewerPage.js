// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * in Protractor tests.
 */

var waitFor = require('./waitFor.js');
var action = require('./action.js');

var SubTopicViewerPage = function() {
  var subTopicTileList = element.all(by.css('.protractor-test-subtopic-tile'));
  var conceptCardList = element.all(
    by.css('.protractor-test-concept-card-link'));
  var conceptCardExplanation = element(
    by.css('.protractor-test-concept-card-explanation'));

  this.get = async function(subTopicName) {
    await waitFor.pageToFullyLoad();
    var subTopicTile = element(by.cssContainingText(
      '.protractor-test-subtopic-tile', subTopicName));
    await waitFor.presenceOf(
      subTopicTile, 'Sub topic ' + subTopicName + ' card is not present,');
    await action.click(subTopicName, subTopicTile);
    await waitFor.pageToFullyLoad();
  };

  this.expectRevisionCardCountToBe = async function(count) {
    if (count === 0) {
      expect(await subTopicTileList.count()).toEqual(0);
    } else {
      await waitFor.visibilityOf(
        subTopicTileList.first(),
        'Revisions cards take too long to be visible.');
      expect(await subTopicTileList.count()).toEqual(count);
    }
  };

  this.expectConceptCardCountToBe = async function(count) {
    if (count === 0) {
      expect(await conceptCardList.count()).toEqual(0);
    } else {
      await waitFor.visibilityOf(
        conceptCardList.first(),
        'Concept cards take too long to be visible.');
      expect(await conceptCardList.count()).toEqual(count);
    }
  };

  this.getConceptCard = async function() {
    var conceptCardElement = conceptCardList.first();
    await action.click('Concept card link', conceptCardElement);
    await waitFor.pageToFullyLoad();
  };

  this.expectConceptCardInformationToBe = async function(description) {
    await waitFor.visibilityOf(
      conceptCardExplanation,
      'Concept card explanation takes too long to be visible.');
    var text = await conceptCardExplanation.getText();
    expect(text).toEqual(description);
  };
};

exports.SubTopicViewerPage = SubTopicViewerPage;
