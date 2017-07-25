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
 */

var forms = require('../protractor_utils/forms.js');
var editor = require('../protractor_utils/editor.js');
var general = require('../protractor_utils/general.js');
var users = require('../protractor_utils/users.js');
var workflow = require('../protractor_utils/workflow.js');

describe('Permissions for private explorations', function() {
  it('should be correct for collaborators', function() {
    users.createUser('alice@privileges.com', 'alicePrivileges');
    users.createUser('bob@privileges.com', 'bobPrivileges');
    users.createUser('eve@privileges.com', 'evePrivileges');

    users.login('alice@privileges.com');
    workflow.createExploration();
    workflow.addExplorationCollaborator('bobPrivileges');
    expect(workflow.getExplorationManagers()).toEqual(['alicePrivileges']);
    expect(workflow.getExplorationCollaborators()).toEqual(['bobPrivileges']);
    expect(workflow.getExplorationPlaytesters()).toEqual([]);
    general.getExplorationIdFromEditor().then(function(explorationId) {
      users.logout();

      users.login('bob@privileges.com');
      general.openEditor(explorationId);
      editor.setContent(forms.toRichText('I love you'));
      editor.setInteraction('TextInput');
      editor.saveChanges();
      users.logout();

      users.login('eve@privileges.com');
      general.openEditor(explorationId);
      general.expect404Error();
      users.logout();
    });
  });

  afterEach(function() {
    general.checkForConsoleErrors([
      'Failed to load resource: the server responded with a status of 404'
    ]);
  });
});
