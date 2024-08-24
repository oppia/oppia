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
 * @fileoverview Acceptance Test for checking the user flow of Parent/Teachers
 */

/*
  This is the user-journey of parent/teacher:
  1.Go to Teach page via footer from the home(splash) page
  2.Go to the lessons page from teach page by clicking on the explore lessons button.
  Testing -Can parent/teacher navigate to the teach page from home page and then to the lessons page from the teach page?
 */

import {UserFactory} from '../../utilities/common/user-factory';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';
import testConstants from '../../utilities/common/test-constants';
import {ConsoleReporter} from '../../utilities/common/console-reporter';

const DEFAULT_SPEC_TIMEOUT_MSECS = testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;

ConsoleReporter.setConsoleErrorsToIgnore([
  /http:\/\/localhost:8181\/access_validation_handler\/can_access_classroom_page\?/,
  /classroom_url_fragment=math Failed to load resource: the server responded with a status of 404 \(Not Found\)/,
  /webpack:\/\/\/\.\/core\/templates\/services\/contextual\/logger\.service\.ts\?/,
  /The requested path \/learn\/math is not found\./,
]);

ConsoleReporter.setConsoleErrorsToIgnore([
  /http:\/\/localhost:8181\/access_validation_handler\/can_access_classrooms_page Failed to load resource: the server responded with a status of 404 \(Not Found\)/,
]);

describe('Parent/Teacher', function () {
  let loggedOutUser: LoggedOutUser;

  beforeAll(async function () {
    loggedOutUser = await UserFactory.createLoggedOutUser();
  }, DEFAULT_SPEC_TIMEOUT_MSECS);

  it(
    'should be able to navigate to "For Parent/Teacher page" via footer ' +
      'and click on "Explore Lessons" button',
    async function () {
      // Navigating to "For Parent/Teacher page" via footer from home page.
      await loggedOutUser.clickOnForParentsSlashTeachersLinkInFooter();

      // Navigating to "Parents/Teachers guide pdf" by clicking on the "Check out our guide" button.
      await loggedOutUser.clickGuideButtonInTeachPage();
      // Navigating to "Teacher Story tagged blogs page" by clicking on the "Check out our blog" button.
      await loggedOutUser.clickBlogButtonInTeachPage();
      // Checking if the lesson creators carousel is working in the "For Parent/Teacher" page.
      await loggedOutUser.expectLessonCreatorsCarouselToBeFunctionalInTeachPage();
      // Navigating to "lesson creator's LinkedIn profile" by clicking on the "LinkedIn profile" button.
      await loggedOutUser.clickLinkedInButtonInTeachPage();
      // Checking if the lesson creation process is visible in the "For Parent/Teacher" page.
      await loggedOutUser.expectLessonCreationStepsAccordionToBeFunctionalInTeachPage();
      // Navigating to lessons/classroom page by clicking on the
      // "Explore Lessons" button on the "For Parent/Teacher" page.
      await loggedOutUser.clickExploreLessonsButtonAtTheTopInTeachPage();
      // Navigating back.
      await loggedOutUser.navigateToTeachPage();
      // Checking if the testimonials carousel is working in the "For Parent/Teacher" page.
      await loggedOutUser.expectTestimonailsCarouselToBeFunctionalInTeachPage();
      // Navigating to lessons/classroom page by clicking on the
      // "Explore Lessons" button on the "For Parent/Teacher" page.
      await loggedOutUser.clickExploreLessonsButtonAtTheBottomInTeachPage();
      // Navigating back.
      await loggedOutUser.navigateToTeachPage();
      // Navigating to "Andriod page" by clicking on the "Get Android App" button.
      await loggedOutUser.clickGetAndroidAppButtonInTeachPage();
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
