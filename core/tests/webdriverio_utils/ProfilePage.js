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
 * @fileoverview Page object for the profile page, for use in
 * WebdriverIO tests.
 */

var waitFor = require('./waitFor.js');

var ProfilePage = function () {
  var allExplorationCardElement = $('.e2e-test-exploration-dashboard-card');
  var allExplorationCardSelector = function () {
    return $$('.e2e-test-exploration-dashboard-card');
  };
  var bio = $('.e2e-test-profile-bio');
  var createdExplorationStat = $('.e2e-test-profile-created-stat');
  var userProfilePhoto = $('.e2e-test-profile-user-photo');
  var interestPlaceholder = $('.e2e-test-profile-no-interest');
  var interestsSelector = function () {
    return $$('.e2e-test-profile-interest');
  };

  this.get = async function (userName) {
    await browser.url('/profile/' + userName);
    await waitFor.pageToFullyLoad();
  };

  this.expectUserToHaveProfilePhoto = async function () {
    await waitFor.visibilityOf(
      userProfilePhoto,
      'User profile photo taking too long to display'
    );
  };

  this.expectUserToHaveBio = async function (expectedText) {
    await waitFor.visibilityOf(bio, 'Bio is taking too long to appear');
    expect(await bio.getText()).toMatch(expectedText);
  };

  this.expectUserToHaveNoInterests = async function () {
    var interests = await interestsSelector();
    var numInterests = interests.length;
    expect(numInterests).toEqual(0);
  };

  this.expectUserToHaveInterests = async function (expectedInterests) {
    var interests = await interestsSelector();
    var numInterests = interests.length;
    expect(numInterests).toEqual(expectedInterests.length);

    var interestTexts = await interests.map(async function (interestElem) {
      await waitFor.visibilityOf(
        interestElem,
        'InterestElem is taking too long to appear'
      );
      return await interestElem.getText();
    });
    for (var index = 0; index < interestTexts.length; index++) {
      var interestText = interestTexts[index];
      expect(expectedInterests.includes(await interestText)).toBe(true);
    }
  };

  this.expectUserToHaveInterestPlaceholder = async function (expectedText) {
    await waitFor.visibilityOf(
      interestPlaceholder,
      'Interest place holder is taking too long to appear'
    );
    expect(await interestPlaceholder.getText()).toMatch(expectedText);
  };

  this.expectUserToNotHaveInterestPlaceholder = async function () {
    expect(await interestPlaceholder.isExisting()).toBe(false);
  };

  this.expectToHaveExplorationCards = async function () {
    await waitFor.visibilityOf(
      allExplorationCardElement,
      'Exploration cards is not present or taking time to display'
    );
  };

  this.expectToHaveExplorationCardByName = async function (explorationName) {
    var allExplorationCardElements = allExplorationCardSelector();
    var explorationsCardByName = await allExplorationCardElements.filter(
      async function (card) {
        var cardTitle = card.$('.e2e-test-exp-summary-tile-title');
        await waitFor.visibilityOf(
          cardTitle,
          'CardTitle is not present or taking too long to display'
        );
        var title = await cardTitle.getText();
        return title === explorationName;
      }
    );

    if ((await explorationsCardByName.length) === 0) {
      throw new Error(
        'There is no exploration card with name ' + explorationName
      );
    }
    expect(await explorationsCardByName.length).toBeGreaterThanOrEqual(1);
  };

  this.expectToHaveCreatedExplorationStat = async function (expectedStat) {
    expect(await createdExplorationStat.getText()).toMatch(expectedStat);
  };
};

exports.ProfilePage = ProfilePage;
