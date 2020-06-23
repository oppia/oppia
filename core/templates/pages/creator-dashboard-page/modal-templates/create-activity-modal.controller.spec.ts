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
 * @fileoverview Unit tests for CreateActivityModalController.
 */

// TODO(#7222): Remove the following block of unnnecessary imports once
// file is upgraded to Angular 8.
import { UpgradedServices } from 'services/UpgradedServices';
// ^^^ This block is to be removed.

describe('Create Activity Modal Controller', function() {
  var $q = null;
  var $scope = null;
  var $uibModalInstance = null;
  var CollectionCreationService = null;
  var ExplorationCreationService = null;
  var UserService = null;

  var userInfo = {
    canCreateCollections: () => true
  };

  beforeEach(angular.mock.module('oppia', function($provide) {
    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));

  beforeEach(angular.mock.inject(function($injector, $controller) {
    $q = $injector.get('$q');
    var $rootScope = $injector.get('$rootScope');
    CollectionCreationService = $injector.get('CollectionCreationService');
    ExplorationCreationService = $injector.get('ExplorationCreationService');
    UserService = $injector.get('UserService');

    $uibModalInstance = jasmine.createSpyObj(
      '$uibModalInstance', ['close', 'dismiss']);

    spyOn(UserService, 'getUserInfoAsync').and.returnValue(
      $q.resolve(userInfo));

    $scope = $rootScope.$new();
    $controller('CreateActivityModalController', {
      $scope: $scope,
      $uibModalInstance: $uibModalInstance,
    });
    $scope.$apply();
  }));

  it('should check properties set after controller is initialized', function() {
    expect($scope.canCreateCollections).toEqual(true);
    expect($scope.explorationImgUrl).toBe(
      '/assets/images/activity/exploration.svg');
    expect($scope.collectionImgUrl).toBe(
      '/assets/images/activity/collection.svg');
  });

  it('should create new exploration', function() {
    spyOn(ExplorationCreationService, 'createNewExploration').and.callThrough();
    $scope.chooseExploration();
    expect(ExplorationCreationService.createNewExploration).toHaveBeenCalled();
    expect($uibModalInstance.close).toHaveBeenCalled();
  });

  it('should create new collection', function() {
    spyOn(CollectionCreationService, 'createNewCollection').and.callThrough();
    $scope.chooseCollection();
    expect(CollectionCreationService.createNewCollection).toHaveBeenCalled();
    expect($uibModalInstance.close).toHaveBeenCalled();
  });
});
