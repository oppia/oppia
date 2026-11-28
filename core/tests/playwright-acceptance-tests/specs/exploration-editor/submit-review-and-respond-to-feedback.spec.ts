// Copyright 2026 The Oppia Authors. All Rights Reserved.
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

import {test} from '@playwright/test';
import {UserFactory} from '../../utilities/common/user-factory';
import {ExplorationEditor} from '../../utilities/user/exploration-editor';
import {LoggedInUser} from '../../utilities/user/logged-in-user';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';

test.describe.configure({mode: 'serial'});

test.describe('Exploration Editor', function () {
  // TODO(19443): Once this issue is resolved (which was not allowing to make the feedback
  // in mobile viewport which is required for testing the feedback messages tab),
  // remove this part of skipping the test and make the test to run in mobile viewport as well.
  // see: https://github.com/oppia/oppia/issues/19443
  test.skip(
    () => process.env.MOBILE === 'true',
    'Test skipped in mobile viewport'
  );

  let explorationEditor: ExplorationEditor;
  let loggedInVisitor: LoggedInUser & LoggedOutUser;
  let loggedOutVisitor: LoggedOutUser;
  let explorationId: string | null;

  test.beforeAll(async function ({browser}) {
    explorationEditor = await UserFactory.createNewUser(
      'explorationEditor',
      'exploration_editor@example.com',
      browser
    );

    explorationId =
      await explorationEditor.createAndPublishAMinimalExplorationWithTitle(
        'Feedback Test'
      );
  });

  test(
    'should log in as a different user and give feedback to an exploration, ' +
      'both anonymously and non-anonymously. Then log out and give anonymous feedback.',
    async function ({browser}) {
      loggedInVisitor = await UserFactory.createNewUser(
        'loggedInVisitor',
        'loggedInVisitor@example.com',
        browser
      );

      // First user plays the exploration and gives non-anonymous feedback.
      await loggedInVisitor.playExplorationAsLoggedInUser(explorationId);
      await loggedInVisitor.openFeedbackPopup();
      await loggedInVisitor.writeAndSubmitFeedback(
        'This is helpful non-anonymous feedback',
        false
      );

      loggedOutVisitor = await UserFactory.createLoggedOutUser(browser);

      // Anonymous logged-out user plays the exploration and gives feedback.
      await loggedOutVisitor.playExplorationAsLoggedOutUser(explorationId);
      await loggedOutVisitor.openFeedbackPopup();
      await loggedOutVisitor.writeAndSubmitFeedback(
        'This is anonymous feedback from the first user',
        false
      );

      // Logged-in user gives anonymous feedback (testing both feedback types).
      await loggedInVisitor.playExplorationAsLoggedInUser(explorationId);
      await loggedInVisitor.openFeedbackPopup();
      await loggedInVisitor.writeAndSubmitFeedback(
        'This is anonymous feedback from the second user',
        true
      );
    }
  );

  test(
    'should log in as the original creator and go to the feedback tab ' +
      'and verify that all the feedback is shown in the list of feedback',
    async function () {
      await explorationEditor.navigateToCreatorDashboardPage();
      await explorationEditor.openExplorationInExplorationEditor(
        'Feedback Test'
      );

      // Go to the feedback tab and verify the count of feedback items.
      await explorationEditor.navigateToFeedbackTab();
      await explorationEditor.expectNoOfSuggestionsToBe(3);
    }
  );

  test('should verify that each feedback report has the correct details', async function () {
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
  });

  test(
    'should change the feedback status and verify that the changes are ' +
      'saved correctly in both the feedback thread and the list-of-all-feedback menu',
    async function () {
      await explorationEditor.navigateToCreatorDashboardPage();
      await explorationEditor.openExplorationInExplorationEditor(
        'Feedback Test'
      );
      await explorationEditor.navigateToFeedbackTab();

      // Change status of the second feedback thread to "fixed".
      await explorationEditor.viewFeedbackThread(2);
      await explorationEditor.updateFeedbackStatus('fixed');
      await explorationEditor.expectFeedbackStatusToBe('fixed');

      // Change status of the third feedback thread to "ignored".
      await explorationEditor.viewFeedbackThread(2);
      await explorationEditor.updateFeedbackStatus('ignored');
      await explorationEditor.expectFeedbackStatusToBe('ignored');
    }
  );

  test.afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
