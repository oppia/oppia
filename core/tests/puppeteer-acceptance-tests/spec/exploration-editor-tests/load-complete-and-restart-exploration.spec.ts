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
 * @fileoverview Acceptance Test for preview tab in exploration editor.
 */
import { UserFactory } from
  '../../puppeteer-testing-utilities/user-factory';
import testConstants from
  '../../puppeteer-testing-utilities/test-constants';
import { IExplorationEditor } from '../../user-utilities/exploration-editor-utils';

const DEFAULT_SPEC_TIMEOUT: number = testConstants.DEFAULT_SPEC_TIMEOUT;

describe('Exploration Editor', function() {
  let explorationEditor: IExplorationEditor;

  beforeAll(async function() {
    explorationEditor = await UserFactory.createNewUser(
      'explorationEditor', 'exploration_creator@example.com');
  }, DEFAULT_SPEC_TIMEOUT);

  it('should be able to load, complete and restart an exploration preview',
    async function() {
      await explorationEditor.navigateToCreatorDashboard(); 
      await explorationEditor.createExploration(
        'Exploration begins', ' Continue Button ');
      await explorationEditor.LoadExplorationWithQuestions(2);

      await explorationEditor.navigateToPreviewTab();
      await explorationEditor.expectTheExplorationToLoadInPreviewTab(
        'Exploration begins');

      await explorationEditor.completeTheExplorationInPreviewTab();
      await explorationEditor.expectTheExplorationToComplete();
      
      await explorationEditor.restartTheExploration();
      await explorationEditor.expectTheExplorationToRestart(
        'Exploration begins');
    }, DEFAULT_SPEC_TIMEOUT);

  afterAll(async function() {
    await UserFactory.closeAllBrowsers();
  });
});