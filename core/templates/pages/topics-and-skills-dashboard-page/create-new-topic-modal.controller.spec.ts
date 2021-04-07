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
 * @fileoverview Unit tests for the create new topic modal controller.
 */

// TODO(#7222): Remove the following block of unnnecessary imports once
// the code corresponding to the spec is upgraded to Angular 8.
import { importAllAngularServices } from 'tests/unit-test-utils';
// ^^^ This block is to be removed.

import { NewlyCreatedTopic } from
  'domain/topics_and_skills_dashboard/newly-created-topic.model';

describe('Create new topic modal', function() {
  importAllAngularServices();

  beforeEach(angular.mock.module('oppia'));

  var $scope = null;
  var $uibModalInstance = null;
  var ImageLocalStorageService = null;
  var TopicEditorStateService = null;
  beforeEach(angular.mock.inject(function($injector, $controller) {
    var $rootScope = $injector.get('$rootScope');

    $uibModalInstance = jasmine.createSpyObj(
      '$uibModalInstance', ['close', 'dismiss']);
    $scope = $rootScope.$new();
    ImageLocalStorageService = $injector.get('ImageLocalStorageService');
    TopicEditorStateService = $injector.get('TopicEditorStateService');

    spyOn(ImageLocalStorageService, 'getStoredImagesData').and.returnValue(
      [{filename: 'a', image: 'faf'}]);

    $controller('CreateNewTopicModalController', {
      $scope: $scope,
      $uibModalInstance: $uibModalInstance,
      ImageLocalStorageService: ImageLocalStorageService
    });
  }));


  it('should check properties set after controller is initialized', function() {
    var newlyCreatedTopic = NewlyCreatedTopic.createDefault();
    expect($scope.newlyCreatedTopic).toEqual(newlyCreatedTopic);
    expect($scope.MAX_CHARS_IN_TOPIC_NAME).toEqual(39);
    expect($scope.MAX_CHARS_IN_TOPIC_DESCRIPTION).toEqual(240);
    expect($scope.allowedBgColors).toEqual(['#C6DCDA']);
  });

  it('should close modal with newlyCreatedTopic', function() {
    var newlyCreatedTopic = NewlyCreatedTopic.createDefault();
    $scope.save();
    expect($uibModalInstance.close).toHaveBeenCalledWith(newlyCreatedTopic);
  });

  it('should return whether the topic is valid', function() {
    var newlyCreatedTopic = NewlyCreatedTopic.createDefault();
    expect($scope.isValid()).toEqual(false);
    newlyCreatedTopic.name = 'name';
    newlyCreatedTopic.urlFragment = 'url-fragment';
    newlyCreatedTopic.description = 'description';
    $scope.newlyCreatedTopic = newlyCreatedTopic;
    expect($scope.isValid()).toEqual(true);
  });

  it('should cancel the modal on dismiss', function() {
    $scope.cancel();
    expect($uibModalInstance.dismiss).toHaveBeenCalledWith('cancel');
  });

  it('should check if url fragment already exists', function() {
    spyOn(
      TopicEditorStateService,
      'updateExistenceOfTopicUrlFragment').and.callFake(
      (urlFragment, callback) => callback());
    spyOn(
      TopicEditorStateService,
      'getTopicWithUrlFragmentExists').and.returnValue(true);
    expect($scope.topicUrlFragmentExists).toBeFalse();
    $scope.newlyCreatedTopic.urlFragment = 'test-url';
    $scope.onTopicUrlFragmentChange();
    expect($scope.topicUrlFragmentExists).toBeTrue();
  });

  it('should not update topic url fragment existence for empty url fragment',
    function() {
      spyOn(TopicEditorStateService, 'updateExistenceOfTopicUrlFragment');
      $scope.newlyCreatedTopic.urlFragment = '';
      $scope.onTopicUrlFragmentChange();
      expect(
        TopicEditorStateService.updateExistenceOfTopicUrlFragment
      ).not.toHaveBeenCalled();
    });

  it('should check if topic name already exists', function() {
    spyOn(
      TopicEditorStateService,
      'updateExistenceOfTopicName').and.callFake(
      (urlFragment, callback) => callback());
    spyOn(
      TopicEditorStateService,
      'getTopicWithNameExists').and.returnValue(true);
    expect($scope.topicNameExists).toBeFalse();
    $scope.newlyCreatedTopic.name = 'test';
    $scope.onTopicNameChange();
    expect($scope.topicNameExists).toBeTrue();
  });

  it('should not call updateExistenceOfTopicName for empty url fragment',
    function() {
      spyOn(TopicEditorStateService, 'updateExistenceOfTopicName');
      $scope.newlyCreatedTopic.name = '';
      $scope.onTopicNameChange();
      expect(
        TopicEditorStateService.updateExistenceOfTopicName
      ).not.toHaveBeenCalled();
    });
});
