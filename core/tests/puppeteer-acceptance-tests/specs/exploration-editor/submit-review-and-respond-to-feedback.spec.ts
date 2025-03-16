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
 * @fileoverview Acceptance Test for addressing, verifying, and managing feedback on an exploration.
 */

import {UserFactory} from '../../utilities/common/user-factory';
import testConstants from '../../utilities/common/test-constants';
import {ExplorationEditor} from '../../utilities/user/exploration-editor';
import {LoggedInUser} from '../../utilities/user/logged-in-user';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';

const DEFAULT_SPEC_TIMEOUT_MSECS = testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;

describe('Exploration Editor', function () {
  let explorationEditor: ExplorationEditor;
  let loggedInVisitor: LoggedInUser;
  let loggedOutVisitor: LoggedOutUser;
  let explorationId: string | null;

  beforeAll(async function () {
    explorationEditor = await UserFactory.createNewUser(
      'explorationEditor',
      'exploration_editor@example.com'
    );

    await explorationEditor.navigateToCreatorDashboardPage();
    await explorationEditor.navigateToExplorationEditorPage();
    await explorationEditor.dismissWelcomeModal();
    explorationId =
      await explorationEditor.createAndPublishAMinimalExplorationWithTitle(
        'Feedback Test Exploration'
      );
  }, DEFAULT_SPEC_TIMEOUT_MSECS);

  it(
    'should log in as a different user and give feedback to an exploration, both anonymously and non-anonymously. Then log out and give anonymous feedback.',
    async function () {
      loggedInVisitor = await UserFactory.createNewUser(
        'loggedInVisitor',
        'loggedInVisitor@example.com'
      );
      await loggedInVisitor.playExploration(explorationId);
      await loggedInVisitor.giveFeedback(
        'This is helpful non-anonymous feedback',
        false
      );

      loggedOutVisitor = await UserFactory.createLoggedOutUser();
      await loggedOutVisitor.playExploration(explorationId);
      await loggedOutVisitor.giveFeedback(
        'This is anonymous feedback from the first user',
        false
      );

      await loggedInVisitor.playExploration(explorationId);
      await loggedInVisitor.giveFeedback(
        'This is anonymous feedback from the second user',
        true
      );
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should log in as the original creator and go to the feedback tab and verify that all the feedback is shown in the list of feedback',
    async function () {
      await explorationEditor.page.bringToFront();
      await explorationEditor.navigateToCreatorDashboardPage();
      await explorationEditor.openExplorationInExplorationEditor(
        'Feedback Test Exploration'
      );
      await explorationEditor.navigateToFeedbackTab();
      await explorationEditor.expectNoOfSuggestionsToBe(3);
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should verify that each feedback report has the correct details',
    async function () {
      await explorationEditor.viewFeedbackThread(1);
      await explorationEditor.expectSuggestionToBeAnonymous(
        'This is helpful non-anonymous feedback',
        false
      );
      await explorationEditor.replyToSuggestion(
        'Thank you for your non-anonymous feedback!'
      );

      await explorationEditor.viewFeedbackThread(1);
      await explorationEditor.expectSuggestionToBeAnonymous(
        'This is anonymous feedback from the first user',
        true
      );
      await explorationEditor.replyToSuggestion(
        'Thank you for your anonymous feedback!'
      );

      await explorationEditor.viewFeedbackThread(1);
      await explorationEditor.expectSuggestionToBeAnonymous(
        'This is anonymous feedback from the second user',
        true
      );
      await explorationEditor.replyToSuggestion(
        'I appreciate your anonymous feedback!'
      );
      await explorationEditor.goBackToTheFeedbackTab();
      await explorationEditor.expectNoOfSuggestionsToBe(3);
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should verify that feedback recipients can see the responses to their feedback',
    async function () {
      await loggedInVisitor.page.bringToFront();
      await loggedInVisitor.navigateToFeedbackUpdatesPage();
      await loggedInVisitor.viewFeedbackUpdateThread(1);
      await loggedInVisitor.expectFeedbackAndResponseToMatch(
        'This is helpful non-anonymous feedback',
        'Thank you for your non-anonymous feedback!'
      );
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should change the feedback status and verify that the changes are saved correctly in both the feedback thread and the list-of-all-feedback menu',
    async function () {
      await explorationEditor.navigateToCreatorDashboardPage();
      await explorationEditor.openExplorationInExplorationEditor(
        'Feedback Test Exploration'
      );
      await explorationEditor.navigateToFeedbackTab();
      await explorationEditor.page.bringToFront();

      await explorationEditor.viewFeedbackThread(2);
      await explorationEditor.changeFeedbackStatus('fixed');
      await explorationEditor.expectFeedbackStatusToBe('fixed');

      await explorationEditor.viewFeedbackThread(2);
      await explorationEditor.changeFeedbackStatus('ignored');
      await explorationEditor.expectFeedbackStatusToBe('ignored');

      await explorationEditor.pressFeedbackThreadBackButton();
      await explorationEditor.page.reload();
      await explorationEditor.expectFeedbackStatusInList(1, 'Open');
      await explorationEditor.expectFeedbackStatusInList(2, 'Ignored');
      await explorationEditor.expectFeedbackStatusInList(3, 'Fixed');
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
