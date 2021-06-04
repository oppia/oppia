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

import { TestBed } from '@angular/core/testing';
import { AlertsService } from 'services/alerts.service';
import { PlaythroughIssueObjectFactory } from
  'domain/statistics/PlaythroughIssueObjectFactory';
import { importAllAngularServices } from 'tests/unit-test-utils';

/**
 * @fileoverview Unit tests for cyclicTransitionsIssue.
 */

describe('Cyclic Transitions Issue Component', function() {
  var $scope = null;
  var alertsService = null;
  var playthroughIssueObjectFactory = null;
  var playthroughIssuesService = null;

  var explorationId = 'exp1';
  var explorationVersion = 1;

  beforeEach(angular.mock.module('oppia'));
  importAllAngularServices();
  beforeEach(function() {
    alertsService = TestBed.get(AlertsService);
    playthroughIssueObjectFactory = TestBed.get(PlaythroughIssueObjectFactory);
  });

  beforeEach(angular.mock.inject(function($injector, $componentController) {
    playthroughIssuesService = $injector.get('PlaythroughIssuesService');
    var $rootScope = $injector.get('$rootScope');

    playthroughIssuesService.initSession(explorationId, explorationVersion);

    $scope = $rootScope.$new();
    var ctrl = $componentController('cyclicTransitionsIssue', {
      $scope: $scope,
      AlertsService: alertsService,
      PlaythroughIssuesService: playthroughIssuesService
    }, {
      index: () => 1,
      issue: () => (playthroughIssueObjectFactory.createFromBackendDict({
        issue_type: 'CyclicStateTransitions',
        issue_customization_args: {
          state_names: {
            value: ['State1', 'State2']
          }
        },
        playthrough_ids: ['1', '2', '3'],
        schema_version: 1,
        is_valid: true
      }))
    });
    ctrl.$onInit();
  }));

  it('should initialize controller properties after its initialization',
    function() {
      expect($scope.currentIssueIdentifier).toBe(2);
      expect($scope.issueStatement).toBe(
        'Several learners ended up in a cyclic loop revisiting card "State1"' +
        ' many times.');
      expect($scope.suggestions).toEqual([
        'Check that the concept presented in "State1" has been reinforced' +
        ' sufficiently by the time the learner gets to "State2".']);
      expect($scope.playthroughIds).toEqual(['1', '2', '3']);
    });

  it('should open playthrough modal with specific playthrough id', function() {
    spyOn(playthroughIssuesService, 'openPlaythroughModal');
    $scope.showPlaythrough('2');
    expect(playthroughIssuesService.openPlaythroughModal)
      .toHaveBeenCalledWith('2', 1);
  });

  it('should create playthorugh nav id based on playthrough id', function() {
    expect($scope.createPlaythroughNavId('1')).toBe(1);
    expect($scope.createPlaythroughNavId('2')).toBe(2);
    expect($scope.createPlaythroughNavId('3')).toBe(3);
  });

  it('should resolve issue if it\'s not resolved yet', function() {
    spyOn(playthroughIssuesService, 'resolveIssue').and.callFake(() => {});
    spyOn(alertsService, 'addSuccessMessage');
    $scope.resolveIssue();

    expect(playthroughIssuesService.resolveIssue).toHaveBeenCalled();
    expect(alertsService.addSuccessMessage).toHaveBeenCalledWith(
      'Issue resolved. Refresh the page to view changes.');
  });

  it('should not resolve issue if it\'s already resolved', function() {
    // Resolve issue.
    $scope.resolveIssue();

    spyOn(playthroughIssuesService, 'resolveIssue').and.callFake(() => {});
    spyOn(alertsService, 'addSuccessMessage');
    $scope.resolveIssue();

    expect(playthroughIssuesService.resolveIssue).not.toHaveBeenCalled();
    expect(alertsService.addSuccessMessage).toHaveBeenCalledWith(
      'Issue has already been resolved. No need to resolve again. ' +
      'Refresh the page to view changes.');
  });
});
