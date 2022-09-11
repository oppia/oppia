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
 * @fileoverview Unit tests for stateTranslationStatusGraph.
 */

import { TestBed } from '@angular/core/testing';
import { StateEditorService } from
  // eslint-disable-next-line max-len
  'components/state-editor/state-editor-properties-services/state-editor.service';
import { StateRecordedVoiceoversService } from
  // eslint-disable-next-line max-len
  'components/state-editor/state-editor-properties-services/state-recorded-voiceovers.service';
import { StateWrittenTranslationsService } from
  // eslint-disable-next-line max-len
  'components/state-editor/state-editor-properties-services/state-written-translations.service';
import { StateEditorRefreshService } from
  'pages/exploration-editor-page/services/state-editor-refresh.service';
import { AlertsService } from 'services/alerts.service';
import { UtilsService } from 'services/utils.service';
import { ReadOnlyExplorationBackendApiService } from
  'domain/exploration/read-only-exploration-backend-api.service';
import { Subscription } from 'rxjs';

// TODO(#7222): Remove the following block of unnnecessary imports once
// the code corresponding to the spec is upgraded to Angular 8.
import { importAllAngularServices } from 'tests/unit-test-utils.ajs';
// ^^^ This block is to be removed.

describe('State Translation Status Graph Component', function() {
  var $rootScope = null;
  var $scope = null;
  var explorationStatesService = null;
  var graphDataService = null;
  var stateEditorService = null;
  var stateRecordedVoiceoversService = null;
  var stateWrittenTranslationsService = null;
  var translationStatusService = null;
  var testSubscriptions: Subscription;
  const refreshStateTranslationSpy = jasmine.createSpy(
    'refreshStateTranslationSpy');

  var stateName = 'State1';
  var state = {
    recorded_voiceovers: {},
  };

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

  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value('AlertsService', TestBed.get(AlertsService));
    $provide.value(
      'StateEditorRefreshService', TestBed.get(StateEditorRefreshService));
    $provide.value(
      'StateRecordedVoiceoversService',
      TestBed.get(StateRecordedVoiceoversService));
    $provide.value(
      'StateWrittenTranslationsService',
      TestBed.get(StateWrittenTranslationsService));
    $provide.value('UtilsService', TestBed.get(UtilsService));
    $provide.value(
      'ReadOnlyExplorationBackendApiService',
      TestBed.get(ReadOnlyExplorationBackendApiService));
  }));

  beforeEach(function() {
    stateEditorService = TestBed.get(StateEditorService);
    stateRecordedVoiceoversService = TestBed.get(
      StateRecordedVoiceoversService);
    stateWrittenTranslationsService = TestBed.get(
      StateWrittenTranslationsService);
  });

  beforeEach(() => {
    testSubscriptions = new Subscription();
    testSubscriptions.add(
      stateEditorService.onRefreshStateTranslation.subscribe(
        refreshStateTranslationSpy));
  });

  afterEach(() => {
    testSubscriptions.unsubscribe();
  });

  describe('when translation tab is not busy', function() {
    beforeEach(angular.mock.inject(function($injector, $componentController) {
      $rootScope = $injector.get('$rootScope');
      explorationStatesService = $injector.get('ExplorationStatesService');
      graphDataService = $injector.get('GraphDataService');
      translationStatusService = $injector.get('TranslationStatusService');

      spyOn(stateEditorService, 'getActiveStateName').and.returnValue(
        stateName);
      spyOn(explorationStatesService, 'getState').and.returnValue(state);

      $scope = $rootScope.$new();
      $componentController('stateTranslationStatusGraph', {
        $scope: $scope,
        StateEditorService: stateEditorService,
        StateRecordedVoiceoversService: stateRecordedVoiceoversService,
        StateWrittenTranslationsService: stateWrittenTranslationsService
      }, {
        isTranslationTabBusy: false
      });
    }));

    it('should get graph data from graph data service', function() {
      var graphData = {
        finalStateIds: [],
        initStateId: 'property_1',
        links: [],
        nodes: {}
      };
      spyOn(graphDataService, 'getGraphData').and.returnValue(graphData);

      expect($scope.getGraphData()).toEqual(graphData);
      expect(graphDataService.getGraphData).toHaveBeenCalled();
    });

    it('should get node colors from translation status', function() {
      var nodeColors = {};
      spyOn(translationStatusService, 'getAllStateStatusColors').and
        .returnValue(nodeColors);

      expect($scope.nodeColors()).toEqual(nodeColors);
      expect(translationStatusService.getAllStateStatusColors)
        .toHaveBeenCalled();
    });

    it('should get active state name from state editor', function() {
      expect($scope.getActiveStateName()).toBe(stateName);
    });

    it('should set new active state name and refresh state when clicking' +
      ' on state in map', function() {
      spyOn(stateEditorService, 'setActiveStateName');
      $scope.onClickStateInMap('State2');

      expect(stateEditorService.setActiveStateName).toHaveBeenCalledWith(
        'State2');
      expect(refreshStateTranslationSpy).toHaveBeenCalled();
    });
  });

  describe('when translation tab is busy', function() {
    beforeEach(angular.mock.inject(function($injector, $componentController) {
      $rootScope = $injector.get('$rootScope');
      explorationStatesService = $injector.get('ExplorationStatesService');
      graphDataService = $injector.get('GraphDataService');
      translationStatusService = $injector.get('TranslationStatusService');

      $scope = $rootScope.$new();
      $scope.isTranslationTabBusy = true;
      $componentController('stateTranslationStatusGraph', {
        $scope: $scope,
        StateEditorService: stateEditorService,
        StateRecordedVoiceoversService: stateRecordedVoiceoversService,
        StateWrittenTranslationsService: stateWrittenTranslationsService
      }, {
        isTranslationTabBusy: true
      });
    }));

    var showTranslationTabBusyModalspy = null;
    var testSubscriptions = null;

    beforeEach(() => {
      showTranslationTabBusyModalspy = jasmine.createSpy(
        'showTranslationTabBusyModal');
      testSubscriptions = new Subscription();
      testSubscriptions.add(
        stateEditorService.onShowTranslationTabBusyModal.subscribe(
          showTranslationTabBusyModalspy));
    });

    afterEach(() => {
      testSubscriptions.unsubscribe();
    });

    it('should show translation tab busy modal when clicking on state in map',
      function() {
        spyOn(stateEditorService, 'setActiveStateName');
        $scope.onClickStateInMap('State2');

        expect(stateEditorService.setActiveStateName).not.toHaveBeenCalled();
        expect(showTranslationTabBusyModalspy).toHaveBeenCalled();
      });
  });
});
