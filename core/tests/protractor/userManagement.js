// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview End-to-end tests for user management.
 */

var general = require('../protractor_utils/general.js');
var users = require('../protractor_utils/users.js');
var workflow = require('../protractor_utils/workflow.js');

describe('Account creation', function() {
  it('should create users', function() {
    users.createUser(
      'ordinaryuser@userManagement.com', 'ordinaryUserManagement');
  });

  it('should create moderators', function() {
    users.createModerator(
      'mod@userManagement.com', 'moderatorUserManagement');
  });

  // Usernames containing "admin" are not permitted.
  it('should create admins', function() {
    users.createAdmin(
      'admin@userManagement.com', 'adm1nUserManagement');
  });

  afterEach(function() {
    general.checkForConsoleErrors([]);
  });
});
