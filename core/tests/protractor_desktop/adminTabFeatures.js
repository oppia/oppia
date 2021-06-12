// Copyright 2019 The Oppia Authors. All Rights Reserved.
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

var general = require('../protractor_utils/general.js');
var users = require('../protractor_utils/users.js');
var AdminPage = require('../protractor_utils/AdminPage.js');

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
    await users.createUser(
      'newQuestionReviewer@adminTab.com', 'newQuestionReviewer');
    await users.createAndLoginAdminUser(
      'management@adminTab.com', 'management');
    await adminPage.get();
    await adminPage.updateRole('moderator1', 'moderator');
    await adminPage.viewRolesByUsername('moderator1', true);
    await adminPage.expectUsernamesToMatch(['moderator1']);

    await adminPage.get();
    await adminPage.updateRole('moderator2', 'moderator');
    await adminPage.viewRolesByUsername('moderator2', true);
    await adminPage.expectUsernamesToMatch(['moderator2']);

    await adminPage.getUsersAsssignedToRole('moderator');
    await adminPage.expectUsernamesToMatch(['moderator1', 'moderator2']);

    await adminPage.get();
    await adminPage.updateRole('collectionEditor1', 'collection editor');
    await adminPage.getUsersAsssignedToRole('collection editor');
    await adminPage.expectUsernamesToMatch(['collectionEditor1']);

    await users.logout();
  });

  afterEach(async function() {
    await general.checkForConsoleErrors([]);
  });
});
