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

import testConstants from '../../utilities/common/test-constants';
import {UserFactory} from '../../utilities/common/user-factory';
import {ExplorationEditor} from '../../utilities/user/exploration-editor';
import {LoggedInUser} from '../../utilities/user/logged-in-user';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';
import {showMessage} from '../../utilities/common/show-message';

const DEFAULT_SPEC_TIMEOUT_MSECS = testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;

describe('Exploration Editor', function () {
  let explorationEditor: ExplorationEditor;
  let loggedInVisitor: LoggedInUser;
  let loggedOutVisitor: LoggedOutUser;
  let explorationId: string | null;

  beforeAll(async function () {
    // TODO(19443): Once this issue is resolved (which was not allowing to make the feedback
    // in mobile viewport which is required for testing the feedback messages tab),
    // remove this part of skipping the test and make the test to run in mobile viewport as well.
    // see: https://github.com/oppia/oppia/issues/19443
    if (process.env.MOBILE === 'true') {
      showMessage('Test skipped in mobile viewport');
      return;
    }

    explorationEditor = await UserFactory.createNewUser(
      'explorationEditor',
      'exploration_editor@example.com'
    );

    explorationId =
      await explorationEditor.createAndPublishAMinimalExplorationWithTitle(
        'Feedback Test'
      );
  }, DEFAULT_SPEC_TIMEOUT_MSECS);

  it(
    'should log in as a different user and give feedback to an exploration, both anonymously and non-anonymously. Then log out and give anonymous feedback.',
    async function () {
      // TODO(19443): Once this issue is resolved (which was not allowing to make the feedback
      // in mobile viewport which is required for testing the feedback messages tab),
      // remove this part of skipping the test and make the test to run in mobile viewport as well.
      // see: https://github.com/oppia/oppia/issues/19443
      if (process.env.MOBILE === 'true') {
        showMessage('Test skipped in mobile viewport');
        return;
      }

      loggedInVisitor = await UserFactory.createNewUser(
        'loggedInVisitor',
        'loggedInVisitor@example.com'
      );

      // First user plays the exploration and gives non-anonymous feedback.
      await loggedInVisitor.playExploration(explorationId);
      await loggedInVisitor.giveFeedback(
        'This is helpful non-anonymous feedback',
        false
      );

      loggedOutVisitor = await UserFactory.createLoggedOutUser();

      // Anonymous logged-out user plays the exploration and gives feedback.
      await loggedOutVisitor.playExploration(explorationId);
      await loggedOutVisitor.giveFeedback(
        'This is anonymous feedback from the first user',
        false
      );

      // Logged-in user gives anonymous feedback (testing both feedback types).
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
      // TODO(19443): Once this issue is resolved (which was not allowing to make the feedback
      // in mobile viewport which is required for testing the feedback messages tab),
      // remove this part of skipping the test and make the test to run in mobile viewport as well.
      // see: https://github.com/oppia/oppia/issues/19443
      if (process.env.MOBILE === 'true') {
        showMessage('Test skipped in mobile viewport');
        return;
      }
      await explorationEditor.navigateToCreatorDashboardPage();
      await explorationEditor.openExplorationInExplorationEditor(
        'Feedback Test'
      );

      // Go to the feedback tab and verify the count of feedback items.
      await explorationEditor.navigateToFeedbackTab();
      await explorationEditor.expectNoOfSuggestionsToBe(3);
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should verify that each feedback report has the correct details',
    async function () {
      // TODO(19443): Once this issue is resolved (which was not allowing to make the feedback
      // in mobile viewport which is required for testing the feedback messages tab),
      // remove this part of skipping the test and make the test to run in mobile viewport as well.
      // see: https://github.com/oppia/oppia/issues/19443
      if (process.env.MOBILE === 'true') {
        showMessage('Test skipped in mobile viewport');
        return;
      }

      // Verify first feedback thread (non-anonymous).
      await explorationEditor.viewFeedbackThread(1);
      await explorationEditor.expectSuggestionToBeAnonymous(
        'This is helpful non-anonymous feedback',
        false
      );
      await explorationEditor.replyToSuggestion(
        'Thank you for your non-anonymous feedback!'
      );

      // Verify second feedback thread (anonymous).
      await explorationEditor.viewFeedbackThread(1);
      await explorationEditor.expectSuggestionToBeAnonymous(
        'This is anonymous feedback from the first user',
        true
      );
      await explorationEditor.replyToSuggestion(
        'Thank you for your anonymous feedback!'
      );

      // Verify third feedback thread (anonymous).
      await explorationEditor.viewFeedbackThread(1);
      await explorationEditor.expectSuggestionToBeAnonymous(
        'This is anonymous feedback from the second user',
        true
      );
      await explorationEditor.replyToSuggestion(
        'I appreciate your anonymous feedback!'
      );
      await explorationEditor.goBackToTheFeedbackTab();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  it(
    'should verify that feedback recipients can see the responses to their feedback',
    async function () {
      // TODO(19443): Once this issue is resolved (which was not allowing to make the feedback
      // in mobile viewport which is required for testing the feedback messages tab),
      // remove this part of skipping the test and make the test to run in mobile viewport as well.
      // see: https://github.com/oppia/oppia/issues/19443
      if (process.env.MOBILE === 'true') {
        showMessage('Test skipped in mobile viewport');
        return;
      }

      await loggedInVisitor.navigateToFeedbackUpdatesPage();
      await loggedInVisitor.viewFeedbackUpdateThread(1);

      // Verify the feedback and response match what was expected.
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
      // TODO(19443): Once this issue is resolved (which was not allowing to make the feedback
      // in mobile viewport which is required for testing the feedback messages tab),
      // remove this part of skipping the test and make the test to run in mobile viewport as well.
      // see: https://github.com/oppia/oppia/issues/19443
      if (process.env.MOBILE === 'true') {
        showMessage('Test skipped in mobile viewport');
        return;
      }

      await explorationEditor.navigateToCreatorDashboardPage();
      await explorationEditor.openExplorationInExplorationEditor(
        'Feedback Test'
      );
      await explorationEditor.navigateToFeedbackTab();

      // Change status of the second feedback thread to "fixed".
      await explorationEditor.viewFeedbackThread(2);
      await explorationEditor.changeFeedbackStatus('fixed');
      await explorationEditor.expectFeedbackStatusToBe('fixed');

      // Change status of the third feedback thread to "ignored".
      await explorationEditor.viewFeedbackThread(2);
      await explorationEditor.changeFeedbackStatus('ignored');
      await explorationEditor.expectFeedbackStatusToBe('ignored');
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
