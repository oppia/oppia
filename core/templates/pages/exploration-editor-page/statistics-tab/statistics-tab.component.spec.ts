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
 * @fileoverview Unit tests for statisticsTab.
 */

import { TestBed } from '@angular/core/testing';
import { ExplorationStatsService } from 'services/exploration-stats.service';
import { StateInteractionStatsService } from
  'services/state-interaction-stats.service';
import { StatesObjectFactory } from 'domain/exploration/StatesObjectFactory';
import { AlertsService } from 'services/alerts.service';
import { ComputeGraphService } from 'services/compute-graph.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { EventEmitter } from '@angular/core';
import { ReadOnlyExplorationBackendApiService } from
  'domain/exploration/read-only-exploration-backend-api.service';

class MockRouterService {
  private refreshStatisticsTabEventEmitter: EventEmitter<void>;
  get onRefreshStatisticsTab() {
    return this.refreshStatisticsTabEventEmitter;
  }

  set refreshStatisticsTabEmitter(val) {
    this.refreshStatisticsTabEventEmitter = val;
  }
}

describe('Statistics Tab Component', function() {
  var ctrl = null;
  var $q = null;
  var $rootScope = null;
  var $scope = null;
  var $uibModal = null;
  var alertsService = null;
  var computeGraphService = null;
  var explorationStatsService = null;
  var readOnlyExplorationBackendApiService = null;
  var stateInteractionStatsService = null;
  var statesObjectFactory = null;
  var routerService = null;

  var explorationId = 'exp1';
  var state = {
    classifier_model_id: '1',
    content: {
      content_id: 'content1',
      html: 'This is a html text'
    },
    interaction: {
      id: 'Continue',
      answer_groups: [{
        outcome: {
          dest: 'outcome 1',
          dest_if_really_stuck: null,
          feedback: {
            content_id: 'content2',
            html: ''
          },
          labelled_as_correct: true,
          param_changes: [],
          refresher_exploration_id: null
        },
        rule_specs: [],
        tagged_skill_misconception_id: ''
      }, {
        outcome: {
          dest: 'outcome 2',
          dest_if_really_stuck: null,
          feedback: {
            content_id: 'content3',
            html: ''
          },
          labelled_as_correct: true,
          param_changes: [],
          refresher_exploration_id: null
        },
        rule_specs: [],
        tagged_skill_misconception_id: ''
      }],
      confirmed_unclassified_answers: null,
      customization_args: {
        buttonText: {
          value: {
            content_id: 'ca_buttonText_0',
            unicode_str: 'Continue'
          }
        }
      },
      hints: [],
      solution: {
        answer_is_exclusive: false,
        correct_answer: 'This is the correct answer',
        explanation: {
          content_id: 'content1',
          html: 'This is a html text'
        }
      }
    },
    linked_skill_id: null,
    next_content_id_index: 0,
    param_changes: [],
    recorded_voiceovers: {
      voiceovers_mapping: {}
    },
    solicit_answer_details: true,
    written_translations: {
      translations_mapping: {}
    }
  };

  beforeEach(angular.mock.module('oppia'));

  beforeEach(function() {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    alertsService = TestBed.get(AlertsService);
    computeGraphService = TestBed.get(ComputeGraphService);
    explorationStatsService = TestBed.get(ExplorationStatsService);
    stateInteractionStatsService = TestBed.get(StateInteractionStatsService);
    statesObjectFactory = TestBed.get(StatesObjectFactory);
    routerService = new MockRouterService();
  });

  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value('ExplorationDataService', {
      explorationId: explorationId
    });
    $provide.value(
      'ReadOnlyExplorationBackendApiService',
      TestBed.get(ReadOnlyExplorationBackendApiService));
  }));

  beforeEach(angular.mock.inject(function($injector, $componentController) {
    $q = $injector.get('$q');
    $rootScope = $injector.get('$rootScope');
    $uibModal = $injector.get('$uibModal');
    readOnlyExplorationBackendApiService = $injector.get(
      'ReadOnlyExplorationBackendApiService');

    spyOn(
      readOnlyExplorationBackendApiService, 'loadLatestExplorationAsync').and
      .returnValue($q.resolve({
        exploration: {
          init_state_name: 'State1',
          states: {
            State1: state
          }
        }
      }));
    spyOn(explorationStatsService, 'getExplorationStatsAsync').and.returnValue(
      $q.resolve({
        numStarts: 20,
        numActualStarts: 10,
        numCompletions: 5,
      }));
    spyOn(stateInteractionStatsService, 'computeStatsAsync').and.returnValue(
      $q.resolve({
        visualizationsInfo: {}
      }));

    routerService.refreshStatisticsTabEmitter = new EventEmitter();
    $scope = $rootScope.$new();
    ctrl = $componentController('statisticsTab', {
      $scope: $scope,
      AlertsService: alertsService,
      ComputeGraphService: computeGraphService,
      ExplorationStatsService: explorationStatsService,
      RouterService: routerService,
      StateInteractionStatsService: stateInteractionStatsService,
      StatesObjectFactory: statesObjectFactory
    });
    ctrl.$onInit();
  }));

  afterEach(() => {
    ctrl.$onDestroy();
  });

  it('should initialize controller properties after its initialization',
    function() {
      expect(ctrl.stateStatsModalIsOpen).toBe(false);
      expect($scope.explorationHasBeenVisited).toBe(false);
    });

  it('should refresh exploration statistics when broadcasting' +
    ' refreshStatisticsTab', function() {
    routerService.onRefreshStatisticsTab.emit();

    // Resolve promise.
    $scope.$apply();

    expect($scope.statsGraphData).toEqual({
      finalStateIds: [],
      initStateId: 'State1',
      links: [{
        source: 'State1',
        target: 'outcome 1',
        linkProperty: ''
      }, {
        source: 'State1',
        target: 'outcome 2',
        linkProperty: ''
      }],
      nodes: {
        State1: 'State1'
      }
    });
    expect($scope.pieChartData).toEqual([
      ['Type', 'Number'],
      ['Completions', 5],
      ['Non-Completions', 5]
    ]);
    expect($scope.numPassersby).toBe(10);
    expect($scope.explorationHasBeenVisited).toBe(true);
  });

  it('should open state stats modal', function() {
    routerService.onRefreshStatisticsTab.emit();

    // Resolve promise.
    $scope.$apply();

    spyOn($uibModal, 'open').and.callThrough();
    $scope.onClickStateInStatsGraph('State1');
    expect(ctrl.stateStatsModalIsOpen).toBe(true);

    $scope.$apply();

    expect($uibModal.open).toHaveBeenCalled();
  });

  it('should open state stats modal and close it when clicking in stats' +
    ' graph', function() {
    routerService.onRefreshStatisticsTab.emit();

    // Resolve promise.
    $scope.$apply();

    spyOn($uibModal, 'open').and.returnValue({
      result: $q.resolve()
    });
    $scope.onClickStateInStatsGraph('State1');
    expect(ctrl.stateStatsModalIsOpen).toBe(true);
    $scope.$apply();

    expect(ctrl.stateStatsModalIsOpen).toBe(false);
  });

  it('should open state stats modal and dismiss it when clicking in' +
    ' stats graph', function() {
    routerService.onRefreshStatisticsTab.emit();

    // Resolve promise.
    $scope.$apply();

    spyOn($uibModal, 'open').and.returnValue({
      result: $q.reject()
    });
    spyOn(alertsService, 'clearWarnings');

    $scope.onClickStateInStatsGraph('State1');
    expect(ctrl.stateStatsModalIsOpen).toBe(true);
    $scope.$apply();

    expect(alertsService.clearWarnings).toHaveBeenCalled();
    expect(ctrl.stateStatsModalIsOpen).toBe(false);
  });
});
