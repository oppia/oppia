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
 * @fileoverview End-to-end tests for the classroom page.
 */

var general = require('../webdriverio_utils/general.js');
var users = require('../webdriverio_utils/users.js');
var waitFor = require('../webdriverio_utils/waitFor.js');
var workflow = require('../webdriverio_utils/workflow.js');

var ClassroomPage = require('../webdriverio_utils/ClassroomPage.js');
var LibraryPage = require('../webdriverio_utils/LibraryPage.js');
var DiagnosticTestPage = require('../webdriverio_utils/DiagnosticTestPage.js');

describe('Classroom page functionality', function() {
  var classroomPage = null;
  var libraryPage = null;

  beforeAll(async function() {
    classroomPage = new ClassroomPage.ClassroomPage();
    libraryPage = new LibraryPage.LibraryPage();
    diagnosticTestPage = new DiagnosticTestPage.DiagnosticTestPage();

    await users.createAndLoginCurriculumAdminUser(
      'creator@classroomPage.com', 'creatorClassroomPage');
    await users.logout();
  });

  beforeEach(async function() {
    await users.login('creator@classroomPage.com');
  });

  it('should search for explorations from classroom page', async function() {
    await workflow.createAndPublishExploration(
      'Exploration Title',
      'Algorithms',
      'This is the objective.',
      'English',
      true);

    await browser.url('/classroom-admin/');
    await waitFor.pageToFullyLoad();
    await diagnosticTestPage.createNewClassroomConfig('Math', 'math');

    await classroomPage.get('math');
    await libraryPage.findExploration('Title');
    await libraryPage.expectExplorationToBeVisible('Exploration Title');

    await libraryPage.selectLanguages(['English']);
    await libraryPage.expectCurrentLanguageSelectionToBe(['English']);

    await libraryPage.selectCategories(['Algorithms']);
    await libraryPage.expectCurrentCategorySelectionToBe(['Algorithms']);
  });

  afterEach(async function() {
    await general.checkForConsoleErrors([]);
    await users.logout();
  });
});
