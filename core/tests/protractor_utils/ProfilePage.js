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
  var cardTitleCss = by.css('.protractor-test-exp-summary-tile-title');

  this.get = async function(userName) {
    await browser.get('/profile/' + userName);
    await waitFor.pageToFullyLoad();
  };

  this.expectCurrUserToHaveProfilePhoto = async function() {
    await waitFor.visibilityOf(
      currUserProfilePhoto,
      'Current user profile photo taking too long to display');
  };

  this.expectOtherUserToHaveProfilePhoto = async function() {
    await waitFor.presenceOf(
      otherUserProfilePhoto,
      'Other user profile photo taking too long to display');
  };

  this.expectUserToHaveBio = async function(expectedText) {
    await waitFor.visibilityOf(
      bio,
      'Bio is taking too long to appear');
    expect(await bio.getText()).toMatch(expectedText);
  };

  this.expectUserToHaveNoInterests = async function() {
    var numInterests = await interests.count();
    expect(numInterests).toEqual(0);
  };

  this.expectUserToHaveInterests = async function(expectedInterests) {
    var numInterests = await interests.count();
    expect(numInterests).toEqual(expectedInterests.length);

    var interestTexts = await interests.map(async function(interestElem) {
      await waitFor.visibilityOf(
        interestElem,
        'InterestElem is taking too long to appear');
      return await interestElem.getText();
    });
    interestTexts.forEach(function(interestText) {
      expect(expectedInterests.includes(interestText)).toBe(true);
    });
  };

  this.expectUserToHaveInterestPlaceholder = async function(expectedText) {
    await waitFor.visibilityOf(
      interestPlaceholder,
      'Interest place holder is taking too long to appear');
    expect(await interestPlaceholder.getText()).toMatch(expectedText);
  };

  this.expectUserToNotHaveInterestPlaceholder = async function() {
    expect(await interestPlaceholder.isPresent()).toBe(false);
  };

  this.expectToHaveExplorationCards = async function() {
    await waitFor.visibilityOf(
      allExplorationCardElements.first(),
      'Exploration cards is not present or taking time to display');
  };

  this.expectToHaveExplorationCardByName = async function(explorationName) {
    var explorationsCardByName = await allExplorationCardElements.filter(
      async function(card) {
        var cardTitle = card.element(cardTitleCss);
        await waitFor.visibilityOf(
          cardTitle,
          'CardTitle is not present or taking too long to display');
        var title = await cardTitle.getText();
        return title === explorationName;
      });

    if (await explorationsCardByName.length === 0) {
      throw new Error(
        'There is no exploration card with name ' + explorationName);
    }
    expect(await explorationsCardByName.length).toBeGreaterThanOrEqual(1);
  };

  this.expectToHaveCreatedExplorationStat = async function(expectedStat) {
    expect(await createdExplorationStat.getText()).toMatch(expectedStat);
  };
};

exports.ProfilePage = ProfilePage;
