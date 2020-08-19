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
import { UpgradedServices } from 'services/UpgradedServices';

describe('Exploration Graph Component', function() {
  var ctrl = null;
  var $q = null;
  var $rootScope = null;
  var $uibModal = null;
  var alertsService = null;
  var editabilityService = null;
  var explorationStatesService = null;
  var loggerService = null;
  var routerService = null;
  var stateEditorService = null;

  beforeEach(angular.mock.module('oppia', function($provide) {
    const ugs = new UpgradedServices();
    for (const [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));
  beforeEach(angular.mock.inject(function($injector, $componentController) {
    $q = $injector.get('$q');
    $rootScope = $injector.get('$rootScope');
    $uibModal = $injector.get('$uibModal');
    alertsService = $injector.get('AlertsService');
    editabilityService = $injector.get('EditabilityService');
    explorationStatesService = $injector.get('ExplorationStatesService');
    loggerService = $injector.get('LoggerService');
    routerService = $injector.get('RouterService');
    stateEditorService = $injector.get('StateEditorService');

    ctrl = $componentController('explorationGraph', {
      $uibModal: $uibModal,
    });
  }));

  it('should evaluate when exploration states service is initialized to' +
    ' show graph', function() {
    expect(ctrl.isGraphShown()).toBe(false);
    explorationStatesService.init({});
    expect(ctrl.isGraphShown()).toBe(true);
  });

  it('should evaluate active state name', function() {
    spyOn(stateEditorService, 'getActiveStateName').and.returnValue(
      'Introduction');
    expect(ctrl.getActiveStateName()).toBe('Introduction');
  });

  it('should get null graph data from graph data service when it is not' +
    ' recomputed', function() {
    expect(ctrl.getGraphData()).toBe(null);
  });

  it('should evaluate when exploration graph is editable', function() {
    var isEditableSpy = spyOn(editabilityService, 'isEditable');
    isEditableSpy.and.returnValue(true);
    expect(ctrl.isEditable()).toBe(true);
    isEditableSpy.and.returnValue(false);
    expect(ctrl.isEditable()).toBe(false);
  });

  it('should open state graph modal using $uibModal open method',
    function() {
      var modalOpenSpy = spyOn($uibModal, 'open').and.callThrough();

      ctrl.openStateGraphModal();
      $rootScope.$apply();

      expect(modalOpenSpy).toHaveBeenCalled();
    });

  it('should open state graph modal and close it with delete action',
    function() {
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

  it('should open state graph modal and close it with navigate action',
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

  it('should open state graph modal and close it with an invalid action',
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

  it('should open state graph modal and dismiss it', function() {
    spyOn($uibModal, 'open').and.returnValue({
      result: $q.reject()
    });
    spyOn(alertsService, 'clearWarnings');

    ctrl.openStateGraphModal();
    $rootScope.$apply();

    expect(alertsService.clearWarnings).toHaveBeenCalled();
  });
});
