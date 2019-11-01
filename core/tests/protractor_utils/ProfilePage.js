// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Page object for the profile page, for use in
 * Protractor tests.
 */
var waitFor = require('./waitFor.js');

var ProfilePage = function() {
  var currUserProfilePhoto = element(
    by.css('.protractor-test-profile-current-user-photo'));
  var otherUserProfilePhoto = element(
    by.css('.protractor-test-profile-other-user-photo'));
  var bio = element(
    by.css('.protractor-test-profile-bio'));
  var interests = element.all(
    by.css('.protractor-test-profile-interest'));
  var interestPlaceholder = element(
    by.css('.protractor-test-profile-no-interest'));
  var allExplorationCardElements = element.all(
    by.css('.protractor-test-exploration-dashboard-card'));
  var createdExplorationStat = element.all(
    by.css('.protractor-test-profile-created-stat'));

  this.get = function(userName) {
    browser.get('/profile/' + userName);
    return waitFor.pageToFullyLoad();
  };

  this.expectCurrUserToHaveProfilePhoto = function() {
    expect(currUserProfilePhoto.isPresent()).toBe(true);
  };

  this.expectOtherUserToNotHaveProfilePhoto = function() {
    expect(otherUserProfilePhoto.isPresent()).toBe(false);
  };

  this.expectUserToHaveBio = function(expectedText) {
    expect(bio.getText()).toMatch(expectedText);
  };

  this.expectUserToHaveNoInterests = function() {
    interests.count().then(function(numInterests) {
      expect(numInterests).toEqual(0);
    });
  };

  this.expectUserToHaveInterests = function(expectedInterests) {
    interests.count().then(function(numInterests) {
      expect(numInterests).toEqual(expectedInterests.length);
      interests.map(function(interestElem) {
        return interestElem.getText();
      }).then(function(interestTexts) {
        interestTexts.forEach(function(interestText) {
          expect(expectedInterests.includes(interestText)).toBe(true);
        });
      });
    });
  };

  this.expectUserToHaveInterestPlaceholder = function(expectedText) {
    expect(interestPlaceholder.getText()).toMatch(expectedText);
  };

  this.expectUserToNotHaveInterestPlaceholder = function() {
    expect(interestPlaceholder.isPresent()).toBe(false);
  };

  this.expectToHaveExplorationCards = function() {
    allExplorationCardElements.then(function(cards) {
      if (cards.length === 0) {
        throw 'There is no exploration card on this profile';
      }
      expect(cards.length).toBeGreaterThan(0);
    });
  };

  this.expectToHaveExplorationCardByName = function(explorationName) {
    var explorationsCardByName = allExplorationCardElements.filter(
      function(card) {
        var cardTitle = card.element(
          by.css('.protractor-test-exp-summary-tile-title'));
        return cardTitle.getText().then(function(title) {
          return (title === explorationName);
        });
      });

    if (explorationsCardByName.length === 0) {
      throw 'There is no exploration card with name ' + explorationName;
    }
    expect(explorationsCardByName.count()).toBeGreaterThanOrEqual(1);
  };

  this.expectToHaveCreatedExplorationStat = function(expectedStat) {
    expect(createdExplorationStat.getText()).toMatch(expectedStat);
  };
};

exports.ProfilePage = ProfilePage;
