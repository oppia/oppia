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
 * https://docs.google.com/spreadsheets/d/1IrxN13IC5xwWdAFnGMu_4p3FU1ADL4QO-eLZIuTowIA/edit?gid=1002825365#gid=1002825365
 * SE.1. Crawl the main marketing and transactional pages
 */

import {UserFactory} from '../../utilities/common/user-factory';
import testConstants from '../../utilities/common/test-constants';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';

const DEFAULT_SPEC_TIMEOUT_MSECS = testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;

// Expected SEO metadata values for each page.
const SPLASH_SEO = {
  title: 'Oppia | Free, Online and Interactive Lessons for Anyone',
  ogTitle: 'Personalized Online Learning from Oppia',
  description:
    'Learn any subject through free and interactive lessons in easy-to-follow language. Oppia provides a step-by-step learning process to master any skills you want.',
  ogDescription:
    'Oppia is a free, open-source learning platform. Join the community to create or try an exploration today!',
  applicationName: 'Oppia.org',
};

// Expected SEO metadata values for donate page.
const DONATE_SEO = {
  title: 'Donate | Make a Positive Impact | Oppia',
  ogTitle: 'Personalized Online Learning from Oppia',
  description:
    'Learn any subject through free and interactive lessons in easy-to-follow language. Oppia provides a step-by-step learning process to master any skills you want.',
  ogDescription:
    'Donate to The Oppia Foundation to enable more students to receive the quality education they deserve.',
  applicationName: 'Oppia.org',
};

// Expected SEO metadata values for volunteer page.
const VOLUNTEER_SEO = {
  title: 'Volunteer | Oppia',
  ogTitle: 'Personalized Online Learning from Oppia',
  description:
    'Learn any subject through free and interactive lessons in easy-to-follow language. Oppia provides a step-by-step learning process to master any skills you want.',
  ogDescription:
    'Oppia is a free, open-source learning platform. Join the community to create or try an exploration today!',
  applicationName: 'Oppia.org',
};

// Expected SEO metadata values for partnerships page.
const PARTNERSHIPS_SEO = {
  title: 'Partnerships | Oppia',
  ogTitle: 'Personalized Online Learning from Oppia',
  description:
    'Learn any subject through free and interactive lessons in easy-to-follow language. Oppia provides a step-by-step learning process to master any skills you want.',
  ogDescription:
    'Oppia is a free, open-source learning platform. Join the community to create or try an exploration today!',
  applicationName: 'Oppia.org',
};

// Expected SEO metadata values for teachers page.
const TEACHERS_SEO = {
  title: 'Volunteer | Oppia',
  ogTitle: 'Personalized Online Learning from Oppia',
  description:
    'Learn any subject through free and interactive lessons in easy-to-follow language. Oppia provides a step-by-step learning process to master any skills you want.',
  ogDescription:
    'Oppia is a free, open-source learning platform. Join the community to create or try an exploration today!',
  applicationName: 'Oppia.org',
};

// Expected SEO metadata values for parents page.
const PARENTS_SEO = {
  title: 'Volunteer | Oppia',
  ogTitle: 'Personalized Online Learning from Oppia',
  description:
    'Learn any subject through free and interactive lessons in easy-to-follow language. Oppia provides a step-by-step learning process to master any skills you want.',
  ogDescription:
    'Oppia is a free, open-source learning platform. Join the community to create or try an exploration today!',
  applicationName: 'Oppia.org',
};

describe('Search Engine Bot', function () {
  let loggedOutUser: LoggedOutUser;

  beforeAll(async function () {
    loggedOutUser = await UserFactory.createLoggedOutUser();
  }, DEFAULT_SPEC_TIMEOUT_MSECS);

  it(
    'should discover the site map architecture, respect crawling restrictions,' +
      ' and extract unique, high-fidelity metadata from core public pages',
    async function () {
      // Issue an HTTP GET request to oppia.org/robots.txt.
      await loggedOutUser.navigateToRobotsTxt();
      await loggedOutUser.verifyCurrentPageStatus200();

      // Issue an HTTP GET request to oppia.org/sitemap.xml.
      await loggedOutUser.navigateToSitemapXml();
      await loggedOutUser.verifyCurrentPageStatus200();
      await loggedOutUser.verifySitemapXmlContent();

      // Issue an HTTP GET request to the site root directory (oppia.org/).
      await loggedOutUser.navigateToSplashPage();
      await loggedOutUser.verifyCurrentPageStatus200();
      await loggedOutUser.verifySEOMetadata(SPLASH_SEO);

      // Issue an HTTP GET request to oppia.org/donate.
      await loggedOutUser.navigateToDonatePage();
      await loggedOutUser.verifyCurrentPageStatus200();
      await loggedOutUser.verifySEOMetadata(DONATE_SEO);

      // Issue an HTTP GET request to oppia.org/volunteer.
      await loggedOutUser.navigateToVolunteerPage();
      await loggedOutUser.verifyCurrentPageStatus200();
      await loggedOutUser.verifySEOMetadata(VOLUNTEER_SEO);

      // Issue an HTTP GET request to oppia.org/partnerships.
      await loggedOutUser.navigateToPartnershipsPage();
      await loggedOutUser.verifyCurrentPageStatus200();
      await loggedOutUser.verifySEOMetadata(PARTNERSHIPS_SEO);

      // Issue an HTTP GET request to oppia.org/teachers.
      await loggedOutUser.navigateToTeachersPage();
      await loggedOutUser.verifyCurrentPageStatus200();
      await loggedOutUser.verifySEOMetadata(TEACHERS_SEO);

      // Issue an HTTP GET request to oppia.org/parents.
      await loggedOutUser.navigateToParentsPage();
      await loggedOutUser.verifyCurrentPageStatus200();
      await loggedOutUser.verifySEOMetadata(PARENTS_SEO);
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
