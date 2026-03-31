// Copyright 2025 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Acceptance test from CUJv3 Doc
 * https://docs.google.com/document/d/1D7kkFTzg3rxUe3QJ_iPlnxUzBFNElmRkmAWss00nFno/
 *
 * EC. Feedback.
 */

import {UserFactory} from '../../utilities/common/user-factory';
import {ExplorationEditor} from '../../utilities/user/exploration-editor';

describe('Exploration Editor', function () {
  let explorationEditor: ExplorationEditor;

  beforeAll(async function () {
    explorationEditor = await UserFactory.createNewUser(
      'explorationEditor',
      'exploration_editor@example.com'
    );

    await explorationEditor.navigateToCreatorDashboardPage();
    await explorationEditor.navigateToExplorationEditorFromCreatorDashboard();
    await explorationEditor.dismissWelcomeModal();

    await explorationEditor.navigateToFeedbackTab();
  });

  it('should be able to give exploration feedback', async function () {
    await explorationEditor.startAFeedbackThread(
      'Test Feedback',
      'Test Feedback'
    );
    await explorationEditor.expectFeedbackThreadToBePresent('Test Feedback');

    await explorationEditor.expectFeedbackStatusInList(1, 'Open');
    await explorationEditor.expectFeedbackAuthorToBe('explorationEditor');

    await explorationEditor.viewFeedbackThread(1);
    await explorationEditor.changeFeedbackStatus('fixed');
    await explorationEditor.replyToSuggestion('Thank you for your feedback!');

    await explorationEditor.goBackToTheFeedbackTab();
    await explorationEditor.expectFeedbackStatusInList(1, 'Fixed');
  });

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
