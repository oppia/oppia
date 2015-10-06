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
 * @fileoverview End-to-end tests of user editing and viewing rights.
 *
 * @author Jacob Davis (jacobdavis11@gmail.com)
 */

var forms = require('../protractor_utils/forms.js');
var editor = require('../protractor_utils/editor.js');
var general = require('../protractor_utils/general.js');
var users = require('../protractor_utils/users.js');
var workflow = require('../protractor_utils/workflow.js');

describe('Permissions for private explorations', function() {
  it('should be correct for collaborators', function() {
    users.createUser('alice@example.com', 'Alice');
    users.createUser('bob@example.com', 'Bob');
    users.createUser('eve@example.com', 'Eve');

    users.login('alice@example.com');
    workflow.createExploration('message', 'secrets');
    workflow.addExplorationCollaborator('Bob');
    expect(workflow.getExplorationManagers()).toEqual(['Alice']);
    expect(workflow.getExplorationCollaborators()).toEqual(['Bob']);
    expect(workflow.getExplorationPlaytesters()).toEqual([]);
    general.getExplorationIdFromEditor().then(function(explorationId) {
      users.logout();

      users.login('bob@example.com');
      general.openEditor(explorationId);
      editor.setContent(forms.toRichText('I love you'));
      editor.setInteraction('TextInput');
      editor.saveChanges();
      users.logout();

      users.login('eve@example.com');
      general.openEditor(explorationId);
      // Eve is redirected to the homepage.
      expect(browser.getCurrentUrl()).toEqual(general.SERVER_URL_PREFIX + '/');
      users.logout();
    });
  });

  afterEach(function() {
    general.checkForConsoleErrors([
      'Failed to load resource: the server responded with a status of 404'
    ]);
  });
});
