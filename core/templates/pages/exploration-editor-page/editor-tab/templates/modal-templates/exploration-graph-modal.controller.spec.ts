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
 * @fileoverview Unit tests for ExplorationGraphModalController.
 */

describe('Exploration Graph Modal Controller', function() {
  var $scope = null;
  var $uibModalInstance = null;
  var GraphDataService = null;
  var StateEditorService = null;

  var isEditable = true;
  var graphData = {};
  var stateName = 'Introduction';

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.inject(function($injector, $controller) {
    var $rootScope = $injector.get('$rootScope');
    GraphDataService = $injector.get('GraphDataService');
    StateEditorService = $injector.get('StateEditorService');

    $uibModalInstance = jasmine.createSpyObj(
      '$uibModalInstance', ['close', 'dismiss']);

    spyOn(GraphDataService, 'getGraphData').and.returnValue(graphData);
    spyOn(StateEditorService, 'getActiveStateName').and.returnValue(stateName);

    $scope = $rootScope.$new();
    $controller('ExplorationGraphModalController', {
      $scope: $scope,
      $uibModalInstance: $uibModalInstance,
      isEditable: isEditable
    });
  }));

  it('should evaluate scope variable values correctly', function() {
    expect($scope.currentStateName).toBe(stateName);
    expect($scope.graphData).toEqual(graphData);
    expect($scope.isEditable).toBe(isEditable);
  });

  it('should delete state', function() {
    var stateName = 'State Name';
    $scope.deleteState(stateName);

    expect($uibModalInstance.close).toHaveBeenCalledWith({
      action: 'delete',
      stateName: stateName
    });
  });

  it('should select state', function() {
    var stateName = 'State Name';
    $scope.selectState(stateName);

    expect($uibModalInstance.close).toHaveBeenCalledWith({
      action: 'navigate',
      stateName: stateName
    });
  });
});
