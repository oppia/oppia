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
 * @fileoverview Page object for the diagnostic test page, for use
 * in Webdriverio tests.
 */

var action = require('./action.js');

var DiagnosticTestPage = function() {
  var startDiagnosticTestButton = $('.e2e-test-start-diagnostic-test');
  var addNewClassroomButton = $('.e2e-test-add-new-classroom-config');
  var newClassrooomNameInput = $('.e2e-test-new-classroom-name');
  var newClassroomUrlFragmentInput = $('.e2e-test-new-classroom-url-fragment');
  var createNewClassroomButton = $('.e2e-test-create-new-classroom');

  this.startDiagnosticTest = async function() {
    await action.click('Start diagnostic test', startDiagnosticTestButton);
  };

  this.createNewClassroomConfig = async function(
      classroomName, classroomUrlFragment
  ) {
    await action.click(
      'Add new classroom config data', addNewClassroomButton);
    await action.setValue(
      'New classroom name input',
      newClassrooomNameInput,
      classroomName
    );
    await action.setValue(
      'New classroom URL fragment input',
      newClassroomUrlFragmentInput,
      classroomUrlFragment
    );
    await action.click(
      'Create new classroom config', createNewClassroomButton);
  };
};

exports.DiagnosticTestPage = DiagnosticTestPage;
