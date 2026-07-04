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
 * @fileoverview Acceptance test from CUJv3 Doc
 * https://docs.google.com/document/d/1D7kkFTzg3rxUe3QJ_iPlnxUzBFNElmRkmAWss00nFno/
 *
 * LO.16. Submit a platform defect report from a non-lesson page
 */

import {UserFactory} from '../../utilities/common/user-factory';
import testConstants, {FILEPATHS} from '../../utilities/common/test-constants';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';
import {ReleaseCoordinator} from '../../utilities/user/release-coordinator';
import {showMessage} from '../../utilities/common/show-message';

const ROLES = testConstants.Roles;

describe('Logged-Out User', function () {
  let loggedOutLearner: LoggedOutUser;
  let releaseCoordinator: ReleaseCoordinator;

  beforeAll(async function () {
    releaseCoordinator = await UserFactory.createNewUser(
      'releaseCoordinator',
      'releaseCoordinator@example.com',
      [ROLES.RELEASE_COORDINATOR]
    );
    await releaseCoordinator.enableFeatureFlag('web_feedback_modal_enabled');
    loggedOutLearner = await UserFactory.createLoggedOutUser();
    await UserFactory.closeBrowserForUser(releaseCoordinator);
  });

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });

  it('Report a broken layout or static page bug as a guest user.', async () => {
    // Navigating to a non-lesson page (About page) and clicking on the "Report a Website Issue" link in the global footer layout.
    await loggedOutLearner.navigateToAboutPage();
    await loggedOutLearner.scrollToBottomOfPage();
    await loggedOutLearner.openReportASiteIssueModalFromGlobalFooter(false);
    await loggedOutLearner.expectIncludeTechnicalLogToBePresent(true);
    showMessage('Clicked on "Report a Website Issue" button.');
    await loggedOutLearner.expectScreenshotToMatch(
      'reportASiteIssueModal',
      __dirname
    );
    // should not be able to submit "Report a Website Issue" feedback while the text area description is completely blank.
    await loggedOutLearner.clickButtonInModal(
      'Report a Website Issue',
      'confirm',
      false
    );
    await loggedOutLearner.expectTextContentInElementWithSelectorToBe(
      '.e2e-test-form-error',
      'Please add a description before submitting.'
    );

    await loggedOutLearner.submitFeedbackInTextArea(
      'The partner image grid overlaps text headers when scaling down to smaller mobile screen viewports.'
    );
    // Add a screenshot of size greater than 1MB.
    await loggedOutLearner.addFeedbackScreenshot(FILEPATHS.BANNER_HIGH_RES);
    await loggedOutLearner.expectPhotoUploadErrorMessageToBe(
      'The maximum allowed file size is 1024 KB'
    );
    await loggedOutLearner.expectScreenshotToMatch(
      'reportASiteIssueModalAfterEnteringFeedbackWithLargeFile',
      __dirname
    );
    // Add an invalid file type.
    await loggedOutLearner.addFeedbackScreenshot(FILEPATHS.BANNER_BMP);
    await loggedOutLearner.expectPhotoUploadErrorMessageToBe(
      'This image format is not supported'
    );
    await loggedOutLearner.expectScreenshotToMatch(
      'reportASiteIssueModalAfterEnteringFeedbackWithInvalidFileType',
      __dirname
    );

    // should clear the screenshoterror by dropping a valid screenshot image into the box
    await loggedOutLearner.addFeedbackScreenshot(testConstants.data.oppiaPage);
    // In the screenshot, test is seen that all error messages are cleared.
    await loggedOutLearner.expectScreenshotToMatch(
      'reportASiteIssueModalAfterDroppingValidScreenshot',
      __dirname
    );

    await loggedOutLearner.expectIncludeTechnicalLogToBePresent(true);
    await loggedOutLearner.scrollToCaptchaContainer();
    await loggedOutLearner.expectScreenshotToMatch(
      'reportASiteIssueModalAfterEnteringFeedback',
      __dirname
    );
    await loggedOutLearner.waitForTurnstileTokenIfPresent();
    await loggedOutLearner.clickButtonInModal(
      'Report a Website Issue',
      'confirm'
    );
    await loggedOutLearner.expectToastMessage(
      'Thank you! Your report has been sent to the technical team.'
    );
    await loggedOutLearner.expectScreenshotToMatch(
      'reportASiteIssueModalAfterSubmittingFeedback',
      __dirname
    );
  });
});
