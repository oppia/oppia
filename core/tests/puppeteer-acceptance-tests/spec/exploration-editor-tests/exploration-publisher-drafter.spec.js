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
  let explorationVisitor = null;
  beforeAll(async function() {
    explorationCreator = await userFactory.createNewExplorationCreator(
      'explorationAdm', 'exploration_creator@example.com');
    explorationVisitor = await userFactory.createNewExplorationCreator(
      'explorationVisitor', 'exploration_visitor@example.com');
  }, DEFAULT_SPEC_TIMEOUT);

  it('should draft, discard and publish the changes',
    async function() {
      await explorationCreator.openCreatorDashboardPage();
      await explorationCreator.switchToEditorTab();
      await explorationCreator.updateCardName('Test');
      await explorationCreator.updateExplorationIntroText(
        'Exploration intro text');
      await explorationCreator.addEndInteraction();
      await explorationCreator.showMessageOfSuccessfullExplrationCreation();

      await explorationCreator.goToSettingsTab();
      await explorationCreator.addTitle('Old Title');
      await explorationCreator.updateGoal('OppiaAcceptanceTestsCheck');
      await explorationCreator.selectAlgebraAsACategory();
      await explorationCreator.selectEnglishAsLanguage();
      await explorationCreator.addTags(['TagA', 'TagB', 'TagC']);
      await explorationCreator.updateSettingsSuccessfully();

      await explorationCreator.publishExploration();

      await explorationCreator.addTitle('New Title');
      await explorationCreator.discardCurrentChanges();
      await explorationCreator.expectTitleToBe('Old Title');

      await explorationCreator.addTitle('New Title');
      await explorationCreator.saveDraftExploration();
      await explorationCreator.expectTitleToBe('Old TitleNew Title');

      await explorationVisitor.
        expectInteractionOnCreatorDashboard();
    }, DEFAULT_SPEC_TIMEOUT);

  afterAll(async function() {
    await userFactory.closeAllBrowsers();
  });
});
