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
import { UpgradedServices } from 'services/UpgradedServices';
// ^^^ This block is to be removed.

describe('Create new topic modal', function() {
  beforeEach(angular.mock.module('oppia'));

  beforeEach(angular.mock.module('oppia', function($provide) {
    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));

  var $scope = null;
  var $uibModalInstance = null;
  var NewlyCreatedTopicObjectFactory = null;
  var ImageLocalStorageService = null;
  beforeEach(angular.mock.inject(function($injector, $controller) {
    var $rootScope = $injector.get('$rootScope');

    $uibModalInstance = jasmine.createSpyObj(
      '$uibModalInstance', ['close', 'dismiss']);
    NewlyCreatedTopicObjectFactory =
        $injector.get('NewlyCreatedTopicObjectFactory');
    $scope = $rootScope.$new();
    ImageLocalStorageService = $injector.get('ImageLocalStorageService');

    spyOn(ImageLocalStorageService, 'getStoredImagesData').and.returnValue(
      [{filename: 'a', image: 'faf'}]);

    $controller('CreateNewTopicModalController', {
      $scope: $scope,
      $uibModalInstance: $uibModalInstance,
      ImageLocalStorageService: ImageLocalStorageService
    });
  }));


  it('should init the variables', function() {
    var newlyCreatedTopic = NewlyCreatedTopicObjectFactory.createDefault();
    expect($scope.newlyCreatedTopic).toEqual(newlyCreatedTopic);
    expect($scope.MAX_CHARS_IN_TOPIC_NAME).toEqual(39);
    expect($scope.MAX_CHARS_IN_TOPIC_DESCRIPTION).toEqual(240);
    expect($scope.allowedBgColors).toEqual(['#C6DCDA']);
  });

  it('should close modal with newlyCreatedTopic', function() {
    var newlyCreatedTopic = NewlyCreatedTopicObjectFactory.createDefault();
    $scope.save();
    expect($uibModalInstance.close).toHaveBeenCalledWith(newlyCreatedTopic);
  });

  it('should return whether the topic is valid', function() {
    var newlyCreatedTopic = NewlyCreatedTopicObjectFactory.createDefault();
    expect($scope.isValid()).toEqual(false);
    newlyCreatedTopic.name = 'name';
    newlyCreatedTopic.description = 'description';
    $scope.newlyCreatedTopic = newlyCreatedTopic;
    expect($scope.isValid()).toEqual(true);
  });

  it('should cancel the modal on dismiss', function() {
    $scope.cancel();
    expect($uibModalInstance.dismiss).toHaveBeenCalledWith('cancel');
  });
});
