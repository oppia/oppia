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
 * @fileoverview Unit tests for explorationGraph.
 */

// TODO(#7222): Remove usage of UpgradedServices once upgraded to Angular 8.
import { importAllAngularServices } from 'tests/unit-test-utils.ajs';

describe('Exploration Graph Component', function() {
  var ctrl = null;
  var $q = null;
  var $rootScope = null;
  var $uibModal = null;
  var alertsService = null;
  var editabilityService = null;
  var explorationStatesService = null;
  var explorationWarningsService = null;
  var loggerService = null;
  var routerService = null;
  var stateEditorService = null;

  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value('NgbModal', {
      open: () => {
        return {
          result: Promise.resolve()
        };
      }
    });
  }));
  importAllAngularServices();
  beforeEach(angular.mock.inject(function($injector, $componentController) {
    $q = $injector.get('$q');
    $rootScope = $injector.get('$rootScope');
    $uibModal = $injector.get('$uibModal');
    alertsService = $injector.get('AlertsService');
    editabilityService = $injector.get('EditabilityService');
    explorationStatesService = $injector.get('ExplorationStatesService');
    explorationWarningsService = $injector.get('ExplorationWarningsService');
    loggerService = $injector.get('LoggerService');
    routerService = $injector.get('RouterService');
    stateEditorService = $injector.get('StateEditorService');

    ctrl = $componentController('explorationGraph', {
      $uibModal: $uibModal,
    });
  }));

  it('should show graph when exploration states service is initialized',
    function() {
      expect(ctrl.isGraphShown()).toBe(false);
      explorationStatesService.init({});
      expect(ctrl.isGraphShown()).toBe(true);
    });

  it('should get name from the active state', function() {
    spyOn(stateEditorService, 'getActiveStateName').and.returnValue(
      'Introduction');
    expect(ctrl.getActiveStateName()).toBe('Introduction');
  });

  it('should get null graph data from graph data service when it is not' +
    ' recomputed', function() {
    expect(ctrl.isGraphShown()).toBe(false);
    expect(ctrl.getGraphData()).toBe(null);
  });

  it('should evaluate if exploration graph is editable', function() {
    var isEditableSpy = spyOn(editabilityService, 'isEditable');
    isEditableSpy.and.returnValue(true);
    expect(ctrl.isEditable()).toBe(true);
    isEditableSpy.and.returnValue(false);
    expect(ctrl.isEditable()).toBe(false);
  });

  it('should open state graph modal', function() {
    var modalOpenSpy = spyOn($uibModal, 'open').and.callThrough();

    ctrl.openStateGraphModal();
    $rootScope.$apply();

    expect(modalOpenSpy).toHaveBeenCalled();
  });

  it('should delete state when closing state graph modal', function() {
    spyOn($uibModal, 'open').and.returnValue({
      result: $q.resolve({
        action: 'delete',
        stateName: 'Introduction'
      })
    });
    spyOn(explorationStatesService, 'deleteState');

    ctrl.openStateGraphModal();
    $rootScope.$apply();

    expect(explorationStatesService.deleteState).toHaveBeenCalledWith(
      'Introduction');
  });

  it('should navigate to main tab when closing state graph modal',
    function() {
      spyOn($uibModal, 'open').and.returnValue({
        result: $q.resolve({
          action: 'navigate',
          stateName: 'Introduction'
        })
      });
      spyOn(routerService, 'navigateToMainTab');

      ctrl.openStateGraphModal();
      $rootScope.$apply();

      expect(routerService.navigateToMainTab).toHaveBeenCalledWith(
        'Introduction');
    });

  it('should handle invalid actions when state graph modal is opened',
    function() {
      spyOn($uibModal, 'open').and.returnValue({
        result: $q.resolve({
          action: 'add',
          stateName: 'Introduction'
        })
      });
      spyOn(loggerService, 'error');

      ctrl.openStateGraphModal();
      $rootScope.$apply();

      expect(loggerService.error).toHaveBeenCalledWith(
        'Invalid closeDict action: add');
    });

  it('should dismiss state graph modal', function() {
    spyOn($uibModal, 'open').and.returnValue({
      result: $q.reject()
    });
    spyOn(alertsService, 'clearWarnings');

    ctrl.openStateGraphModal();
    $rootScope.$apply();

    expect(alertsService.clearWarnings).toHaveBeenCalled();
  });

  it('should return checkpoint count', function() {
    spyOn(explorationStatesService, 'getCheckpointCount').and.returnValue(5);

    expect(ctrl.getCheckpointCount()).toEqual(5);
  });

  it('should return checkpoint count warning', function() {
    spyOn(explorationWarningsService, 'getCheckpointCountWarning').and
      .returnValue('Only a maximum of 8 checkpoints are allowed per lesson.');

    expect(ctrl.showCheckpointCountWarningSign()).toEqual(
      'Only a maximum of 8 checkpoints are allowed per lesson.');
    expect(ctrl.checkpointCountWarning).toEqual(
      'Only a maximum of 8 checkpoints are allowed per lesson.');
  });
});
