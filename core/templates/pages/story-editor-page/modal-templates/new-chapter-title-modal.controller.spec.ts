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
 * @fileoverview Unit tests for NewChapterTitleModalController.
 */

describe('New Chapter Title Modal Controller', function() {
  var $scope = null;
  var $uibModalInstance = null;
  var nodeTitles = ['title 1', 'title 2', 'title 3'];

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.inject(function($injector, $controller) {
    var $rootScope = $injector.get('$rootScope');

    $uibModalInstance = jasmine.createSpyObj(
      '$uibModalInstance', ['close', 'dismiss']);

    $scope = $rootScope.$new();
    $controller('NewChapterTitleModalController', {
      $scope: $scope,
      $uibModalInstance: $uibModalInstance,
      nodeTitles: nodeTitles
    });
  }));

  it('should init the variables', function() {
    expect($scope.nodeTitle).toBe('');
    expect($scope.nodeTitles).toEqual(nodeTitles);
    expect($scope.errorMsg).toBe(null);
  });

  it('should check if node title is empty', function() {
    expect($scope.isNodeTitleEmpty('')).toBe(true);
    expect($scope.isNodeTitleEmpty('abc')).toBe(false);
  });

  it('should not close modal when title is already being used', function() {
    expect($scope.errorMsg).toBe(null);
    $scope.save('title 1');
    expect($scope.errorMsg).toBe('A chapter with this title already exists');
    expect($uibModalInstance.close).not.toHaveBeenCalled();
    $scope.resetErrorMsg();
    expect($scope.errorMsg).toBe(null);
  });

  it('should close modal when title is not being used', function() {
    expect($scope.errorMsg).toBe(null);
    $scope.save('title 4');
    expect($scope.errorMsg).toBe(null);
    expect($uibModalInstance.close).toHaveBeenCalledWith('title 4');
  });
});
