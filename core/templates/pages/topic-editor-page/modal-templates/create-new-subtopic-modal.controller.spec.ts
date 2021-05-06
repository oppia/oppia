// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the create new subtopic modal controller.
 */

// TODO(#7222): Remove the following block of unnnecessary imports once
// the code corresponding to the spec is upgraded to Angular 8.
import { importAllAngularServices } from 'tests/unit-test-utils';
// ^^^ This block is to be removed.

describe('Create new subtopic modal', function() {
  importAllAngularServices();

  beforeEach(angular.mock.module('oppia'));

  var $scope = null;
  var ctrl = null;
  var $uibModalInstance = null;
  var TopicObjectFactory = null;
  var SubtopicValidationService = null;
  var topic = null;
  beforeEach(angular.mock.inject(function($injector, $controller) {
    var $rootScope = $injector.get('$rootScope');

    $uibModalInstance = jasmine.createSpyObj(
      '$uibModalInstance', ['close', 'dismiss']);
    TopicObjectFactory =
            $injector.get('TopicObjectFactory');
    SubtopicValidationService = $injector.get('SubtopicValidationService');
    $scope = $rootScope.$new();
    topic = TopicObjectFactory.createInterstitialTopic();
    ctrl = $controller('CreateNewSubtopicModalController', {
      $scope: $scope,
      $uibModalInstance: $uibModalInstance,
      topic: topic
    });
    ctrl.$onInit();
  }));


  it('should initialize controller properties after its initialization',
    function() {
      ctrl.$onInit();
      expect(ctrl.topic).toEqual(topic);
      expect(ctrl.SUBTOPIC_PAGE_SCHEMA).toEqual({
        type: 'html',
        ui_config: {
          rows: 100
        }});
      expect(ctrl.allowedBgColors).toEqual(['#FFFFFF']);
      expect(ctrl.MAX_CHARS_IN_SUBTOPIC_TITLE).toEqual(64);
    });

  it('should close the modal and save the subtopicId', function() {
    ctrl.subtopicTitle = 'Subtopic1';
    ctrl.subtopicId = 1;
    ctrl.save();
    expect($uibModalInstance.close).toHaveBeenCalledWith(1);
  });

  it('should show schema editor', function() {
    expect(ctrl.schemaEditorIsShown).toEqual(false);
    ctrl.showSchemaEditor();
    expect(ctrl.schemaEditorIsShown).toEqual(true);
  });

  it('should show error message if subtopic name is invalid', function() {
    expect(ctrl.errorMsg).toEqual(null);
    spyOn(
      SubtopicValidationService,
      'checkValidSubtopicName').and.returnValue(false);
    ctrl.subtopicTitle = 'Subtopic1';
    ctrl.save();

    var errorMessage = 'A subtopic with this title already exists';
    expect(ctrl.errorMsg).toEqual(errorMessage);
  });

  it('should show reset the error message', function() {
    expect(ctrl.errorMsg).toEqual(null);
    spyOn(
      SubtopicValidationService,
      'checkValidSubtopicName').and.returnValue(false);
    ctrl.subtopicTitle = 'Subtopic1';
    ctrl.save();

    var errorMessage = 'A subtopic with this title already exists';
    expect(ctrl.errorMsg).toEqual(errorMessage);

    ctrl.resetErrorMsg();
    expect(ctrl.errorMsg).toEqual(null);
  });

  it('should check if subtopic with url fragment exists', function() {
    expect(ctrl.subtopicUrlFragmentExists).toEqual(false);
    spyOn(
      SubtopicValidationService,
      'doesSubtopicWithUrlFragmentExist').and.returnValue(true);
    ctrl.checkSubtopicExistence();
    expect(ctrl.subtopicUrlFragmentExists).toEqual(true);
  });

  it('should return the validity of the subtopic', function() {
    // Fails when all fields are empty.
    ctrl.editableThumbnailFilename = '';
    ctrl.subtopicTitle = '';
    ctrl.htmlData = '';
    ctrl.editableUrlFragment = '';
    expect(ctrl.isSubtopicValid()).toEqual(false);

    // Fails when subtopicTitle is empty but other fields are valid.
    ctrl.htmlData = 'Subtopic description';
    ctrl.editableThumbnailFilename = 'img_316_512.svg';
    ctrl.editableUrlFragment = 'subtopic-url';
    expect(ctrl.isSubtopicValid()).toEqual(false);

    // Fails when editableThumbnailFilename is empty but other fields
    // are valid.
    ctrl.editableThumbnailFilename = '';
    ctrl.subtopicTitle = 'Subtopic1';
    expect(ctrl.isSubtopicValid()).toEqual(false);

    // Fails when htmlData is empty but other fields are valid.
    ctrl.htmlData = '';
    ctrl.editableThumbnailFilename = 'img_316_512.svg';
    expect(ctrl.isSubtopicValid()).toEqual(false);

    // Fails when editableUrlFragment is empty but other fields are valid.
    ctrl.htmlData = 'Subtopic description';
    ctrl.editableUrlFragment = '';
    expect(ctrl.isSubtopicValid()).toEqual(false);

    // Fails when editableUrlFragment contains an invalid character.
    ctrl.editableUrlFragment = 'ABC 123';
    expect(ctrl.isSubtopicValid()).toEqual(false);

    // Fails when only editableThumbnailFilename and subtopicTitle are
    // valid but others are empty.
    ctrl.editableThumbnailFilename = 'img_316_512.svg';
    ctrl.subtopicTitle = 'Subtopic1';
    ctrl.htmlData = '';
    ctrl.editableUrlFragment = '';
    expect(ctrl.isSubtopicValid()).toEqual(false);

    // Fails when only editableThumbnailFilename and htmlData are
    // valid but others are empty.
    ctrl.editableThumbnailFilename = 'img_316_512.svg';
    ctrl.subtopicTitle = '';
    ctrl.htmlData = 'Subtopic description';
    ctrl.editableUrlFragment = '';
    expect(ctrl.isSubtopicValid()).toEqual(false);

    // Fails when only editableThumbnailFilename and editableUrlFragment are
    // valid but others are empty.
    ctrl.editableThumbnailFilename = 'img_316_512.svg';
    ctrl.subtopicTitle = '';
    ctrl.htmlData = '';
    ctrl.editableUrlFragment = 'subtopic-url';
    expect(ctrl.isSubtopicValid()).toEqual(false);

    // Fails when only subtopicTitle and htmlData are
    // valid but others are empty.
    ctrl.editableThumbnailFilename = '';
    ctrl.subtopicTitle = 'Subtopic1';
    ctrl.htmlData = 'Subtopic description';
    ctrl.editableUrlFragment = '';
    expect(ctrl.isSubtopicValid()).toEqual(false);

    // Fails when only subtopicTitle and editableUrlFragment are
    // valid but others are empty.
    ctrl.editableThumbnailFilename = '';
    ctrl.subtopicTitle = 'Subtopic1';
    ctrl.htmlData = '';
    ctrl.editableUrlFragment = 'subtopic-url';
    expect(ctrl.isSubtopicValid()).toEqual(false);

    // Fails when only htmlData and editableUrlFragment are
    // valid but others are empty.
    ctrl.editableThumbnailFilename = '';
    ctrl.subtopicTitle = '';
    ctrl.htmlData = 'Subtopic description';
    ctrl.editableUrlFragment = 'subtopic-url';
    expect(ctrl.isSubtopicValid()).toEqual(false);

    // Fails validation if only subtopicTitle is valid.
    ctrl.subtopicTitle = 'Subtopic1';
    ctrl.htmlData = '';
    ctrl.editableThumbnailFilename = '';
    ctrl.editableUrlFragment = '';
    expect(ctrl.isSubtopicValid()).toEqual(false);

    // Fails validation if only htmlData is valid.
    ctrl.subtopicTitle = '';
    ctrl.htmlData = 'Subtopic description';
    ctrl.editableThumbnailFilename = '';
    ctrl.editableUrlFragment = '';
    expect(ctrl.isSubtopicValid()).toEqual(false);

    // Fails validation if only editableThumbnailFilename is valid.
    ctrl.subtopicTitle = '';
    ctrl.htmlData = '';
    ctrl.editableThumbnailFilename = 'img_316_512.svg';
    ctrl.editableUrlFragment = '';
    expect(ctrl.isSubtopicValid()).toEqual(false);

    // Fails validation if only editableUrlFragment is valid.
    ctrl.subtopicTitle = '';
    ctrl.htmlData = '';
    ctrl.editableThumbnailFilename = '';
    ctrl.editableUrlFragment = 'subtopic-url';
    expect(ctrl.isSubtopicValid()).toEqual(false);

    // Passes validation when all fields are valid.
    ctrl.subtopicTitle = 'Subtopic1';
    ctrl.htmlData = 'Subtopic description';
    ctrl.editableThumbnailFilename = 'img_316_512.svg';
    ctrl.editableUrlFragment = 'subtopic-url';
    expect(ctrl.isSubtopicValid()).toEqual(true);
  });

  it('should dismiss the modal on cancel', function() {
    ctrl.cancel();
    expect($uibModalInstance.dismiss).toHaveBeenCalledWith('cancel');
  });

  it('should update the subtopic thumbnail filename', function() {
    expect(ctrl.editableThumbnailFilename).toEqual('');
    ctrl.updateSubtopicThumbnailFilename('img_512.svg');
    expect(ctrl.editableThumbnailFilename).toEqual('img_512.svg');
  });

  it('should update the subtopic thumbnail bg color', function() {
    expect(ctrl.editableThumbnailBgColor).toEqual('');
    ctrl.updateSubtopicThumbnailBgColor('#FFFFFF');
    expect(ctrl.editableThumbnailBgColor).toEqual('#FFFFFF');
  });
});
