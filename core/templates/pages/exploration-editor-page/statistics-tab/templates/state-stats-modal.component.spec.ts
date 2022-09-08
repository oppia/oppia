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
import { importAllAngularServices } from 'tests/unit-test-utils.ajs';
// ^^^ This block is to be removed.

describe('State Stats Modal Controller', function() {
  var $scope = null;
  var $uibModalInstance = null;
  var RouterService = null;

  var stateName = 'State 1';
  var stateStats = {
    usefulFeedbackCount: 0,
    totalAnswersCount: 10,
    numTimesSolutionViewed: 4,
    totalHitCount: 13,
    numCompletions: 8
  };
  var stateStatsModalIsOpen = true;
  var visualizationsInfo = [{
    data: 'Hola',
    options: 'Options',
    id: '1',
    addressed_info_is_supported: true
  }];
  var interactionArgs = {
  };

  importAllAngularServices();

  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value('NgbModal', {
      open: () => {
        return {
          result: Promise.resolve()
        };
      }
    });
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
      interactionArgs: interactionArgs,
      stateName: stateName,
      stateStats: stateStats,
      stateStatsModalIsOpen: stateStatsModalIsOpen,
      visualizationsInfo: visualizationsInfo,
    });
  }));

  it('should initialize $scope properties after controller is initialized',
    function() {
      expect($scope.stateName).toBe(stateName);
      expect($scope.numEnters).toEqual(stateStats.totalHitCount);
      expect($scope.numQuits)
        .toEqual(stateStats.totalHitCount - stateStats.numCompletions);
      expect($scope.interactionArgs).toBe(interactionArgs);
      expect($scope.visualizationsInfo).toEqual(visualizationsInfo);
    });

  it('should navigate to state editor', function() {
    spyOn(RouterService, 'navigateToMainTab').and.callThrough();
    $scope.navigateToStateEditor();

    expect($uibModalInstance.dismiss).toHaveBeenCalledWith('cancel');
    expect(RouterService.navigateToMainTab).toHaveBeenCalledWith(stateName);
  });
});
