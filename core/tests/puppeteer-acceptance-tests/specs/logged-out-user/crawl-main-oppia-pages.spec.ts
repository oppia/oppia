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
  title: 'Personalized Online Learning from Oppia',
  ogTitle: 'Personalized Online Learning from Oppia',
  description:
    'Empowering children globally through free, high-quality, story-based adaptive lessons.',
  ogDescription:
    'Empowering children globally through free, high-quality, story-based adaptive lessons.',
  applicationName: 'Oppia.org',
};

// Expected SEO metadata values for donate page.
const DONATE_SEO = {
  title: 'Donate to Oppia | Support Global Education',
  ogTitle: 'Donate to Oppia | Support Global Education',
  description:
    'Your donation helps fund free, localized educational resources for children in under-resourced communities.',
  ogDescription:
    'Your donation helps fund free, localized educational resources for children in under-resourced communities.',
  applicationName: 'Oppia.org',
};

// Expected SEO metadata values for volunteer page.
const VOLUNTEER_SEO = {
  title: 'Volunteer with Oppia | Join Our Global Team',
  ogTitle: 'Volunteer with Oppia | Join Our Global Team',
  description:
    'Contribute your translation, engineering, or content design skills to make education accessible to all.',
  ogDescription:
    'Contribute your translation, engineering, or content design skills to make education accessible to all.',
  applicationName: 'Oppia.org',
};

// Expected SEO metadata values for partnerships page.
const PARTNERSHIPS_SEO = {
  title: 'Partner with Oppia | NGOs and Schools',
  ogTitle: 'Partner with Oppia | NGOs and Schools',
  description:
    "Discover how schools and non-profit organizations leverage Oppia's offline capability to eliminate learning deficits.",
  ogDescription:
    "Discover how schools and non-profit organizations leverage Oppia's offline capability to eliminate learning deficits.",
  applicationName: 'Oppia.org',
};

// TODO(#26383): Re-enable distinct metadata checks for /teachers and
// /parents after these routes are separated into dedicated page modules
// instead of sharing the volunteer/stewards page implementation.

// Expected SEO metadata values for teachers page.
// const TEACHERS_SEO = {
//   title: 'Free Math Teaching Resources & Tools | Oppia',
//   ogTitle: 'Free Math Teaching Resources & Tools | Oppia',
//   description:
//     'Equip your classroom or home with adaptive math stories, downloadable lesson plan guides, and automated student tracking dashboards.',
//   ogDescription:
//     'Equip your classroom or home with adaptive math stories, downloadable lesson plan guides, and automated student tracking dashboards.',
//   applicationName: 'Oppia.org',
// };

// Expected SEO metadata values for parents page.
// const PARENTS_SEO = {
//   title: 'Free At-Home Math Learning for Kids | Oppia',
//   ogTitle: 'Free At-Home Math Learning for Kids | Oppia',
//   description:
//     'Help your child master math with fun, story-based lessons. Safe, completely free, and designed for independent learning at home.',
//   ogDescription:
//     'Help your child master math with fun, story-based lessons. Safe, completely free, and designed for independent learning at home.',
//   applicationName: 'Oppia.org',
// };

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
      // TODO(#26383): Re-enable distinct metadata checks for /teachers and
      // /parents after these routes are separated into dedicated page modules
      // instead of sharing the volunteer/stewards page implementation.
      // await loggedOutUser.verifySEOMetadata(TEACHERS_SEO);

      // Issue an HTTP GET request to oppia.org/parents.
      await loggedOutUser.navigateToParentsPage();
      await loggedOutUser.verifyCurrentPageStatus200();
      // TODO(#26383): Re-enable distinct metadata checks for /teachers and
      // /parents after these routes are separated into dedicated page modules
      // instead of sharing the volunteer/stewards page implementation.
      // await loggedOutUser.verifySEOMetadata(PARENTS_SEO);
    },
    DEFAULT_SPEC_TIMEOUT_MSECS
  );

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
