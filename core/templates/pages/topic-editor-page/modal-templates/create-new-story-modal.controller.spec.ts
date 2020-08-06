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
import { angularServices } from 'pages/../angular-services.index';
import { NewlyCreatedStoryObjectFactory } from
  'domain/topic/NewlyCreatedStoryObjectFactory';
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

const CONSTANTS = require('constants.ts');

describe('Create New Story Modal Controller', function() {
  var $scope = null;
  var $uibModalInstance = null;
  var ImageLocalStorageService = null;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
  });

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.module('oppia', function($provide) {
    for (let servicePair of angularServices) {
      $provide.value(
        servicePair[0], TestBed.get(servicePair[1]));
    }
    $provide.value(
      'NewlyCreatedStoryObjectFactory', new NewlyCreatedStoryObjectFactory());
  }));

  beforeEach(angular.mock.inject(function($injector, $controller) {
    var $rootScope = $injector.get('$rootScope');

    $uibModalInstance = jasmine.createSpyObj(
      '$uibModalInstance', ['close', 'dismiss']);
    ImageLocalStorageService = $injector.get('ImageLocalStorageService');

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

  it('should check if the story is valid', function() {
    expect($scope.isValid()).toBe(false);

    $scope.story.title = 'title';
    expect($scope.isValid()).toBe(false);

    $scope.story.description = 'description';
    expect($scope.isValid()).toBe(true);

    $scope.story.title = '';
    expect($scope.isValid()).toBe(false);
  });
});
