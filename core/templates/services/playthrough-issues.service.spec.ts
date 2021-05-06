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
 * @fileoverview Unit tests for PlaythroughIssuesService.
 */

import { UpgradedServices } from 'services/UpgradedServices';

describe('Playthrough Issues Service', function() {
  var PlaythroughIssuesService = null;
  var PlaythroughIssueObjectFactory = null;
  var PlaythroughObjectFactory = null;
  var PlaythroughIssuesBackendApiService = null;
  var ImprovementModalService = null;
  var $q = null;
  var $rootScope = null;
  var explorationId = 'abc1';
  var explorationVersion = 1;
  var backendIssues = [{
    issue_type: 'MultipleIncorrectSubmissions',
    issue_customization_args: {
      state_name: {
        value: 'state_name1'
      },
      state_names: {
        value: ['state_name1', 'state_name2', 'state_name3']
      },
      num_times_answered_incorrectly: {
        value: 7
      }
    },
    playthrough_ids: ['playthrough_id2'],
    schema_version: 1,
    is_valid: true
  }];
  var backendPlaythrough = {
    exp_id: 'exp_id1',
    exp_version: 1,
    issue_type: 'EarlyQuit',
    issue_customization_args: {
      state_name: {
        value: 'state_name1'
      },
      time_spent_in_exp_in_msecs: {
        value: 200
      }
    },
    actions: [{
      action_type: 'ExplorationStart',
      action_customization_args: {
        state_name: {
          value: 'state_name1'
        }
      },
      schema_version: 1
    }]
  };

  beforeEach(angular.mock.module('oppia', function($provide) {
    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));
  beforeEach(angular.mock.inject(function($injector) {
    PlaythroughIssuesService = $injector.get('PlaythroughIssuesService');
    PlaythroughIssueObjectFactory = $injector.get(
      'PlaythroughIssueObjectFactory');
    PlaythroughObjectFactory = $injector.get('PlaythroughObjectFactory');
    PlaythroughIssuesBackendApiService = $injector.get(
      'PlaythroughIssuesBackendApiService');
    ImprovementModalService = $injector.get(
      'ImprovementModalService');
    $q = $injector.get('$q');
    $rootScope = $injector.get('$rootScope');

    PlaythroughIssuesService.initSession(explorationId, explorationVersion);
  }));

  it('should get issues from backend', function() {
    var backendCallSpy = spyOn(
      PlaythroughIssuesBackendApiService, 'fetchIssuesAsync').and.returnValue(
      $q.resolve(backendIssues.map(
        PlaythroughIssueObjectFactory.createFromBackendDict)));

    PlaythroughIssuesService.getIssues().then(function(issues) {
      expect(backendCallSpy).toHaveBeenCalled();
      expect(issues).toEqual(
        backendIssues.map(
          PlaythroughIssueObjectFactory.createFromBackendDict));
    });
  });

  it('should get playthrough from backend', function() {
    var backendCallSpy = spyOn(
      PlaythroughIssuesBackendApiService, 'fetchPlaythroughAsync').and
      .returnValue($q.resolve(PlaythroughObjectFactory.createFromBackendDict(
        backendPlaythrough)));
    var playthroughId = 'exp_id1';

    PlaythroughIssuesService.getPlaythrough(playthroughId)
      .then(function(playthrough) {
        expect(backendCallSpy).toHaveBeenCalled();
        expect(playthrough).toEqual(
          PlaythroughObjectFactory.createFromBackendDict(backendPlaythrough));
      });
  });

  it(
    'should render issue statement when its type is' +
    ' MultipleIncorrectSubmissions', function() {
      var copiedBackendIssue = angular.copy(backendIssues[0]);
      var issue = PlaythroughIssueObjectFactory.createFromBackendDict(
        copiedBackendIssue);
      var stateName = issue.issueCustomizationArgs.state_name.value;

      expect(PlaythroughIssuesService.renderIssueStatement(issue))
        .toBe(
          'Several learners submitted answers to card "' + stateName +
          '" several times, then gave up and quit.');
    });

  it('should render issue statement when its type is EarlyQuit', function() {
    var copiedBackendIssue = angular.copy(backendIssues[0]);
    copiedBackendIssue.issue_type = 'EarlyQuit';
    var issue = PlaythroughIssueObjectFactory.createFromBackendDict(
      copiedBackendIssue);

    expect(PlaythroughIssuesService.renderIssueStatement(issue))
      .toBe('Several learners exited the exploration in less than a minute.');
  });

  it('should render issue statement when its type is CyclicStateTransitions',
    function() {
      var copiedBackendIssue = angular.copy(backendIssues[0]);
      copiedBackendIssue.issue_type = 'CyclicStateTransitions';
      var issue = PlaythroughIssueObjectFactory.createFromBackendDict(
        copiedBackendIssue);
      var stateName = issue.issueCustomizationArgs.state_names.value[0];

      expect(PlaythroughIssuesService.renderIssueStatement(issue))
        .toBe(
          'Several learners ended up in a cyclic loop revisiting card "' +
          stateName + '" many times.');
    });

  it('should render issue suggestion when its type is' +
    ' MultipleIncorrectSubmissions', function() {
    var copiedBackendIssue = angular.copy(backendIssues[0]);
    var issue = PlaythroughIssueObjectFactory.createFromBackendDict(
      copiedBackendIssue);
    var stateName = issue.issueCustomizationArgs.state_name.value;

    expect(PlaythroughIssuesService.renderIssueSuggestions(issue))
      .toEqual(
        ['Check the wording of the card "' + stateName +
        '" to ensure it is not confusing.',
        'Consider addressing the answers submitted in the sample' +
        ' playthroughs explicitly using answer groups.']);
  });

  it('should render issue suggestion when its type is EarlyQuit', function() {
    var copiedBackendIssue = angular.copy(backendIssues[0]);
    copiedBackendIssue.issue_type = 'EarlyQuit';
    var issue = PlaythroughIssueObjectFactory.createFromBackendDict(
      copiedBackendIssue);
    var stateName = issue.issueCustomizationArgs.state_name.value;

    expect(PlaythroughIssuesService.renderIssueSuggestions(issue))
      .toEqual([
        'Review the cards up to and including "' + stateName +
        '" for errors, ' + 'ambiguities, or insufficient motivation.']);
  });

  it('should render issue suggestion when its type is CyclicStateTransitions',
    function() {
      var copiedBackendIssue = angular.copy(backendIssues[0]);
      copiedBackendIssue.issue_type = 'CyclicStateTransitions';
      var issue = PlaythroughIssueObjectFactory.createFromBackendDict(
        copiedBackendIssue);
      var statesName = issue.issueCustomizationArgs.state_names.value;
      var lastStateName = statesName[statesName.length - 1];

      expect(PlaythroughIssuesService.renderIssueSuggestions(issue))
        .toEqual(
          ['Check that the concept presented in "' + statesName[0] +
        '" has ' + 'been reinforced sufficiently by the time the learner' +
        ' gets to "' + lastStateName + '".']);
    });

  it('should resolve issue', function() {
    var backendCallSpy = spyOn(
      PlaythroughIssuesBackendApiService, 'resolveIssueAsync').and.returnValue(
      $q.resolve());
    var issue = PlaythroughIssueObjectFactory.createFromBackendDict(
      angular.copy(backendIssues[0]));

    PlaythroughIssuesService.resolveIssue(issue).then(function() {
      expect(backendCallSpy).toHaveBeenCalledWith(
        issue, explorationId, explorationVersion);
    });
  });

  it('should open playthrough modal', function() {
    spyOn(PlaythroughIssuesBackendApiService, 'fetchPlaythroughAsync').and
      .returnValue($q.resolve(PlaythroughObjectFactory.createFromBackendDict(
        backendPlaythrough)));
    var openModalSpy = spyOn(ImprovementModalService, 'openPlaythroughModal')
      .and.callThrough();
    var playthroughId = 'exp_id1';
    var index = 1;
    var playthrough = PlaythroughObjectFactory.createFromBackendDict(
      backendPlaythrough);

    PlaythroughIssuesService.openPlaythroughModal(playthroughId, index);
    $rootScope.$digest();

    expect(openModalSpy).toHaveBeenCalledWith(playthrough, index);
  });
});
