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
 * @fileoverview Unit tests for previewTab.
 */

import { TestBed } from '@angular/core/testing';
import { ParamChangeObjectFactory } from
  'domain/exploration/ParamChangeObjectFactory';
import { EventEmitter } from '@angular/core';

// TODO(#7222): Remove usage of importAllAngularServices once upgraded to
// Angular 8.
import { importAllAngularServices } from 'tests/unit-test-utils.ajs';
import {StateObjectFactory} from "domain/state/StateObjectFactory";

fdescribe('Preview Tab Component', function() {
  importAllAngularServices();

  var ctrl = null;
  var $flushPendingTasks = null;
  var $q = null;
  var $rootScope = null;
  var $scope = null;
  var $uibModal = null;
  var contextService = null;
  var editableExplorationBackendApiService = null;
  var explorationEngineService = null;
  var explorationInitStateNameService = null;
  var explorationFeaturesService = null;
  var explorationPlayerStateService = null;
  var explorationParamChangesService = null;
  var explorationStatesService = null;
  var learnerParamsService = null;
  var numberAttemptsService = null;
  var routerService = null;
  var stateEditorService = null;
  var stateObjectFactory = null;
  var paramChangeObjectFactory = null;
  var parameterMetadataService = null;
  var mockUpdateActiveStateIfInEditorEventEmitter = new EventEmitter();
  var mockPlayerStateChangeEventEmitter = new EventEmitter();

  var explorationId = 'exp1';
  var stateName = 'State1';
  var exploration = {
    init_state_name: stateName,
    param_changes: [],
    param_specs: {},
    states: {},
    title: 'Exploration Title',
    language_code: 'en',
    correctness_feedback_enabled: true
  };
  var parameters = [{
    paramName: 'paramName1'
  }, {
    paramName: 'paramName2'
  }];

  beforeEach(function() {
    paramChangeObjectFactory = TestBed.inject(ParamChangeObjectFactory);
    stateObjectFactory = TestBed.inject(StateObjectFactory);
  });

  beforeEach(angular.mock.module(function($provide) {
    $provide.value('ExplorationDataService', {
      getDataAsync: () => $q.resolve({
        param_changes: [
          paramChangeObjectFactory.createEmpty('a').toBackendDict()
        ],
        states: [stateObjectFactory.createDefaultState('state')]
      })
    });
  }));

  describe('when there are manual param changes', function() {
    beforeEach(angular.mock.inject(function($injector, $componentController) {
      $flushPendingTasks = $injector.get('$flushPendingTasks');
      $rootScope = $injector.get('$rootScope');
      $q = $injector.get('$q');
      $uibModal = $injector.get('$uibModal');
      contextService = $injector.get('ContextService');
      spyOn(contextService, 'getExplorationId').and.returnValue(explorationId);

      editableExplorationBackendApiService = $injector.get(
        'EditableExplorationBackendApiService');
      explorationEngineService = $injector.get('ExplorationEngineService');
      explorationFeaturesService = $injector.get('ExplorationFeaturesService');
      explorationPlayerStateService = $injector.get(
        'ExplorationPlayerStateService');
      explorationParamChangesService = $injector.get(
        'ExplorationParamChangesService');
      explorationStatesService = $injector.get('ExplorationStatesService');
      learnerParamsService = $injector.get('LearnerParamsService');
      parameterMetadataService = $injector.get('ParameterMetadataService');
      routerService = $injector.get('RouterService');
      stateEditorService = $injector.get('StateEditorService');
      spyOn(stateEditorService, 'getActiveStateName').and.returnValue(
        stateName);
      spyOn(parameterMetadataService, 'getUnsetParametersInfo').and
        .returnValue(parameters);
      spyOn(
        editableExplorationBackendApiService, 'fetchApplyDraftExplorationAsync')
        .and.returnValue($q.resolve(exploration));
      spyOnProperty(
        explorationEngineService,
        'onUpdateActiveStateIfInEditor').and.returnValue(
        mockUpdateActiveStateIfInEditorEventEmitter);
      spyOnProperty(
        explorationPlayerStateService,
        'onPlayerStateChange').and.returnValue(
        mockPlayerStateChangeEventEmitter);
      $scope = $rootScope.$new();
      ctrl = $componentController('previewTab', {
        $scope: $scope,
        ParamChangeObjectFactory: paramChangeObjectFactory
      });
      ctrl.$onInit();
    }));

    afterEach(() => {
      ctrl.$onDestroy();
    });

    it('should initialize controller properties after its initialization',
      function() {
        // Get data from exploration data service.
        $scope.$apply();

        expect(ctrl.isExplorationPopulated).toBe(false);
        expect(ctrl.previewWarning).toBe('Preview started from \"State1\"');
      });

    it('should init param changes if they are undefined', function() {
      explorationParamChangesService.savedMemento = undefined;
      spyOn(explorationParamChangesService, 'init').and.callThrough();
      spyOn(explorationStatesService, 'init').and.callThrough();

      // Get data from exploration data service.
      $scope.$apply();

      expect(explorationParamChangesService.init).toHaveBeenCalledWith(
        [paramChangeObjectFactory.createEmpty('a')]
      );
      expect(explorationStatesService.init).toHaveBeenCalledWith(
        [stateObjectFactory.createDefaultState('state')]
      );
      expect(explorationParamChangesService.savedMemento).toEqual(
        [paramChangeObjectFactory.createEmpty('a')]
      );
    });

    it('should set active state name when broadcasting' +
      ' updateActiveStateIfInEditor', function() {
      spyOn(stateEditorService, 'setActiveStateName');

      mockUpdateActiveStateIfInEditorEventEmitter.emit('State2');

      expect(stateEditorService.setActiveStateName).toHaveBeenCalledWith(
        'State2');
    });

    it('should get all learner params when broadcasting playerStateChange',
      function() {
        spyOn(learnerParamsService, 'getAllParams').and.returnValue({
          foo: []
        });
        mockPlayerStateChangeEventEmitter.emit();

        expect(ctrl.allParams).toEqual({
          foo: []
        });
      });

    it('should evaluate whenever parameter summary is shown', function() {
      spyOn(explorationFeaturesService, 'areParametersEnabled')
        .and.returnValue(true);
      expect(ctrl.showParameterSummary()).toBe(false);

      spyOn(learnerParamsService, 'getAllParams').and.returnValue({
        foo: []
      });
      mockPlayerStateChangeEventEmitter.emit();
      expect(ctrl.showParameterSummary()).toBe(true);
    });

    it('should open set params modal', function() {
      spyOn($uibModal, 'open').and.callThrough();

      // Get data from exploration data service.
      $scope.$apply();

      expect($uibModal.open).toHaveBeenCalled();
    });

    it('should load preview state when closing set params modal', function() {
      spyOn($uibModal, 'open').and.returnValue({
        result: $q.resolve()
      });
      spyOn(explorationEngineService, 'initSettingsFromEditor');

      // Get data from exploration data service and resolve promise in open
      // modal.
      $scope.$apply();

      var expectedParamChanges = parameters.map(parameter => (
        paramChangeObjectFactory.createEmpty(parameter.paramName)));
      expect(
        explorationEngineService.initSettingsFromEditor).toHaveBeenCalledWith(
        stateName, expectedParamChanges);
      expect(ctrl.isExplorationPopulated).toBeTrue();
    });

    it('should go to main tab when dismissing set params modal', function() {
      spyOn($uibModal, 'open').and.returnValue({
        result: $q.reject()
      });
      spyOn(routerService, 'navigateToMainTab');

      // Get data from exploration data service and resolve promise in open
      // modal.
      $scope.$apply();

      expect(routerService.navigateToMainTab).toHaveBeenCalled();
    });
  });

  describe('when there are no manual param changes', function() {
    beforeEach(angular.mock.inject(function($injector, $componentController) {
      $flushPendingTasks = $injector.get('$flushPendingTasks');
      var $rootScope = $injector.get('$rootScope');
      $q = $injector.get('$q');
      $uibModal = $injector.get('$uibModal');
      contextService = $injector.get('ContextService');
      spyOn(contextService, 'getExplorationId').and.returnValue(explorationId);
      editableExplorationBackendApiService = $injector.get(
        'EditableExplorationBackendApiService');
      explorationInitStateNameService = $injector.get(
        'ExplorationInitStateNameService');
      explorationEngineService = $injector.get('ExplorationEngineService');
      explorationParamChangesService = $injector.get(
        'ExplorationParamChangesService');
      numberAttemptsService = $injector.get('NumberAttemptsService');
      parameterMetadataService = $injector.get('ParameterMetadataService');
      routerService = $injector.get('RouterService');
      stateEditorService = $injector.get('StateEditorService');

      explorationInitStateNameService.init(stateName);

      spyOn(stateEditorService, 'getActiveStateName').and.returnValue(
        stateName);
      spyOn(parameterMetadataService, 'getUnsetParametersInfo')
        .and.returnValue([]);
      spyOn(
        editableExplorationBackendApiService, 'fetchApplyDraftExplorationAsync')
        .and.returnValue($q.resolve(exploration));
      explorationParamChangesService.savedMemento = undefined;

      // Mock init just to call the callback directly.
      spyOn(explorationEngineService, 'init').and.callFake(function(
          explorationDict, explorationVersion, preferredAudioLanguage,
          autoTtsEnabled, preferredContentLanguageCodes,
          successCallback) {
        successCallback();
      });

      $scope = $rootScope.$new();
      ctrl = $componentController('previewTab', {
        $scope: $scope,
        ParamChangeObjectFactory: paramChangeObjectFactory
      });
      ctrl.$onInit();
    }));

    it('should initialize controller properties after its initialization',
      function() {
        // Get data from exploration data service.
        $scope.$apply();

        expect(ctrl.isExplorationPopulated).toBe(false);
        expect(ctrl.previewWarning).toBe('');
      });

    it('should load preview state when closing set params modal', function() {
      spyOn($uibModal, 'open');
      spyOn(explorationEngineService, 'initSettingsFromEditor');

      // Get data from exploration data service and resolve promise in open
      // modal.
      $scope.$apply();

      expect($uibModal.open).not.toHaveBeenCalled();
      expect(
        explorationEngineService.initSettingsFromEditor)
        .toHaveBeenCalledWith(stateName, []);
      expect(ctrl.isExplorationPopulated).toBe(true);
    });

    it('should reset preview settings', function() {
      spyOn($uibModal, 'open').and.returnValue({
        result: $q.reject()
      });
      spyOn(numberAttemptsService, 'reset').and.callThrough();
      spyOn(explorationEngineService, 'initSettingsFromEditor');

      // Get data from exploration data service and resolve promise in open
      // modal.
      $scope.$apply();

      ctrl.resetPreview();

      $flushPendingTasks();

      expect(numberAttemptsService.reset).toHaveBeenCalled();
      expect(
        explorationEngineService.initSettingsFromEditor)
        .toHaveBeenCalledWith(stateName, []);
      expect(ctrl.isExplorationPopulated).toBe(true);
    });
  });
});
