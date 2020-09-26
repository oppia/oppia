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
 * @fileoverview Unit tests for ConfirmDeleteStateModalController.
 */

describe('Confirm Delete State Modal Controller', function() {
  var $scope = null;
  var $uibModalInstance = null;

  var deleteStateName = 'Introduction';

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.inject(function($injector, $controller) {
    var $rootScope = $injector.get('$rootScope');

    $uibModalInstance = jasmine.createSpyObj(
      '$uibModalInstance', ['close', 'dismiss']);

    $scope = $rootScope.$new();
    $controller('ConfirmDeleteStateModalController', {
      $scope: $scope,
      $uibModalInstance: $uibModalInstance,
      deleteStateName: deleteStateName
    });
  }));

  it('should initialize $scope properties after controller is initialized',
    function() {
      expect($scope.deleteStateWarningText).toBe(
        'Are you sure you want to delete the card "Introduction"?');
    });
});
