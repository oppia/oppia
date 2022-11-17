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
 * @fileoverview End-to-end tests for the diagnostic test page.
 */

var general = require('../webdriverio_utils/general.js');
var users = require('../webdriverio_utils/users.js');

var AdminPage = require('../webdriverio_utils/AdminPage.js');
var ClassroomPage = require('../webdriverio_utils/ClassroomPage.js');

describe('Diagnostic test page functionality', function() {
  var classroomPage = null;
  var adminPage = null;

  beforeAll(async function() {
    adminPage = new AdminPage.AdminPage();
    classroomPage = new ClassroomPage.ClassroomPage();

    await users.createAndLoginCurriculumAdminUser(
      'creator@classroomPage.com', 'creatorClassroomPage');
    await adminPage.createDummyClassroom();
    await users.logout();
  });

  beforeEach(async function() {
    await users.login('creator@classroomPage.com');
  });

  it('should be able to start diagnostic test', async function() {
    await classroomPage.get('math');
    await classroomPage.takeDiagnosticTest();
  });

  afterEach(async function() {
    await general.checkForConsoleErrors([]);
    await users.logout();
  });
});
