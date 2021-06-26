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
 * @fileoverview Unit tests for playthroughIssues.
 */

import { importAllAngularServices } from 'tests/unit-test-utils';

describe('Playthrough Issues Component', function() {
  var $q = null;
  var $scope = null;
  var PlaythroughIssuesService = null;

  var issues = [{
    issue_type: 'CyclicStateTransitions',
    issue_customization_args: {
      state_names: {
        value: ['State1', 'State2']
      }
    },
    playthrough_ids: ['1', '2', '3'],
    schema_version: 1,
    is_valid: true
  }, {
    issue_type: 'EarlyQuit',
    issue_customization_args: {
      state_name: {
        value: 'State1'
      },
      time_spent_in_exp_in_msecs: {
        value: 0
      }
    },
    playthrough_ids: ['1', '2', '3'],
    schema_version: 1,
    is_valid: true
  }, {
    issue_type: 'MultipleIncorrectSubmissions',
    issue_customization_args: {
      state_name: {
        value: 'State1'
      },
      time_spent_in_exp_in_msecs: {
        value: 0
      }
    },
    playthrough_ids: ['1', '2', '3'],
    schema_version: 1,
    is_valid: true
  }];

  beforeEach(angular.mock.module('oppia'));
  importAllAngularServices();
  beforeEach(angular.mock.inject(function($injector, $componentController) {
    $q = $injector.get('$q');
    var $rootScope = $injector.get('$rootScope');
    PlaythroughIssuesService = $injector.get('PlaythroughIssuesService');

    spyOn(PlaythroughIssuesService, 'getIssues').and.returnValue($q.resolve(
      issues));

    $scope = $rootScope.$new();
    var ctrl = $componentController('playthroughIssues', {
      $scope: $scope,
    });
    ctrl.$onInit();
    $scope.$apply();
  }));

  it('should initialize $scope properties after controller is initialized',
    function() {
      expect($scope.issues).toEqual(issues);
    });

  it('should check if issue is on init display based on its index on array',
    function() {
      expect($scope.isIssueOnInitDisplay(issues[0])).toBe(true);
      expect($scope.isIssueOnInitDisplay(issues[1])).toBe(false);
      expect($scope.isIssueOnInitDisplay(issues[2])).toBe(false);
    });

  it('should create issue nav id based on an issue', function() {
    expect($scope.createIssueNavId(issues[0])).toBe(1);
    expect($scope.createIssueNavId(issues[1])).toBe(2);
    expect($scope.createIssueNavId(issues[2])).toBe(3);
  });

  it('should change css styles in issue html elements when changing to' +
    ' next issue index', function() {
    expect($scope.currentIssueIndex).toBe(-1);
    expect($scope.isIssueDisplayed()).toBe(false);

    $scope.currentIssueIndex = 0;
    expect($scope.currentIssueIndex).toBe(0);
    expect($scope.isIssueDisplayed()).toBe(true);

    var issueCurrentIssueIndexElement = document.createElement('div');
    var issueNavCurrentIssueIndexElement = document.createElement('div');
    var issueNextIssueIndexElement = document.createElement('div');
    var issueNavNextIssueIndexElement = document.createElement('div');

    spyOn(document, 'getElementById')
      .withArgs('issue0').and.callFake(() => issueCurrentIssueIndexElement)
      .withArgs('issueNav0').and.callFake(() => (
        issueNavCurrentIssueIndexElement))
      .withArgs('issue1').and.callFake(() => issueNextIssueIndexElement)
      .withArgs('issueNav1').and.callFake(() => issueNavNextIssueIndexElement);

    $scope.makeVisible(1);

    expect(issueCurrentIssueIndexElement.style.display).toBe('none');
    expect(issueNavCurrentIssueIndexElement.classList.contains('text-white'))
      .toBe(false);
    expect(issueNavCurrentIssueIndexElement.classList.contains('bg-clr'))
      .toBe(false);
    expect(issueNextIssueIndexElement.style.display).toBe('block');
    expect(issueNavNextIssueIndexElement.classList.contains('text-white'))
      .toBe(true);
    expect(issueNavNextIssueIndexElement.classList.contains('bg-clr'))
      .toBe(true);
    expect($scope.currentIssueIndex).toBe(1);
    expect($scope.isIssueDisplayed()).toBe(true);
  });
});
