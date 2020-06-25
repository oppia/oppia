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
 * @fileoverview Unit tests for LearnerDashboardSuggestionModalController.
 */

import { UpgradedServices } from 'services/UpgradedServices';

describe('Learner Dashboard Suggestion Modal Controller', function() {
  var $scope = null;
  var $uibModalInstance = null;
  var description = 'This is a description string';
  var newContent = 'new content';
  var oldContent = 'old content';

  beforeEach(angular.mock.module('oppia', function($provide) {
    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));
  beforeEach(angular.mock.inject(function($injector, $controller) {
    var $rootScope = $injector.get('$rootScope');

    $uibModalInstance = jasmine.createSpyObj(
      '$uibModalInstance', ['close', 'dismiss']);

    $scope = $rootScope.$new();
    $controller('LearnerDashboardSuggestionModalController', {
      $scope: $scope,
      $uibModalInstance: $uibModalInstance,
      description: description,
      newContent: newContent,
      oldContent: oldContent
    });
  }));

  it('should init the variables', function() {
    expect($scope.newContent).toBe(newContent);
    expect($scope.oldContent).toBe(oldContent);
    expect($scope.description).toBe(description);
  });

  it('should cancel the modal on canceling suggestion modal', function() {
    $scope.cancel();
    expect($uibModalInstance.dismiss).toHaveBeenCalledWith('cancel');
  });
});
