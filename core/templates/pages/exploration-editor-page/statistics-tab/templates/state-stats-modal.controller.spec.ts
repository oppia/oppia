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
 * @fileoverview Unit tests for StateStatsModalController.
 */

// TODO(#7222): Remove the following block of unnnecessary imports once
// file is upgraded to Angular 8.
import { UpgradedServices } from 'services/UpgradedServices';
// ^^^ This block is to be removed.

describe('State Stats Modal Controller', function() {
  var $scope = null;
  var $uibModalInstance = null;
  var RouterService = null;

  var improvementType = '';
  var stateName = 'State 1';
  var stateStats = {
    useful_feedback_count: 0,
    total_answers_count: 10,
    num_times_solution_viewed: 4
  };
  var stateStatsModalIsOpen = true;
  var visualizationsInfo = [{
    data: 'Hola',
    options: 'Options',
    id: '1',
    addressed_info_is_supported: true
  }];

  beforeEach(angular.mock.module('oppia', function($provide) {
    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));

  beforeEach(angular.mock.inject(function($injector, $controller) {
    var $rootScope = $injector.get('$rootScope');
    RouterService = $injector.get('RouterService');

    $uibModalInstance = jasmine.createSpyObj(
      '$uibModalInstance', ['close', 'dismiss']);

    $scope = $rootScope.$new();
    $controller('StateStatsModalController', {
      $scope: $scope,
      $uibModalInstance: $uibModalInstance,
      improvementType: improvementType,
      stateName: stateName,
      stateStats: stateStats,
      stateStatsModalIsOpen: stateStatsModalIsOpen,
      visualizationsInfo: visualizationsInfo,
    });
  }));

  it('should init the variables', function() {
    expect($scope.stateName).toBe(stateName);
    expect($scope.stateStats).toEqual(stateStats);
    expect($scope.improvementType).toBe(improvementType);
    expect($scope.visualizationsInfo).toEqual(visualizationsInfo);
  });

  it('should successfully navigate to state editor', function() {
    spyOn(RouterService, 'navigateToMainTab').and.callThrough();
    $scope.navigateToStateEditor();

    expect($uibModalInstance.dismiss).toHaveBeenCalledWith('cancel');
    expect(RouterService.navigateToMainTab).toHaveBeenCalledWith(stateName);
  });
});
