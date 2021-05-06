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
 * @fileoverview Unit tests for ExplorationSaveModalController.
 */

describe('Exploration Save Modal Controller', function() {
  var $scope = null;
  var $uibModalInstance = null;
  var SiteAnalyticsService = null;

  var diffData = 'exp1';
  var isExplorationPrivate = true;

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.inject(function($injector, $controller) {
    var $rootScope = $injector.get('$rootScope');

    $uibModalInstance = jasmine.createSpyObj(
      '$uibModalInstance', ['close', 'dismiss']);

    spyOnAllFunctions(SiteAnalyticsService);

    $scope = $rootScope.$new();
    $controller('ExplorationSaveModalController', {
      $scope: $scope,
      $uibModalInstance: $uibModalInstance,
      diffData: diffData,
      isExplorationPrivate: isExplorationPrivate
    });
  }));

  it('should initialize $scope properties after controller is initialized',
    function() {
      expect($scope.showDiff).toBe(false);
      expect($scope.diffData).toBe(diffData);
      expect($scope.isExplorationPrivate).toBe(isExplorationPrivate);
      expect($scope.earlierVersionHeader).toBe('Last saved');
      expect($scope.laterVersionHeader).toBe('New changes');
    });

  it('should toggle exploration diff visibility when clicking on toggle diff' +
    ' button', function() {
    expect($scope.showDiff).toBe(false);
    $scope.onClickToggleDiffButton();
    expect($scope.showDiff).toBe(true);
    $scope.onClickToggleDiffButton();
    expect($scope.showDiff).toBe(false);
  });
});
