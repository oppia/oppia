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
 * @fileoverview Unit tests for ConfirmOrCancelModalController.
 */

describe('Confirm Or Cancel Modal Controller', function() {
  var $scope = null;
  var $uibModalInstance = null;

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.inject(function($injector, $controller) {
    var $rootScope = $injector.get('$rootScope');

    $uibModalInstance = jasmine.createSpyObj(
      '$uibModalInstance', ['close', 'dismiss']);

    $scope = $rootScope.$new();
    $controller('ConfirmOrCancelModalController', {
      $scope: $scope,
      $uibModalInstance: $uibModalInstance,
    });
  }));

  it('should close modal with the correct value', function() {
    var message = 'closing';
    $scope.confirm(message);
    expect($uibModalInstance.close).toHaveBeenCalledWith(message);
  });

  it('should dismiss modal', function() {
    $scope.cancel();
    expect($uibModalInstance.dismiss).toHaveBeenCalledWith('cancel');
  });

  it('should dismiss modal with the correct value', function() {
    var message = 'canceling';
    $scope.cancel(message);
    expect($uibModalInstance.dismiss).toHaveBeenCalledWith(message);
  });
});
