// Copyright 2023 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Blog Admin users utility file.
 */

const baseUser = require(
  '../puppeteer-testing-utilities/puppeteer-utils.js');
const testConstants = require(
  '../puppeteer-testing-utilities/test-constants.js');
const { showMessage } = require(
  '../puppeteer-testing-utilities/show-message-utils.js');

const communityLibraryPage = 'http://localhost:8181/community-library';
const explorationCard = 'mat-card.e2e-test-exploration-on-dashboard-card';
const addToPlaylistBtn = 'i.e2e-test-add-to-playlist-btn';
const labelForCommunityLessons = 'Community Lessons';
const removeIcon = 'div.ng-star-inserted.i.remove-icon';
const confirmRemove = 'Remove';

module.exports = class e2eGuestUser extends baseUser {
  async addExploration() {
    await this.goto(communityLibraryPage);
    await this.page.waitForSelector(explorationCard);
    await this.clickOn(addToPlaylistBtn);
    await this.goto(testConstants.URLs.LearnerDashboard);
    await this.clickOn(labelForCommunityLessons);
    await this.page.waitForSelector(explorationCard);
    showMessage('Successfully added exploration!');
  }

  async removeExploration() {
    await this.clickOn(removeIcon);
    await this.clickOn(confirmRemove);
    await this.page.evaluate(async() => {
      const allExplorations = document.getElementsByClassName(
        'oppia-exploration-dashboard-card');
      if (allExplorations.length > 0) {
        throw new Error('Exploration failed to be removed');
      }
      return;
    });
  }
};
