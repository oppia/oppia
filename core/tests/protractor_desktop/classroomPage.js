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
 * @fileoverview End-to-end tests for the classroom page.
 */

var forms = require('../protractor_utils/forms.js');
var general = require('../protractor_utils/general.js');
var users = require('../protractor_utils/users.js');
var waitFor = require('../protractor_utils/waitFor.js');
var workflow = require('../protractor_utils/workflow.js');

var AdminPage = require('../protractor_utils/AdminPage.js');
var ClassroomPage = require('../protractor_utils/ClassroomPage.js');
var LibraryPage = require('../protractor_utils/LibraryPage.js');

describe('Classroom page functionality', function() {
  var adminPage = null;
  var classroomPage = null;
  var libraryPage = null;

  beforeAll(async function() {
    adminPage = new AdminPage.AdminPage();
    classroomPage = new ClassroomPage.ClassroomPage();
    libraryPage = new LibraryPage.LibraryPage();

    await users.createAndLoginAdminUser(
      'creator@classroomPage.com', 'creatorClassroomPage');
    await adminPage.editConfigProperty(
      'Show classroom components.',
      'Boolean', async function(elem) {
        await elem.setValue(true);
      });
  });

  beforeEach(async function() {
    await users.login('creator@classroomPage.com');
  });

  it('should search for explorations from classroom page', async function() {
    await workflow.createAndPublishExploration(
      'Exploration Title',
      'Algorithms',
      'This is the objective.',
      'English');
    await classroomPage.get('math');
    await libraryPage.findExploration('Title');
    await libraryPage.expectExplorationToBeVisible('Exploration Title');

    await libraryPage.selectLanguages(['English']);
    await libraryPage.expectCurrentLanguageSelectionToBe(['English']);

    await libraryPage.selectCategories(['Algorithms']);
    await libraryPage.expectCurrentCategorySelectionToBe(['Algorithms']);
    await users.logout();
  });

  afterEach(async function() {
    await general.checkForConsoleErrors([]);
  });
});
