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
 * @fileoverview Unit tests for CreateNewStoryModalController.
 */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { EditableStoryBackendApiService } from
  'domain/story/editable-story-backend-api.service';
import { importAllAngularServices } from 'tests/unit-test-utils.ajs';

import CONSTANTS from 'assets/constants';

describe('Create New Story Modal Controller', function() {
  var $scope = null;
  var $uibModalInstance = null;
  var ImageLocalStorageService = null;
  var StoryEditorStateService = null;

  importAllAngularServices();

  beforeEach(angular.mock.module('oppia'));

  importAllAngularServices();

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [EditableStoryBackendApiService]
    });
  });
  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value(
      'EditableStoryBackendApiService',
      TestBed.get(EditableStoryBackendApiService));
  }));

  beforeEach(angular.mock.inject(function($injector, $controller) {
    var $rootScope = $injector.get('$rootScope');

    $uibModalInstance = jasmine.createSpyObj(
      '$uibModalInstance', ['close', 'dismiss']);
    ImageLocalStorageService = $injector.get('ImageLocalStorageService');
    StoryEditorStateService = $injector.get('StoryEditorStateService');

    spyOn(ImageLocalStorageService, 'getStoredImagesData').and.returnValue(
      [{filename: 'a.png', image: 'faf'}]);

    $scope = $rootScope.$new();
    $controller('CreateNewStoryModalController', {
      $scope: $scope,
      $uibModalInstance: $uibModalInstance,
      ImageLocalStorageService: ImageLocalStorageService
    });
  }));

  it('should check if properties was initialized correctly', function() {
    expect($scope.story.title).toBe('');
    expect($scope.story.description).toBe('');
    expect($scope.MAX_CHARS_IN_STORY_TITLE).toBe(
      CONSTANTS.MAX_CHARS_IN_STORY_TITLE);
  });

  it('should check if url fragment already exists', function() {
    spyOn(
      StoryEditorStateService,
      'updateExistenceOfStoryUrlFragment').and.callFake(
      (urlFragment, callback) => callback());
    spyOn(
      StoryEditorStateService,
      'getStoryWithUrlFragmentExists').and.returnValue(true);
    expect($scope.storyUrlFragmentExists).toBeFalse();
    $scope.story.urlFragment = 'test-url';
    $scope.onStoryUrlFragmentChange();
    expect($scope.storyUrlFragmentExists).toBeTrue();
  });

  it('should not update story url fragment existence for empty url fragment',
    function() {
      spyOn(StoryEditorStateService, 'updateExistenceOfStoryUrlFragment');
      $scope.story.urlFragment = '';
      $scope.onStoryUrlFragmentChange();
      expect(
        StoryEditorStateService.updateExistenceOfStoryUrlFragment
      ).not.toHaveBeenCalled();
    });

  it('should check if the story is valid', function() {
    expect($scope.isValid()).toBe(false);

    $scope.story.title = 'title';
    expect($scope.isValid()).toBe(false);

    $scope.story.description = 'description';
    expect($scope.isValid()).toBe(false);

    $scope.story.urlFragment = '';
    expect($scope.isValid()).toBe(false);

    $scope.story.urlFragment = 'ABC 123';
    expect($scope.isValid()).toBe(false);

    $scope.story.urlFragment = 'valid-url';
    expect($scope.isValid()).toBe(true);

    $scope.story.title = '';
    expect($scope.isValid()).toBe(false);
  });

  it ('should update View when thumbnail has been uploaded', function() {
    $scope.updateView();
  });
});
