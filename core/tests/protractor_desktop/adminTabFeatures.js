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

describe('Admin Tab', function() {
  var adminPage = null;

  beforeAll(function() {
    adminPage = new AdminPage.AdminPage();
  });

  it('should allow assigning roles and show them', function() {
    users.createUser('moderator1@adminTab.com', 'moderator1');
    users.createUser('moderator2@adminTab.com', 'moderator2');
    users.createUser('collectionEdtior1@adminTab.com', 'collectionEditor1');
    users.createAndLoginAdminUser('management@adminTab.com', 'management');
    adminPage.get();
    adminPage.updateRole('moderator1', 'moderator');
    adminPage.viewRolesbyUsername('moderator1');
    adminPage.expectUsernamesToMatch(['moderator1']);

    adminPage.get();
    adminPage.updateRole('moderator2', 'moderator');
    adminPage.viewRolesbyUsername('moderator2');
    adminPage.expectUsernamesToMatch(['moderator2']);

    adminPage.getUsersAsssignedToRole('moderator');
    adminPage.expectUsernamesToMatch(['moderator1', 'moderator2']);

    adminPage.get();
    adminPage.updateRole('collectionEditor1', 'collection editor');
    adminPage.getUsersAsssignedToRole('collection editor');
    adminPage.expectUsernamesToMatch(['collectionEditor1']);
  });

  afterEach(function() {
    general.checkForConsoleErrors([]);
  });
});
