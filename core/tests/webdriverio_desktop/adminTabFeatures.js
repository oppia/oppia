// Copyright 2022 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview End-to-end tests for admin page functionality.
 */

var general = require('../webdriverio_utils/general.js');
var users = require('../webdriverio_utils/users.js');
var AdminPage = require('../webdriverio_utils/AdminPage.js');

describe('Admin Page', function() {
  var adminPage = null;

  beforeAll(function() {
    adminPage = new AdminPage.AdminPage();
  });

  it('should allow assigning roles and show them', async function() {
    await users.createUser('moderator1@adminTab.com', 'moderator1');
    await users.createUser('moderator2@adminTab.com', 'moderator2');
    await users.createUser(
      'collectionEdtior1@adminTab.com', 'collectionEditor1');
    await users.createAndLoginSuperAdminUser(
      'management@adminTab.com', 'management');

    await adminPage.expectUserRolesToMatch('moderator1', ['full user']);
    await adminPage.addRole('moderator1', 'moderator');
    await adminPage.expectUserRolesToMatch(
      'moderator1', ['full user', 'moderator']);

    await adminPage.expectUserRolesToMatch('moderator2', ['full user']);
    await adminPage.addRole('moderator2', 'moderator');
    await adminPage.expectUserRolesToMatch(
      'moderator2', ['full user', 'moderator']);

    await adminPage.expectUserRolesToMatch(
      'collectionEditor1', ['full user']);
    await adminPage.addRole('collectionEditor1', 'collection editor');
    await adminPage.expectUserRolesToMatch(
      'collectionEditor1', ['full user', 'collection editor']);

    await users.logout();
  });

  it('should allow assigning role of translation coordinator',
    async function() {
      await users.createUser('user1@admintab.com', 'user1');
      await users.login('management@adminTab.com');

      await adminPage.makeUserTranslationCoordinator('user1', 'English');
      await adminPage.expectUserRolesToMatch(
        'user1', ['full user', 'translation coordinator']);
    });

  afterEach(async function() {
    await general.checkForConsoleErrors([]);
  });
});
