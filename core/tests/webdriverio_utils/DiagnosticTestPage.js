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
var workflow = require('../webdriverio_utils/workflow.js');

var DiagnosticTestPage = function () {
  var startDiagnosticTestButton = $('.e2e-test-start-diagnostic-test');
  var addNewClassroomButton = $('.e2e-test-add-new-classroom-config');
  var newClassroomNameInput = $('.e2e-test-new-classroom-name');
  var newClassroomUrlFragmentInput = $('.e2e-test-new-classroom-url-fragment');
  var createNewClassroomButton = $('.e2e-test-create-new-classroom');
  var recommendedTopicSummaryTile = $(
    '.e2e-test-recommended-topic-summary-tile'
  );
  var recommendedTopicSummaryTilesSelector = function () {
    return $$('.e2e-test-recommended-topic-summary-tile');
  };
  var recommendedTopicSummaryTilesLocator =
    '.e2e-test-recommended-topic-summary-tile';
  var classroomTileSelector = $('.e2e-test-classroom-tile');
  var editClassroomConfigButton = $('.e2e-test-edit-classroom-config-button');
  var addTopicToClassroomButton = $('.e2e-test-add-topic-to-classroom-button');
  var saveClassroomConfigButton = $('.e2e-test-save-classroom-config-button');
  var classroomTopicDropdownElement = $('.e2e-test-classroom-topics-modal');
  var updateClassroomTeaserTextInput = $(
    '.e2e-test-update-classroom-teaser-text'
  );
  var updateClassroomTopicListIntroInput = $(
    '.e2e-test-update-classroom-topic-list-intro'
  );
  var updateClassroomCourseDetailsInput = $(
    '.e2e-test-update-classroom-course-details'
  );
  var publishClassroomButton = $(
    '.e2e-test-toggle-classroom-publication-status-btn'
  );
  var thumbnailContainer = $('.e2e-test-thumbnail-container');
  var topicThumbnailButton = $('.e2e-test-photo-button');
  var bannerClickable = $('.e2e-test-classroom-banner-container');
  var bannerCropper = $('.e2e-test-photo-crop .cropper-container');

  this.startDiagnosticTest = async function () {
    await action.click(
      'Start diagnostic test button',
      startDiagnosticTestButton
    );
  };

  this.createNewClassroomConfig = async function (
    classroomName,
    classroomUrlFragment
  ) {
    await action.click(
      'Add new classroom config button',
      addNewClassroomButton
    );

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
    await this.updateClassroomData();
    await action.click(
      'Save classroom config button',
      saveClassroomConfigButton
    );
    await action.click('Classroom config tile selector', classroomTileSelector);
  };

  this.addTopicToClassroomConfig = async function (topicName) {
    await action.click('Classroom config tile selector', classroomTileSelector);

    await action.click(
      'Edit classroom config button',
      editClassroomConfigButton
    );

    await action.click(
      'Add topic to classroom button',
      addTopicToClassroomButton
    );

    await addTopicToClassroom(topicName);
    await action.waitForAutosave();

    await action.click(
      'Save classroom config button',
      saveClassroomConfigButton
    );
  };

  this.updateClassroomData = async function () {
    await action.click('Classroom config tile selector', classroomTileSelector);

    await action.click(
      'Edit classroom config button',
      editClassroomConfigButton
    );

    await action.setValue(
      'New classroom teaser text input',
      updateClassroomTeaserTextInput,
      'teaser text'
    );

    var teaserText = await action.getValue(
      'Teaser text input element',
      updateClassroomTeaserTextInput
    );
    expect(teaserText).toEqual('teaser text');

    await action.setValue(
      'New classroom course details input',
      updateClassroomCourseDetailsInput,
      'course details'
    );

    var courseDetailsText = await action.getValue(
      'Course details input element',
      updateClassroomCourseDetailsInput
    );
    expect(courseDetailsText).toEqual('course details');

    await action.setValue(
      'New classroom topic list intro input',
      updateClassroomTopicListIntroInput,
      'topic list intro'
    );

    var topicListIntroText = await action.getValue(
      'Topic list intro input element',
      updateClassroomTopicListIntroInput
    );
    expect(topicListIntroText).toEqual('topic list intro');

    await workflow.submitImage(
      topicThumbnailButton,
      thumbnailContainer,
      '../data/test_svg.svg',
      false
    );

    await workflow.submitImage(
      bannerClickable,
      bannerCropper,
      '../data/img.png',
      false
    );
  };

  this.publishClassroom = async function () {
    await action.click(
      'Edit classroom config button',
      editClassroomConfigButton
    );

    await action.click('Publish classroom button', publishClassroomButton);
    await action.click('Save classroom button', saveClassroomConfigButton);
  };

  this.expectNumberOfRecommendedTopicsToBe = async function (count) {
    var recommendedTopicSummaryTiles =
      await recommendedTopicSummaryTilesSelector();
    if (count > 0) {
      await waitFor.visibilityOf(
        recommendedTopicSummaryTile,
        'Recommended topic summary tile is not visible'
      );
      await waitFor.numberOfElementsToBe(
        recommendedTopicSummaryTilesLocator,
        'Recommended topic summary tile',
        count
      );
    } else {
      expect(recommendedTopicSummaryTiles.length).toEqual(0);
    }
  };

  var addTopicToClassroom = async function (topicName) {
    var containerLocator = '.e2e-test-classroom-category-dropdown';
    var searchTopicInput = $('.e2e-test-classroom-new-topic-add').$(
      '.mat-select-search-input.mat-input-element'
    );
    var searchInputLocatorTextOption = $(
      '.e2e-test-classroom-topic-selector-choice'
    );

    await action.click(
      'Container Element',
      classroomTopicDropdownElement.$(containerLocator)
    );
    await action.waitForAutosave();

    await action.setValue(
      'Dropdown Element Search',
      searchTopicInput,
      topicName
    );

    await action.click('Dropdown Element Select', searchInputLocatorTextOption);
  };
};

exports.DiagnosticTestPage = DiagnosticTestPage;
