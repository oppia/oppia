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
var waitFor = require('./waitFor.js');

var DiagnosticTestPage = function() {
  var startDiagnosticTestButton = $('.e2e-test-start-diagnostic-test');
  var addNewClassroomButton = $('.e2e-test-add-new-classroom-config');
  var newClassroomNameInput = $('.e2e-test-new-classroom-name');
  var newClassroomUrlFragmentInput = $('.e2e-test-new-classroom-url-fragment');
  var createNewClassroomButton = $('.e2e-test-create-new-classroom');
  var recommendedTopicSummaryTile = $(
    '.e2e-test-recommended-topic-summary-tile');
  var recommendedTopicSummaryTilesSelector = function() {
    return $$('.e2e-test-recommended-topic-summary-tile');
  };
  var recommendedTopicSummaryTilesLocator = (
    '.e2e-test-recommended-topic-summary-tile');
  var classroomTileSelector = $('.e2e-test-classroom-tile');
  var editClassroomConfigButton = $('.e2e-test-edit-classroom-config-button');
  var addTopicToClassroomButton = $('.e2e-test-add-topic-to-classroom-button');
  var addTopicToClassroomInput = $('.e2e-test-add-topic-to-classroom-input');
  var submitTopicIdToClassroomButton = $(
    '.e2e-test-submit-topic-id-to-classroom-button');
  var saveClassroomConfigButton = $('.e2e-test-save-classroom-config-button');

  this.startDiagnosticTest = async function() {
    await action.click(
      'Start diagnostic test button', startDiagnosticTestButton);
  };

  this.createNewClassroomConfig = async function(
      classroomName, classroomUrlFragment
  ) {
    await action.click(
      'Add new classroom config button', addNewClassroomButton);

    await waitFor.modalPopupToAppear();

    await action.setValue(
      'New classroom name input',
      newClassroomNameInput,
      classroomName
    );

    await action.setValue(
      'New classroom URL fragment input',
      newClassroomUrlFragmentInput,
      classroomUrlFragment
    );

    await action.click(
      'Create new classroom config button',
      createNewClassroomButton
    );

    await waitFor.invisibilityOf(
      newClassroomNameInput,
      'Create classroom config modal taking too long to disappear.'
    );
  };

  this.addTopicIdToClassroomConfig = async function(topicId, index) {
    await action.click(
      'Classroom config tile selector', classroomTileSelector);

    await action.click(
      'Edit classroom config button', editClassroomConfigButton);

    await action.click(
      'Add topic to classroom button', addTopicToClassroomButton);

    await action.setValue(
      'Add topic ID to classroom input',
      addTopicToClassroomInput,
      topicId
    );

    await action.click(
      'Add topic ID to classroom submit button',
      submitTopicIdToClassroomButton
    );

    await action.click(
      'Save classroom config button', saveClassroomConfigButton);
  };

  this.expectNumberOfRecommendedTopicsToBe = async function(count) {
    var recommendedTopicSummaryTiles = (
      await recommendedTopicSummaryTilesSelector());
    if (count > 0) {
      await waitFor.visibilityOf(
        recommendedTopicSummaryTile,
        'Recommended topic summary tile is not visible'
      );
      await waitFor.numberOfElementsToBe(
        recommendedTopicSummaryTilesLocator,
        'Recommended topic summary tile', count);
    } else {
      expect(recommendedTopicSummaryTiles.length).toEqual(0);
    }
  };
};

exports.DiagnosticTestPage = DiagnosticTestPage;
