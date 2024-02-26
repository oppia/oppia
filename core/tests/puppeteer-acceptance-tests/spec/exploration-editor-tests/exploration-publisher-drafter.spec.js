// Copyright 2024 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Acceptance Test for Exploration Creator and Exploration Manager
 */

const userFactory = require(
  '../../puppeteer-testing-utilities/user-factory.js');
const testConstants = require(
  '../../puppeteer-testing-utilities/test-constants.js');

const DEFAULT_SPEC_TIMEOUT = testConstants.DEFAULT_SPEC_TIMEOUT;

describe('Exploration Publisher, Saver and Drafter', function() {
  let explorationCreator = null;
  beforeAll(async function() {
    explorationCreator = await userFactory.createNewExplorationCreator(
      'explorationAdm', 'exploration_creator@example.com');
    explorationVisitor = await userFactory.createNewExplorationCreator(
      'explorationLearner', 'exploration_visitor@example.com');
  }, DEFAULT_SPEC_TIMEOUT);

  it('should perform exploration management actions',
    async function() {
      await explorationCreator.goToDashboardUrl();
      await explorationCreator.goToEditorSection();
      await explorationCreator.updateCardName('Test question');
      await explorationCreator.updateExplorationIntroText(
        'Exploration intro text');
      await explorationCreator.addInteraction();
      await explorationCreator.explorationCreatedSuccessfully();

      await explorationCreator.goToSettingsTab();
      await explorationCreator.updateTitle('Your Title Here');
      await explorationCreator.updateGoal('NeedSuccessInLifeAndMoney');
      await explorationCreator.selectCategory();
      await explorationCreator.selectLanguage();
      await explorationCreator.addTags('Your Tag Here');
      await explorationCreator.successfullyUpdatedSettings();

      await explorationCreator.publishExploration();

      await explorationCreator.addSomeChanges();
      await explorationCreator.discardCurrentChanges();
      await explorationCreator.
        expectChangesToBeDiscardedSuccessfully();

      await explorationCreator.addSomeChanges();
      await explorationCreator.saveDraftExploration();
      await explorationCreator.
        expectExplorationToBeDraftedSuccessfully();

      await explorationVisitor.
        expectInteractionOnCreatorDashboard();
    }, DEFAULT_SPEC_TIMEOUT);

  afterAll(async function() {
    await userFactory.closeAllBrowsers();
  });
});
