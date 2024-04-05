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

import testConstants from '../../puppeteer-testing-utilities/test-constants';
import {UserFactory} from '../../puppeteer-testing-utilities/user-factory';
import {ExplorationCreator} from '../../user-utilities/exploration-creator-utils';
import {ConsoleReporter} from '../../puppeteer-testing-utilities/console-reporter';

// TODO(#18372): KeyError: <state name> when the version history handler is hit.
ConsoleReporter.setConsoleErrorsToIgnore([
  /Failed to load resource: the server responded with a status of 500/,
]);

const DEFAULT_SPEC_TIMEOUT = testConstants.DEFAULT_SPEC_TIMEOUT;

describe('Exploration Publisher, Saver and Drafter', function () {
  let explorationCreator: ExplorationCreator;
  let explorationVisitor: ExplorationCreator;
  beforeAll(async function () {
    explorationCreator = await UserFactory.createNewUser(
      'explorationAdm',
      'exploration_creator@example.com'
    );
    explorationVisitor = await UserFactory.createNewUser(
      'explorationSeeker',
      'exploration_visitor@example.com'
    );
  }, DEFAULT_SPEC_TIMEOUT);

  it(
    'should draft, discard and publish the changes',
    async function () {
      await explorationCreator.openCreatorDashboardPage();
      await explorationCreator.switchToEditorTab();
      await explorationCreator.updateExplorationIntroText(
        'Exploration intro text'
      );
      await explorationCreator.updateCardName('Test');
      await explorationCreator.addEndInteraction();

      await explorationCreator.goToSettingsTab();
      await explorationCreator.addTitle('Old Title');
      await explorationCreator.updateGoalTo('OppiaAcceptanceTestsCheck');
      await explorationCreator.selectACategory('Algebra');
      await explorationCreator.selectALanguage('Arabic');
      await explorationCreator.addTags(['TagA', 'TagB', 'TagC']);

      await explorationCreator.publishExploration();

      await explorationCreator.addTitle('New Title');
      await explorationCreator.discardCurrentChanges();
      await explorationCreator.expectTitleToBe('Old Title');

      await explorationCreator.addTitle('New Title');
      await explorationCreator.saveDraftExploration();
      /**
       * We are expecting title to be 'Old TitleNew Title'.
       * Because we are adding in old title without deleting.
       */
      await explorationCreator.expectTitleToBe('Old TitleNew Title');

      await explorationVisitor.expectInteractionOnCreatorDashboard();
    },
    DEFAULT_SPEC_TIMEOUT
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
