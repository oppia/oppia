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
 * @fileoverview Unit tests for SubtopicEditorModalController.
 */

describe('Subtopic Editor Modal Controller', function() {
  var $scope = null;
  var $uibModalInstance = null;
  var SubtopicPageObjectFactory = null;
  var SubtopicObjectFactory = null;
  var TopicEditorStateService = null;

  var subtopic = null;
  var subtopicTitles = [
    'Subtopic 1 Title', 'Subtopic 2 Title', 'Subtopic 3 Title'];
  var editableTitle = '';
  var editableThumbnailFilename = 'filename2.jpg';
  var editableThumbnailBgColor = '#fff';
  var subtopicPage = null;
  var subtopicDict = {
    id: 'sub1',
    title: 'Subtopic 1 Title',
    skill_ids: [],
    thumbnail_filename: 'filename1.jpg',
    thumbnail_bg_color: '#000'
  };
  var getSubtopicPageSpy = null;

  beforeEach(angular.mock.module('oppia'));

  beforeEach(angular.mock.inject(function($injector, $controller) {
    var $rootScope = $injector.get('$rootScope');
    SubtopicPageObjectFactory = $injector.get('SubtopicPageObjectFactory');
    SubtopicObjectFactory = $injector.get('SubtopicObjectFactory');
    TopicEditorStateService = $injector.get('TopicEditorStateService');

    getSubtopicPageSpy = spyOn(TopicEditorStateService, 'getSubtopicPage');

    $uibModalInstance = jasmine.createSpyObj(
      '$uibModalInstance', ['close', 'dismiss']);

    subtopic = SubtopicObjectFactory.create(subtopicDict, {});

    subtopicPage = SubtopicPageObjectFactory.createDefault(
      'topic1', 'sub1');
    getSubtopicPageSpy.and.returnValue(subtopicPage);

    $scope = $rootScope.$new();
    $controller('SubtopicEditorModalController', {
      $scope: $scope,
      $uibModalInstance: $uibModalInstance,
      editableThumbnailBgColor: editableThumbnailBgColor,
      editableThumbnailFilename: editableThumbnailFilename,
      editableTitle: editableTitle,
      subtopic: subtopic,
      subtopicTitles: subtopicTitles
    });
  }));

  it('should evaluate initialized properties', function() {
    expect($scope.subtopicId).toBe('sub1');
    expect($scope.subtopicTitles).toEqual(subtopicTitles);
    expect($scope.editableTitle).toEqual(editableTitle);
    expect($scope.editableThumbnailFilename).toEqual(editableThumbnailFilename);
    expect($scope.editableThumbnailBgColor).toEqual(editableThumbnailBgColor);
    expect($scope.subtopicPage).toEqual(subtopicPage);

    expect($scope.htmlData).toBe('');
    expect($scope.errorMsg).toBe(null);
  });

  it('should get subtopic page contents when page is loaded', function() {
    expect($scope.htmlData).toBe('');

    subtopicPage = SubtopicPageObjectFactory.createFromBackendDict({
      id: 'sub2',
      topic_id: 'topic1',
      page_contents: {
        subtitled_html: {
          content_id: '',
          html: 'This is a html'
        },
        recorded_voiceovers: {
          voiceovers_mapping: {}
        }
      },
      language_code: 'en'
    });
    getSubtopicPageSpy.and.returnValue(
      subtopicPage);
    $scope.$broadcast('subtopicPageLoaded');
    $scope.$apply();

    expect($scope.htmlData).toBe('This is a html');
  });

  it('should not update thumbnail file if it is equal to thumbnail file from' +
    ' subtopic', function() {
    $scope.updateSubtopicThumbnailFilename('filename1.jpg');

    expect($scope.editableThumbnailFilename).toBe('filename2.jpg');
  });

  it('should update thumbnail file if it is not equal to thumbnail file from' +
    ' subtopic', function() {
    $scope.updateSubtopicThumbnailFilename('filename3.jpg');

    expect($scope.editableThumbnailFilename).toBe('filename3.jpg');
  });

  it('should not update thumbnail bg color if it is equal to thumbnail file' +
    ' from subtopic', function() {
    $scope.updateSubtopicThumbnailBgColor('#000');

    expect($scope.editableThumbnailBgColor).toBe('#fff');
  });

  it('should update thumbnail bg color if it is not equal to thumbnail file' +
    ' from subtopic', function() {
    $scope.updateSubtopicThumbnailBgColor('#f00');

    expect($scope.editableThumbnailBgColor).toBe('#f00');
  });

  it('should save a subtopic title after trying to save a subtopic title' +
    ' that was already provided', function() {
    $scope.updateSubtopicTitle('Subtopic 1 Title');
    expect($scope.errorMsg).toBe(null);
    expect($scope.editableTitle).toBe(editableTitle);

    $scope.updateSubtopicTitle('Subtopic 2 Title');
    expect($scope.errorMsg).toBe('A subtopic with this title already exists');
    expect($scope.editableTitle).toBe(editableTitle);

    $scope.resetErrorMsg();

    $scope.updateSubtopicTitle('Subtopic 5 Title');
    expect($scope.errorMsg).toBe(null);
    expect($scope.editableTitle).toBe('Subtopic 5 Title');
  });

  it('should update html data', function() {
    $scope.updateHtmlData('New html');

    expect($scope.subtopicPage.getPageContents().getHtml()).toBe('New html');
  });

  it('should close the modal', function() {
    $scope.save();

    expect($uibModalInstance.close).toHaveBeenCalledWith({
      newTitle: editableTitle,
      newHtmlData: '',
      newThumbnailFilename: editableThumbnailFilename,
      newThumbnailBgColor: editableThumbnailBgColor
    });
  });
});
