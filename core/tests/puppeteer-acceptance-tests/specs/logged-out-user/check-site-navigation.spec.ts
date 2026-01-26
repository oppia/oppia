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
 * @fileoverview Acceptance Test for checking the site navigation and meta tags.
 */

import {UserFactory} from '../../utilities/common/user-factory';
import testConstants from '../../utilities/common/test-constants';
import {LoggedOutUser} from '../../utilities/user/logged-out-user';

const DEFAULT_SPEC_TIMEOUT = testConstants.DEFAULT_SPEC_TIMEOUT_MSECS;

describe('Site Navigation', function () {
  let guestUser: LoggedOutUser;

  beforeAll(async function () {
    guestUser = await UserFactory.createLoggedOutUser();
  }, DEFAULT_SPEC_TIMEOUT);

  it('should verify the navigation to the About page and check meta tags', async function () {
    const aboutSelector = 'a[href="/about"]';
    await guestUser.page.waitForSelector(aboutSelector);
    await guestUser.page.click(aboutSelector);

    await guestUser.page.waitForFunction(
      (url: string) => window.location.href === url,
      {},
      testConstants.URLs.About
    );

    const title = await guestUser.page.title();
    expect(title).toContain('About');

    const appName = await guestUser.page.$eval(
      'meta[name="application-name"]',
      element => element.getAttribute('content')
    );
    expect(appName).toBe('Oppia.org');

    const description = await guestUser.page.$eval(
      'meta[name="description"]',
      element => element.getAttribute('content')
    );
    expect(description).not.toBeNull();
    expect(description?.length).toBeGreaterThan(0);

    const itempropName = await guestUser.page.$eval(
      'meta[itemprop="name"]',
      element => element.getAttribute('content')
    );
    expect(itempropName).not.toBeNull();
  });

  it('should verify the navigation to the Get Started page and check meta tags', async function () {
    const getStartedSelector = 'a[href="/get-started"]';
    await guestUser.page.waitForSelector(getStartedSelector);
    await guestUser.page.click(getStartedSelector);

    await guestUser.page.waitForFunction(
      (url: string) => window.location.href === url,
      {},
      testConstants.URLs.GetStarted
    );

    const title = await guestUser.page.title();
    expect(title).toContain('Get Started');

    const appName = await guestUser.page.$eval(
      'meta[name="application-name"]',
      element => element.getAttribute('content')
    );
    expect(appName).toBe('Oppia.org');

    const description = await guestUser.page.$eval(
      'meta[name="description"]',
      element => element.getAttribute('content')
    );
    expect(description).not.toBeNull();
    expect(description?.length).toBeGreaterThan(0);

    const itempropName = await guestUser.page.$eval(
      'meta[itemprop="name"]',
      element => element.getAttribute('content')
    );
    expect(itempropName).not.toBeNull();
  });

  it('should verify the navigation to the Donate page and check meta tags', async function () {
    const donateSelector = 'a[href="/donate"]';
    await guestUser.page.waitForSelector(donateSelector);
    await guestUser.page.click(donateSelector);

    await guestUser.page.waitForFunction(
      (url: string) => window.location.href === url,
      {},
      testConstants.URLs.Donate
    );

    const title = await guestUser.page.title();
    expect(title).toContain('Donate');

    const appName = await guestUser.page.$eval(
      'meta[name="application-name"]',
      element => element.getAttribute('content')
    );
    expect(appName).toBe('Oppia.org');

    const description = await guestUser.page.$eval(
      'meta[name="description"]',
      element => element.getAttribute('content')
    );
    expect(description).not.toBeNull();
    expect(description?.length).toBeGreaterThan(0);

    const itempropName = await guestUser.page.$eval(
      'meta[itemprop="name"]',
      element => element.getAttribute('content')
    );
    expect(itempropName).not.toBeNull();
  });

  it('should verify the navigation to the Contact page and check meta tags', async function () {
    await guestUser.page.goto(testConstants.URLs.Home);

    const contactSelector = 'a[href="/contact"]';
    await guestUser.page.waitForSelector(contactSelector);
    await guestUser.page.click(contactSelector);

    await guestUser.page.waitForFunction(
      (url: string) => window.location.href === url,
      {},
      testConstants.URLs.Contact
    );

    const title = await guestUser.page.title();
    expect(title).toContain('Contact');

    const appName = await guestUser.page.$eval(
      'meta[name="application-name"]',
      element => element.getAttribute('content')
    );
    expect(appName).toBe('Oppia.org');

    const description = await guestUser.page.$eval(
      'meta[name="description"]',
      element => element.getAttribute('content')
    );
    expect(description).not.toBeNull();
    expect(description?.length).toBeGreaterThan(0);

    const itempropName = await guestUser.page.$eval(
      'meta[itemprop="name"]',
      element => element.getAttribute('content')
    );
    expect(itempropName).not.toBeNull();
  });

  afterAll(async function () {
    await UserFactory.closeAllBrowsers();
  });
});
